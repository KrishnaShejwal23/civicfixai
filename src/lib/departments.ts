import { prisma } from "./prisma";
import type { Department } from "@prisma/client";

export type DepartmentInfo = Department;

/**
 * Route a complaint to the most appropriate verified department
 * based on category, subcategory, and confirmed issue address/city.
 */
export async function routeDepartment(
  category: string,
  city?: string | null
): Promise<DepartmentInfo | null> {
  let categoryType = "GENERAL";

  switch (category) {
    case "Roads & Transport":
      categoryType = "ROADS";
      break;
    case "Garbage & Sanitation":
      categoryType = "SANITATION";
      break;
    case "Water & Drainage":
      categoryType = "WATER";
      break;
    case "Electricity & Lighting":
      categoryType = "ELECTRICITY";
      break;
    case "Parks & Environment":
      categoryType = "PARKS";
      break;
    case "Public Hazards":
      categoryType = "HAZARDS";
      break;
    case "Public Facilities & Accessibility":
      categoryType = "ROADS";
      break;
  }

  // Look for verified department matching categoryType and optional city jurisdiction
  let department = null;
  if (city && city.trim() !== "") {
    department = await prisma.department.findFirst({
      where: {
        categoryType: categoryType,
        isVerified: true,
        jurisdiction: { contains: city },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  if (!department) {
    department = await prisma.department.findFirst({
      where: {
        categoryType: categoryType,
        isVerified: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  if (department) return department;

  // Fallback to any verified department or municipal ward office
  return prisma.department.findFirst({
    where: { isVerified: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAllVerifiedDepartments(): Promise<DepartmentInfo[]> {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
  });
}
