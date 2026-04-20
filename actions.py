import asyncio
import random
from typing import Optional

from playwright.async_api import Page


async def wait_for_page_ready(page: Page, selector: str = "body", timeout: int = 20000):
    await page.wait_for_load_state("domcontentloaded", timeout=timeout)
    if selector:
        await page.wait_for_selector(selector, timeout=timeout)


async def smooth_scroll_to(page: Page, target_y: float, duration_ms: int = 700):
    """requestAnimationFrame 기반으로 자연스럽게 스크롤합니다."""
    await page.evaluate(
        """
        async ({ targetY, durationMs }) => {
          const doc = document.documentElement;
          const maxScrollY = Math.max(0, doc.scrollHeight - window.innerHeight);
          const startY = window.scrollY;
          const endY = Math.min(Math.max(targetY, 0), maxScrollY);
          const delta = endY - startY;

          if (Math.abs(delta) < 1) return;

          const easeInOutCubic = (t) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          await new Promise((resolve) => {
            const startTime = performance.now();
            const tick = (now) => {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / durationMs, 1);
              const eased = easeInOutCubic(progress);
              window.scrollTo(0, startY + delta * eased);
              if (progress < 1) {
                requestAnimationFrame(tick);
              } else {
                resolve();
              }
            };
            requestAnimationFrame(tick);
          });
        }
        """,
        {"targetY": target_y, "durationMs": duration_ms},
    )

class GoogleSearchInput:
    def __init__(self, page: Page):
        self.page = page

    async def activate_search_box(self):
        search_box_element = self.page.locator('textarea[name="q"]').first
        await search_box_element.wait_for(state="visible")

        # 검색창의 실제 위치/크기 가져오기
        box = await search_box_element.bounding_box()

        # 1. 사람처럼 약간 빗나간 위치를 랜덤으로 클릭
        offset_x = random.uniform(box["width"] * 0.2, box["width"] * 0.6)
        offset_y = random.uniform(box["height"] * 0.2, box["height"] * 0.8)
        target_x = box["x"] + offset_x
        target_y = box["y"] + offset_y

        # 2. 현재 마우스 위치에서 목표까지 여러 중간 지점을 거쳐 이동 (곡선 흉내)
        current_x = random.uniform(300, 800)  # 이전 마우스 위치 추정
        current_y = random.uniform(200, 500)

        steps = random.randint(8, 15)
        for i in range(steps):
            t = (i + 1) / steps
            # easing: 처음엔 빠르게, 끝에선 느리게
            ease = t * t * (3 - 2 * t)
            mid_x = current_x + (target_x - current_x) * ease
            mid_y = current_y + (target_y - current_y) * ease
            # 약간의 떨림 추가
            mid_x += random.uniform(-3, 3)
            mid_y += random.uniform(-3, 3)
            await self.page.mouse.move(mid_x, mid_y)
            await asyncio.sleep(random.uniform(0.01, 0.03))

        await asyncio.sleep(random.uniform(0.3, 0.7))

        # 3. 클릭 (마우스 down/up 딜레이도 자연스럽게)
        await self.page.mouse.click(target_x, target_y, delay=random.randint(80, 180))
        await asyncio.sleep(random.uniform(0.2, 0.5))

    async def type_keyword(self, keyword: str):
        await asyncio.sleep(random.uniform(0.3, 0.8))

        for char in keyword:
            await self.page.keyboard.type(char)
            await asyncio.sleep(random.uniform(0.07, 0.22))
            if random.random() < 0.15:
                await asyncio.sleep(random.uniform(0.3, 0.7))

        await asyncio.sleep(random.uniform(0.5, 1.0))

    async def submit_search(self):
        await asyncio.sleep(random.uniform(0.3, 0.7))  # 입력 끝나고 바로 치는 사람 없음
        await self.page.keyboard.press("Enter")
        await wait_for_page_ready(self.page, 'div#search, div#rso, cite, a#pnnext')

