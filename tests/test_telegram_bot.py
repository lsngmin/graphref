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

    telegram_bot.handle_run(redis=object(), queue=object(), chat_id="user-1", text="/run hello world example.com")

    assert add_calls == [
        (
            "user-1",
            telegram_bot.CREDITS_PER_RUN,
            "enqueue_refund",
            {"keyword": "hello world", "domain": "example.com", "error": "queue down"},
        )
    ]
    assert sent_messages == [
        ("user-1", f"⚠️ <b>Failed to Queue</b>\n\nCould not add the job to the queue. Your <b>{telegram_bot.CREDITS_PER_RUN} credits</b> have been refunded.\n💰 Balance: 50")
    ]


def test_handle_run_success_awards_referral_after_enqueue(monkeypatch):
    sent_messages = []
    add_calls = []

    monkeypatch.setattr(telegram_bot, "send_message", lambda chat_id, text, parse_mode=None: sent_messages.append((chat_id, text, parse_mode)))
    monkeypatch.setattr(telegram_bot, "deduct_credits", lambda redis, chat_id, amount, reason=None, metadata=None: (True, 40))
    monkeypatch.setattr(telegram_bot, "enqueue_job", lambda *args, **kwargs: SimpleNamespace(id="job-123"))
    monkeypatch.setattr(telegram_bot, "begin_first_run", lambda *args, **kwargs: (True, "ref-1"))

    def fake_add(redis, chat_id, amount, reason=None, metadata=None):
        add_calls.append((chat_id, amount, reason, metadata))
        return 80

    monkeypatch.setattr(telegram_bot, "add_credits", fake_add)

    telegram_bot.handle_run(redis=object(), queue=object(), chat_id="user-1", text="/run hello world example.com")

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
        "HTML",
    )
    assert sent_messages[1] == (
        "user-1",
        "✅ <b>Job Queued!</b>\n\n"
        "<b>Keyword:</b> <code>hello world</code>\n"
        "<b>Domain:</b> <code>example.com</code>\n"
        "<b>Credits remaining:</b> 40\n\n"
        "<b>Job ID:</b>\n<code>job-123</code>\n\n"
        "Track progress: /status",
        "HTML",
    )


def test_handle_buy_package_sends_checkout_url(monkeypatch):
    sent_messages = []

    monkeypatch.setattr(
        telegram_bot,
        "send_message",
        lambda chat_id, text, parse_mode=None, reply_markup=None: sent_messages.append((chat_id, text, parse_mode)),
    )
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
            "HTML",
        )
    ]


def test_handle_buy_sends_inline_package_buttons(monkeypatch):
    sent_messages = []

    monkeypatch.setattr(
        telegram_bot,
        "send_message",
        lambda chat_id, text, parse_mode=None, reply_markup=None: sent_messages.append(
            (chat_id, text, parse_mode, reply_markup)
        ),
    )
    monkeypatch.setattr(
        telegram_bot,
        "get_packages",
        lambda: [("starter", 100), ("basic", 500), ("pro", 1000)],
    )
    monkeypatch.setattr(
        telegram_bot,
        "create_checkout_url",
        lambda chat_id, package_key: (f"https://checkout.example/{package_key}", 100),
    )

    telegram_bot.handle_buy(redis=object(), chat_id="user-1")

    assert sent_messages == [
        (
            "user-1",
            "<b>Choose a package</b>\n\nTap a button to open PayPal checkout.",
            "HTML",
            {
                "inline_keyboard": [
                    [{"text": "Starter • 100 credits", "url": "https://checkout.example/starter"}],
                    [{"text": "Basic • 500 credits", "url": "https://checkout.example/basic"}],
                    [{"text": "Pro • 1000 credits", "url": "https://checkout.example/pro"}],
                ]
            },
        )
    ]


def test_parse_run_command_uses_last_token_as_domain():
    keyword, domain = telegram_bot.parse_run_command("/run hello world example.com")

    assert keyword == "hello world"
    assert domain == "example.com"


