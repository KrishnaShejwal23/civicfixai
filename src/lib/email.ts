import { prisma } from "./prisma";

export interface DraftEmailParams {
  refNumber: string;
  category: string;
  subcategory: string;
  title: string;
  description: string;
  address: string;
  departmentName: string;
  departmentEmail: string;
  citizenName: string;
}

export interface GeneratedEmailDraft {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
}

/**
 * Generates a formal, factual, concise email draft to the responsible department.
 */
export function generateCivicEmailDraft(params: DraftEmailParams): GeneratedEmailDraft {
  const subject = `Civic Grievance Notice: ${params.subcategory} - [Ref: ${params.refNumber}]`;

  const bodyText = `To,
The Officer-in-Charge,
${params.departmentName}

Subject: Grievance Report regarding ${params.title} [Ref: ${params.refNumber}]

Respected Sir/Madam,

This is to formally bring to your attention a civic infrastructure matter reported in your jurisdiction through the CivicFix AI Citizen Portal.

Complaint Reference: ${params.refNumber}
Category: ${params.category} (${params.subcategory})
Confirmed Issue Location: ${params.address}

Issue Description:
${params.description}

This issue was reported by a concerned local resident to assist your department in timely maintenance and public safety. We kindly request the competent field inspection team to verify the site and initiate appropriate remedial action as per municipal service level standards.

You may reference ticket ${params.refNumber} for all administrative correspondence.

Thank you for your service to our community.

Yours faithfully,
${params.citizenName}
(Submitted via CivicFix AI Citizen Platform)`;

  return {
    recipientEmail: params.departmentEmail,
    recipientName: params.departmentName,
    subject,
    bodyText,
  };
}

export interface SendEmailResult {
  success: boolean;
  sendStatus: "ACCEPTED" | "FAILED" | "UNCONFIGURED";
  messageId?: string;
  errorMessage?: string;
  note?: string;
}

/**
 * Server-side transactional email sender.
 * Uses Resend API when RESEND_API_KEY is configured.
 * If not configured, transparently reports UNCONFIGURED so the user can copy the draft.
 */
export async function sendDepartmentEmail(params: {
  complaintId: string;
  userId: string;
  departmentId?: string | null;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "CivicFix AI <notifications@civicfix.ai>";

  // If no API key is set, record a DRAFT or report UNCONFIGURED
  if (!apiKey || apiKey.trim() === "" || apiKey === "re_test_mock") {
    // If in development and testing mock send:
    if (process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_EMAIL_MOCK === "true") {
      const mockId = `mock_tx_${Date.now()}`;
      await prisma.emailRecord.create({
        data: {
          complaintId: params.complaintId,
          userId: params.userId,
          departmentId: params.departmentId,
          recipientEmail: params.recipientEmail,
          recipientName: params.recipientName,
          isVerified: true,
          subject: params.subject,
          bodyText: params.bodyText,
          providerMessageId: mockId,
          sendStatus: "ACCEPTED",
          sentAt: new Date(),
        },
      });

      return {
        success: true,
        sendStatus: "ACCEPTED",
        messageId: mockId,
        note: "Accepted in development simulation mode.",
      };
    }

    return {
      success: false,
      sendStatus: "UNCONFIGURED",
      errorMessage:
        "Transactional email provider is not configured (RESEND_API_KEY is not set). You can copy the draft text directly.",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.recipientEmail],
        subject: params.subject,
        text: params.bodyText,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.message || "Email provider rejected the transmission.";
      await prisma.emailRecord.create({
        data: {
          complaintId: params.complaintId,
          userId: params.userId,
          departmentId: params.departmentId,
          recipientEmail: params.recipientEmail,
          recipientName: params.recipientName,
          subject: params.subject,
          bodyText: params.bodyText,
          sendStatus: "FAILED",
          errorMessage: errMsg,
        },
      });

      return {
        success: false,
        sendStatus: "FAILED",
        errorMessage: errMsg,
      };
    }

    // Successfully accepted by Resend
    const messageId = data?.id || `resend_${Date.now()}`;

    await prisma.emailRecord.create({
      data: {
        complaintId: params.complaintId,
        userId: params.userId,
        departmentId: params.departmentId,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        isVerified: true,
        subject: params.subject,
        bodyText: params.bodyText,
        providerMessageId: messageId,
        sendStatus: "ACCEPTED",
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      sendStatus: "ACCEPTED",
      messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network exception during email sending";
    console.error("Error calling email provider:", err);
    await prisma.emailRecord.create({
      data: {
        complaintId: params.complaintId,
        userId: params.userId,
        departmentId: params.departmentId,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        subject: params.subject,
        bodyText: params.bodyText,
        sendStatus: "FAILED",
        errorMessage: errorMsg,
      },
    });

    return {
      success: false,
      sendStatus: "FAILED",
      errorMessage: errorMsg,
    };
  }
}
