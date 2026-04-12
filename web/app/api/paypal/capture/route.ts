import { cookies } from "next/headers";
import { captureOrder } from "@/lib/paypal";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get("tg_auth")?.value;
  const chatId = cookieStore.get("tg_id")?.value;

  if (auth !== "1" || !chatId) {
    return Response.json({ error: "Telegram login required" }, { status: 401 });
  }

  let orderId = "";
  try {
    const body = (await request.json()) as { orderId?: string };
    orderId = String(body.orderId || "").trim();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!orderId) {
    return Response.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const result = await captureOrder(orderId);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to capture order";
    return Response.json({ error: message }, { status: 502 });
  }
}
