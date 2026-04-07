import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const auth = cookieStore.get("tg_auth")?.value;
  if (auth !== "1") {
    return Response.json({ connected: false }, { status: 401 });
  }

  const username = cookieStore.get("tg_user")?.value;
  return Response.json({ connected: true, user: { username } });
}
