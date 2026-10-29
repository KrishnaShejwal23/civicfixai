import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIAnalysisResult {
  suggestedCategory: string;
  suggestedSubcategory: string;
  conciseTitle: string;
  summary: string;
  visualObservations: string[];
  suggestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  missingInformation: string[];
  suggestedDepartmentType: string;
  isAiGenerated: boolean;
  notes?: string;
}

const CATEGORY_MAP: Record<string, string[]> = {
  "Roads & Transport": [
    "Potholes",
    "Damaged roads",
    "Broken footpaths",
    "Damaged traffic signals",
    "Damaged or unsafe speed breakers",
    "Unsafe pedestrian crossings",
    "Blocked public roads",
  ],
  "Garbage & Sanitation": [
    "Overflowing bins",
    "Uncollected waste",
    "Illegal dumping",
    "Dirty public areas",
    "Public toilet maintenance",
  ],
  "Water & Drainage": [
    "Water leakage",
    "Broken water pipes",
    "Blocked drains",
    "Waterlogging",
    "Sewage overflow",
    "Water contamination concerns",
  ],
  "Electricity & Lighting": [
    "Broken streetlights",
    "Dark public areas",
    "Damaged public electrical fixtures",
    "Exposed wiring or electrical hazards",
  ],
  "Parks & Environment": [
    "Damaged benches",
    "Broken playground equipment",
    "Fallen branches",
    "Hazardous trees",
    "Pollution",
    "Damaged public gardens",
  ],
  "Public Facilities & Accessibility": [
    "Damaged bus stops",
    "Damaged public benches",
    "Inaccessible ramps",
    "Damaged public buildings",
    "Missing public signboards",
  ],
  "Public Hazards": [
    "Open manholes",
    "Fallen poles",
    "Dangerous debris",
    "Damaged barriers",
    "Other potentially dangerous public infrastructure",
  ],
  "Other Civic Issue": ["General civic grievance"],
};

/**
 * Fallback rule-based analyzer when GEMINI_API_KEY is not configured or fails.
 * Guarantees zero downtime and complete usability.
 */
export function analyzeWithRules(description: string): AIAnalysisResult {
  const lower = description.toLowerCase();

  let category = "Other Civic Issue";
  let subcategory = "General civic grievance";
  let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
  let dept = "Municipal Ward Office";

  if (lower.includes("manhole") || lower.includes("danger") || lower.includes("collapse") || lower.includes("barrier")) {
    category = "Public Hazards";
    subcategory = lower.includes("manhole") ? "Open manholes" : "Other potentially dangerous public infrastructure";
    dept = "Civic Hazards & Rapid Disaster Response Cell";
    priority = "URGENT";
  } else if (lower.includes("wire") || lower.includes("spark") || (lower.includes("electric") && lower.includes("hazard"))) {
    category = "Electricity & Lighting";
    subcategory = "Exposed wiring or electrical hazards";
    dept = "Street Lighting & Electrical Infrastructure Board";
    priority = "URGENT";
  } else if (lower.includes("pothole") || lower.includes("road") || lower.includes("footpath") || lower.includes("divider") || lower.includes("signal")) {
    category = "Roads & Transport";
    subcategory = lower.includes("pothole") ? "Potholes" : lower.includes("footpath") ? "Broken footpaths" : "Damaged roads";
    dept = "Municipal Road Maintenance Division";
    if (lower.includes("deep") || lower.includes("accident") || lower.includes("urgent")) priority = "HIGH";
  } else if (lower.includes("garbage") || lower.includes("waste") || lower.includes("bin") || lower.includes("trash") || lower.includes("dump")) {
    category = "Garbage & Sanitation";
    subcategory = lower.includes("bin") ? "Overflowing bins" : "Uncollected waste";
    dept = "Municipal Solid Waste & Sanitation Department";
    if (lower.includes("smell") || lower.includes("spill") || lower.includes("days")) priority = "HIGH";
  } else if (lower.includes("water") || lower.includes("pipe") || lower.includes("drain") || lower.includes("sewage") || lower.includes("leak")) {
    category = "Water & Drainage";
    subcategory = lower.includes("leak") ? "Water leakage" : lower.includes("sewage") ? "Sewage overflow" : "Blocked drains";
    dept = "Water Supply & Sewerage Drainage Board";
    if (lower.includes("overflow") || lower.includes("contamination") || lower.includes("burst")) priority = "HIGH";
  } else if (lower.includes("light") || lower.includes("dark") || lower.includes("pole")) {
    category = "Electricity & Lighting";
    subcategory = "Broken streetlights";
    dept = "Street Lighting & Electrical Infrastructure Board";
  } else if (lower.includes("tree") || lower.includes("park") || lower.includes("branch") || lower.includes("garden")) {
    category = "Parks & Environment";
    subcategory = lower.includes("branch") ? "Fallen branches" : "Hazardous trees";
    dept = "Parks, Gardens & Urban Greenery Directorate";
  }

  // Generate a concise title
  const cleanDesc = description.trim();
  const firstSentence = cleanDesc.split(/[.\n]/)[0] || cleanDesc;
  const conciseTitle = firstSentence.length > 60 ? firstSentence.slice(0, 57) + "..." : firstSentence;

  return {
    suggestedCategory: category,
    suggestedSubcategory: subcategory,
    conciseTitle: conciseTitle || `${subcategory} Report`,
    summary: cleanDesc.length > 150 ? cleanDesc.slice(0, 147) + "..." : cleanDesc,
    visualObservations: ["No live AI image inference available (rule-based analysis applied)."],
    suggestedPriority: priority,
    missingInformation: cleanDesc.length < 30 ? ["Exact landmark or reference point nearby", "Approximate duration of issue"] : [],
    suggestedDepartmentType: dept,
    isAiGenerated: false,
    notes: "Analyzed using internal civic heuristics (GEMINI_API_KEY not configured or offline).",
  };
}

