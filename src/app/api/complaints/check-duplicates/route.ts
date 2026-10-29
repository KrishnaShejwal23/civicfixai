import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { detectPotentialDuplicates } from "@/lib/duplicates";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { category, subcategory, title, description, latitude, longitude, area, city } = body;

    if (!category || !title || !description) {
      return NextResponse.json({ duplicates: [] });
    }

    const duplicates = await detectPotentialDuplicates({
      category,
      subcategory,
      title,
      description,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      area,
      city,
    });

    return NextResponse.json({ duplicates });
  } catch (error: unknown) {
    console.error("Duplicate check error:", error);
    return NextResponse.json({ duplicates: [] });
  }
}
