from types import SimpleNamespace

from apps import telegram_bot


def test_handle_run_refunds_when_enqueue_fails(monkeypatch):
    sent_messages = []
    add_calls = []

    monkeypatch.setattr(telegram_bot, "send_message", lambda chat_id, text, parse_mode=None: sent_messages.append((chat_id, text)))
    monkeypatch.setattr(telegram_bot, "deduct_credits", lambda redis, chat_id, amount, reason=None, metadata=None: (True, 40))
    monkeypatch.setattr(telegram_bot, "enqueue_job", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("queue down")))
    monkeypatch.setattr(telegram_bot, "begin_first_run", lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("should not run")))

    def fake_add(redis, chat_id, amount, reason=None, metadata=None):
        add_calls.append((chat_id, amount, reason, metadata))
        return 50

    monkeypatch.setattr(telegram_bot, "add_credits", fake_add)

    telegram_bot.handle_run(redis=object(), queue=object(), chat_id="user-1", text="/run hello world | example.com")

    assert add_calls == [
        (
            "user-1",
            telegram_bot.CREDITS_PER_RUN,
            "enqueue_refund",
            {"keyword": "hello world", "domain": "example.com", "error": "queue down"},
        )
    ]
    assert sent_messages == [
        ("user-1", "Failed to queue the job. Your credits were refunded.\nBalance: 50")
    ]


def test_handle_run_success_awards_referral_after_enqueue(monkeypatch):
    sent_messages = []
    add_calls = []

    monkeypatch.setattr(telegram_bot, "send_message", lambda chat_id, text, parse_mode=None: sent_messages.append((chat_id, text)))
    monkeypatch.setattr(telegram_bot, "deduct_credits", lambda redis, chat_id, amount, reason=None, metadata=None: (True, 40))
    monkeypatch.setattr(telegram_bot, "enqueue_job", lambda *args, **kwargs: SimpleNamespace(id="job-123"))
    monkeypatch.setattr(telegram_bot, "begin_first_run", lambda *args, **kwargs: (True, "ref-1"))

    def fake_add(redis, chat_id, amount, reason=None, metadata=None):
        add_calls.append((chat_id, amount, reason, metadata))
        return 80

    monkeypatch.setattr(telegram_bot, "add_credits", fake_add)

    telegram_bot.handle_run(redis=object(), queue=object(), chat_id="user-1", text="/run hello world | example.com")

    assert add_calls == [
        (
            "ref-1",
            telegram_bot.CREDITS_REFERRAL_BONUS,
            "referral_bonus",
            {"referred_chat_id": "user-1"},
        )
    ]
    assert sent_messages[0] == (
        "ref-1",
        "Referral bonus! Your referral just ran their first job.\n"
        f"+{telegram_bot.CREDITS_REFERRAL_BONUS} credits added. Balance: 80",
    )
    assert sent_messages[1] == (
        "user-1",
        "Job queued. Credits remaining: 40\n"
        "job_id: job-123\n"
        "keyword: hello world\n"
        "domain: example.com\n\n"
        "Check progress: /status job-123",
    )


def test_handle_buy_package_sends_checkout_url(monkeypatch):
    sent_messages = []

    monkeypatch.setattr(telegram_bot, "send_message", lambda chat_id, text, parse_mode=None: sent_messages.append((chat_id, text)))
    monkeypatch.setattr(
        telegram_bot,
        "create_checkout_url",
        lambda chat_id, package_key: ("https://checkout.example/test", 100),
    )

    telegram_bot.handle_buy_package(redis=object(), chat_id="user-1", package_key="starter")

    assert sent_messages == [
        (
            "user-1",
            "Checkout ready for 100 credits.\nhttps://checkout.example/test\n\n"
            "Credits will be added automatically after payment confirmation.",
        )
    ]


def test_process_message_ensures_user_before_buy(monkeypatch):
    ensure_calls = []
    buy_calls = []

    monkeypatch.setattr(telegram_bot, "ensure_user", lambda redis, chat_id, referrer_id=None: ensure_calls.append((chat_id, referrer_id)) or True)
    monkeypatch.setattr(telegram_bot, "handle_buy", lambda chat_id: buy_calls.append(chat_id))

    telegram_bot.process_message(
        redis=object(),
        queue=object(),
        message={"chat": {"id": "user-1", "type": "private"}, "text": "/buy"},
    )

    assert ensure_calls == [("user-1", None)]
    assert buy_calls == ["user-1"]
