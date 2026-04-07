import asyncio
from typing import Optional, Tuple
from urllib.parse import urlparse, parse_qs
from playwright.async_api import Page
from capsolver_client import ReCaptchaV2EnterpriseTaskProxyLess, CapSolverClient

class SolveCaptcha:
    def __init__(self, page: Page):
        self.page = page

    async def _extract_enterprise_s_value(self) -> Optional[str]:
        with open("script/extract_enterprise_s_value.js", "r", encoding="utf-8") as f:
            iframe_box = await self.page.evaluate(f.read())

        if not iframe_box:
            return None

        parsed_url = urlparse(iframe_box)
        params = parse_qs(parsed_url.query)
        s_value = params.get('s',[None])[0]

        if not s_value:
            return None
        return s_value

    async def _extract_recaptcha_sitekey(self) -> Optional[str]:
        with open("script/extract_recaptcha_sitekey.js", "r", encoding="utf-8") as f:
            sitekey = await self.page.evaluate(f.read())

        if not sitekey:
            return None

        if "http" in sitekey and "recaptcha" in sitekey:
            parsed = urlparse(sitekey)
            key = parse_qs(parsed.query).get("k")
            return key[0] if key else None
        return sitekey

    async def is_captcha_page(self) -> bool:
        captcha_detected = await self.page.locator(
            'iframe[title*="reCAPTCHA"]'
        ).first.is_visible()
        sorry_page = "google.com/sorry" in self.page.url
        return captcha_detected or sorry_page

    async def solve(self) -> bool:
        sitekey = await self._extract_recaptcha_sitekey()
        s_value = await self._extract_enterprise_s_value()

        task = ReCaptchaV2EnterpriseTaskProxyLess(
            website_url=self.page.url,
            website_key=sitekey,
            s=s_value,
        )

        client = CapSolverClient(task)
        solution = await asyncio.to_thread(client.solve_task)

        token = solution.get("gRecaptchaResponse")
        if not token:
            return False

        with open("script/inject_captcha.js", "r", encoding="utf-8") as f:
            await self.page.evaluate(f.read(), token)
        return True
