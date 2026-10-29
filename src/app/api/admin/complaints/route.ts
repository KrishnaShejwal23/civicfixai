import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied. Administrator privileges required." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const whereClause: Prisma.ComplaintWhereInput = {};

    if (status && status !== "ALL") {
      whereClause.status = status;
    }
    if (category && category !== "ALL") {
      whereClause.category = category;
    }
    if (priority && priority !== "ALL") {
      whereClause.priority = priority;
    }
    if (search && search.trim() !== "") {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { refNumber: { contains: search } },
        { address: { contains: search } },
        { user: { fullName: { contains: search } } },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        department: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            changedBy: { select: { fullName: true, role: true } },
          },
        },
        emailRecords: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ complaints });
  } catch (error) {
    console.error("Admin complaints query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch administrator records." },
      { status: 500 }
    );
  }
}
