import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from decimal import Decimal, ROUND_HALF_UP
from typing import Mapping, Optional


class PayPalError(RuntimeError):
    pass


PACKAGE_DETAILS = {
    "starter": {
        "credits": 100,
        "price": "1.99",
        "name": "Graphref Starter",
        "description": "Graphref Starter - 100 Credits",
    },
    "basic": {
        "credits": 500,
        "price": "8.99",
        "name": "Graphref Basic",
        "description": "Graphref Basic - 500 Credits",
    },
    "pro": {
        "credits": 1000,
        "price": "15.99",
        "name": "Graphref Pro",
        "description": "Graphref Pro - 1,000 Credits",
    },
}


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise PayPalError(f"Missing {name}")
    return value


def _paypal_api_base() -> str:
    explicit = os.getenv("PAYPAL_API_BASE", "").strip()
    if explicit:
        return explicit.rstrip("/")
    return "https://api-m.sandbox.paypal.com"


def _paypal_request(
    path: str,
    *,
    method: str = "GET",
    payload: Optional[dict] = None,
    form: Optional[dict] = None,
    access_token: Optional[str] = None,
    headers: Optional[dict] = None,
    timeout: int = 30,
) -> dict:
    url = _paypal_api_base() + path
    request_headers = {
        "Accept": "application/json",
    }
    if headers:
        request_headers.update(headers)
    if access_token:
        request_headers["Authorization"] = f"Bearer {access_token}"

    data = None
    if form is not None:
        data = urllib.parse.urlencode(form).encode("utf-8")
        request_headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif payload is not None:
        data = json.dumps(payload).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url, data=data, headers=request_headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise PayPalError(f"PayPal HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise PayPalError(f"PayPal network error: {exc.reason}") from exc

    if not body:
        return {}
    return json.loads(body)


def get_access_token() -> str:
    client_id = _require_env("PAYPAL_CLIENT_ID")
    secret = _require_env("PAYPAL_SECRET")
    basic_auth = base64.b64encode(f"{client_id}:{secret}".encode("utf-8")).decode("ascii")
    result = _paypal_request(
        "/v1/oauth2/token",
        method="POST",
        form={"grant_type": "client_credentials"},
        headers={
            "Authorization": f"Basic {basic_auth}",
            "Accept-Language": "en_US",
        },
    )
    token = str(result.get("access_token") or "").strip()
    if not token:
        raise PayPalError("Missing PayPal access token")
    return token


def get_package_details(package_key: str) -> dict:
    details = PACKAGE_DETAILS.get(package_key)
    if details is None:
        raise PayPalError(f"Unknown package: {package_key}")
    return details


def get_package_credits(package_key: str) -> int:
    return int(get_package_details(package_key)["credits"])


def get_packages() -> list[tuple[str, int]]:
    return [(key, int(details["credits"])) for key, details in PACKAGE_DETAILS.items()]


def parse_custom_id(custom_id: str) -> tuple[str, str]:
    chat_id, separator, package_key = str(custom_id).partition(":")
    chat_id = chat_id.strip()
    package_key = package_key.strip()
    if not separator or not chat_id or not package_key:
        raise PayPalError("Invalid PayPal custom_id")
    return chat_id, package_key


def money_to_minor_units(value: str) -> int:
    amount = Decimal(str(value or "0")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return int(amount * 100)


def create_checkout_url(chat_id: str, package_key: str) -> tuple[str, int]:
    details = get_package_details(package_key)
    credits = int(details["credits"])
    return_url = _require_env("PAYPAL_RETURN_URL")
    cancel_url = _require_env("PAYPAL_CANCEL_URL")
    currency_code = os.getenv("PAYPAL_CURRENCY", "USD").strip() or "USD"
    brand_name = os.getenv("PAYPAL_BRAND_NAME", "Graphref").strip() or "Graphref"
    access_token = get_access_token()

    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": package_key,
                "custom_id": f"{chat_id}:{package_key}",
                "description": details["description"],
                "amount": {
                    "currency_code": currency_code,
                    "value": details["price"],
                },
            }
        ],
        "payment_source": {
            "paypal": {
                "experience_context": {
                    "brand_name": brand_name,
                    "shipping_preference": "NO_SHIPPING",
                    "user_action": "PAY_NOW",
                    "return_url": return_url,
                    "cancel_url": cancel_url,
                }
            }
        },
    }

    result = _paypal_request(
        "/v2/checkout/orders",
        method="POST",
        payload=payload,
        access_token=access_token,
        headers={"Prefer": "return=representation"},
    )
    links = result.get("links") or []
    for link in links:
        if link.get("rel") in {"payer-action", "approve"} and link.get("href"):
            return str(link["href"]), credits
    raise PayPalError("Missing PayPal approval URL")


def fetch_order(order_id: str) -> dict:
    access_token = get_access_token()
    return _paypal_request(
        f"/v2/checkout/orders/{urllib.parse.quote(order_id)}",
        method="GET",
        access_token=access_token,
    )


def _header_value(headers: Mapping[str, str], name: str) -> str:
    return str(
        headers.get(name)
        or headers.get(name.lower())
        or headers.get(name.upper())
        or ""
    ).strip()


def verify_webhook_event(headers: Mapping[str, str], event: dict) -> bool:
    webhook_id = _require_env("PAYPAL_WEBHOOK_ID")
    access_token = get_access_token()
    payload = {
        "auth_algo": _header_value(headers, "PAYPAL-AUTH-ALGO"),
        "cert_url": _header_value(headers, "PAYPAL-CERT-URL"),
        "transmission_id": _header_value(headers, "PAYPAL-TRANSMISSION-ID"),
        "transmission_sig": _header_value(headers, "PAYPAL-TRANSMISSION-SIG"),
        "transmission_time": _header_value(headers, "PAYPAL-TRANSMISSION-TIME"),
        "webhook_id": webhook_id,
        "webhook_event": event,
    }
    result = _paypal_request(
        "/v1/notifications/verify-webhook-signature",
        method="POST",
        payload=payload,
        access_token=access_token,
    )
    return str(result.get("verification_status") or "").upper() == "SUCCESS"
