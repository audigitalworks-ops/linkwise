import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { isWithinSiteLimit, PlanType } from "@/lib/billing/plans";
import { validateWordPressUrl } from "@/lib/wordpress/client";

const CreateSiteSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  url: z.string().url("Valid URL required"),
  username: z.string().min(1, "Username is required"),
  appPassword: z.string().min(1, "Application Password is required"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = CreateSiteSchema.safeParse(json);

    if (!result.success) {
      return apiError(
        "INVALID_INPUT",
        result.error.issues[0]?.message || "Invalid input parameters",
        400
      );
    }

    const { name, url, username, appPassword } = result.data;

    // Validate SSRF and HTTPS
    try {
      validateWordPressUrl(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid URL";
      return apiError("INVALID_INPUT", message, 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If user is logged in, enforce plan limits and insert into Supabase
    if (user) {
      // Fetch user's subscription plan
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      const userPlan = (sub?.plan as PlanType) || "free";

      // Count existing sites
      const { count } = await supabase
        .from("sites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const currentSiteCount = count || 0;

      if (!isWithinSiteLimit(currentSiteCount, userPlan)) {
        return apiError(
          "PLAN_LIMIT",
          `Your ${userPlan.toUpperCase()} plan limit of ${currentSiteCount} site(s) reached. Upgrade to connect more sites.`,
          403
        );
      }

      // Encrypt Application Password before saving
      const encryptedPassword = encrypt(appPassword);

      const { data: newSite, error: insertError } = await supabase
        .from("sites")
        .insert({
          user_id: user.id,
          name,
          url,
          wp_username: username,
          wp_password_encrypted: encryptedPassword,
          connected: true,
        })
        .select("id")
        .single();

      if (insertError) {
        return apiError("INTERNAL", insertError.message, 500);
      }

      return apiSuccess({ siteId: newSite.id }, 201);
    }

    // In demo/mock mode without active auth session
    return apiSuccess({ siteId: "site_demo_greenleaf_01" }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return apiError("INTERNAL", message, 500);
  }
}

