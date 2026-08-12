"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BookSlotButton({ doctorId, slotId }: { doctorId: string; slotId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "booking" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function book() {
    setState("booking");
    setError(null);

    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, slotId }),
    });
    const body = await res.json();

    if (!res.ok) {
      setState("error");
      setError(body.error ?? "Could not book this slot.");
      return;
    }

    if (body.free) {
      router.push(`/consultation/${body.consultationId}`);
      return;
    }

    // Paid path: once Razorpay is configured, this is where Checkout.js
    // would open using body.razorpayOrderId / body.razorpayKeyId. Left
    // unimplemented until then — the API already returns 503 with a
    // clear message before this point if Razorpay isn't set up.
    setState("idle");
  }

  if (state === "error") {
    return (
      <div className="text-right">
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={book}
          className="text-xs font-medium text-trust-dark underline underline-offset-4 dark:text-trust"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={book}
      disabled={state === "booking"}
      className="rounded-md bg-trust px-3 py-1.5 text-xs font-medium text-white hover:bg-trust-dark disabled:opacity-60"
    >
      {state === "booking" ? "Booking…" : "Book"}
    </button>
  );
}
