import argparse
import asyncio
import os
import sys
from typing import Optional

from playwright.async_api import async_playwright
from actions import (
    GoogleSearchInput,
    SearchResultNavigator,
    UserEngagementSimulator,
    wait_for_page_ready,
)
from solve_captcha import SolveCaptcha
from fingerprint import build, build_fingerprint_script


def _format_bytes(num_bytes: int) -> str:
    units = ["B", "KB", "MB", "GB"]
    value = float(num_bytes)
    for unit in units:
        if value < 1024.0 or unit == units[-1]:
            return f"{value:.2f} {unit}" if unit != "B" else f"{int(value)} {unit}"
        value /= 1024.0
    return f"{num_bytes} B"


class NetworkUsageTracker:
    def __init__(self) -> None:
        self.request_count = 0
        self.failed_request_count = 0
        self.downloaded_bytes = 0
        self.uploaded_body_bytes = 0
        self._session = None
        self._enabled = False

    async def start(self, page) -> None:
        self._session = await page.context.new_cdp_session(page)
        self._session.on("Network.requestWillBeSent", self._on_request_will_be_sent)
        self._session.on("Network.loadingFinished", self._on_loading_finished)
        self._session.on("Network.loadingFailed", self._on_loading_failed)
        await self._session.send("Network.enable")
        self._enabled = True

    async def stop(self) -> None:
        if not self._session:
            return
        try:
            if self._enabled:
                await self._session.send("Network.disable")
        except Exception:
            pass
        try:
            await self._session.detach()
        except Exception:
            pass
        self._session = None
        self._enabled = False

    def _on_request_will_be_sent(self, params: dict) -> None:
        self.request_count += 1
        request = params.get("request") or {}
        post_data = request.get("postData")
        if post_data:
            self.uploaded_body_bytes += len(post_data.encode("utf-8"))

    def _on_loading_finished(self, params: dict) -> None:
        encoded_data_length = params.get("encodedDataLength", 0)
        if isinstance(encoded_data_length, (int, float)) and encoded_data_length > 0:
            self.downloaded_bytes += int(encoded_data_length)

    def _on_loading_failed(self, _params: dict) -> None:
        self.failed_request_count += 1

    def checkpoint(self) -> dict:
        """현재 누적 바이트 스냅샷 반환 (단계별 측정용)"""
        return {
            "downloaded": self.downloaded_bytes,
            "uploaded": self.uploaded_body_bytes,
            "requests": self.request_count,
        }

    def print_stage_summary(self, stage_name: str, before: dict, after: dict) -> None:
        dl = after["downloaded"] - before["downloaded"]
        ul = after["uploaded"] - before["uploaded"]
        reqs = after["requests"] - before["requests"]
        total = dl + ul
        print(f"   📶 [{stage_name}] 요청 {reqs}건 | ↓{_format_bytes(dl)} ↑{_format_bytes(ul)} | 소계: {_format_bytes(total)}")

    def print_summary(self) -> None:
        total_bytes = self.downloaded_bytes + self.uploaded_body_bytes
        print("📊 네트워크 사용량 요약")
        print(f"   - 요청 수: {self.request_count} (실패 {self.failed_request_count})")
        print(f"   - 다운로드: {_format_bytes(self.downloaded_bytes)}")
        print(f"   - 업로드(body): {_format_bytes(self.uploaded_body_bytes)}")
        print(f"   - 총합: {_format_bytes(total_bytes)}")
        print("   - 참고: 업로드는 요청 body 기준이며 헤더/핸드셰이크 오버헤드는 제외됩니다.")


