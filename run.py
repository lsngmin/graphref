import argparse
import asyncio
import os
import sys

from playwright.async_api import async_playwright
from actions import (
    GoogleSearchInput,
    SearchResultNavigator,
    UserEngagementSimulator,
    wait_for_page_ready,
)
from solve_captcha import SolveCaptcha
from fingerprint import build, build_fingerprint_script


async def run(search_keyword: str, target_domain: str):
    profile = await build()
    if sys.platform == "darwin":
        default_chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    else:
        default_chrome = "google-chrome"
    chrome_path = os.getenv("CHROME_PATH", default_chrome)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=chrome_path,
            headless=False,
            slow_mo=500,
            args=["--new-window", "--no-sandbox", "--disable-dev-shm-usage"],
        )

        viewport = {
            "width": profile["screen"]["width"],
            "height": profile["screen"]["height"] - 40,
        }
        context = await browser.new_context(
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

        try:
            # ── 1단계: 구글 접속 및 검색 ──────────────────────────
            print("🌐 구글 접속 중...")
            await page.goto("https://www.google.com", wait_until="domcontentloaded")
            await wait_for_page_ready(page, 'textarea[name="q"]')

            search_input = GoogleSearchInput(page)
            await search_input.activate_search_box()
            await search_input.type_keyword(search_keyword)
            await search_input.submit_search()

            await asyncio.sleep(3)

            # ── 2단계: 캡차 감지 및 해결 ──────────────────────────
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

            # ── 3단계: 검색결과 탐색 → 타겟 URL 발견 ──────────────
            navigator = SearchResultNavigator(page)
            target_url = None

            for current_page in range(1, 6):
                print(f"📄 {current_page}페이지 탐색 중...")

                await wait_for_page_ready(page, 'div#search, cite, a#pnnext')
                import random
                await asyncio.sleep(random.uniform(1.0, 2.0))

                target_url = await navigator.scan_current_page_for_target(target_domain)

                if target_url:
                    break

                if not await navigator.navigate_to_next_page():
                    break

            if not target_url:
                print("❌ 타겟을 찾지 못했습니다.")
                return 1

            # ── 4단계: 타겟 사이트 진입 ───────────────────────────
            await navigator.access_target_site(target_url)

            # ── 5단계: 사이트 내 자연스러운 활동 ─────────────────
            engagement = UserEngagementSimulator(page)
            await engagement.engage_with_content()
            await engagement.deepen_site_visit(target_domain)
            await engagement.engage_with_content()

            # ── 6단계: 세션 종료 및 구글로 복귀 ──────────────────
            await engagement.finalize_session_and_exit()

        except Exception as e:
            print(f"❌ 오류 발생: {e}")
            return 1
        finally:
            await asyncio.sleep(5)
            await context.close()
            await browser.close()

    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Google Search Bot!!")
    parser.add_argument("search_keyword", type=str, help="검색 키워드")
    parser.add_argument("target_domain", type=str, help="찾을 도메인 (ex: tiktok-save.com)")
    args = parser.parse_args()

    raise SystemExit(asyncio.run(run(search_keyword=args.search_keyword, target_domain=args.target_domain)))
