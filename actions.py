import asyncio
import random
from typing import Optional

from playwright.async_api import Page


async def wait_for_page_ready(page: Page, selector: str = "body", timeout: int = 15000):
    await page.wait_for_load_state("domcontentloaded", timeout=timeout)
    if selector:
        await page.wait_for_selector(selector, timeout=timeout)

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
        await wait_for_page_ready(self.page, 'div#search, cite, a#pnnext')

class SearchResultNavigator:
    def __init__(self, page: Page):
        self.page = page

    async def _scroll_to_element(self, element):
        """요소가 보일 때까지 자연스럽게 스크롤하는 내부 동작"""
        box = await element.bounding_box()
        if not box:
            return

        viewport = self.page.viewport_size
        target_y = box["y"] - (viewport["height"] * 0.3)  # 요소를 화면 상단 30% 위치에

        current_scroll = await self.page.evaluate("window.scrollY")

        # 현재 스크롤 위치에서 목표까지 단계적으로 이동
        steps = random.randint(6, 12)
        for i in range(steps):
            t = (i + 1) / steps
            ease = t * t * (3 - 2 * t)
            next_y = current_scroll + (target_y - current_scroll) * ease
            await self.page.evaluate(f"window.scrollTo(0, {next_y})")
            await asyncio.sleep(random.uniform(0.03, 0.08))

        await asyncio.sleep(random.uniform(0.3, 0.7))

    async def _click_element(self, element):
        """요소를 사람처럼 약간 빗나간 위치로 클릭하는 내부 동작"""
        box = await element.bounding_box()
        if not box:
            return

        target_x = box["x"] + random.uniform(box["width"] * 0.2, box["width"] * 0.8)
        target_y = box["y"] + random.uniform(box["height"] * 0.2, box["height"] * 0.8)

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
        await self._scroll_to_element(next_btn)
        await self._click_element(next_btn)
        await wait_for_page_ready(self.page, 'div#search, cite, a#pnnext')
        return True

    async def access_target_site(self, target_url: str):
        """식별된 링크를 직접 클릭하여 타겟 사이트로 진입합니다."""
        print(f"🚀 타겟 사이트 진입 시도: {target_url}")

        link = self.page.locator(f'a[href="{target_url}"], a[href="{target_url.rstrip("/")}"]').first
        if await link.count() > 0:
            await self._scroll_to_element(link)
            await asyncio.sleep(random.uniform(0.5, 1.2))

            await self._click_element(link)
            await wait_for_page_ready(self.page)
        else:
            print("⚠️ 직접 href 매칭 실패 → 제목 링크로 재시도")
            title_link = self.page.locator(f'a[href*="{target_url.split("//")[-1].rstrip("/")}"]').first
            if await title_link.count() > 0:
                await self._scroll_to_element(title_link)
                await asyncio.sleep(random.uniform(0.5, 1.2))
                await self._click_element(title_link)
                await wait_for_page_ready(self.page)
            else:
                print("⚠️ 링크 요소를 찾지 못해 goto로 이동합니다.")
                await self.page.goto(target_url, wait_until="domcontentloaded")
                await wait_for_page_ready(self.page)

        await wait_for_page_ready(self.page)
        print(f"✅ 현재 URL: {self.page.url}")


import asyncio
import random
from playwright.async_api import Page

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

    async def engage_with_content(self):
        """페이지 콘텐츠를 실제 유저처럼 소비하며 체류 시간을 확보합니다."""
        browsing_session_count = random.randint(5, 9)
        print(f"⏱️ [Engagement] 콘텐츠 소비 시작 (약 {browsing_session_count}단계)")

        for step in range(1, browsing_session_count + 1):
            scroll_depth = random.randint(350, 800)
            await self.page.mouse.wheel(0, scroll_depth)

            observation_time = random.uniform(2.0, 5.0)
            print(f"   - {step}단계 이동 후 {observation_time:.1f}초 머물기")
            await asyncio.sleep(observation_time)

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
