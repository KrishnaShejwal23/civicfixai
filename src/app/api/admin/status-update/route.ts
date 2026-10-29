import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateStatusSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied. Administrator privileges required." },
      { status: 403 }
    );
  }

  try {
    const { complaintId, ...payload } = await req.json();

    if (!complaintId) {
      return NextResponse.json({ error: "Complaint ID is required." }, { status: 400 });
    }

    const validation = updateStatusSchema.safeParse(payload);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid status payload." },
        { status: 400 }
      );
    }

    const { status, notes, departmentId, priority } = validation.data;

    const existing = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    }

    // Update complaint record
    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status,
        adminNotes: notes,
        departmentId: departmentId !== undefined ? departmentId : existing.departmentId,
        priority: priority || existing.priority,
      },
    });

    // Record in status history with admin's identity & timestamp
    const historyEntry = await prisma.complaintStatusHistory.create({
      data: {
        complaintId,
        status,
        notes: `[Official Action by ${user.fullName}] ${notes}`,
        changedById: user.id,
      },
    });

    // Record in Admin Audit Log
    await prisma.adminAuditLog.create({
      data: {
        adminId: user.id,
        action: "STATUS_UPDATE",
        targetType: "COMPLAINT",
        targetId: complaintId,
        details: JSON.stringify({
          previousStatus: existing.status,
          newStatus: status,
          notes,
          departmentId,
        }),
      },
    });

    return NextResponse.json({
      message: "Complaint status updated and logged.",
      complaint: updated,
      history: historyEntry,
    });
  } catch (error) {
    console.error("Admin status update error:", error);
    return NextResponse.json(
      { error: "Failed to persist official status update." },
      { status: 500 }
    );
  }
}
