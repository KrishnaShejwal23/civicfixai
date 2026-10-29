import { z } from "zod";

/**
 * Unicode-friendly name validator:
 * - Trims whitespace
 * - Rejects empty/whitespace-only
 * - Accepts Unicode letters, spaces, hyphens, apostrophes, dots, and regional scripts
 *   (Devanagari, Tamil, Telugu, Arabic, etc.)
 */
export const fullNameSchema = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, {
    message: "Full Name is required and cannot be blank or whitespace only.",
  })
  .refine((val) => val.length >= 2, {
    message: "Full Name must be at least 2 characters.",
  })
  .refine((val) => val.length <= 100, {
    message: "Full Name must be 100 characters or fewer.",
  });

export const emailSchema = z
  .string()
  .transform((val) => val.trim().toLowerCase())
  .pipe(z.string().email({ message: "Please enter a valid email address." }));

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long." })
  .max(128, { message: "Password is too long." });

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and Confirm Password do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required." }),
});

export const updateProfileSchema = z.object({
  fullName: fullNameSchema,
});

export const complaintCreateSchema = z.object({
  category: z.string().min(1, { message: "Category is required." }),
  subcategory: z.string().min(1, { message: "Subcategory / issue type is required." }),
  title: z.string().min(5, { message: "Title must be at least 5 characters." }).max(200),
  description: z.string().min(15, { message: "Description must be at least 15 characters." }),
  photoUrl: z.string().optional().nullable(),
  photoName: z.string().optional().nullable(),
  address: z.string().min(5, { message: "Confirmed issue address is required." }),
  building: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  landmark: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  aiAnalysis: z.string().optional().nullable(),
  aiSuggested: z.boolean().default(false),
});

export const updateStatusSchema = z.object({
  status: z.enum(["SUBMITTED", "PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED", "REOPENED"]),
  notes: z.string().min(3, { message: "Official status update notes are required." }),
  departmentId: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const sendEmailSchema = z.object({
  complaintId: z.string().min(1, { message: "Complaint ID is required." }),
  departmentId: z.string().optional().nullable(),
  recipientEmail: z.string().email({ message: "Valid recipient email is required." }),
  recipientName: z.string().min(2, { message: "Recipient name is required." }),
  subject: z.string().min(5, { message: "Subject is required." }),
  bodyText: z.string().min(20, { message: "Email body must be at least 20 characters." }),
});

export const savedAddressSchema = z.object({
  label: z.string().min(1, { message: "Label is required (e.g. Home, Work)." }),
  building: z.string().optional().nullable(),
  street: z.string().min(2, { message: "Street name is required." }),
  area: z.string().min(2, { message: "Area or locality is required." }),
  landmark: z.string().optional().nullable(),
  city: z.string().min(2, { message: "City is required." }),
  state: z.string().min(2, { message: "State is required." }),
  pincode: z.string().regex(/^\d{6}$/, { message: "PIN code must be a 6-digit number." }),
  isDefault: z.boolean().default(false),
});
