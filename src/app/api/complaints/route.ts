import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { complaintCreateSchema } from "@/lib/validations";
import { routeDepartment } from "@/lib/departments";

function generateRefNumber(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CF-2026-${randomNum}`;
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in to view complaints." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const whereClause: Prisma.ComplaintWhereInput = {
      userId: user.id, // Enforce strict citizen ownership
    };

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (search && search.trim() !== "") {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { refNumber: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isVerified: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
          include: {
            changedBy: {
              select: { fullName: true, role: true },
            },
          },
        },
        emailRecords: {
          where: { sendStatus: "ACCEPTED" }, // Fetch accepted emails for subtle indicator
          select: {
            id: true,
            recipientName: true,
            recipientEmail: true,
            sentAt: true,
            sendStatus: true,
          },
          orderBy: { sentAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ complaints });
  } catch (error: unknown) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Failed to retrieve complaints." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to submit a civic complaint." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    const validationResult = complaintCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || "Invalid complaint data." },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Generate unique reference number
    let refNumber = generateRefNumber();
    let collisionCheck = await prisma.complaint.findUnique({ where: { refNumber } });
    while (collisionCheck) {
      refNumber = generateRefNumber();
      collisionCheck = await prisma.complaint.findUnique({ where: { refNumber } });
    }

    // Identify matching verified department
    const department = await routeDepartment(data.category, data.city);

    // Save complaint
    const complaint = await prisma.complaint.create({
      data: {
        refNumber,
        userId: user.id,
        category: data.category,
        subcategory: data.subcategory,
        title: data.title,
        description: data.description,
        photoUrl: data.photoUrl,
        photoName: data.photoName,
        address: data.address,
        building: data.building,
        street: data.street,
        area: data.area,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        latitude: data.latitude,
        longitude: data.longitude,
        priority: data.priority,
        status: "SUBMITTED",
        aiAnalysis: data.aiAnalysis,
        aiSuggested: data.aiSuggested,
        departmentId: department ? department.id : null,
      },
      include: {
        department: true,
      },
    });

    // Create initial status history entry
    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        status: "SUBMITTED",
        notes: "Grievance lodged by citizen through CivicFix AI platform.",
        changedById: user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Civic complaint registered successfully.",
        complaint,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Complaint creation error:", error);
    return NextResponse.json(
      { error: "Failed to persist complaint to the database." },
      { status: 500 }
    );
  }
}
