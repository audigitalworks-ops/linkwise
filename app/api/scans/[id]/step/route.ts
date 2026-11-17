import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stepScan } from "@/lib/scan/run-scan";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(
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
      return apiError("UNAUTHENTICATED", "You must be signed in to advance a scan.", 401);
    }

    const result = await stepScan(id);

    return apiSuccess({
      status: result.status,
      processedPages: result.processedPages,
      totalPages: result.totalPages,
      step: result.step,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed advancing scan.";
    return apiError("INTERNAL", message, 500);
  }
}
