import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, createSessionToken, getSessionCookieName } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid profile update." },
        { status: 400 }
      );
    }

    const { fullName } = result.data;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { fullName },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    // Refresh session cookie with updated name
    const token = await createSessionToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      fullName: updatedUser.fullName,
    });

    const response = NextResponse.json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });

    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile record." },
      { status: 500 }
    );
  }
}
