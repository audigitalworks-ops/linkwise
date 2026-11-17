import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "PLAN_LIMIT"
  | "WP_UNREACHABLE"
  | "WP_AUTH_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
}

export function apiError(code: ApiErrorCode, message: string, status = 400) {
  return NextResponse.json<ApiError>(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
}

