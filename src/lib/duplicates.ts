import { prisma } from "./prisma";

export interface DuplicateMatch {
  id: string;
  refNumber: string;
  title: string;
  category: string;
  subcategory: string;
  address: string;
  status: string;
  createdAt: Date;
  distanceMeters?: number;
  similarityScore: number;
  reason: string;
}

/**
 * Calculates distance in meters between two lat/lng coordinates (Haversine formula).
 */
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculates a simple Jaccard word similarity between two texts.
 */
function textWordSimilarity(text1: string, text2: string): number {
  const tokenize = (t: string) =>
    new Set(
      t
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

  const set1 = tokenize(text1);
  const set2 = tokenize(text2);

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }

  const union = new Set([...set1, ...set2]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Detect possible duplicate complaints within the same category and vicinity.
 * Non-blocking: returns potential matches for user review.
 */
export async function detectPotentialDuplicates(params: {
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  area?: string | null;
  city?: string | null;
}): Promise<DuplicateMatch[]> {
  const { category, title, description, latitude, longitude, area, city } = params;

  // Search active complaints (within last 45 days, not rejected)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 45);

  const candidates = await prisma.complaint.findMany({
    where: {
      category: category,
      status: { in: ["SUBMITTED", "PENDING", "IN_PROGRESS"] },
      createdAt: { gte: cutoffDate },
    },
    select: {
      id: true,
      refNumber: true,
      title: true,
      category: true,
      subcategory: true,
      address: true,
      area: true,
      city: true,
      description: true,
      status: true,
      latitude: true,
      longitude: true,
      createdAt: true,
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  const matches: DuplicateMatch[] = [];

  for (const item of candidates) {
    let score = 0;
    const reasons: string[] = [];
    let distanceMeters: number | undefined;

    // Check GPS distance if both have coordinates
    if (
      latitude &&
      longitude &&
      item.latitude !== null &&
      item.longitude !== null
    ) {
      distanceMeters = calculateDistanceMeters(
        latitude,
        longitude,
        item.latitude,
        item.longitude
      );

      if (distanceMeters <= 150) {
        score += 0.55;
        reasons.push(`Within ${distanceMeters}m of this location`);
      } else if (distanceMeters <= 500) {
        score += 0.35;
        reasons.push(`Within ${distanceMeters}m`);
      }
    } else if (area && item.area && area.toLowerCase() === item.area.toLowerCase()) {
      score += 0.3;
      reasons.push(`In the same area (${item.area})`);
    } else if (city && item.city && city.toLowerCase() === item.city.toLowerCase()) {
      score += 0.1;
      reasons.push(`In the same city (${item.city})`);
    }

    // Check text similarity
    const titleSim = textWordSimilarity(title, item.title);
    const descSim = textWordSimilarity(description, item.description);
    const textScore = Math.max(titleSim, descSim);

    if (textScore > 0.3) {
      score += textScore * 0.45;
      reasons.push("Similar wording and complaint description");
    }

    if (params.subcategory && item.subcategory === params.subcategory) {
      score += 0.15;
    }

    if (score >= 0.4) {
      matches.push({
        id: item.id,
        refNumber: item.refNumber,
        title: item.title,
        category: item.category,
        subcategory: item.subcategory,
        address: item.address,
        status: item.status,
        createdAt: item.createdAt,
        distanceMeters,
        similarityScore: Math.round(score * 100),
        reason: reasons.join(", ") || "Similar category and locality",
      });
    }
  }

  // Sort by highest similarity
  return matches.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 3);
}