/**
 * Server-side Gemini AI analysis with schema validation and strict safety guidelines.
 */
export async function analyzeComplaintWithGemini(
  description: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<AIAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return analyzeWithRules(description);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const systemPrompt = `You are the civic intelligence core for CivicFix AI.
Your role is to analyze a citizen's civic problem description and optional photo.
Return a STRICT JSON object conforming to this TypeScript interface:
{
  "suggestedCategory": string (must be one of: "Roads & Transport", "Garbage & Sanitation", "Water & Drainage", "Electricity & Lighting", "Parks & Environment", "Public Facilities & Accessibility", "Public Hazards", "Other Civic Issue"),
  "suggestedSubcategory": string (specific civic issue name),
  "conciseTitle": string (concise 4-8 words factual headline),
  "summary": string (1-2 sentences factual summary),
  "visualObservations": string[] (strictly visual details confirmed by the image, or empty if no photo),
  "suggestedPriority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "missingInformation": string[] (helpful details the citizen might want to add, like specific landmark or duration),
  "suggestedDepartmentType": string (e.g. "Municipal Road Maintenance", "Municipal Sanitation", "Water Supply & Drainage", "Streetlight Maintenance", "Parks & Gardens", "Public Hazards Cell")
}

RULES:
1. Avoid inventing facts not in the citizen description or photo.
2. Distinguish visual observations from assumptions. Never claim an image proves a dangerous condition unless visibly clear.
3. Never determine an official complaint status. Status is solely set by authorized municipal officials.
4. If priority is dangerous to life (open manhole, live wire), suggest URGENT. Otherwise HIGH, MEDIUM or LOW based on severity.
`;

    const promptParts: Array<string | { inlineData: { data: string; mimeType: string } }> = [
      systemPrompt,
      `Citizen description: """${description}"""`,
    ];

    if (imageBase64 && imageMimeType) {
      // Strip data url prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      promptParts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: imageMimeType,
        },
      });
    }

    const response = await model.generateContent(promptParts);
    const rawText = response.response.text();

    const parsed = JSON.parse(rawText) as AIAnalysisResult;

    // Validate category
    if (!CATEGORY_MAP[parsed.suggestedCategory]) {
      parsed.suggestedCategory = "Other Civic Issue";
    }

    parsed.isAiGenerated = true;
    return parsed;
  } catch (err) {
    console.error("Gemini API call failed, falling back to heuristic engine:", err);
    const fallback = analyzeWithRules(description);
    fallback.notes = "Gemini API request failed or timed out. Heuristic rule analysis supplied.";
    return fallback;
  }
}
