import { NextResponse } from "next/server";

export async function GET() {
  // Access environment variables securely
  const apiKey = process.env["MY_SECRET_API_KEY"];

  // This code only runs on the server, not in the browser
  console.log("API key exists:", !!apiKey);

  // Return a safe response without exposing sensitive data
  return NextResponse.json({
    message: "Hello from the secure API!",
    // Never return API keys or sensitive data in responses
  });
}
