import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailSchema } from "@/lib/validations";
import { sendDepartmentEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();

    const result = sendEmailSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid email payload." },
        { status: 400 }
      );
    }

    const { complaintId, departmentId, recipientEmail, recipientName, subject, bodyText } =
      result.data;

    // Verify complaint existence and ownership
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    }

    if (complaint.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. You cannot send emails on behalf of another citizen's complaint." },
        { status: 403 }
      );
    }

    // Attempt to send email
    const sendResult = await sendDepartmentEmail({
      complaintId,
      userId: user.id,
      departmentId,
      recipientEmail,
      recipientName,
      subject,
      bodyText,
    });

    return NextResponse.json(sendResult);
  } catch (error: unknown) {
    console.error("Email send API error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch email to the department." },
      { status: 500 }
    );
  }
}
