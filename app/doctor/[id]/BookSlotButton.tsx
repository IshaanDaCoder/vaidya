"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToCalendarLinks } from "@/components/AddToCalendarLinks";
import { buttonVariants, link as linkClass } from "@/components/ui/styles";

export function BookSlotButton({
  doctorId,
  slotId,
  doctorName,
  startTime,
  endTime,
}: {
  doctorId: string;
  slotId: string;
  doctorName: string;
  startTime: string;
  endTime: string;
}) {
  const [state, setState] = useState<"idle" | "booking" | "error" | "booked">("idle");
  const [error, setError] = useState<string | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);

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
      // Show the confirmation + calendar options rather than
      // immediately redirecting away — a booking a patient made for a
      // future date is exactly the case where they'd want to add it to
      // their own calendar before moving on, not just be dropped
      // straight into the (empty, too-early) video room.
      setConsultationId(body.consultationId);
      setState("booked");
      return;
    }

    // Paid path: once Razorpay is configured, this is where Checkout.js
    // would open using body.razorpayOrderId / body.razorpayKeyId. Left
    // unimplemented until then — the API already returns 503 with a
    // clear message before this point if Razorpay isn't set up.
    setState("idle");
  }

  if (state === "booked" && consultationId) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return (
      <div className="w-full rounded-xl border border-trust/25 bg-trust/10 p-4">
        <p className="text-xs font-medium text-trust-dark dark:text-trust">
          Booked with {doctorName}.
        </p>
        <p className="mt-2 text-xs text-muted">Add to your calendar:</p>
        <div className="mt-2">
          <AddToCalendarLinks
            consultationId={consultationId}
            event={{
              title: `Consultation with ${doctorName} — Vaidya`,
              description: `Your Vaidya consultation. Join here: ${origin}/consultation/${consultationId}`,
              location: `${origin}/consultation/${consultationId}`,
              start: new Date(startTime),
              end: new Date(endTime),
            }}
          />
        </div>
        <Link href={`/consultation/${consultationId}`} className={`mt-3 inline-block text-xs ${linkClass}`}>
          Go to consultation
        </Link>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="text-right">
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        <button onClick={book} className={`text-xs ${linkClass}`}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <button onClick={book} disabled={state === "booking"} className={buttonVariants("primary", "sm")}>
      {state === "booking" ? "Booking…" : "Book"}
    </button>
  );
}
