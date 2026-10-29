import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CivicFix AI database...");

  // 1. Seed Verified Departments
  const departments = [
    {
      id: "dept-roads-01",
      name: "Municipal Road Maintenance Division",
      categoryType: "ROADS",
      jurisdiction: "Citywide & Central Metropolitan Zone",
      email: "roads.maintenance@civic.gov.in",
      phone: "+91-20-2550-1010",
      verificationSource: "Municipal Corporation Gazette 2026, Vol. 4",
      isVerified: true,
      verifiedAt: new Date("2026-01-15T00:00:00.000Z"),
    },
    {
      id: "dept-sanitation-02",
      name: "Municipal Solid Waste & Sanitation Department",
      categoryType: "SANITATION",
      jurisdiction: "All Urban Wards & Zones",
      email: "sanitation.complaints@civic.gov.in",
      phone: "+91-20-2550-2020",
      verificationSource: "Department of Urban Development Notification 2025/11",
      isVerified: true,
      verifiedAt: new Date("2026-02-01T00:00:00.000Z"),
    },
    {
      id: "dept-water-03",
      name: "Water Supply & Sewerage Drainage Board",
      categoryType: "WATER",
      jurisdiction: "Metropolitan Water Supply Network",
      email: "watersupply.helpline@civic.gov.in",
      phone: "+91-20-2550-3030",
      verificationSource: "Public Utility Board Registry #PUB-2026-88",
      isVerified: true,
      verifiedAt: new Date("2026-01-20T00:00:00.000Z"),
    },
    {
      id: "dept-electricity-04",
      name: "Street Lighting & Electrical Infrastructure Board",
      categoryType: "ELECTRICITY",
      jurisdiction: "All City Wards & Public Thoroughfares",
      email: "streetlighting.ops@civic.gov.in",
      phone: "+91-20-2550-4040",
      verificationSource: "State Electricity Regulatory Authority Directory 2026",
      isVerified: true,
      verifiedAt: new Date("2026-02-10T00:00:00.000Z"),
    },
    {
      id: "dept-parks-05",
      name: "Parks, Gardens & Urban Greenery Directorate",
      categoryType: "PARKS",
      jurisdiction: "Public Parks, Gardens & Avenue Trees",
      email: "parks.gardens@civic.gov.in",
      phone: "+91-20-2550-5050",
      verificationSource: "Urban Forestry & Horticulture Wing 2026",
      isVerified: true,
      verifiedAt: new Date("2026-01-10T00:00:00.000Z"),
    },
    {
      id: "dept-hazards-06",
      name: "Civic Hazards & Rapid Disaster Response Cell",
      categoryType: "HAZARDS",
      jurisdiction: "Metropolitan Emergency Public Works",
      email: "emergency.hazards@civic.gov.in",
      phone: "+91-20-2550-9999",
      verificationSource: "Disaster Management Authority Act 2025",
      isVerified: true,
      verifiedAt: new Date("2026-01-05T00:00:00.000Z"),
    },
    {
      id: "dept-traffic-07",
      name: "Traffic Infrastructure & Safety Authority",
      categoryType: "TRAFFIC",
      jurisdiction: "Urban Arterial Roads & Intersections",
      email: "traffic.infra@civic.gov.in",
      phone: "+91-20-2550-7070",
      verificationSource: "City Traffic Police & Municipal Works Joint Panel",
      isVerified: true,
      verifiedAt: new Date("2026-02-15T00:00:00.000Z"),
    },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: dept,
      create: dept,
    });
  }
  console.log(`✓ Seeded ${departments.length} verified departments`);

  // 2. Seed Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Password123!", salt);

  const admin = await prisma.user.upsert({
    where: { email: "admin@civicfix.ai" },
    update: {
      fullName: "Chief Civic Administrator",
      role: "ADMIN",
      emailVerified: true,
    },
    create: {
      email: "admin@civicfix.ai",
      fullName: "Chief Civic Administrator",
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const citizen = await prisma.user.upsert({
    where: { email: "krishna@civicfix.ai" },
    update: {
      fullName: "Krishna Shejwal",
      role: "CITIZEN",
      emailVerified: true,
    },
    create: {
      email: "krishna@civicfix.ai",
      fullName: "Krishna Shejwal",
      passwordHash,
      role: "CITIZEN",
      emailVerified: true,
    },
  });

  console.log(`✓ Seeded users: admin (${admin.email}), citizen (${citizen.email})`);

  // 3. Seed Saved Address for citizen
  await prisma.savedAddress.deleteMany({ where: { userId: citizen.id } });
  await prisma.savedAddress.create({
    data: {
      userId: citizen.id,
      label: "Home",
      building: "Flat 402, Shivam Heights",
      street: "Senapati Bapat Road",
      area: "Shivajinagar",
      landmark: "Near Symbiosis Institute",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411016",
      isDefault: true,
    },
  });
  console.log("✓ Seeded citizen saved address");

  // 4. Seed Real Complaints
  await prisma.complaint.deleteMany({ where: { userId: citizen.id } });

  const complaint1 = await prisma.complaint.create({
    data: {
      refNumber: "CF-2026-8192",
      userId: citizen.id,
      category: "Garbage & Sanitation",
      subcategory: "Overflowing bins",
      title: "Overflowing Community Garbage Bin Spilling onto Main Road",
      description:
        "The public waste container near the corner has not been cleared for over 4 days. Waste is overflowing onto the pedestrian walkway, causing hygiene concerns and stray animal disruption.",
      address: "Corner of Senapati Bapat Road & ICC Tower Lane, Shivajinagar, Pune, Maharashtra 411016",
      building: "Opposite ICC Trade Tower",
      street: "Senapati Bapat Road",
      area: "Shivajinagar",
      landmark: "Opposite ICC Trade Tower",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411016",
      latitude: 18.5362,
      longitude: 73.8301,
      priority: "HIGH",
      status: "IN_PROGRESS",
      departmentId: "dept-sanitation-02",
      adminNotes: "Assigned to Ward 14 Solid Waste Sanitation Crew for priority clearing.",
      aiSuggested: true,
      aiAnalysis: JSON.stringify({
        suggestedCategory: "Garbage & Sanitation",
        suggestedSubcategory: "Overflowing bins",
        conciseTitle: "Overflowing Community Garbage Bin",
        summary: "Waste container overflowing onto walkway for 4+ days.",
        suggestedPriority: "HIGH",
        suggestedDepartmentType: "Municipal Solid Waste & Sanitation",
      }),
      createdAt: new Date("2026-10-21T09:30:00.000Z"),
    },
  });

  await prisma.complaintStatusHistory.create({
    data: {
      complaintId: complaint1.id,
      status: "SUBMITTED",
      notes: "Complaint submitted by citizen via CivicFix AI.",
      changedById: citizen.id,
      createdAt: new Date("2026-10-21T09:30:00.000Z"),
    },
  });

  await prisma.complaintStatusHistory.create({
    data: {
      complaintId: complaint1.id,
      status: "IN_PROGRESS",
      notes: "Forwarded to Ward 14 field team for immediate clearance.",
      changedById: admin.id,
      createdAt: new Date("2026-10-22T10:15:00.000Z"),
    },
  });

  // Seed Email Record for Complaint 1 (ACCEPTED by provider) to demonstrate subtle grey indicator
  await prisma.emailRecord.create({
    data: {
      complaintId: complaint1.id,
      userId: citizen.id,
      departmentId: "dept-sanitation-02",
      recipientEmail: "sanitation.complaints@civic.gov.in",
      recipientName: "Municipal Solid Waste & Sanitation Department",
      isVerified: true,
      subject: "Urgent: Overflowing Community Garbage Bin Spilling onto Main Road [CF-2026-8192]",
      bodyText:
        "To the Officer-in-Charge, Municipal Solid Waste & Sanitation Department.\n\nRef: CF-2026-8192\nLocation: Senapati Bapat Road, Shivajinagar, Pune 411016.\n\nPlease find attached citizen report regarding an overflowing community bin requiring immediate clearance.\n\nRegards,\nCivicFix Citizen",
      providerMessageId: "msg_resend_91024_demo",
      sendStatus: "ACCEPTED",
      sentAt: new Date("2026-10-22T10:30:00.000Z"),
    },
  });

  const complaint2 = await prisma.complaint.create({
    data: {
      refNumber: "CF-2026-8193",
      userId: citizen.id,
      category: "Roads & Transport",
      subcategory: "Potholes",
      title: "Deep Pothole on Curve Causing Two-Wheeler Accidents",
      description:
        "A large and deep pothole (approx 2 feet wide, 6 inches deep) has developed right on the inner curve after recent rains. Multiple two-wheelers have skidded here during evening hours.",
      address: "Near University Flyover Descent, Ganeshkhind Road, Pune, Maharashtra 411007",
      street: "Ganeshkhind Road",
      area: "University Circle",
      landmark: "Near Flyover Descent",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411007",
      latitude: 18.5422,
      longitude: 73.8285,
      priority: "URGENT",
      status: "PENDING",
      departmentId: "dept-roads-01",
      aiSuggested: true,
      aiAnalysis: JSON.stringify({
        suggestedCategory: "Roads & Transport",
        suggestedSubcategory: "Potholes",
        conciseTitle: "Deep Pothole on Curve",
        summary: "Severe road depression creating hazard for commuters.",
        suggestedPriority: "URGENT",
        suggestedDepartmentType: "Municipal Road Maintenance Division",
      }),
      createdAt: new Date("2026-10-22T14:15:00.000Z"),
    },
  });

  await prisma.complaintStatusHistory.create({
    data: {
      complaintId: complaint2.id,
      status: "SUBMITTED",
      notes: "Complaint submitted by citizen with high hazard tag.",
      changedById: citizen.id,
      createdAt: new Date("2026-10-22T14:15:00.000Z"),
    },
  });

  const complaint3 = await prisma.complaint.create({
    data: {
      refNumber: "CF-2026-8194",
      userId: citizen.id,
      category: "Electricity & Lighting",
      subcategory: "Broken streetlights",
      title: "Three Consecutive Dark Streetlights on Pedestrian Walkway",
      description:
        "Streetlights numbered SL-104, SL-105, and SL-106 have been non-functional for past 10 days, leaving a 200m stretch completely dark at night. Women and senior citizens use this walkway daily.",
      address: "Model Colony 5th Cross Road, Model Colony, Pune, Maharashtra 411016",
      street: "5th Cross Road",
      area: "Model Colony",
      landmark: "Opposite Model Colony Park Gate 2",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411016",
      latitude: 18.5331,
      longitude: 73.8375,
      priority: "MEDIUM",
      status: "RESOLVED",
      departmentId: "dept-electricity-04",
      adminNotes: "Bulb replacements and line terminal repaired by Zone 3 electrical team.",
      aiSuggested: false,
      createdAt: new Date("2026-10-18T18:00:00.000Z"),
    },
  });

  await prisma.complaintStatusHistory.create({
    data: {
      complaintId: complaint3.id,
      status: "SUBMITTED",
      notes: "Complaint submitted.",
      changedById: citizen.id,
      createdAt: new Date("2026-10-18T18:00:00.000Z"),
    },
  });

  await prisma.complaintStatusHistory.create({
    data: {
      complaintId: complaint3.id,
      status: "RESOLVED",
      notes: "Repaired by electrical division. Verified working.",
      changedById: admin.id,
      createdAt: new Date("2026-10-20T11:00:00.000Z"),
    },
  });

  console.log("✓ Seeded realistic complaints with status history & email record");
  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
