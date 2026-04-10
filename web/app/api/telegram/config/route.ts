export async function GET() {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME?.trim();

  if (!botUsername) {
    return Response.json({ error: "Missing TELEGRAM_BOT_USERNAME" }, { status: 500 });
  }

  return Response.json({ botUsername });
}
