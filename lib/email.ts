import { Resend } from "resend";

let client: Resend | null = null;

function getResend(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY no está configurado.");
    client = new Resend(apiKey);
  }
  return client;
}

export async function sendTicketEmail(params: {
  to: string;
  subject: string;
  html: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL no está configurado.");

  const { error } = await getResend().emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    attachments: [{ filename: params.pdfFilename, content: params.pdfBuffer }],
  });

  if (error) {
    throw new Error(`Resend: ${error.message}`);
  }
}
