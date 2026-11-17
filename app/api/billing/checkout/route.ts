import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { createDodoCheckoutSession } from "@/lib/billing/dodo";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("UNAUTHENTICATED", "You must be logged in to checkout.", 401);
    }

    const body = await req.json().catch(() => ({}));
    const { plan, interval } = body;

    if (plan !== "pro" && plan !== "agency") {
      return apiError(
        "INVALID_INPUT",
        "Invalid plan selected. Choose 'pro' or 'agency'.",
        400
      );
    }

    if (interval !== "monthly" && interval !== "yearly") {
      return apiError(
        "INVALID_INPUT",
        "Invalid interval selected. Choose 'monthly' or 'yearly'.",
        400
      );
    }

    const url = await createDodoCheckoutSession({
      userId: user.id,
      userEmail: user.email || "",
      userName: (user.user_metadata?.full_name as string) || undefined,
      plan,
      interval,
    });

    return apiSuccess({ url });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout session";
    return apiError("INTERNAL", message, 500);
  }
}
