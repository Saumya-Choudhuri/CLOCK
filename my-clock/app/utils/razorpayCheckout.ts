type RazorpayCheckoutPayload = {
  uid: string;
  email?: string | null;
  username?: string;
};

export async function startRazorpayCheckout(payload: RazorpayCheckoutPayload) {
  const response = await fetch("/api/razorpay/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Unable to start Razorpay checkout.");
  }

  if (!data?.orderId || !data?.keyId) {
    throw new Error("Razorpay order creation failed.");
  }

  return {
    orderId: data.orderId,
    keyId: data.keyId,
    amount: data.amount,
    currency: data.currency,
    userEmail: data.userEmail,
    userName: data.userName,
  };
}
