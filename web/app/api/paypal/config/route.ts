export async function GET() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  if (!clientId) {
    return Response.json({ error: "PayPal not configured" }, { status: 500 });
  }
  return Response.json({ clientId });
}
