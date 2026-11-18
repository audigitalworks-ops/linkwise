import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding/connect";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      try {
        const admin = createAdminClient();
        const user = data.user;
        const fullName =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email?.split("@")[0] ||
          "User";
        await admin.from("profiles").upsert({
          id: user.id,
          email: user.email,
          full_name: fullName,
        });
      } catch (err) {
        console.error("Error ensuring profile on auth callback:", err);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page or login with an instruction
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

