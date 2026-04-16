import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  const publicAdminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

  if (!adminToken || !publicAdminToken) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN and NEXT_PUBLIC_ADMIN_TOKEN must be configured" },
      { status: 500 }
    );
  }

  const body = (await request.json()) as { token?: string };
  const providedToken = String(body.token ?? "").trim();

  if (!providedToken || providedToken !== adminToken || providedToken !== publicAdminToken) {
    return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_access_token", providedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
