import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return apiError("INVALID_INPUT", "Scan ID is required.", 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("UNAUTHENTICATED", "You must be signed in.", 401);
    }

    const admin = createAdminClient();
    const { data: scan, error: scanError } = await admin
      .from("scans")
      .select("id, status, step, total_pages, processed_pages, error_message")
      .eq("id", id)
      .single();

    if (scanError || !scan) {
      return apiError("NOT_FOUND", "Scan not found.", 404);
    }

    return apiSuccess({
      status: scan.status,
      processedPages: scan.processed_pages || 0,
      totalPages: scan.total_pages || 0,
      step: scan.step,
      errorMessage: scan.error_message,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed retrieving scan.";
    return apiError("INTERNAL", message, 500);
  }
}