def test_parse_run_command_keeps_legacy_pipe_compatible():
    keyword, domain = telegram_bot.parse_run_command("/run hello world | example.com")

    assert keyword == "hello world"
    assert domain == "example.com"


def test_handle_status_shows_most_recent_job(monkeypatch):
    sent_messages = []

    class FakeJob:
        def get_status(self, refresh: bool = False) -> str:
            return "finished"

    monkeypatch.setattr(telegram_bot, "send_message", lambda chat_id, text, parse_mode=None: sent_messages.append((chat_id, text, parse_mode)))
    monkeypatch.setattr(telegram_bot, "get_recent_job_ids", lambda redis, chat_id, limit=1: ["job-latest"])
    monkeypatch.setattr(telegram_bot.Job, "fetch", lambda job_id, connection=None: FakeJob())
    monkeypatch.setattr(
        telegram_bot,
        "get_job_meta",
        lambda redis, job_id: {"chat_id": "user-1", "keyword": "hello world", "domain": "example.com"},
    )
    monkeypatch.setattr(telegram_bot, "format_job_message", lambda redis, job, keyword, domain: f"{job.get_status()} {keyword} {domain}")

    telegram_bot.handle_status(redis=object(), chat_id="user-1")

    assert sent_messages == [("user-1", "finished hello world example.com", "HTML")]


def test_handle_status_reports_when_no_jobs(monkeypatch):
    sent_messages = []

    monkeypatch.setattr(telegram_bot, "send_message", lambda chat_id, text, parse_mode=None: sent_messages.append((chat_id, text, parse_mode)))
    monkeypatch.setattr(telegram_bot, "get_recent_job_ids", lambda redis, chat_id, limit=1: [])

    telegram_bot.handle_status(redis=object(), chat_id="user-1")

    assert sent_messages == [
        (
            "user-1",
            "💤 <b>No Jobs Yet</b>\n\nYou haven't run any jobs yet.\n\n"
            "Start one with <code>/run &lt;keyword&gt; &lt;domain&gt;</code>",
            "HTML",
        )
    ]


def test_format_job_message_for_started_job():
    class FakeJob:
        id = "job-123"
        result = None
        exc_info = None

        def get_status(self, refresh: bool = False) -> str:
            return "started"

    body = telegram_bot.format_job_message(
        redis=object(),
        job=FakeJob(),
        keyword="hello <world>",
        domain="example.com",
    )

    assert "<b>🚀 Job Status</b>" in body
    assert "<b>Status:</b> Running" in body
    assert "<code>hello &lt;world&gt;</code>" in body
    assert "<code>example.com</code>" in body
    assert "<i>Your job is currently being processed.</i>" in body
    assert "<code>job-123</code>" in body


def test_format_job_message_for_failed_job_includes_preview():
    class FakeJob:
        id = "job-456"
        result = {"status": "failed", "code": 1, "stderr": "boom <bad>\ntrace"}
        exc_info = None

        def get_status(self, refresh: bool = False) -> str:
            return "failed"

    body = telegram_bot.format_job_message(
        redis=object(),
        job=FakeJob(),
        keyword="kw",
        domain="example.com",
    )

    assert "<b>❌ Job Failed</b>" in body
    assert "<b>Result:</b> <code>failed</code>" in body
    assert "<b>Exit code:</b> <code>1</code>" in body
    assert "<pre>boom &lt;bad&gt;\ntrace</pre>" in body


def test_handle_jobs_requires_limit(monkeypatch):
    sent_messages = []

    monkeypatch.setattr(telegram_bot, "send_message", lambda chat_id, text, parse_mode=None: sent_messages.append((chat_id, text)))

    telegram_bot.handle_jobs(redis=object(), chat_id="user-1", text="/jobs")

    assert sent_messages == [("user-1", "📋 <b>How many jobs?</b>\n\nPlease enter a number, e.g. <code>/jobs 5</code>")]


