import { NextResponse } from "next/server";
import { getEnvStatus } from "@/lib/env";

export async function GET() {
  const status = getEnvStatus();
  return NextResponse.json({
    ok: true,
    phase: "01-foundation",
    supabaseConfigured: status.configured,
    fakeData: false,
    timestamp: new Date().toISOString(),
  });
}
