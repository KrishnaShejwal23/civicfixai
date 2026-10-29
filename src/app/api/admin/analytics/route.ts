import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied. Administrator privileges required." },
      { status: 403 }
    );
  }

  try {
    // 1. Total and Status Counts from real records
    const [total, pending, inProgress, resolved, urgent] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: "PENDING" } }),
      prisma.complaint.count({ where: { status: "IN_PROGRESS" } }),
      prisma.complaint.count({ where: { status: "RESOLVED" } }),
      prisma.complaint.count({ where: { priority: "URGENT" } }),
    ]);

    // 2. Category distribution
    const categoryGroups = await prisma.complaint.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const categoryBreakdown = categoryGroups.map((g) => ({
      category: g.category,
      count: g._count.id,
      percentage: total > 0 ? Math.round((g._count.id / total) * 100) : 0,
    }));

    // 3. Hotspots / Area aggregation from real database records
    const areaGroups = await prisma.complaint.groupBy({
      by: ["area", "city"],
      where: { area: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    });

    const hotspots = areaGroups.map((a) => ({
      area: a.area || "General Urban Area",
      city: a.city || "Pune",
      complaintCount: a._count.id,
      severity: a._count.id > 3 ? "HIGH" : "MEDIUM",
    }));

    // 4. Recent status changes audit
    const recentActivity = await prisma.complaintStatusHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        complaint: { select: { refNumber: true, title: true, category: true } },
        changedBy: { select: { fullName: true, role: true } },
      },
    });

    // 5. Email dispatch records
    const emailStats = await prisma.emailRecord.groupBy({
      by: ["sendStatus"],
      _count: { id: true },
    });

    return NextResponse.json({
      metrics: {
        total,
        pending,
        inProgress,
        resolved,
        urgent,
        lastRefreshed: new Date().toISOString(),
      },
      categoryBreakdown,
      hotspots,
      recentActivity,
      emailStats,
    });
  } catch (error) {
    console.error("Analytics computation error:", error);
    return NextResponse.json(
      { error: "Failed to compile live analytics." },
      { status: 500 }
    );
  }
}