class SearchResultNavigator:
    def __init__(self, page: Page):
        self.page = page

    async def _get_scroll_state(self):
        return await self.page.evaluate(
            """
            () => {
              const pageH = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.offsetHeight
              );
              return {
                y: window.scrollY,
                viewportH: window.innerHeight,
                pageH
              };
            }
            """
        )

    async def _pause_and_look_around(self):
        """중간에 멈춰 화면을 읽는 듯한 동작"""
        state = self.page.viewport_size or {"height": 720, "width": 1280}
        vw = state["width"]
        vh = state["height"]

        # 시선 이동 흉내
        for _ in range(random.randint(1, 3)):
            x = random.randint(int(vw * 0.18), int(vw * 0.86))
            y = random.randint(int(vh * 0.18), int(vh * 0.82))
            await self.page.mouse.move(x, y)
            await asyncio.sleep(random.uniform(0.15, 0.45))

        # 읽는 시간
        await asyncio.sleep(random.uniform(0.9, 2.2))

    async def browse_results_page_like_human(self, target_domain: str) -> Optional[str]:
        """
        검색 결과를 끝까지 보는 듯이 스크롤/정지 반복.
        중간중간 타겟 도메인을 찾으면 즉시 반환하고,
        끝까지 봤는데 없으면 None 반환.
        """
        # 페이지 첫 화면 잠깐 확인
        await self._pause_and_look_around()
        found = await self.scan_current_page_for_target(target_domain)
        if found:
            return found

        max_cycles = 50  # 무한루프 방지
        cycles = 0
        prev_scroll_y = None

        while cycles < max_cycles:
            scroll = await self._get_scroll_state()
            remaining = scroll["pageH"] - (scroll["y"] + scroll["viewportH"])

            # 스크롤이 더 이상 진행되지 않으면 끝으로 판단
            if prev_scroll_y is not None and scroll["y"] == prev_scroll_y:
                await self._pause_and_look_around()
                return await self.scan_current_page_for_target(target_domain)

            # 페이지 끝 도달 → 마지막 스캔 후 종료
            if remaining <= 5:
                await self._pause_and_look_around()
                return await self.scan_current_page_for_target(target_domain)

            # 랜덤하게 읽다 멈추는 구간 (32% 확률)
            if cycles > 0 and random.random() < 0.32:
                await self._pause_and_look_around()
                found = await self.scan_current_page_for_target(target_domain)
                if found:
                    return found
                cycles += 1
                continue

            # 뷰포트 18~30% 단위로 스크롤 (남은 거리 초과 방지)
            max_step = max(110, int(scroll["viewportH"] * 0.30))
            min_step = max(80,  int(scroll["viewportH"] * 0.18))
            step = random.randint(min_step, max_step)

            prev_scroll_y = scroll["y"]
            await smooth_scroll_to(
                self.page,
                scroll["y"] + step,
                duration_ms=random.randint(250, 430),
            )
            cycles += 1
            await self._pause_and_look_around()

            found = await self.scan_current_page_for_target(target_domain)
            if found:
                return found

    async def _wait_for_click_stability(self, element):
        """스크롤 직후 레이아웃 흔들림을 잠깐 기다린 뒤 클릭 좌표를 확정합니다."""
        try:
            await element.wait_for(state="visible", timeout=4000)
        except Exception:
            return None

        await asyncio.sleep(random.uniform(0.35, 0.9))
        first_box = await element.bounding_box()
        if not first_box:
            return None

        await asyncio.sleep(random.uniform(0.08, 0.2))
        second_box = await element.bounding_box()
        if second_box:
            return second_box
        return first_box

    async def _scroll_to_element(self, element):
        """요소가 보일 때까지 자연스럽게 스크롤하는 내부 동작"""
        box = await element.bounding_box()
        if not box:
            return

        viewport = self.page.viewport_size or {"height": 720, "width": 1280}
        vh = viewport["height"]

        # 이미 뷰포트 안에 완전히 들어와 있으면 스크롤 불필요
        if box["y"] >= 0 and (box["y"] + box["height"]) <= vh:
            return

        current_scroll = await self.page.evaluate("window.scrollY")
        target_doc_y = current_scroll + box["y"] - (vh * 0.30)

        max_step = max(110, int(vh * random.uniform(0.18, 0.26)))
        while True:
            current_scroll = await self.page.evaluate("window.scrollY")
            remaining = target_doc_y - current_scroll
            if abs(remaining) <= max_step:
                break

            step = max_step if remaining > 0 else -max_step
            await smooth_scroll_to(self.page, current_scroll + step, duration_ms=random.randint(260, 420))
            await asyncio.sleep(random.uniform(0.22, 0.46))

        await smooth_scroll_to(self.page, target_doc_y, duration_ms=random.randint(280, 480))
        await asyncio.sleep(random.uniform(0.3, 0.7))

    async def _find_clickable_point(self, element, box: dict) -> tuple[float, float]:
        """
        요소 내에서 실제로 클릭 가능한 좌표를 찾습니다.
        elementFromPoint()로 검증 → 가려진 경우 그리드 탐색으로 다른 좌표 시도
        """
        candidates = [(
            random.uniform(box["width"] * 0.2, box["width"] * 0.8),
            random.uniform(box["height"] * 0.2, box["height"] * 0.8),
        )]
        for fx in [0.3, 0.5, 0.7]:
            for fy in [0.3, 0.5, 0.7]:
                candidates.append((box["width"] * fx, box["height"] * fy))

        for (ox, oy) in candidates:
            abs_x = box["x"] + ox
            abs_y = box["y"] + oy

            is_hittable = await element.evaluate(f"""
                el => {{
                    const top = document.elementFromPoint({abs_x}, {abs_y});
                    return top !== null && (el === top || el.contains(top));
                }}
            """)

            if is_hittable:
                return abs_x, abs_y

        return box["x"] + box["width"] / 2, box["y"] + box["height"] / 2

    async def _click_element(self, element):
        """요소를 사람처럼 약간 빗나간 위치로 클릭하는 내부 동작"""
        box = await self._wait_for_click_stability(element)
        if not box:
            return

        vh = self.page.viewport_size["height"]
        # bounding_box가 뷰포트 밖이면 스크롤 후 좌표 재획득
        if box["y"] < 0 or (box["y"] + box["height"]) > vh:
            await self._scroll_to_element(element)
            box = await self._wait_for_click_stability(element)
            if not box:
                return

        target_x, target_y = await self._find_clickable_point(element, box)
        await self.page.mouse.click(target_x, target_y, delay=random.randint(80, 180))
        await asyncio.sleep(random.uniform(0.2, 0.5))

    async def scan_current_page_for_target(self, target_domain: str) -> Optional[str]:
        # 1. cite가 DOM에 올라올 때까지 대기
        try:
            await self.page.wait_for_selector('cite', timeout=5000)
        except:
            print("⚠️ cite 요소 로딩 타임아웃")
            return None

        # 2. .yuRUbf 대신 cite 전체 직접 수집
        cite_elements = await self.page.locator('cite').all()
        print(f"🔍 현재 페이지에서 {len(cite_elements)}개의 결과 분석 중...")

        for cite_el in cite_elements:
            displayed_url = await cite_el.inner_text()

            if target_domain.lower() not in displayed_url.lower():
                continue

            print(f"🎯 타겟 도메인 식별 성공: {displayed_url}")

            # cite에서 가장 가까운 a태그 탐색
            href = await cite_el.evaluate("""
                (el) => {
                    let node = el;
                    while (node) {
                        const a = node.closest('a[href]');
                        if (a) return a.href;
                        node = node.parentElement;
                    }
                    return null;
                }
            """)

            if href:
                return href

        return None

    async def navigate_to_next_page(self) -> bool:
        """다음 페이지로 이동합니다."""
        next_btn = self.page.locator('a#pnnext')

        if not await next_btn.is_visible():
            print("❌ 더 이상 탐색할 페이지가 없습니다.")
            return False

        print("➡️ 다음 검색 결과 페이지로 이동합니다.")
        before_url = self.page.url
        before_start = await self.page.evaluate(
            "() => new URL(window.location.href).searchParams.get('start') || '0'"
        )

        await self._scroll_to_element(next_btn)

        async with self.page.expect_navigation(timeout=30000):
            await self._click_element(next_btn)

        moved = True

        await wait_for_page_ready(self.page, 'div#search, div#rso, cite, a#pnnext')
        await self.page.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(random.uniform(0.5, 1.2))
        return True

    async def access_target_site(self, target_url: str):
        """식별된 링크를 직접 클릭하여 타겟 사이트로 진입합니다."""
        print(f"🚀 타겟 사이트 진입 시도: {target_url}")

        link = self.page.locator(f'a[href="{target_url}"], a[href="{target_url.rstrip("/")}"]').first
        if await link.count() > 0:
            await self._scroll_to_element(link)
            await self._click_element(link)
            await wait_for_page_ready(self.page)
        else:
            print("⚠️ 직접 href 매칭 실패 → 제목 링크로 재시도")
            title_link = self.page.locator(f'a[href*="{target_url.split("//")[-1].rstrip("/")}"]').first
            if await title_link.count() > 0:
                await self._scroll_to_element(title_link)
                await self._click_element(title_link)
                await wait_for_page_ready(self.page)
            else:
                print("⚠️ 링크 요소를 찾지 못해 goto로 이동합니다.")
                await self.page.goto(target_url, wait_until="domcontentloaded")
                await wait_for_page_ready(self.page)

        await wait_for_page_ready(self.page)
        print(f"✅ 현재 URL: {self.page.url}")

