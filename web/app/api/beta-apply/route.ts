import { createHash } from "node:crypto";

type BetaApplyPayload = {
  name?: string;
  email?: string;
  testUrl?: string;
  searchConsole?: "yes" | "no" | "";
  currentRank?: string;
  message?: string;
  consent?: boolean;
  locale?: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalize(value: unknown): string {
  return String(value ?? "").trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getClientIp(request: Request): string | null {
  const candidates = [
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-client-ip"),
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const first = raw.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
}

function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

async function acquireIpLock(params: {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  ipHash: string;
  name: string;
  locale: string;
  email: string;
  testUrl: string;
  searchConsole: "yes" | "no" | "";
  currentRank: string;
  message: string;
  consent: boolean;
}) {
  const table = process.env.BETA_IP_LOCK_TABLE?.trim() || "beta_ip_locks";
  const endpoint = `${params.supabaseUrl.replace(/\/+$/, "")}/rest/v1/${table}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: params.supabaseServiceRoleKey,
      Authorization: `Bearer ${params.supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      ip_hash: params.ipHash,
      name: params.name,
      locale: params.locale,
      email: params.email,
      test_url: params.testUrl,
      search_console: params.searchConsole || null,
      current_rank: params.currentRank || null,
      message: params.message || null,
      consent: params.consent,
    }),
    cache: "no-store",
  });

  if (res.ok) {
    return { acquired: true as const };
  }

  const detail = await res.text();
  const duplicate =
    res.status === 409 ||
    detail.includes("duplicate key") ||
    detail.includes("23505");

  if (duplicate) {
    return { acquired: false as const };
  }

  throw new Error(`Supabase lock insert failed ${res.status}: ${detail}`);
}

async function releaseIpLock(params: {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  ipHash: string;
}) {
  const table = process.env.BETA_IP_LOCK_TABLE?.trim() || "beta_ip_locks";
  const endpoint = `${params.supabaseUrl.replace(/\/+$/, "")}/rest/v1/${table}?ip_hash=eq.${params.ipHash}`;

  await fetch(endpoint, {
    method: "DELETE",
    headers: {
      apikey: params.supabaseServiceRoleKey,
      Authorization: `Bearer ${params.supabaseServiceRoleKey}`,
    },
    cache: "no-store",
  });
}

async function sendEmail(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo ? [params.replyTo] : undefined,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend error ${res.status}: ${detail}`);
  }
}

export async function POST(request: Request) {
  let body: BetaApplyPayload;
  try {
    body = (await request.json()) as BetaApplyPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = normalize(body.name);
  const email = normalize(body.email);
  const testUrl = normalize(body.testUrl);
  const searchConsole = body.searchConsole === "yes" || body.searchConsole === "no" ? body.searchConsole : "";
  const currentRank = normalize(body.currentRank);
  const message = normalize(body.message);
  const consent = Boolean(body.consent);
  const locale = normalize(body.locale) || "unknown";

  if (!name || !email || !testUrl || !consent) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!isValidHttpUrl(testUrl)) {
    return Response.json({ error: "Invalid testUrl" }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY ?? "";
  const inboxEmail = process.env.BETA_INBOX_EMAIL ?? "";
  const fromEmail = process.env.BETA_FROM_EMAIL ?? "";
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const rateLimitSalt = process.env.BETA_IP_RATE_LIMIT_SALT ?? "graphref-beta-ip-lock";

  if (!resendApiKey || !inboxEmail || !fromEmail || !supabaseUrl || !supabaseServiceRoleKey) {
    return Response.json(
      {
        error:
          "Missing configuration (RESEND_API_KEY, BETA_INBOX_EMAIL, BETA_FROM_EMAIL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)",
      },
      { status: 500 }
    );
  }

  const clientIp = getClientIp(request);
  if (!clientIp) {
    return Response.json({ error: "Cannot determine client IP" }, { status: 400 });
  }

  const ipHash = hashIp(clientIp, rateLimitSalt);
  let lockAcquired = false;

  try {
    const lock = await acquireIpLock({
      supabaseUrl,
      supabaseServiceRoleKey,
      ipHash,
      name,
      locale,
      email,
      testUrl,
      searchConsole,
      currentRank,
      message,
      consent,
    });
    if (!lock.acquired) {
      return Response.json({ error: "An application has already been submitted." }, { status: 429 });
    }
    lockAcquired = true;
  } catch (error) {
    console.error("beta ip lock acquire failed", error);
    return Response.json({ error: "Failed to validate rate limit" }, { status: 502 });
  }

  const submittedAt = new Date().toISOString();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeTestUrl = escapeHtml(testUrl);
  const safeCurrentRank = escapeHtml(currentRank || "-");
  const safeMessage = escapeHtml(message || "-");
  const searchConsoleText = searchConsole === "yes" ? "Yes" : searchConsole === "no" ? "No" : "-";

  try {
    await sendEmail({
      apiKey: resendApiKey,
      from: fromEmail,
      to: inboxEmail,
      replyTo: email,
      subject: `[Graphref Beta] ${name} applied`,
      html: `
        <h2>New Beta Application</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Test URL:</strong> <a href="${safeTestUrl}">${safeTestUrl}</a></p>
        <p><strong>Search Console registered:</strong> ${searchConsoleText}</p>
        <p><strong>Current rank:</strong> ${safeCurrentRank}</p>
        <p><strong>Message:</strong><br/>${safeMessage}</p>
        <hr/>
        <p><strong>Locale:</strong> ${escapeHtml(locale)}</p>
        <p><strong>Submitted at:</strong> ${escapeHtml(submittedAt)}</p>
      `,
      text: [
        "New Beta Application",
        `Name: ${name}`,
        `Email: ${email}`,
        `Test URL: ${testUrl}`,
        `Search Console registered: ${searchConsoleText}`,
        `Current rank: ${currentRank || "-"}`,
        `Message: ${message || "-"}`,
        `Locale: ${locale}`,
        `Submitted at: ${submittedAt}`,
      ].join("\n"),
    });

    // Best-effort confirmation mail to applicant.
    try {
      await sendEmail({
        apiKey: resendApiKey,
        from: fromEmail,
        to: email,
        replyTo: inboxEmail,
        subject: "Graphref beta application received",
        html: `
          <p>Hi ${safeName},</p>
          <p>Thanks for applying to the Graphref beta.</p>
          <p>We received your request and will review it shortly. We'll contact you at this email after review.</p>
          <p><strong>Submitted URL:</strong> <a href="${safeTestUrl}">${safeTestUrl}</a></p>
          <p>— Graphref</p>
        `,
        text: [
          `Hi ${name},`,
          "",
          "Thanks for applying to the Graphref beta.",
          "We received your request and will review it shortly.",
          "We'll contact you at this email after review.",
          "",
          `Submitted URL: ${testUrl}`,
          "",
          "— Graphref",
        ].join("\n"),
      });
    } catch (error) {
      console.error("beta confirmation email failed", error);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("beta apply email send failed", error);
    if (lockAcquired) {
      try {
        await releaseIpLock({
          supabaseUrl,
          supabaseServiceRoleKey,
          ipHash,
        });
      } catch (releaseError) {
        console.error("beta ip lock release failed", releaseError);
      }
    }
    return Response.json({ error: "Failed to send application email" }, { status: 502 });
  }
}
