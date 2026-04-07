import random
import asyncio
import urllib.request
import json
from typing import Optional

# IP 기반 정보 조회 (무료 API)
async def fetch_ip_profile(proxy: Optional[str] = None) -> dict:
    """
    현재 IP(또는 프록시 IP)의 국가/timezone/언어 정보를 조회합니다.
    """
    try:
        # proxy 환경이면 프록시를 통해 조회해야 실제 프록시 IP 기준으로 나옴
        if proxy:
            proxy_handler = urllib.request.ProxyHandler({"http": proxy, "https": proxy})
            opener = urllib.request.build_opener(proxy_handler)
        else:
            opener = urllib.request.build_opener()

        # ip-api.com: 무료, 분당 45회 제한
        req = urllib.request.Request(
            "http://ip-api.com/json/?fields=status,country,countryCode,timezone,lat,lon,lang,query",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with opener.open(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        if data.get("status") != "success":
            raise RuntimeError(f"ip-api 조회 실패: {data}")

        print(f"🌐 IP 정보 조회 성공: {data['query']} ({data['countryCode']} / {data['timezone']})")
        return data

    except Exception as e:
        print(f"⚠️ IP 조회 실패, 기본값(KR) 사용: {e}")
        return {
            "countryCode": "KR",
            "timezone": "Asia/Seoul",
            "country": "South Korea",
            "lat": 37.5665,
            "lon": 126.9780,
        }


# timezone → UTC offset 계산
def get_timezone_offset(timezone: str) -> int:
    """
    timezone 문자열로 UTC offset(분)을 계산합니다.
    예: Asia/Seoul → -540, America/New_York → 300 (EST 기준)
    """
    import datetime
    import zoneinfo

    try:
        tz = zoneinfo.ZoneInfo(timezone)
        now = datetime.datetime.now(tz)
        offset_seconds = now.utcoffset().total_seconds()
        # JS의 getTimezoneOffset()은 UTC보다 앞서면 음수
        return -int(offset_seconds / 60)
    except Exception:
        return -540  # fallback: KST


# 국가코드 → locale 매핑
LOCALE_MAP = {
    "KR": "ko-KR",
    "US": "en-US",
    "GB": "en-GB",
    "JP": "ja-JP",
    "DE": "de-DE",
    "FR": "fr-FR",
    "CN": "zh-CN",
    "BR": "pt-BR",
    "IN": "en-IN",
    "AU": "en-AU",
}

# 국가코드 → UA 풀 매핑
UA_POOL = {
    "KR": [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
    ],
    "US": [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
    ],
    "DEFAULT": [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
    ]
}

# 국가코드 → screen 해상도 풀
SCREEN_POOL = {
    "KR": [{"width": 1440, "height": 900}, {"width": 1920, "height": 1080}],
    "US": [{"width": 1920, "height": 1080}, {"width": 2560, "height": 1440}],
    "DEFAULT": [{"width": 1920, "height": 1080}],
}

async def get_chrome_version() -> str:
    """실제 실행될 Chromium/Chrome의 버전을 가져옵니다."""
    import subprocess
    import os
    import sys
    try:
        if sys.platform == "darwin":
            default_chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        else:
            default_chrome = "google-chrome"
        chrome_path = os.getenv("CHROME_PATH", default_chrome)

        # 실제 Chrome 버전 확인
        result = subprocess.run([chrome_path, "--version"], capture_output=True, text=True)
        # "Google Chrome 124.0.6367.60" → "124"
        version = result.stdout.strip().split(" ")[-1].split(".")[0]
        return version
    except:
        return "464"  # fallback


async def build(proxy: Optional[str] = None) -> dict:
    version = await get_chrome_version()  # 버전 먼저 가져오기

    """
    IP 조회 결과를 기반으로 브라우저 프로필을 동적으로 생성합니다.
    """
    ip_data = await asyncio.to_thread(
        lambda: asyncio.run(fetch_ip_profile(proxy))
        if False else None
    )
    # to_thread에서 async 함수를 쓸 수 없으므로 직접 await
    ip_data = await fetch_ip_profile(proxy)

    country = ip_data.get("countryCode", "KR")
    timezone = ip_data.get("timezone", "Asia/Seoul")
    tz_offset = get_timezone_offset(timezone)

    locale = LOCALE_MAP.get(country, "en-US")
    ua_template = random.choice(UA_POOL.get(country, UA_POOL["DEFAULT"]))
    user_agent = ua_template.replace("{version}", f"{version}.0.0.0")
    screen = random.choice(SCREEN_POOL.get(country, SCREEN_POOL["DEFAULT"]))

    platform = "Win32" if "Windows" in user_agent else "MacIntel"
    profile = {
        "country": country,
        "timezone_id": timezone,
        "timezone_offset": tz_offset,
        "locale": locale,
        "user_agent": user_agent,
        "platform": platform,
        "hardware_concurrency": random.choice([4, 6, 8, 12]),
        "device_memory": random.choice([8, 16]),
        "screen": screen,
    }

    print(f"📋 동적 프로필 생성 완료:")
    print(f"   - 국가: {country} / timezone: {timezone} (offset: {tz_offset})")
    print(f"   - locale: {locale}")
    print(f"   - UA: {user_agent[:60]}...")
    print(f"   - screen: {screen}")

    return profile


def build_fingerprint_script(profile: dict) -> str:
    hw = profile["hardware_concurrency"]
    mem = profile["device_memory"]
    tz_offset = profile["timezone_offset"]
    timezone = profile["timezone_id"]
    screen_w = profile["screen"]["width"]
    screen_h = profile["screen"]["height"]
    locale = profile["locale"]
    lang = locale.split("-")[0]
    user_agent = profile["user_agent"]
    platform = profile["platform"]

    with open("script/fingerprint.js", "r", encoding="utf-8") as f:
        script = f.read()

    return (
        script
        .replace("__HW__",       str(hw))
        .replace("__MEM__",      str(mem))
        .replace("__LOCALE__",   locale)
        .replace("__LANG__",     lang)
        .replace("__SCREEN_W__", str(screen_w))
        .replace("__SCREEN_H__", str(screen_h))
        .replace("__TZ_OFFSET__",str(tz_offset))
        .replace("__TIMEZONE__", timezone)
        .replace("__UA__",       user_agent)
        .replace("__PLATFORM__", platform)
    )
