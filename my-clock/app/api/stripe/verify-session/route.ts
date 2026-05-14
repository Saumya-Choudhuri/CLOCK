import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return NextResponse.json(
    { error: "Stripe is not configured. Using Razorpay instead." },
    { status: 400 }
  );
}
