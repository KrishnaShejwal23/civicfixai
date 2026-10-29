import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCivicEmailDraft } from "@/lib/email";
import { routeDepartment } from "@/lib/departments";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { complaintId, departmentId } = await req.json();

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { department: true },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint record not found." }, { status: 404 });
    }

    // Ownership check
    if (complaint.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    let dept = complaint.department;
    if (departmentId && departmentId !== dept?.id) {
      dept = await prisma.department.findUnique({ where: { id: departmentId } });
    }

    if (!dept) {
      dept = await routeDepartment(complaint.category, complaint.city);
    }

    const deptName = dept?.name || "Municipal Corporation Ward Office";
    const deptEmail = dept?.email || "civic.grievances@civic.gov.in";

    const draft = generateCivicEmailDraft({
      refNumber: complaint.refNumber,
      category: complaint.category,
      subcategory: complaint.subcategory,
      title: complaint.title,
      description: complaint.description,
      address: complaint.address,
      departmentName: deptName,
      departmentEmail: deptEmail,
      citizenName: user.fullName || "Concerned Citizen",
    });

    return NextResponse.json({
      draft,
      department: dept,
      isVerified: dept?.isVerified || false,
    });
  } catch (error: unknown) {
    console.error("Draft generation error:", error);
    return NextResponse.json(
      { error: "Could not generate email draft." },
      { status: 500 }
    );
  }
}
