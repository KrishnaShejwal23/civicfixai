import {
  EMERGENCY_CONTACTS,
  VERIFIED_MEDICAL_FACILITIES,
  MEDICINE_DELIVERY_PARTNERS,
} from "@/lib/emergency-data";

describe("Emergency & Medical Directories", () => {
  it("should have India's unified 112 emergency helpline as primary", () => {
    const primary = EMERGENCY_CONTACTS.find((c) => c.isPrimary);
    expect(primary).toBeDefined();
    expect(primary?.number).toBe("112");
    expect(primary?.name).toContain("National Emergency Unified Helpline");
  });

  it("should include standard Indian emergency numbers: Police (100), Ambulance (108), Fire (101)", () => {
    const numbers = EMERGENCY_CONTACTS.map((c) => c.number);
    expect(numbers).toContain("100");
    expect(numbers).toContain("108");
    expect(numbers).toContain("101");
    expect(numbers).toContain("1091"); // Women safety
  });

  it("should list verified medical facilities with 24x7 emergency and pharmacies", () => {
    expect(VERIFIED_MEDICAL_FACILITIES.length).toBeGreaterThan(0);
    const traumaCenters = VERIFIED_MEDICAL_FACILITIES.filter((m) => m.emergencyAvailable);
    expect(traumaCenters.length).toBeGreaterThan(0);

    const pharmacies = VERIFIED_MEDICAL_FACILITIES.filter((m) => m.type.includes("Pharmacy"));
    expect(pharmacies.length).toBeGreaterThan(0);
  });

  it("should require prescription verification notice for licensed medicine partners", () => {
    for (const partner of MEDICINE_DELIVERY_PARTNERS) {
      expect(partner.prescriptionRequired).toBe(true);
      expect(partner.appUrl).toBeDefined();
    }
  });
});
