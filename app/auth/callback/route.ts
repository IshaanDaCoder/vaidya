import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getPostAuthRedirect } from "@/utils/get-post-auth-redirect";

// Distinct from /auth/confirm: that route verifies an email OTP
// (token_hash + type) for password signups. This one exchanges the
// authorization code Supabase appends after an OAuth provider (Google,
// later Microsoft) redirects back, per the PKCE flow.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(await getPostAuthRedirect(supabase));
    }
  }

  redirect("/login?error=Could not complete sign-in");
}