async def run(search_keyword: str, target_domain: str, measure_data: bool = False, proxy: Optional[str] = None):
    profile = await build(proxy=proxy)
    if sys.platform == "darwin":
        default_chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    else:
        default_chrome = "google-chrome"
    chrome_path = os.getenv("CHROME_PATH", default_chrome)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=chrome_path,
            headless=False,
            slow_mo=80,
            args=[
                "--new-window",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                # 브라우저 언어를 프로필과 일치 → 자동번역 방지
                f"--lang={profile['locale']}",
                # DNS 누출 방지
                "--disable-dns-prefetch-service",
                "--disable-features=DnsOverHttps",
                # WebRTC 누출 방지 (JS 오버라이드와 이중 적용)
                "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
            ],
        )

        viewport = {
            "width": profile["screen"]["width"],
            "height": profile["screen"]["height"] - profile["viewport_offset"],
        }
        if proxy:
            from urllib.parse import urlparse as _urlparse_proxy
            _p = _urlparse_proxy(proxy)
            _proxy_config = {"server": f"{_p.scheme}://{_p.hostname}:{_p.port}"}
            if _p.username:
                _proxy_config["username"] = _p.username
            if _p.password:
                _proxy_config["password"] = _p.password
        else:
            _proxy_config = None

        context = await browser.new_context(
            proxy=_proxy_config,
            user_agent=profile["user_agent"],
            viewport=viewport,
            locale=profile["locale"],
            timezone_id=profile["timezone_id"],
            extra_http_headers={
                "Accept-Language": f"{profile['locale']},{profile['locale'].split('-')[0]};q=0.9,en-US;q=0.8,en;q=0.7"
            }
        )
        await context.add_init_script(build_fingerprint_script(profile))

        page = await context.new_page()

        # ── 데이터 절약 ────────────────────────────────────────────
        from urllib.parse import urlparse as _urlparse

        # 기능에 무관한 광고/트래킹 도메인 (suffix 매칭)
        _BLOCKED_DOMAIN_SUFFIXES = frozenset({
            "doubleclick.net",
            "googleadservices.com",
            "googletagmanager.com",
            "googlesyndication.com",
            "googleoptimize.com",
        })
        # 기능에 무관한 특정 서브도메인
        _BLOCKED_SUBDOMAINS = frozenset({
            "www.youtube.com",
            "img.youtube.com",
            "play.google.com",
            "ogads-pa.clients6.google.com",
            "lensfrontend-pa.clients6.google.com",
            "jnn-pa.googleapis.com",
        })

        def _should_block_domain(netloc: str) -> bool:
            netloc = netloc.lower()
            if netloc in _BLOCKED_SUBDOMAINS:
                return True
            return any(
                netloc == d or netloc.endswith("." + d)
                for d in _BLOCKED_DOMAIN_SUFFIXES
            )

        _TRANSPARENT_PIXEL = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
            b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        intercepted_count = {"image": 0, "media": 0, "font": 0, "ping": 0, "domain": 0}

        async def smart_data_saver(route):
            rtype = route.request.resource_type

            # 1. 이미지/미디어/폰트 → 투명 PNG로 대체
            if rtype in ("image", "media", "font"):
                intercepted_count[rtype] += 1
                await route.fulfill(status=200, content_type="image/png", body=_TRANSPARENT_PIXEL)
                return

            # 2. 핑/비콘 → 즉시 차단 (순수 트래킹)
            if rtype == "ping":
                intercepted_count["ping"] += 1
                await route.abort()
                return

            # 3. 광고/트래킹 서드파티 도메인 → 차단
            try:
                netloc = _urlparse(route.request.url).netloc
                if _should_block_domain(netloc):
                    intercepted_count["domain"] += 1
                    await route.abort()
                    return
            except Exception:
                pass

            await route.continue_()

        await page.route("**/*", smart_data_saver)

        network_tracker: Optional[NetworkUsageTracker] = None

        if measure_data:
            network_tracker = NetworkUsageTracker()
            try:
                await network_tracker.start(page)
                print("📈 네트워크 계측 시작")
            except Exception as e:
                print(f"⚠️ 네트워크 계측을 시작하지 못했습니다: {e}")
                network_tracker = None

        def snap():
            return network_tracker.checkpoint() if network_tracker else None

        def log_stage(name, before, after):
            if network_tracker and before and after:
                network_tracker.print_stage_summary(name, before, after)

        try:
            # ── [1단계] 구글 접속 및 검색 제출 ───────────────────
            s0 = snap()
            print("🌐 구글 접속 중...")
            await page.goto("https://www.google.com", wait_until="domcontentloaded")
            await wait_for_page_ready(page, 'textarea[name="q"]')

            search_input = GoogleSearchInput(page)
            await search_input.activate_search_box()
            await search_input.type_keyword(search_keyword)
            await search_input.submit_search()

            await asyncio.sleep(3)
            s1 = snap()
            log_stage("1단계: 구글접속+검색제출", s0, s1)

            # ── [2단계] 캡차 처리 + 검색결과 탐색 → 타겟 발견 ───
            solver = SolveCaptcha(page)

            if await solver.is_captcha_page():
                print("🚨 캡차 감지!")
                solved = await solver.solve()
                if solved:
                    await page.wait_for_url(
                        lambda url: "google.com/sorry" not in url,
                        timeout=15000
                    )
                    print("✅ 캡차 통과")
                else:
                    print("❌ 캡차 해결 실패, 종료합니다.")
                    return 1

            navigator = SearchResultNavigator(page)
            target_url = None

            for current_page in range(1, 6):
                print(f"📄 {current_page}페이지 탐색 중...")

                await wait_for_page_ready(page, 'div#search, div#rso, cite, a#pnnext')
                import random
                await asyncio.sleep(random.uniform(1.0, 2.0))

                target_url = await navigator.browse_results_page_like_human(target_domain)

                if target_url:
                    break

                if not await navigator.navigate_to_next_page():
                    break

            s2 = snap()
            log_stage("2단계: 캡차처리+검색결과탐색", s1, s2)

            if not target_url:
                print("❌ 타겟을 찾지 못했습니다.")
                return 1

            # ── [3단계] 타겟 사이트 진입 + 활동 + 세션 종료 ─────
            # 타겟 사이트에서는 GA/GTM 허용 → 이미지/폰트/미디어만 차단
            await page.unroute("**/*")

            async def target_data_saver(route):
                rtype = route.request.resource_type
                if rtype in ("image", "media", "font"):
                    intercepted_count[rtype] += 1
                    await route.fulfill(status=200, content_type="image/png", body=_TRANSPARENT_PIXEL)
                else:
                    await route.continue_()

            await page.route("**/*", target_data_saver)

            await navigator.access_target_site(target_url)

            engagement = UserEngagementSimulator(page)
            await engagement.engage_with_content()
            await engagement.deepen_site_visit(target_domain)
            await engagement.engage_with_content()

            await engagement.finalize_session_and_exit()

            s3 = snap()
            log_stage("3단계: 타겟진입+활동+종료", s2, s3)

        except Exception as e:
            print(f"❌ 오류 발생: {e}")
            return 1
        finally:
            await asyncio.sleep(5)
            if network_tracker:
                await network_tracker.stop()
                network_tracker.print_summary()
            total_intercepted = sum(intercepted_count.values())
            print(f"🚫 차단 요약: 총 {total_intercepted}건"
                  f" | 이미지 {intercepted_count['image']}"
                  f" / 미디어 {intercepted_count['media']}"
                  f" / 폰트 {intercepted_count['font']}"
                  f" / 핑 {intercepted_count['ping']}"
                  f" / 광고·트래킹도메인 {intercepted_count['domain']}")
            await context.close()
            await browser.close()

    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Google Search Bot!!")
    parser.add_argument("search_keyword", type=str, help="검색 키워드")
    parser.add_argument("target_domain", type=str, help="찾을 도메인 (ex: tiktok-save.com)")
    parser.add_argument(
        "--measure-data",
        action="store_true",
        help="실행 구간 네트워크 사용량을 출력합니다.",
    )
    parser.add_argument(
        "--proxy",
        type=str,
        default=None,
        help="프록시 URL (예: http://user:pass@gate.decodo.com:10001)",
    )
    args = parser.parse_args()

    raise SystemExit(
        asyncio.run(
            run(
                search_keyword=args.search_keyword,
                target_domain=args.target_domain,
                measure_data=args.measure_data,
                proxy=args.proxy,
            )
        )
    )
