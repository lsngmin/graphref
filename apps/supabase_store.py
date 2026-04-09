import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Optional


class SupabaseStoreError(RuntimeError):
    pass


class SupabaseStore:
    def __init__(self, url: str, service_role_key: str, schema: str = "public"):
        if not url or not service_role_key:
            raise SupabaseStoreError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")

        self.base_url = url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Accept-Profile": schema,
            "Content-Profile": schema,
        }

    @classmethod
    def from_env(cls) -> "SupabaseStore":
        return cls(
            url=os.getenv("SUPABASE_URL", ""),
            service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
            schema=os.getenv("SUPABASE_SCHEMA", "public"),
        )

    def _request(
        self,
        method: str,
        path: str,
        payload: Optional[dict] = None,
        query: Optional[dict] = None,
        extra_headers: Optional[dict] = None,
        timeout: int = 30,
    ):
        url = self.base_url + path
        if query:
            url += "?" + urllib.parse.urlencode(query, doseq=True)

        data = None if payload is None else json.dumps(payload).encode("utf-8")
        headers = dict(self.headers)
        if extra_headers:
            headers.update(extra_headers)

        request = urllib.request.Request(url, data=data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise SupabaseStoreError(f"Supabase HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise SupabaseStoreError(f"Supabase network error: {exc.reason}") from exc

        if not body:
            return None
        return json.loads(body)

    def rpc(self, function_name: str, payload: Optional[dict] = None):
        return self._request("POST", f"/rpc/{function_name}", payload=payload or {})

    def get_user(self, chat_id: str) -> Optional[dict]:
        rows = self._request(
            "GET",
            "/telegram_users",
            query={
                "chat_id": f"eq.{chat_id}",
                "select": "chat_id,credits,referred_by,first_run_done,created_at,updated_at",
                "limit": "1",
            },
        )
        if not rows:
            return None
        return rows[0]

    def register_user(
        self,
        chat_id: str,
        initial_credits: int,
        referred_by: Optional[str] = None,
        reason: str = "signup_bonus",
        metadata: Optional[dict] = None,
    ) -> dict:
        return self.rpc(
            "tg_register_user",
            {
                "p_chat_id": chat_id,
                "p_initial_credits": int(initial_credits),
                "p_referred_by": referred_by,
                "p_reason": reason,
                "p_metadata": metadata or {},
            },
        )

    def add_credits(
        self,
        chat_id: str,
        amount: int,
        reason: str = "credit_add",
        metadata: Optional[dict] = None,
    ) -> int:
        value = self.rpc(
            "tg_add_credits",
            {
                "p_chat_id": chat_id,
                "p_amount": int(amount),
                "p_reason": reason,
                "p_metadata": metadata or {},
            },
        )
        return int(value or 0)

    def deduct_credits(
        self,
        chat_id: str,
        amount: int,
        reason: str = "credit_deduct",
        metadata: Optional[dict] = None,
    ) -> tuple[bool, int]:
        result = self.rpc(
            "tg_deduct_credits",
            {
                "p_chat_id": chat_id,
                "p_amount": int(amount),
                "p_reason": reason,
                "p_metadata": metadata or {},
            },
        ) or {}
        return bool(result.get("success")), int(result.get("balance", 0))

    def begin_first_run(self, chat_id: str) -> tuple[bool, Optional[str]]:
        result = self.rpc("tg_begin_first_run", {"p_chat_id": chat_id}) or {}
        return bool(result.get("first_run")), result.get("referrer_id")

    def record_payment(
        self,
        chat_id: str,
        telegram_payment_charge_id: str,
        invoice_payload: str,
        currency: str,
        total_amount: int,
        credits_added: int,
        provider_payment_charge_id: Optional[str] = None,
        raw: Optional[dict] = None,
    ) -> tuple[bool, int]:
        result = self.rpc(
            "tg_record_payment",
            {
                "p_chat_id": chat_id,
                "p_telegram_payment_charge_id": telegram_payment_charge_id,
                "p_invoice_payload": invoice_payload,
                "p_currency": currency,
                "p_total_amount": int(total_amount),
                "p_credits_added": int(credits_added),
                "p_provider_payment_charge_id": provider_payment_charge_id,
                "p_raw": raw or {},
            },
        ) or {}
        return bool(result.get("applied")), int(result.get("balance", 0))

    def record_lemonsqueezy_order(
        self,
        order_id: str,
        chat_id: str,
        package_key: str,
        credits_added: int,
        identifier: str,
        order_number: int,
        user_email: Optional[str],
        currency: str,
        total: int,
        status: str,
        raw: Optional[dict] = None,
    ) -> tuple[bool, int]:
        result = self.rpc(
            "tg_record_lemonsqueezy_order",
            {
                "p_order_id": order_id,
                "p_chat_id": chat_id,
                "p_package_key": package_key,
                "p_credits_added": int(credits_added),
                "p_identifier": identifier,
                "p_order_number": int(order_number),
                "p_user_email": user_email,
                "p_currency": currency,
                "p_total": int(total),
                "p_status": status,
                "p_raw": raw or {},
            },
        ) or {}
        return bool(result.get("applied")), int(result.get("balance", 0))

    def record_paypal_order(
        self,
        order_id: str,
        chat_id: str,
        package_key: str,
        credits_added: int,
        capture_id: str,
        user_email: Optional[str],
        currency: str,
        total: int,
        status: str,
        raw: Optional[dict] = None,
    ) -> tuple[bool, int]:
        result = self.rpc(
            "tg_record_paypal_order",
            {
                "p_order_id": order_id,
                "p_chat_id": chat_id,
                "p_package_key": package_key,
                "p_credits_added": int(credits_added),
                "p_capture_id": capture_id,
                "p_user_email": user_email,
                "p_currency": currency,
                "p_total": int(total),
                "p_status": status,
                "p_raw": raw or {},
            },
        ) or {}
        return bool(result.get("applied")), int(result.get("balance", 0))
