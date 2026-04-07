import asyncio
from playwright.async_api import async_playwright

from fingerprint import build_fingerprint_script


async def main():
    from fingerprint import build
    profile = await build()

    async with async_playwright() as p:

        browser = await p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=False,
            args=["--new-window"],
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
        await page.goto("https://www.google.com", wait_until="domcontentloaded")
        await page.bring_to_front()

        print("구글 창을 띄웠습니다. 직접 입력하세요.")
        await asyncio.to_thread(input, "종료하려면 엔터를 누르세요...")

        await context.close()
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
