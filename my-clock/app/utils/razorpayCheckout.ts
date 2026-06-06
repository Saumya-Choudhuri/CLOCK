type RazorpayCheckoutPayload = {
  uid: string;
  email?: string | null;
  username?: string;
};

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

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

