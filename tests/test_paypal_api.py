from fastapi.testclient import TestClient

from apps import api


def _sample_order(order_id: str = "ORDER-123", package_key: str = "starter", chat_id: str = "user-1"):
    return {
        "id": order_id,
        "status": "COMPLETED",
        "payer": {"email_address": "payer@example.com"},
        "purchase_units": [
            {
                "custom_id": f"{chat_id}:{package_key}",
                "payments": {
                    "captures": [
                        {
                            "id": "CAPTURE-123",
                            "status": "COMPLETED",
                            "amount": {"currency_code": "USD", "value": "1.99"},
                        }
                    ]
                },
            }
        ],
    }


def test_paypal_webhook_records_completed_capture(monkeypatch):
    client = TestClient(api.app)
    record_calls = []

    class FakeStore:
        def get_user(self, chat_id: str):
            return {"chat_id": chat_id, "credits": 50}

        def record_paypal_order(self, **kwargs):
            record_calls.append(kwargs)
            return True, 150

    monkeypatch.setattr(api, "verify_paypal_webhook_event", lambda headers, payload: True)
    monkeypatch.setattr(api, "fetch_paypal_order", lambda order_id: _sample_order(order_id=order_id))
    monkeypatch.setattr(api, "get_user_store", lambda: FakeStore())

    payload = {
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "resource": {
            "supplementary_data": {
                "related_ids": {"order_id": "ORDER-123"}
            }
        },
    }

    response = client.post("/paypal/webhook", json=payload)

    assert response.status_code == 200
    assert response.json() == {"ok": True, "applied": True, "balance": 150}
    assert record_calls[0]["order_id"] == "ORDER-123"
    assert record_calls[0]["package_key"] == "starter"
    assert record_calls[0]["credits_added"] == 100


def test_paypal_webhook_ignores_unrelated_events(monkeypatch):
    client = TestClient(api.app)

    monkeypatch.setattr(api, "verify_paypal_webhook_event", lambda headers, payload: True)

    response = client.post("/paypal/webhook", json={"event_type": "PAYMENT.CAPTURE.DENIED"})

    assert response.status_code == 200
    assert response.json() == {"ok": True, "ignored": "PAYMENT.CAPTURE.DENIED"}
