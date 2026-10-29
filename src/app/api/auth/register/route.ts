import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { hashPassword, createSessionToken, getSessionCookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate inputs with Zod
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message || "Invalid registration input.";
      return NextResponse.json(
        { error: firstError, details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { fullName, email, password } = validationResult.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in instead." },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // Create user profile
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: "CITIZEN",
        emailVerified: true, // Auto-verified for modern onboarding
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    const response = NextResponse.json(
      {
        message: "Account created successfully.",
        user,
      },
      { status: 201 }
    );

    // Set secure httpOnly cookie
    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while creating your account." },
      { status: 500 }
    );
  }
}
