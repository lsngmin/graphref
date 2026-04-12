import { cookies } from "next/headers";
import { createOrder } from "@/lib/paypal";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get("tg_auth")?.value;
  const chatId = cookieStore.get("tg_id")?.value;

  if (auth !== "1" || !chatId) {
    return Response.json({ error: "Telegram login required" }, { status: 401 });
  }

  let packageKey = "";
  try {
    const body = (await request.json()) as { packageKey?: string };
    packageKey = String(body.packageKey || "").trim().toLowerCase();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!packageKey) {
    return Response.json({ error: "Missing packageKey" }, { status: 400 });
  }

  try {
    const result = await createOrder(chatId, packageKey);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    return Response.json({ error: message }, { status: 502 });
  }
}
