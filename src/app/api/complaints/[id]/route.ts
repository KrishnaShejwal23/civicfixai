import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id },
      include: {
        department: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
          include: {
            changedBy: {
              select: { fullName: true, role: true },
            },
          },
        },
        emailRecords: {
          orderBy: { createdAt: "desc" },
          include: {
            department: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    }

    // Server-side ownership check: prevent IDOR
    if (user.role !== "ADMIN" && complaint.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. You do not have permission to view this complaint." },
        { status: 403 }
      );
    }

    return NextResponse.json({ complaint });
  } catch (error: unknown) {
    console.error("Error fetching complaint:", error);
    return NextResponse.json(
      { error: "Failed to retrieve complaint record." },
      { status: 500 }
    );
  }
}

/**
 * Citizen route to add supplementary note or request reopen
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    }

    // Ownership check
    if (complaint.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { action, note } = await req.json();

    if (!note || note.trim() === "") {
      return NextResponse.json({ error: "Note text is required." }, { status: 400 });
    }

    let newStatus = complaint.status;
    if (action === "REOPEN") {
      newStatus = "REOPENED";
      await prisma.complaint.update({
        where: { id: complaint.id },
        data: { status: "REOPENED" },
      });
    }

    const history = await prisma.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        status: newStatus,
        notes: action === "REOPEN" ? `[Citizen Reopen Request] ${note}` : `[Citizen Note] ${note}`,
        changedById: user.id,
      },
    });

    return NextResponse.json({ message: "Note added successfully.", history });
  } catch (error: unknown) {
    console.error("Error updating complaint note:", error);
    return NextResponse.json({ error: "Failed to submit note." }, { status: 500 });
  }
}