class UserEngagementSimulator:
    def __init__(self, page: Page):
        self.page = page

    async def _move_to_back_button(self):
        """브라우저 뒤로가기 버튼 위치(좌상단)로 마우스를 자연스럽게 이동"""
        # 뒤로가기 버튼은 보통 좌상단 20~40px 영역
        target_x = random.uniform(18, 35)
        target_y = random.uniform(18, 35)

        # 현재 마우스 위치 추정 (페이지 중앙 어딘가)
        current_x = random.uniform(400, 900)
        current_y = random.uniform(300, 600)

        steps = random.randint(10, 18)
        for i in range(steps):
            t = (i + 1) / steps
            ease = t * t * (3 - 2 * t)
            mid_x = current_x + (target_x - current_x) * ease
            mid_y = current_y + (target_y - current_y) * ease
            mid_x += random.uniform(-2, 2)
            mid_y += random.uniform(-2, 2)
            await self.page.mouse.move(mid_x, mid_y)
            await asyncio.sleep(random.uniform(0.01, 0.03))

        await asyncio.sleep(random.uniform(0.2, 0.5))
        await self.page.mouse.click(target_x, target_y, delay=random.randint(60, 130))
        await asyncio.sleep(random.uniform(0.3, 0.6))

    async def _smooth_scroll(self, total_delta: int):
        """한 번에 길게 내려가지 않도록 작은 구간으로 나눠 부드럽게 스크롤"""
        viewport = self.page.viewport_size or {"height": 720, "width": 1280}
        remaining = max(1, total_delta)
        max_chunk = max(110, int(viewport["height"] * 0.24))

        while remaining > 0:
            chunk = min(remaining, random.randint(max(80, int(max_chunk * 0.55)), max_chunk))
            current_scroll = await self.page.evaluate("window.scrollY")
            target_scroll = current_scroll + chunk
            await smooth_scroll_to(self.page, target_scroll, duration_ms=random.randint(240, 420))
            remaining -= chunk
            await asyncio.sleep(random.uniform(0.16, 0.34))


    async def _scan_viewport(self):
        """스크롤 후 현재 화면을 훑어보는 동작 (시선 이동 흉내)"""
        vw = self.page.viewport_size["width"]
        vh = self.page.viewport_size["height"]

        # 화면 내 1~3곳을 마우스로 자연스럽게 이동하며 훑기
        scan_count = random.randint(1, 3)
        for _ in range(scan_count):
            x = random.randint(int(vw * 0.1), int(vw * 0.75))
            y = random.randint(int(vh * 0.2), int(vh * 0.80))
            await self.page.mouse.move(x, y)
            await asyncio.sleep(random.uniform(0.3, 0.9))

        # 찾는 게 있는지 확인하는 시간
        await asyncio.sleep(random.uniform(1.0, 2.5))

    async def engage_with_content(self):
        """스크롤 → 훑어보기 → 없으면 또 스크롤 반복"""
        vh = self.page.viewport_size["height"]
        max_scrolls = random.randint(6, 7)
        print(f"⏱️ [Engagement] 콘텐츠 탐색 시작 (최대 {max_scrolls}회)")

        for step in range(1, max_scrolls + 1):
            # 실제 스크롤 가능한 높이 (SPA/컨테이너 대응)
            scroll_y, page_h = await self.page.evaluate("""
                [
                    window.scrollY,
                    Math.max(
                        document.body.scrollHeight,
                        document.documentElement.scrollHeight,
                        document.body.offsetHeight,
                        document.documentElement.offsetHeight
                    )
                ]
            """)

            remaining = page_h - scroll_y - vh
            if remaining < 80 and step > 2:
                # 최소 2번은 스크롤 후 끝 도달 시 종료
                print(f"   - {step}번째: 페이지 끝 도달, 탐색 종료")
                break

            # 남은 거리보다 크게 내리지 않도록 조정
            max_delta = max(int(vh * 0.40), min(int(vh * 0.60), remaining - 50))
            delta = random.randint(int(vh * 0.40), max(int(vh * 0.40) + 10, max_delta))
            await self._smooth_scroll(delta)

            print(f"   - {step}/{max_scrolls} 스크롤 후 화면 확인 중...")
            await self._scan_viewport()

    async def deepen_site_visit(self, root_domain: str) -> bool:
        """내부 링크를 클릭하여 세션 깊이를 더하고 이탈률을 낮춥니다."""
        path_candidates = await self.page.locator(
            f'a[href*="{root_domain}"], a[href^="/"]'
        ).all()

        valid_paths = []
        for path in path_candidates:
            url_string = await path.get_attribute('href')
            if url_string and len(url_string.strip()) > len(root_domain) + 5:
                valid_paths.append(path)

        if not valid_paths:
            print("⚠️ [Notice] 추가 탐색 가능한 경로를 찾지 못했습니다.")
            return False

        chosen_path = random.choice(valid_paths)
        print(f"🔗 [Engagement] 내부 페이지로 탐색 확장")

        try:
            await chosen_path.scroll_into_view_if_needed()
            await asyncio.sleep(random.uniform(1.0, 2.5))
            await chosen_path.click()
            await wait_for_page_ready(self.page)
            return True
        except Exception as e:
            print(f"❌ [Error] 내부 이동 중 오류: {e}")
            return False

    async def finalize_session_and_exit(self):
        """체류 후 뒤로가기 2회로 구글 검색결과까지 자연스럽게 퇴장합니다."""
        final_retention_time = random.randint(20, 45)
        print(f"✅ 최종 {final_retention_time}초 대기 중...")
        await asyncio.sleep(final_retention_time)

        # 1. 내부페이지 → 타겟사이트 메인
        print("🔙 타겟사이트 메인으로 복귀")
        await self._move_to_back_button()
        await wait_for_page_ready(self.page)
        await asyncio.sleep(random.uniform(2.0, 4.0))

        # 2. 타겟사이트 메인 → 구글 검색결과
        print("🔙 구글 검색결과로 복귀")
        await self._move_to_back_button()
        await wait_for_page_ready(self.page)

        print("🏁 세션 종료 완료")
