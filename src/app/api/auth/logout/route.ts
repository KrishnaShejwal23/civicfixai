import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Signed out successfully." });
  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}
