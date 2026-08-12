"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: {
        roomName: string;
        parentNode: HTMLElement;
        width: string | number;
        height: string | number;
        userInfo?: { displayName?: string };
      },
    ) => { dispose: () => void };
  }
}

const SCRIPT_SRC = "https://meet.jit.si/external_api.js";

function loadScriptOnce(): Promise<void> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", () => resolve()));
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Jitsi's embed script."));
    document.body.appendChild(script);
  });
}

export function JitsiRoom({ roomName, displayName }: { roomName: string; displayName?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let api: { dispose: () => void } | null = null;
    let cancelled = false;

    loadScriptOnce().then(() => {
      if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return;
      api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: displayName ? { displayName } : undefined,
      });

      // Known Jitsi SDK quirk: height/width "100%" doesn't reliably
      // resolve against a flexbox-sized parent — the generated iframe
      // can lock in at a small default height instead. Force it to
      // genuinely fill the container instead of trusting the SDK's own
      // sizing.
      const iframe = containerRef.current.querySelector("iframe");
      if (iframe) {
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";
      }
    });

    return () => {
      cancelled = true;
      api?.dispose();
    };
  }, [roomName, displayName]);

  return <div ref={containerRef} className="h-full w-full" />;
}
