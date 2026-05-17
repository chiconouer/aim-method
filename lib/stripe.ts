import Stripe from "stripe";

// Build-time placeholder: Next.js runs route modules during `next build`
// to collect page data, before runtime env is available. The Stripe SDK
// rejects an empty key at construction time, so fall back to a dummy
// string for the build step. At runtime in production, STRIPE_SECRET_KEY
// is set and the real key is used.
const apiKey = process.env.STRIPE_SECRET_KEY || "sk_build_placeholder";

// stripe v22 SDK ships a stricter literal type for apiVersion; pin to
// the version the routes were written against and cast around it.
const stripe = new Stripe(apiKey, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2024-12-18.acacia" as any,
});

export default stripe;
