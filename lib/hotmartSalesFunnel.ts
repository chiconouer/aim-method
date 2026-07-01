"use client";

import { useEffect, useRef } from "react";

// Hotmart's checkout-elements bundle sets this global once loaded.
// The signature below only reflects the .init('salesFunnel').mount()
// path we use — the runtime object has other methods we don't touch.
declare global {
  interface Window {
    checkoutElements?: {
      init(kind: string): { mount(selector: string): void };
    };
  }
}

export const HOTMART_SALES_FUNNEL_ID = "hotmart-sales-funnel";
export const HOTMART_ELEMENTS_SRC =
  "https://checkout.hotmart.com/lib/hotmart-checkout-elements.js";

// =============================================================
// useHotmartSalesFunnel — mounts Hotmart's Sales Funnel widget
// exactly once when both:
//   1. `shouldMount` is true (the page's own reveal gate — e.g.
//      the /fb2/upsell 120 s timer, or /fb2/downsell's wheel win),
//   2. window.checkoutElements has been defined by the loaded
//      hotmart-checkout-elements.js script,
//   3. the <div id={HOTMART_SALES_FUNNEL_ID}> is in the DOM.
//
// Defensive: polls every 100 ms up to 10 s (100 attempts) waiting
// for the two conditions above, cancels cleanly on unmount, uses
// a ref to guard against React StrictMode's double-effect and
// against dependency-change re-runs (mount() must never fire
// twice on the same page). All widget calls are try/catch so
// Hotmart-side breakage can't crash the React tree.
// =============================================================
export function useHotmartSalesFunnel(shouldMount: boolean): void {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!shouldMount) return;
    if (mountedRef.current) return;
    if (typeof window === "undefined") return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 100; // 100 × 100 ms = 10 s cap

    function tryMount() {
      if (cancelled || mountedRef.current) return;
      const ce = window.checkoutElements;
      const el = document.getElementById(HOTMART_SALES_FUNNEL_ID);
      if (ce && el) {
        try {
          ce.init("salesFunnel").mount(`#${HOTMART_SALES_FUNNEL_ID}`);
          mountedRef.current = true;
        } catch {
          // Silent — widget failure must never crash the page.
        }
        return;
      }
      if (++attempts < MAX_ATTEMPTS) {
        setTimeout(tryMount, 100);
      }
    }

    tryMount();

    return () => {
      cancelled = true;
    };
  }, [shouldMount]);
}
