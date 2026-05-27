import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import Gallery, { type GeneratedImage } from "./Gallery";

// SEO: keep private — the order_id IS the access token for the gallery.
export const metadata: Metadata = {
  title: "Your AI Model — AIM Method",
  robots: { index: false, follow: false },
};

// Re-query every visit so a refresh picks up new images while generation
// is still in progress (positions trickle in 1-by-1 from replicate-callback).
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OrderRow {
  id: string;
  customer_name: string | null;
  status: string;
  generated_images: GeneratedImage[] | null;
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
      .select("id, customer_name, status, generated_images")
      .eq("id", orderId)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error(
        `[upsell-mymodel] supabase error orderId=${orderId} err=${error.message}`,
      );
      return { order: null, failed: true };
    }
    return { order: (data as OrderRow | null) ?? null, failed: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[upsell-mymodel] unexpected error orderId=${orderId} err=${msg}`,
    );
    return { order: null, failed: true };
  }
}

export default async function MyModelPage({ params }: PageProps) {
  const { order_id } = params;
  const { order, failed } = await fetchOrder(order_id);

  // Funnel state — push back to preferences if they haven't filled the form.
  if (order && (order.status === "pending" || order.status === "form_submitted")) {
    redirect(`/upsell-1/preferences/${order.id}`);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-10 sm:py-16">
      <div className="w-full max-w-5xl mx-auto">
        <div className="glass-card rounded-2xl p-6 sm:p-10">
          {!order ? (
            <MissingState failed={failed} />
          ) : order.status === "generating" ? (
            <GeneratingState />
          ) : order.status === "failed" ? (
            <FailedState />
          ) : order.status === "refunded" ? (
            <RefundedState />
          ) : (order.status === "ready_for_review" || order.status === "delivered") ? (
            <Gallery
              images={order.generated_images ?? []}
              customerName={order.customer_name}
            />
          ) : (
            // Defensive fallback for an unknown status — degrade gracefully.
            <FallbackState />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- STATE: generating ----------
function GeneratingState() {
  return (
    <div className="text-center">
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
        Your 11 hyperrealistic AI photos will be ready in <strong className="text-white">24&ndash;48 hours</strong>. We&apos;ll email you the moment they&apos;re done.
      </p>
      <div className="border border-purple-700/40 bg-purple-900/10 rounded-xl px-5 py-4 text-sm text-gray-400 leading-relaxed max-w-xl mx-auto">
        You can close this page — we have your email on file and you&apos;ll get a notification with a link back here.
      </div>
    </div>
  );
}

// ---------- STATE: failed ----------
function FailedState() {
  return (
    <div className="text-center">
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
    </div>
  );
}

// ---------- STATE: refunded ----------
function RefundedState() {
  return (
    <div className="text-center">
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
    </div>
  );
}

// ---------- STATE: unknown status — defensive fallback ----------
function FallbackState() {
  return (
    <div className="text-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
        We&apos;re on it
      </h1>
      <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-6">
        Your order is being processed. We&apos;ll email you the moment your photos are ready.
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
    </div>
  );
}

// ---------- STATE: order missing ----------
function MissingState({ failed }: { failed: boolean }) {
  return (
    <div className="text-center">
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
    </div>
  );
}
