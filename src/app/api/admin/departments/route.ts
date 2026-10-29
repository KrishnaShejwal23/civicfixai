import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const departments = await prisma.department.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { complaints: true, emailRecords: true } } },
  });

  return NextResponse.json({ departments });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, categoryType, jurisdiction, email, phone, verificationSource } = body;

    if (!name || !email || !verificationSource) {
      return NextResponse.json(
        { error: "Department Name, Email, and Verification Source are required." },
        { status: 400 }
      );
    }

    const dept = await prisma.department.create({
      data: {
        name,
        categoryType: categoryType || "GENERAL",
        jurisdiction: jurisdiction || "Citywide",
        email,
        phone,
        verificationSource,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: user.id,
        action: "DEPARTMENT_CREATE",
        targetType: "DEPARTMENT",
        targetId: dept.id,
        details: JSON.stringify({ name, email }),
      },
    });

    return NextResponse.json({ department: dept }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create department record." },
      { status: 500 }
    );
  }
}
