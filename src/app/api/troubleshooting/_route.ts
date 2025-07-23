
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.IMAGEROUTER_API_KEY;
  return NextResponse.json({
    message: "Troubleshooting endpoint",
    apiKey: apiKey ? `Exists, last 4 chars: ${apiKey.slice(-4)}` : "Not found",
  });
}
