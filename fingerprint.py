import random
import asyncio
import requests
from typing import Optional

# IP 기반 정보 조회 (무료 API)
async def fetch_ip_profile(proxy: Optional[str] = None) -> dict:
    """
    현재 IP(또는 프록시 IP)의 국가/timezone/언어 정보를 조회합니다.
    """
    try:
        proxies = {"http": proxy, "https": proxy} if proxy else None
        resp = requests.get(
            "http://ip-api.com/json/?fields=status,country,countryCode,timezone,lat,lon,query",
            proxies=proxies,
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        data = resp.json()

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
    "KR": "ko-KR", "US": "en-US", "GB": "en-GB", "JP": "ja-JP",
    "DE": "de-DE", "FR": "fr-FR", "CN": "zh-CN", "BR": "pt-BR",
    "IN": "en-IN", "AU": "en-AU", "CA": "en-CA", "RU": "ru-RU",
    "ES": "es-ES", "MX": "es-MX", "IT": "it-IT", "PL": "pl-PL",
    "NL": "nl-NL", "TR": "tr-TR", "SE": "sv-SE", "NO": "nb-NO",
    "SG": "en-SG", "TH": "th-TH", "ID": "id-ID", "VN": "vi-VN",
    "PH": "en-PH", "MY": "ms-MY", "UA": "uk-UA", "AR": "es-AR",
    "CL": "es-CL", "CO": "es-CO", "ZA": "en-ZA", "NG": "en-NG",
    "EG": "ar-EG", "SA": "ar-SA", "AE": "ar-AE", "IL": "he-IL",
    "PT": "pt-PT", "CZ": "cs-CZ", "HU": "hu-HU", "RO": "ro-RO",
    "GR": "el-GR", "FI": "fi-FI", "DK": "da-DK",
}

# UA 템플릿 (Windows/Mac OS 버전 다양화, {version} → 실제 Chrome 버전으로 대체)
_WIN_UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",  # 2x weight (가장 흔함)
    "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
]
_MAC_UAS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
]
_LIN_UAS = [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
]

# 국가별 OS 선호도 반영 (Mac 비율이 높은 국가 vs Windows 위주)
UA_POOL = {
    # Mac 비율 높은 국가
    "US": _WIN_UAS * 2 + _MAC_UAS * 2 + _LIN_UAS,
    "GB": _WIN_UAS * 2 + _MAC_UAS * 2 + _LIN_UAS,
    "AU": _WIN_UAS * 2 + _MAC_UAS * 2,
    "CA": _WIN_UAS * 2 + _MAC_UAS * 2,
    "SE": _WIN_UAS + _MAC_UAS * 2,
    "NO": _WIN_UAS + _MAC_UAS * 2,
    "DK": _WIN_UAS + _MAC_UAS * 2,
    # Mac 비율 낮은 국가
    "KR": _WIN_UAS * 3 + _MAC_UAS,
    "JP": _WIN_UAS * 3 + _MAC_UAS,
    "DE": _WIN_UAS * 3 + _MAC_UAS + _LIN_UAS,
    "RU": _WIN_UAS * 4,
    "CN": _WIN_UAS * 4,
    "BR": _WIN_UAS * 3 + _MAC_UAS,
    "IN": _WIN_UAS * 4 + _LIN_UAS,
    "DEFAULT": _WIN_UAS * 3 + _MAC_UAS + _LIN_UAS,
}

# 글로벌 공통 해상도 풀 (실사용 점유율 기반 가중치)
_COMMON_SCREENS = [
    {"width": 1920, "height": 1080},  # ~25% - 3x weight
    {"width": 1920, "height": 1080},
    {"width": 1920, "height": 1080},
    {"width": 1366, "height": 768},   # ~10%
    {"width": 1366, "height": 768},
    {"width": 1536, "height": 864},   # ~7%
    {"width": 1536, "height": 864},
    {"width": 1440, "height": 900},   # ~7%
    {"width": 1440, "height": 900},
    {"width": 2560, "height": 1440},  # ~7%
    {"width": 2560, "height": 1440},
    {"width": 1280, "height": 720},   # ~5%
    {"width": 1600, "height": 900},   # ~4%
    {"width": 1280, "height": 800},   # ~3%
    {"width": 2560, "height": 1600},  # ~3%
    {"width": 3840, "height": 2160},  # ~3%
    {"width": 1680, "height": 1050},  # ~2%
    {"width": 1920, "height": 1200},  # ~2%
]

# 국가코드 → screen 해상도 풀 (특이사항 없으면 공통 풀 사용)
SCREEN_POOL = {
    # 4K/고해상도 비율 높은 국가
    "US": _COMMON_SCREENS + [{"width": 2560, "height": 1440}, {"width": 3840, "height": 2160}],
    "GB": _COMMON_SCREENS + [{"width": 2560, "height": 1440}],
    "DE": _COMMON_SCREENS + [{"width": 2560, "height": 1440}],
    "JP": _COMMON_SCREENS + [{"width": 2560, "height": 1440}],
    "KR": _COMMON_SCREENS + [{"width": 2560, "height": 1440}],
    "DEFAULT": _COMMON_SCREENS,
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
    """
    IP 조회 결과를 기반으로 브라우저 프로필을 동적으로 생성합니다.
    """
    version = await get_chrome_version()
    ip_data = await fetch_ip_profile(proxy)

    country = ip_data.get("countryCode", "KR")
    timezone = ip_data.get("timezone", "Asia/Seoul")
    tz_offset = get_timezone_offset(timezone)

    locale = LOCALE_MAP.get(country, "en-US")
    ua_template = random.choice(UA_POOL.get(country, UA_POOL["DEFAULT"]))
    user_agent = ua_template.replace("{version}", f"{version}.0.0.0")
    screen = random.choice(SCREEN_POOL.get(country, SCREEN_POOL["DEFAULT"]))

    if "Windows" in user_agent:
        platform = "Win32"
        # Windows: 작업표시줄(~40) + 탭바/주소창(~85~95) = 총 125~135px 차감
        viewport_offset = random.randint(125, 140)
    elif "Macintosh" in user_agent:
        platform = "MacIntel"
        # macOS: 메뉴바(~28) + 탭바/주소창(~75~85) = 총 100~115px 차감
        viewport_offset = random.randint(100, 115)
    else:
        platform = "Linux x86_64"
        viewport_offset = random.randint(90, 110)

    profile = {
        "country": country,
        "timezone_id": timezone,
        "timezone_offset": tz_offset,
        "locale": locale,
        "user_agent": user_agent,
        "platform": platform,
        "hardware_concurrency": random.choice([4, 6, 8, 12, 16]),
        "device_memory": random.choice([8, 16, 32]),
        "screen": screen,
        "viewport_offset": viewport_offset,
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
