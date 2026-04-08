import hashlib
import hmac
import json
import os
import urllib.error
import urllib.request
from typing import Optional


class LemonSqueezyError(RuntimeError):
    pass


PACKAGE_CREDITS = {
    "starter": 100,
    "basic": 500,
    "pro": 1000,
}


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise LemonSqueezyError(f"Missing {name}")
    return value


def get_package_variant_id(package_key: str) -> str:
    env_name = f"LEMON_SQUEEZY_VARIANT_{package_key.upper()}"
    return _require_env(env_name)


def get_package_credits(package_key: str) -> int:
    credits = PACKAGE_CREDITS.get(package_key)
    if credits is None:
        raise LemonSqueezyError(f"Unknown package: {package_key}")
    return credits


def get_packages() -> list[tuple[str, int]]:
    return [(key, credits) for key, credits in PACKAGE_CREDITS.items()]


def verify_webhook_signature(raw_body: bytes, signature: str, secret: str) -> bool:
    digest = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return bool(signature) and hmac.compare_digest(digest, signature)


def create_checkout_url(chat_id: str, package_key: str) -> tuple[str, int]:
    api_key = _require_env("LEMON_SQUEEZY_API_KEY")
    store_id = _require_env("LEMON_SQUEEZY_STORE_ID")
    variant_id = get_package_variant_id(package_key)
    credits = get_package_credits(package_key)
    test_mode = os.getenv("LEMON_SQUEEZY_TEST_MODE", "false").lower() == "true"
    redirect_url = os.getenv("LEMON_SQUEEZY_REDIRECT_URL", "").strip()

    product_options: dict = {
        "enabled_variants": [int(variant_id)],
    }
    if redirect_url:
        product_options["redirect_url"] = redirect_url

    payload = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "checkout_data": {
                    "custom": {
                        "chat_id": chat_id,
                        "package_key": package_key,
                        "credits": credits,
                    }
                },
                "checkout_options": {
                    "embed": False,
                },
                "product_options": product_options,
                "test_mode": test_mode,
            },
            "relationships": {
                "store": {
                    "data": {"type": "stores", "id": store_id}
                },
                "variant": {
                    "data": {"type": "variants", "id": variant_id}
                },
            },
        }
    }

    request = urllib.request.Request(
        "https://api.lemonsqueezy.com/v1/checkouts",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise LemonSqueezyError(f"Lemon Squeezy HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise LemonSqueezyError(f"Lemon Squeezy network error: {exc.reason}") from exc

    result = json.loads(body)
    url = result.get("data", {}).get("attributes", {}).get("url")
    if not url:
        raise LemonSqueezyError("Missing checkout URL")

    return url, credits
