import {
  fullNameSchema,
  registerSchema,
  loginSchema,
  complaintCreateSchema,
  updateStatusSchema,
} from "@/lib/validations";

describe("Validation Schemas", () => {
  describe("Mandatory Full Name Validation", () => {
    it("should accept valid standard names", () => {
      const res = fullNameSchema.safeParse("Krishna Shejwal");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe("Krishna Shejwal");
      }
    });

    it("should accept names with leading and trailing whitespace and trim them", () => {
      const res = fullNameSchema.safeParse("   Ananya Sharma   ");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe("Ananya Sharma");
      }
    });

    it("should accept Unicode names and regional scripts", () => {
      // Devanagari (Hindi/Marathi)
      const resHindi = fullNameSchema.safeParse("कृष्णा शेजवळ");
      expect(resHindi.success).toBe(true);

      // Tamil
      const resTamil = fullNameSchema.safeParse("கிருஷ்ணா");
      expect(resTamil.success).toBe(true);

      // Accented European name
      const resAccents = fullNameSchema.safeParse("Jean-Luc D'Amato");
      expect(resAccents.success).toBe(true);
    });

    it("should reject blank or whitespace-only name", () => {
      const empty = fullNameSchema.safeParse("");
      expect(empty.success).toBe(false);

      const whitespace = fullNameSchema.safeParse("     ");
      expect(whitespace.success).toBe(false);
    });

    it("should reject names with fewer than 2 characters", () => {
      const single = fullNameSchema.safeParse("A");
      expect(single.success).toBe(false);
    });
  });

  describe("Registration Schema", () => {
    it("should require all 4 fields: fullName, email, password, confirmPassword", () => {
      const valid = registerSchema.safeParse({
        fullName: "Rohan Deshmukh",
        email: "rohan@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      expect(valid.success).toBe(true);
    });

    it("should reject when password and confirmPassword do not match", () => {
      const mismatch = registerSchema.safeParse({
        fullName: "Rohan Deshmukh",
        email: "rohan@example.com",
        password: "Password123!",
        confirmPassword: "DifferentPassword456!",
      });
      expect(mismatch.success).toBe(false);
      if (!mismatch.success) {
        expect(mismatch.error.errors[0].message).toContain("do not match");
      }
    });

    it("should reject invalid email", () => {
      const invalidEmail = registerSchema.safeParse({
        fullName: "Rohan Deshmukh",
        email: "not-an-email",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      expect(invalidEmail.success).toBe(false);
    });

    it("should reject short password", () => {
      const shortPass = registerSchema.safeParse({
        fullName: "Rohan Deshmukh",
        email: "rohan@example.com",
        password: "123",
        confirmPassword: "123",
      });
      expect(shortPass.success).toBe(false);
    });
  });

  describe("Login Schema", () => {
    it("should require ONLY email and password (returning user does not enter name)", () => {
      const valid = loginSchema.safeParse({
        email: "krishna@civicfix.ai",
        password: "Password123!",
      });
      expect(valid.success).toBe(true);
    });

    it("should reject missing password", () => {
      const res = loginSchema.safeParse({
        email: "krishna@civicfix.ai",
        password: "",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("Complaint Creation Schema", () => {
    it("should validate a complete civic complaint payload", () => {
      const valid = complaintCreateSchema.safeParse({
        category: "Roads & Transport",
        subcategory: "Potholes",
        title: "Large pothole causing traffic hazard",
        description: "A 2-foot wide pothole right at the junction is causing two-wheelers to skid.",
        address: "Senapati Bapat Road, Shivajinagar, Pune 411016",
        priority: "HIGH",
      });
      expect(valid.success).toBe(true);
    });

    it("should reject descriptions that are too short", () => {
      const shortDesc = complaintCreateSchema.safeParse({
        category: "Roads & Transport",
        subcategory: "Potholes",
        title: "Pothole here",
        description: "Bad road", // less than 15 chars
        address: "Main Street",
      });
      expect(shortDesc.success).toBe(false);
    });
  });

  describe("Status Update Schema", () => {
    it("should require official audit notes when updating status", () => {
      const valid = updateStatusSchema.safeParse({
        status: "RESOLVED",
        notes: "Inspected by Ward 14 supervisor. Asphalt patching completed.",
      });
      expect(valid.success).toBe(true);

      const invalid = updateStatusSchema.safeParse({
        status: "RESOLVED",
        notes: "", // empty notes
      });
      expect(invalid.success).toBe(false);
    });
  });
});
