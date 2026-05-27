import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";

// SEO: keep this URL out of Google — the order_id is private to the customer.
export const metadata: Metadata = {
  title: "Your Order — AIM Method",
  robots: { index: false, follow: false },
};

// Never statically cache — every visit re-queries the order so the friendly
// "we got your order" view reflects whatever was just written by the webhook.
export const dynamic = "force-dynamic";

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
        `[upsell-preferences-placeholder] supabase error orderId=${orderId} err=${error.message}`,
      );
      return { order: null, failed: true };
    }
    return { order: (data as OrderRow | null) ?? null, failed: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[upsell-preferences-placeholder] unexpected error orderId=${orderId} err=${msg}`,
    );
    return { order: null, failed: true };
  }
}

export default async function PreferencesPlaceholderPage({ params }: PageProps) {
  const { order_id } = params;
  const { order, failed } = await fetchOrder(order_id);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-5 py-10 sm:py-16">
      <div className="w-full max-w-2xl">
        <div className="glass-card rounded-2xl p-6 sm:p-10 text-center">
          {order ? <FoundState order={order} /> : <MissingState failed={failed} />}
        </div>
      </div>
    </div>
  );
}

// ---------- STATE 1: order found ----------
function FoundState({ order }: { order: OrderRow }) {
  const firstName = order.customer_name?.split(" ")[0] || "there";
  const shortId = `${order.id.slice(0, 8)}…`; // ellipsis char

  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
        We got your order{" "}
        <span className="neon-purple">✅</span>
      </h1>
      <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-6">
        Hi {firstName}, your AI model is on the way.
      </p>

      <div className="border border-purple-700/40 bg-purple-900/10 rounded-xl px-5 py-4 text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl mx-auto text-left mb-6">
        We&apos;re finalizing the preferences form for your custom AI model. In the meantime, sit tight &mdash; we&apos;ll email you within 24 hours with the next step. Your 11 hyperrealistic photos will be delivered within 24&ndash;48 hours of you submitting your preferences.
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

// ---------- STATE 2: order missing (not found OR DB error) ----------
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
