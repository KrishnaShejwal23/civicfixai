import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savedAddressSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const addresses = await prisma.savedAddress.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ addresses });
  } catch {
    return NextResponse.json({ error: "Failed to load addresses." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = savedAddressSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid address data." },
        { status: 400 }
      );
    }

    const data = result.data;

    // If marked default, unset existing default
    if (data.isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.savedAddress.create({
      data: {
        userId: user.id,
        label: data.label,
        building: data.building,
        street: data.street,
        area: data.area,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        isDefault: data.isDefault,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save address." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Address ID required." }, { status: 400 });
    }

    // Ownership check
    const existing = await prisma.savedAddress.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Address not found or unauthorized." }, { status: 404 });
    }

    await prisma.savedAddress.delete({ where: { id } });

    return NextResponse.json({ message: "Address removed." });
  } catch {
    return NextResponse.json({ error: "Failed to delete address." }, { status: 500 });
  }
}
