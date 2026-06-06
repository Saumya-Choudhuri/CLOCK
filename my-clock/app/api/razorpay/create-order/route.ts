import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Moved INSIDE the function to prevent aggressive Next.js caching
  const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  // 2. Safe debugging logs - check your Vercel logs after clicking the button!
  console.log("--- RAZORPAY KEY CHECK ---");
  console.log("Key ID (First 8 chars):", RAZORPAY_KEY_ID ? RAZORPAY_KEY_ID.substring(0, 8) : "UNDEFINED");
  console.log("Secret Key (Length):", RAZORPAY_KEY_SECRET ? RAZORPAY_KEY_SECRET.length : "UNDEFINED");
  console.log("--------------------------");

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: "Razorpay is not configured." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body?.uid) {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }

  const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });

  try {
    const order = await razorpay.orders.create({
      amount: 29900, // INR 299 in paise
      currency: "INR",
      receipt: `rcpt_${body.uid.substring(0, 15)}-${Date.now()}`,
      notes: {
        uid: body.uid,
        email: body.email || "",
        username: body.username || "",
      },
    });

    if (!order.id) {
      return NextResponse.json(
        { error: "Razorpay order creation failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      keyId: RAZORPAY_KEY_ID,
      amount: 29900,
      currency: "INR",
      userEmail: body.email || "",
      userName: body.username || "",
    });
  } catch (error: unknown) {
    console.error("Razorpay create order error:", error);
    return NextResponse.json(
      { error: "Unable to create Razorpay order." },
      { status: 500 }
    );
  }
}



