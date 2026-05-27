import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

// SEO: keep this URL out of Google — the order_id is private to the customer.
export const metadata: Metadata = {
  title: "Your Order — AIM Method",
  robots: { index: false, follow: false },
};

// Never statically cache — every visit re-queries the order so the screen
// reflects the current status (pending → form_submitted → generating → ready).
export const dynamic = "force-dynamic";

const TALLY_FORM_URL = "https://tally.so/r/7Ra2g9";

// Quick gate: reject anything that isn't a valid UUID v4-shape string
// BEFORE hitting Postgres. Postgres would reject malformed UUIDs with an
// `invalid input syntax for type uuid` error that the catch block treats
// as a transient DB problem ("snag"). For mis-typed URLs we'd rather show
// the cleaner "Order not found" copy.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OrderRow {
  id: string;
  customer_email: string;
  customer_name: string | null;
  status: string;
}

interface PageProps {
  params: { order_id: string };
}

async function fetchOrder(
  orderId: string,
): Promise<{ order: OrderRow | null; failed: boolean }> {
  if (!UUID_RE.test(orderId)) {
    return { order: null, failed: false };
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("upsell_orders")
      .select("id, customer_email, customer_name, status")
      .eq("id", orderId)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error(
        `[upsell-preferences] supabase error orderId=${orderId} err=${error.message}`,
      );
      return { order: null, failed: true };
    }
    return { order: (data as OrderRow | null) ?? null, failed: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[upsell-preferences] unexpected error orderId=${orderId} err=${msg}`,
    );
    return { order: null, failed: true };
  }
}

export default async function PreferencesPage({ params }: PageProps) {
  const { order_id } = params;
  const { order, failed } = await fetchOrder(order_id);

  // Photos already done → push them straight to the gallery.
  if (order && (order.status === "ready_for_review" || order.status === "delivered")) {
    redirect(`/upsell-1/my-model/${order.id}`);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-5 py-10 sm:py-16">
      <div className="w-full max-w-2xl">
        <div className="glass-card rounded-2xl p-6 sm:p-10 text-center">
          {!order ? (
            <MissingState failed={failed} />
          ) : order.status === "pending" ? (
            <PendingState order={order} />
          ) : order.status === "form_submitted" || order.status === "generating" ? (
            <GeneratingState />
          ) : order.status === "failed" ? (
            <FailedState />
          ) : order.status === "refunded" ? (
            <RefundedState />
          ) : (
            // Defensive fallback — unknown status. Treat as "we got your order"
            // so the customer doesn't see a broken screen.
            <UnknownState order={order} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- STATE: pending — CTA to fill out the Tally form ----------
function PendingState({ order }: { order: OrderRow }) {
  const firstName = order.customer_name?.split(" ")[0] || "there";
  const tallyUrl = `${TALLY_FORM_URL}?order_id=${order.id}`;
  const shortId = `${order.id.slice(0, 8)}…`;

  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
        Tell us about your{" "}
        <span className="neon-purple">AI model</span>
      </h1>
      <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
        Hi {firstName} — we got your order. Now we just need a few details so we can generate your custom AI model. Takes about 2 minutes.
      </p>

      <a
        href={tallyUrl}
        className="inline-block bg-purple-600 hover:bg-purple-500 transition-colors text-white font-bold text-base sm:text-lg px-8 py-4 rounded-xl shadow-lg shadow-purple-900/30 mb-6"
      >
        Start Form →
      </a>

      <div className="border border-purple-700/40 bg-purple-900/10 rounded-xl px-5 py-4 text-sm text-gray-300 leading-relaxed max-w-xl mx-auto text-left mb-6">
        <p className="mb-2"><strong className="text-white">What you&apos;ll fill out:</strong></p>
        <ul className="list-disc list-inside space-y-1 text-gray-400">
          <li>Age, ethnicity, hair, eyes, body type, aesthetic</li>
          <li>Optional: a reference selfie so the AI looks like you</li>
        </ul>
        <p className="mt-3 text-gray-400">Your 11 hyperrealistic photos arrive within 24&ndash;48 hours of submission.</p>
      </div>

      <p className="text-xs text-gray-500 mb-2">
        Order ID: <span className="font-mono">{shortId}</span>
      </p>
      <p className="text-xs text-gray-500">
        Questions? Email{" "}
        <a
          href="mailto:aimodelmethods@gmail.com"
          className="text-purple-400 hover:underline"
        >
          aimodelmethods@gmail.com
        </a>
      </p>
    </>
  );
}

// ---------- STATE: form submitted / generating — wait screen ----------
function GeneratingState() {
  return (
    <>
      <div className="flex justify-center mb-6">
        <svg
          className="animate-spin w-10 h-10 sm:w-12 sm:h-12 text-purple-400"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="3"
          />
          <path
            d="M22 12a10 10 0 0 1-10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
        Your photos are being{" "}
        <span className="neon-purple">generated</span>
      </h1>
      <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-6">
        We got your preferences. Your 11 hyperrealistic AI photos will be ready in <strong className="text-white">24&ndash;48 hours</strong>. We&apos;ll email you the moment they&apos;re done.
      </p>
      <div className="border border-purple-700/40 bg-purple-900/10 rounded-xl px-5 py-4 text-sm text-gray-400 leading-relaxed max-w-xl mx-auto">
        You can close this page — we have your email on file and you&apos;ll get a notification with a link to your gallery.
      </div>
    </>
  );
}

// ---------- STATE: failed ----------
function FailedState() {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
        Something went wrong
      </h1>
      <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-6">
        Our team has been notified and we&apos;re looking into it. Please reach out so we can sort it out for you fast.
      </p>
      <a
        href="mailto:aimodelmethods@gmail.com"
        className="inline-block bg-purple-600 hover:bg-purple-500 transition-colors text-white font-bold text-base px-6 py-3 rounded-xl"
      >
        Email Support
      </a>
    </>
  );
}

// ---------- STATE: refunded ----------
function RefundedState() {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
        Order refunded
      </h1>
      <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-6">
        This order has been refunded. If you believe this is a mistake, please contact us.
      </p>
      <p className="text-xs text-gray-500">
        Support:{" "}
        <a
          href="mailto:aimodelmethods@gmail.com"
          className="text-purple-400 hover:underline"
        >
          aimodelmethods@gmail.com
        </a>
      </p>
    </>
  );
}

// ---------- STATE: unknown status — defensive fallback ----------
function UnknownState({ order }: { order: OrderRow }) {
  const firstName = order.customer_name?.split(" ")[0] || "there";
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
        We got your order{" "}
        <span className="neon-purple">✅</span>
      </h1>
      <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-6">
        Hi {firstName}, sit tight &mdash; we&apos;ll email you the next step shortly.
      </p>
      <p className="text-xs text-gray-500">
        Support:{" "}
        <a
          href="mailto:aimodelmethods@gmail.com"
          className="text-purple-400 hover:underline"
        >
          aimodelmethods@gmail.com
        </a>
      </p>
    </>
  );
}

// ---------- STATE: order missing (not found OR DB error) ----------
function MissingState({ failed }: { failed: boolean }) {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
        Order not found
      </h1>
      <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-6">
        {failed
          ? "We hit a snag loading your order. Email us at aimodelmethods@gmail.com and we'll sort it out."
          : "We couldn't find an order matching this link. If you just purchased and think this is a mistake, email aimodelmethods@gmail.com with your transaction ID."}
      </p>
      <p className="text-xs text-gray-500">
        Support:{" "}
        <a
          href="mailto:aimodelmethods@gmail.com"
          className="text-purple-400 hover:underline"
        >
          aimodelmethods@gmail.com
        </a>
      </p>
    </>
  );
}
