import { analyzeWithRules } from "@/lib/gemini";
import { generateCivicEmailDraft } from "@/lib/email";

describe("AI Analysis & Email Drafting Engines", () => {
  describe("Rule-based AI Fallback Engine", () => {
    it("should classify road and pothole descriptions accurately", () => {
      const result = analyzeWithRules(
        "There is a huge deep pothole on the main road causing severe accidents."
      );

      expect(result.suggestedCategory).toBe("Roads & Transport");
      expect(result.suggestedSubcategory).toBe("Potholes");
      expect(result.suggestedPriority).toBe("HIGH");
      expect(result.suggestedDepartmentType).toContain("Road Maintenance");
      expect(result.conciseTitle).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it("should classify garbage and overflow descriptions", () => {
      const result = analyzeWithRules(
        "Community waste bin is overflowing with rotten garbage and foul smell for 5 days."
      );

      expect(result.suggestedCategory).toBe("Garbage & Sanitation");
      expect(result.suggestedSubcategory).toBe("Overflowing bins");
      expect(result.suggestedDepartmentType).toContain("Sanitation");
    });

    it("should classify dangerous hazards with URGENT priority", () => {
      const result = analyzeWithRules(
        "Open manhole on footpath with collapse risk in the dark."
      );

      expect(result.suggestedCategory).toBe("Public Hazards");
      expect(result.suggestedSubcategory).toBe("Open manholes");
      expect(result.suggestedPriority).toBe("URGENT");
    });
  });

  describe("Civic Email Draft Generator", () => {
    it("should generate a formal, factual draft containing reference number and location", () => {
      const draft = generateCivicEmailDraft({
        refNumber: "CF-2026-9999",
        category: "Roads & Transport",
        subcategory: "Potholes",
        title: "Deep Pothole at Main Crossing",
        description: "Severe pothole causing vehicular damage.",
        address: "FC Road, Deccan, Pune 411004",
        departmentName: "Municipal Road Maintenance Division",
        departmentEmail: "roads.maintenance@civic.gov.in",
        citizenName: "Krishna Shejwal",
      });

      expect(draft.recipientEmail).toBe("roads.maintenance@civic.gov.in");
      expect(draft.subject).toContain("CF-2026-9999");
      expect(draft.subject).toContain("Potholes");
      expect(draft.bodyText).toContain("CF-2026-9999");
      expect(draft.bodyText).toContain("FC Road, Deccan, Pune 411004");
      expect(draft.bodyText).toContain("Krishna Shejwal");
      expect(draft.bodyText).toContain("CivicFix AI Citizen Platform");
    });
  });
});
