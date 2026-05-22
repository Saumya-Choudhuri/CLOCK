import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: Request) {
  if (!RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: "Razorpay is not configured." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body?.razorpay_payment_id || !body?.razorpay_order_id || !body?.razorpay_signature) {
    return NextResponse.json(
      { error: "Missing payment details." },
      { status: 400 }
    );
  }

  try {
    // Verify signature
    const hmac = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET);
    hmac.update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`);
    const generated_signature = hmac.digest("hex");

    const isSignatureValid = generated_signature === body.razorpay_signature;
    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Invalid payment signature.", paid: false },
        { status: 400 }
      );
    }

    // Optionally fetch payment details from Razorpay to double-check
    if (RAZORPAY_KEY_ID) {
      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      });

      const payment = await razorpay.payments.fetch(body.razorpay_payment_id);
      if (payment.status !== "captured") {
        return NextResponse.json(
          { error: "Payment not captured.", paid: false },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      paid: true,
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
    });
  } catch (error: unknown) {
    console.error("Razorpay verify payment error:", error);
    return NextResponse.json(
      { error: "Unable to verify Razorpay payment.", paid: false },
      { status: 500 }
    );
  }
}
