import crypto from "crypto";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return new Response("Missing TELEGRAM_BOT_TOKEN", { status: 500 });
  }

  const body = (await request.json()) as Record<string, string>;
  const hash = body.hash;
  if (!hash) {
    return new Response("Missing hash", { status: 400 });
  }

  const dataCheckArr = Object.keys(body)
    .filter((key) => key !== "hash")
    .sort()
    .map((key) => `${key}=${body[key]}`);

  const dataCheckString = dataCheckArr.join("\n");
  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (hmac !== hash) {
    return new Response("Invalid auth data", { status: 401 });
  }

  const cookieStore = cookies();
  const username = body.username || body.first_name || "user";

  cookieStore.set("tg_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  cookieStore.set("tg_user", username, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return Response.json({ connected: true, user: { username } });
}
