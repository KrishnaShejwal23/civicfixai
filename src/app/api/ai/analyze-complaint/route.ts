import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { analyzeComplaintWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { description, imageBase64, imageMimeType } = await req.json();

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a description of at least 5 characters for AI analysis." },
        { status: 400 }
      );
    }

    const analysis = await analyzeComplaintWithGemini(
      description,
      imageBase64,
      imageMimeType
    );

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error("AI Analysis route error:", error);
    return NextResponse.json(
      { error: "AI analysis could not be completed. You can still submit your complaint manually." },
      { status: 500 }
    );
  }
}