def test_handle_credits_uses_dashboard_layout(monkeypatch):
    sent_messages = []

    monkeypatch.setattr(telegram_bot, "send_message", lambda chat_id, text, parse_mode=None: sent_messages.append((chat_id, text, parse_mode)))
    monkeypatch.setattr(telegram_bot, "get_credits", lambda redis, chat_id: 150)

    telegram_bot.handle_credits(redis=object(), chat_id="123")

    assert sent_messages == [
        (
            "123",
            "<b>💳 Your Credit Dashboard</b>\n\n"
            "👤 <b>Account:</b> User_123\n"
            "━━━━━━━━━━━━━━━━━━\n"
            "💰 <b>Current Credits:</b> <code>150</code>\n"
            "🚀 <b>Estimated Runs:</b> <code>15</code> times\n"
            "━━━━━━━━━━━━━━━━━━\n\n"
            "💡 <i>Tip: Each run costs 10 credits.</i>\n"
            "✨ <i>Need more power? Click the button below!</i>\n\n"
            "🛒 <b>Top up with</b> /buy",
            "HTML",
        )
    ]


def test_handle_referral_uses_invite_layout(monkeypatch):
    sent_messages = []

    monkeypatch.setattr(telegram_bot, "send_message", lambda chat_id, text, parse_mode=None: sent_messages.append((chat_id, text, parse_mode)))
    monkeypatch.setattr(telegram_bot, "get_bot_username", lambda: "graphref_bot")
    monkeypatch.setattr(telegram_bot, "get_referral_code", lambda chat_id: chat_id)

    telegram_bot.handle_referral(chat_id="123")

    assert sent_messages == [
        (
            "123",
            "<b>🎁 Invite Friends & Earn Credits</b>\n\n"
            "Share the power of <b>Graphref</b> and get rewarded!\n\n"
            "<b>🔗 Your Unique Link:</b>\n"
            "<code>https://t.me/graphref_bot?start=123</code>\n\n"
            "━━━━━━━━━━━━━━━━━━\n"
            "<b>✨ Reward details:</b>\n"
            "• <b>Step 1:</b> Share your link with friends.\n"
            "• <b>Step 2:</b> When they run their <b>first job</b>,\n"
            "• <b>Step 3:</b> You instantly earn <b>30 credits!</b> 💰\n"
            "━━━━━━━━━━━━━━━━━━\n\n"
            "🚀 <i>There is no limit to how much you can earn. Start sharing now!</i>",
            "HTML",
        )
    ]


def test_process_message_ensures_user_before_buy(monkeypatch):
    ensure_calls = []
    buy_calls = []

    monkeypatch.setattr(telegram_bot, "ensure_user", lambda redis, chat_id, referrer_id=None: ensure_calls.append((chat_id, referrer_id)) or True)
    monkeypatch.setattr(telegram_bot, "handle_buy", lambda redis, chat_id: buy_calls.append(chat_id))

    telegram_bot.process_message(
        redis=object(),
        queue=object(),
        message={"chat": {"id": "user-1", "type": "private"}, "text": "/buy"},
    )

    assert ensure_calls == [("user-1", None)]
    assert buy_calls == ["user-1"]


def test_process_callback_query_handles_buy_button(monkeypatch):
    ensure_calls = []
    answer_calls = []
    buy_calls = []

    monkeypatch.setattr(telegram_bot, "ensure_user", lambda redis, chat_id, referrer_id=None: ensure_calls.append((chat_id, referrer_id)) or True)
    monkeypatch.setattr(
        telegram_bot,
        "answer_callback_query",
        lambda callback_query_id, text=None: answer_calls.append((callback_query_id, text)),
    )
    monkeypatch.setattr(
        telegram_bot,
        "handle_buy_package",
        lambda redis, chat_id, package_key: buy_calls.append((chat_id, package_key)),
    )
    monkeypatch.setattr(telegram_bot, "get_packages", lambda: [("starter", 100), ("basic", 500), ("pro", 1000)])

    telegram_bot.process_callback_query(
        redis=object(),
        callback_query={
            "id": "cbq-1",
            "data": "buy:starter",
            "message": {"chat": {"id": "user-1", "type": "private"}},
        },
    )

    assert ensure_calls == [("user-1", None)]
    assert answer_calls == [("cbq-1", "Generating checkout link...")]
    assert buy_calls == [("user-1", "starter")]
