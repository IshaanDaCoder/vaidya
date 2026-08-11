import { Resend } from "resend";

// Sandbox sender — no domain verification needed. Swap for a verified
// custom domain (e.g. notifications@vaidya.in) before a real launch,
// per the roadmap's Day 14 checklist.
const FROM = "Vaidya <onboarding@resend.dev>";

function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendDoctorApprovedEmail(to: string) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping doctor-approved email.");
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "You're verified on Vaidya",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 20px;">You're verified on Vaidya</h1>
        <p>
          Good news — your medical registration has been reviewed and
          approved. Your profile is now visible to patients searching on
          Vaidya.
        </p>
        <p>
          Next step: set your consultation availability from your
          dashboard so patients can start booking with you.
        </p>
        <p style="margin-top: 24px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/doctor/dashboard"
             style="background:#0e6b63;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
            Go to your dashboard
          </a>
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send doctor-approved email:", error);
  }
}
