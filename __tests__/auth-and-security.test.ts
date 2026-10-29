/**
 * @jest-environment node
 */

import {
  hashPassword,
  comparePassword,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth";

describe("Authentication & Security Primitives", () => {
  it("should securely hash passwords with bcrypt and never store plaintext", async () => {
    const raw = "SuperSecretPass123!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await comparePassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrong = await comparePassword("WrongPassword123!", hash);
    expect(isWrong).toBe(false);
  });

  it("should sign and verify secure session JWT tokens", async () => {
    const payload = {
      userId: "user_test_99",
      email: "citizen@civicfix.ai",
      role: "CITIZEN",
      fullName: "Pooja Hegde",
    };

    const token = await createSessionToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe("user_test_99");
    expect(verified?.fullName).toBe("Pooja Hegde");
    expect(verified?.role).toBe("CITIZEN");
  });

  it("should reject invalid or tampered JWT tokens", async () => {
    const tampered = "invalid.token.signature";
    const result = await verifySessionToken(tampered);
    expect(result).toBeNull();
  });
});
