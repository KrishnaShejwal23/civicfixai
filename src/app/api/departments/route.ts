import { NextResponse } from "next/server";
import { getAllVerifiedDepartments } from "@/lib/departments";

export async function GET() {
  try {
    const departments = await getAllVerifiedDepartments();
    return NextResponse.json({ departments });
  } catch (error: unknown) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Failed to load verified departments directory." },
      { status: 500 }
    );
  }
}
