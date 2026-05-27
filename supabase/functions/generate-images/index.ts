// Edge Function: generate-images
// Triggered by Supabase Database Webhook when a new row appears in upsell_orders.
// Validates the order, creates the FIRST photo prediction with a webhook callback.
// The replicate-callback function handles photos 2-11.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REPLICATE_MODEL = "google/nano-banana-pro";
const CALLBACK_BASE_URL = `${SUPABASE_URL}/functions/v1/replicate-callback`;

interface FormResponses {
  age?: string;
  ethnicity?: string;
  hair_color?: string;
  hair_length?: string;
  eye_color?: string;
  body_type?: string;
  aesthetic?: string;
  notes?: string;
}

interface GeneratedImage {
  position: number;
  type: string;
  url: string;
}

const PHOTO_ORDER = [
  { key: "photo_01_reference", type: "reference" },
  { key: "photo_02_morning_bedroom", type: "morning_bedroom" },
  { key: "photo_03_coffee_shop", type: "coffee_shop" },
  { key: "photo_04_car_passenger", type: "car_passenger" },
  { key: "photo_05_golden_hour", type: "golden_hour" },
  { key: "photo_06_bedroom_mirror", type: "bedroom_mirror" },
  { key: "photo_07_gym_mirror", type: "gym_mirror" },
  { key: "photo_08_beach", type: "beach" },
  { key: "photo_09_restaurant", type: "restaurant" },
  { key: "photo_10_city_street", type: "city_street" },
  { key: "photo_11_rooftop", type: "rooftop" },
];

function safeStr(v: unknown, fallback: string): string {
  if (v === undefined || v === null) return fallback;
  return String(v).trim() || fallback;
}

function fillPrompt(template: string, form: FormResponses): string {
  const age = safeStr(form.age, "23");
  const ethnicity = safeStr(form.ethnicity, "Latina");
  const hairColor = safeStr(form.hair_color, "Brunette");
  const hairLength = safeStr(form.hair_length, "Long");
  const eyeColor = safeStr(form.eye_color, "Dark Brown");
  const bodyType = safeStr(form.body_type, "Slim with curves");
  const aesthetic = safeStr(form.aesthetic, "Clean Girl");
  const hairCombo = `${hairLength} ${hairColor}`.toLowerCase();
  return template
    .replaceAll("{AGE}", age)
    .replaceAll("{ETHNICITY}", ethnicity)
    .replaceAll("{HAIR_COLOR_AND_LENGTH}", hairCombo)
    .replaceAll("{EYE_COLOR}", eyeColor.toLowerCase())
    .replaceAll("{BODY_TYPE}", bodyType.toLowerCase())
    .replaceAll("{NICHE}", aesthetic.toLowerCase());
}

async function createReplicatePrediction(
  prompt: string,
  orderId: string,
  position: number,
  referenceUrl?: string,
): Promise<void> {
  const input: Record<string, unknown> = {
    prompt,
    aspect_ratio: "4:5",
    output_format: "jpg",
    resolution: "4K",
    safety_filter_level: "block_only_high",
  };
  if (referenceUrl) {
    input.image_input = [referenceUrl];
  }

  const webhookUrl = `${CALLBACK_BASE_URL}?order_id=${orderId}&position=${position}`;
  console.log(`[${orderId}] creating photo ${position} prediction, webhook: ${webhookUrl}`);

  const res = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input,
      webhook: webhookUrl,
      webhook_events_filter: ["completed"],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Replicate create error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  console.log(`[${orderId}] photo ${position} prediction created: ${data.id}`);
}


const PROMPTS = {
  photo_01_reference: `Authentic iPhone front-camera selfie of a stunning {AGE}-year-old {ETHNICITY} woman sitting in the driver's seat of a car, taken at a slight upward angle as if she just picked up her phone. The kind of girl who gets stopped on the street, model-level beauty, the type of selfie that goes viral on Instagram.

{HAIR_COLOR_AND_LENGTH} hair, parted in the middle, falling well past her shoulders down to her chest in length, smooth and sleek with healthy natural shine, gentle soft waves at the ends, freshly styled and well-groomed, no frizz, no flyaways, glossy hair-care commercial quality but still natural. The kind of hair from a high-end salon blowout.

Striking model features: large piercing {EYE_COLOR} almond-shaped eyes with very long thick dark mascara-coated eyelashes, subtle natural eyeliner along the upper lash line creating a soft cat-eye effect, bold defined brows in a natural fluffy laminated brushed-up shape matching her hair tone, small upturned button nose, full plump heart-shaped natural lips with a glossy nude-pink tint that catches the light, sharp defined jawline, high prominent cheekbones with a soft warm pink blush. Subtle highlight on the cheekbones and tip of the nose catching the daylight.

Looking directly into the camera with a soft confident neutral expression, lips slightly parted with a hint of a pout, eyes locked on the lens with intensity. Pretty girl serving face.

Wearing a black knit crewneck sweater and a thin delicate gold chain necklace, small gold hoop earrings. Seatbelt across her chest. Modern car interior with light grey ceiling and panoramic sunroof showing bright blue sky and green tree canopy above, blurred green trees through the back window. Natural midday sunlight pouring in from the sunroof, soft diffused daylight on her face from front-left.

Shot on iPhone 15 Pro front camera, slightly soft natural focus, no professional retouching. Hyperrealistic skin showing visible pores on the nose and cheeks, fine peach fuzz along the jawline, tiny natural freckles scattered across the bridge of her nose, subtle natural shine on the nose tip and forehead, healthy dewy skin with a glow, no AI plastic look, no over-smoothing, but skin clearly looks taken care of and glowing.

Makeup: professional natural "{NICHE} aesthetic" makeup — invisible base showing real skin texture, defined and groomed brows, dramatic mascara on top and bottom lashes, soft pink blush on the apples of her cheeks, subtle bronzer on the cheekbones, glossy nude-pink lip tint. Pretty, polished, but still natural.

Vibe: {AGE}-year-old Instagram model with 200k followers driving to lunch with friends. Aesthetic: {NICHE}, model-off-duty. Composition framing from chest up, slightly off-center. Aspect ratio 4:5, 4K quality.`,

  photo_02_morning_bedroom: `Authentic iPhone front-camera selfie of a stunning {AGE}-year-old {ETHNICITY} woman who just woke up, sitting on a white bed with messy crumpled sheets and pillows around her. Follow her exact face features just like the reference image — same face shape, same {EYE_COLOR} eyes, same nose, same lips, same jawline, identical model.

{HAIR_COLOR_AND_LENGTH} hair slightly tousled from sleep but still pretty, no frizz, falling naturally over her shoulders, parted in the middle, soft texture, no flyaways.

Wearing an oversized cream knit sweater pulled slightly off one shoulder, exposing a delicate collarbone. Cozy lived-in bedroom in soft blurred background — neutral beige tones, white linen curtains glowing with morning light.

Soft golden morning light streaming through a window on her left, warm honey tones, slight dreamy haze in the air, gentle backlight catching the edges of her hair creating a subtle halo glow.

Looking directly at the camera with sleepy soft expression, lips slightly parted in a barely-there smile, half-lidded relaxed eyes, head resting slightly tilted. Effortless just-woke-up pretty.

Same model-level beauty as reference: large {EYE_COLOR} almond-shaped eyes with long dark mascara-coated lashes, defined groomed brows, full plump glossy nude-pink lips, sharp jawline, high cheekbones with natural warm flush.

Makeup: no fresh makeup, slightly smudged remnants from yesterday — faded mascara softening the lashes naturally, subtle leftover lip tint. Skin looks rested and dewy.

Shot on iPhone 15 Pro front camera, slightly soft natural focus, no retouching. Hyperrealistic skin with visible pores, fine peach fuzz, tiny freckles on the nose, natural shine on cheeks and nose tip, no AI plastic look, no over-smoothing.

Vibe: cozy Sunday morning, the kind of selfie a {NICHE} {AGE}-year-old Instagram model posts on her story with a coffee emoji. Composition from chest up, slightly off-center. Aspect ratio 4:5, 4K quality.`,

  photo_03_coffee_shop: `Authentic iPhone front-camera selfie inside a modern aesthetic coffee shop, taken at a slight upward angle. A stunning {AGE}-year-old {ETHNICITY} woman holding a clear glass cup of matcha latte with milk swirls visible. Follow her exact face features just like the reference image — same face shape, same {EYE_COLOR} eyes, same nose, same lips, same jawline, identical model.

{HAIR_COLOR_AND_LENGTH} hair styled smooth and sleek with soft waves at the ends, parted in the middle, falling past her shoulders, polished and well-groomed, glossy natural shine.

Wearing a beige oversized hoodie with the hood down, gold dainty necklace peeking through, small gold hoop earrings.

Aesthetic minimalist coffee shop in background — warm wood tones, plants, soft pendant lighting, blurred with creamy bokeh. Large window behind her with soft natural daylight creating a gentle backlight, subtle glow around her hair, warm rim light.

Looking at the camera with a soft confident expression, slight subtle smile that doesn't show teeth, lips slightly parted, eyes locked on lens with intensity. Pretty girl serving face.

Same model-level beauty as reference: large piercing {EYE_COLOR} almond-shaped eyes with very long thick dark mascara-coated lashes, subtle cat-eye liner, bold defined laminated brushed-up brows, small upturned nose, full plump heart-shaped lips with glossy nude-pink tint, sharp jawline, high cheekbones with warm pink blush.

Makeup: professional natural clean girl aesthetic, dewy skin, defined brows, dramatic mascara, glossy lips.

Shot on iPhone 15 Pro front camera, slightly soft natural focus, no retouching. Hyperrealistic skin with visible pores, peach fuzz, tiny freckles, healthy glow, no AI plastic look.

Vibe: casual coffee date, the kind of photo a {NICHE} {AGE}-year-old Instagram model posts mid-afternoon. Composition from chest up, drink visible at bottom of frame. Aspect ratio 4:5, 4K quality.`,

  photo_04_car_passenger: `Authentic iPhone front-camera selfie inside a car during the day, taken at a slight upward angle. A stunning {AGE}-year-old {ETHNICITY} woman sitting in the passenger seat, wearing oversized round designer sunglasses pushed up on top of her head holding her hair back. Follow her exact face features just like the reference image — same face shape, same {EYE_COLOR} eyes, same nose, same lips, same jawline, identical model.

{HAIR_COLOR_AND_LENGTH} hair pulled slightly back by the sunglasses, parted in the middle, falling smooth and glossy past her shoulders.

Wearing a fitted white ribbed tank top, thin gold chain necklace, small gold hoop earrings, sun-kissed shoulders visible.

Bright natural sunlight pouring through the windshield, golden warm tones, subtle lens flare in the upper corner, soft shadows. Beige leather car interior softly blurred, road visible through the back window.

Looking directly at the camera with a playful confident half-smile, slight smize, head tilted a tiny bit to the side. Effortless summer vibe.

Same model-level beauty as reference: large piercing {EYE_COLOR} almond-shaped eyes with long dark mascara lashes, defined laminated brows, full plump glossy nude-pink lips, sharp jawline, high cheekbones with warm sun-kissed flush.

Makeup: professional natural clean girl aesthetic, dewy sun-kissed skin, light bronzer, glossy lips, mascara.

Shot on iPhone 15 Pro front camera, slightly soft focus, no retouching. Hyperrealistic skin with visible pores, peach fuzz catching sunlight, tiny freckles slightly more visible from sun exposure, natural glow, no AI plastic look.

Vibe: summer road trip, the kind of selfie a {NICHE} {AGE}-year-old Instagram model takes on the way to the beach. Composition from chest up. Aspect ratio 4:5, 4K quality.`,

  photo_05_golden_hour: `Authentic iPhone front-camera selfie outdoors during golden hour, taken at a slight upward angle. A stunning {AGE}-year-old {ETHNICITY} woman standing in a green park or backyard with soft sunset light. Follow her exact face features just like the reference image — same face shape, same {EYE_COLOR} eyes, same nose, same lips, same jawline, identical model.

{HAIR_COLOR_AND_LENGTH} hair catching warm golden sunset backlight, glowing edges, soft waves with natural movement from a gentle breeze, parted in the middle, glossy and well-groomed.

Wearing a fitted white cropped t-shirt and high-waisted denim shorts, thin gold chain necklace, small gold hoop earrings.

Dreamy warm golden hour atmosphere — soft pink and orange sky, blurred green trees and bokeh in background, lens flare from the setting sun in the corner. Soft backlight creating a glowing halo around her hair and shoulders, warm fill light on her face.

Looking at the camera with a soft natural smile, slight squint from the warm light, eyes catching the golden glow. Effortless candid summer pretty.

Same model-level beauty as reference: large piercing {EYE_COLOR} almond-shaped eyes glowing in the golden light, long dark mascara lashes, defined brows, full plump glossy lips, sharp jawline, high cheekbones with warm sun-flushed cheeks.

Makeup: professional natural clean girl aesthetic, sun-kissed dewy glow, bronzer accentuated by the warm light, glossy lips.

Shot on iPhone 15 Pro front camera, slightly soft focus with warm color cast from sunset, no retouching. Hyperrealistic skin with visible pores, peach fuzz lit up by the backlight, tiny freckles, natural sun-flushed glow, no AI plastic look.

Vibe: summer golden hour magic, the kind of selfie a {NICHE} {AGE}-year-old Instagram model posts at sunset with a sun emoji. Composition from chest up. Aspect ratio 4:5, 4K quality.`,

  photo_06_bedroom_mirror: `Authentic full-body mirror selfie taken with an iPhone in a modern bedroom, phone held at chest level visible in the reflection. A stunning {AGE}-year-old {ETHNICITY} woman standing in front of a tall full-length mirror. Follow her exact face features just like the reference image — same face shape, same {EYE_COLOR} eyes, same nose, same lips, same jawline, identical model.

{BODY_TYPE} body visible in full, natural posture with one hip slightly popped, weight on one leg, free hand resting naturally at her side or holding the bottom of her shirt.

{HAIR_COLOR_AND_LENGTH} hair falling smooth and glossy past her shoulders, parted in the middle, slight movement.

Wearing a tight white ribbed cropped tank top showing a sliver of waist and low-rise loose-fit straight jeans, white sneakers visible at the bottom. Thin gold chain necklace, small gold hoop earrings. iPhone visible covering part of her face but eyes still locked on the mirror reflection.

Clean modern bedroom in soft background reflection — neutral beige and white tones, unmade bed with white linen, plants, soft natural daylight from a window on the side. Slightly cluttered lived-in aesthetic.

Same model-level beauty as reference: visible {EYE_COLOR} eyes looking at the mirror reflection over the phone, defined laminated brows, full plump glossy lips slightly parted, sharp jawline, high cheekbones.

Makeup: professional natural clean girl aesthetic, dewy skin, glossy lips, mascara, blush.

Shot on iPhone 15 Pro main camera in mirror reflection, slightly soft natural focus, no retouching. Hyperrealistic skin tones, no AI plastic look. Slight imperfect framing, authentic Instagram-style mirror selfie.

Vibe: getting ready, the kind of mirror selfie a {NICHE} {AGE}-year-old Instagram model posts to show off her outfit. Composition full body, vertical framing. Aspect ratio 4:5, 4K quality.`,

  photo_07_gym_mirror: `Authentic full-body mirror selfie taken with an iPhone in a modern bright gym locker room, phone held at chest level visible in the reflection. A stunning {AGE}-year-old {ETHNICITY} woman standing in front of a tall gym mirror after a workout. Follow her exact face features just like the reference image — same face shape, same {EYE_COLOR} eyes, same nose, same lips, same jawline, identical model.

{BODY_TYPE} athletic body visible in full, natural confident posture, one hand holding the phone, other hand resting on her hip.

{HAIR_COLOR_AND_LENGTH} hair pulled up in a high sleek ponytail with a few face-framing strands left loose, slightly damp at the roots from a light post-workout glow.

Wearing a matching activewear set — neutral beige or sage green seamless sports bra and matching high-waisted leggings showing toned midriff. White Nike or Adidas sneakers visible. No jewelry or just a minimalist gold necklace.

Bright clean modern gym locker room in background — white walls, wooden benches, soft overhead lighting, slight neutral cool tones. iPhone partially covering her face but features still visible.

Same model-level beauty as reference: visible {EYE_COLOR} eyes focused on the mirror, defined brows, full plump natural lips, sharp jawline, high cheekbones with a flushed post-workout glow.

Makeup: minimal, natural — slight mascara, no lip product, fresh face with a subtle workout flush, dewy skin from a light sheen of sweat.

Shot on iPhone 15 Pro main camera in mirror reflection, slightly soft focus, no retouching. Hyperrealistic skin with visible pores, peach fuzz, slight redness from exercise, healthy glow, no AI plastic look.

Vibe: post-workout pump, the kind of mirror selfie a {NICHE} {AGE}-year-old Instagram model posts after leg day. Composition full body, vertical framing. Aspect ratio 4:5, 4K quality.`,

  photo_08_beach: `Candid full-body photograph of a stunning {AGE}-year-old {ETHNICITY} woman walking on a beach during golden hour, taken from a few meters away as if a friend captured the moment from behind and slightly to the side. Follow her exact face features just like the reference image — same face shape, same {EYE_COLOR} eyes, same nose, same lips, same jawline, identical model.

{BODY_TYPE} body in full view, walking gracefully barefoot on wet sand, slight movement, natural unposed stride.

{HAIR_COLOR_AND_LENGTH} hair blowing softly in the ocean breeze, catching warm golden sunset light, slight movement, glossy and well-groomed despite the wind.

Wearing a flowing white linen midi sundress that catches the breeze, thin gold chain necklace, no other jewelry, barefoot with delicate ankle bracelet.

Looking off into the distance toward the ocean with a soft natural expression, not posing for the camera, captured mid-step as if she didn't know the photo was being taken. Effortless candid moment.

Warm golden hour at the beach — soft pink and orange sky reflecting on wet sand, gentle waves in background, sun low on the horizon creating long warm shadows and dramatic backlight glow around her silhouette. Slight lens flare.

Same model-level beauty as reference: profile or 3/4 view of her face, {EYE_COLOR} eyes catching the warm light, full plump lips slightly parted, sharp jawline, high cheekbones bathed in golden light.

Makeup: natural beachy clean girl aesthetic, sun-kissed dewy glow, minimal makeup, glossy lips, mascara.

Shot on a 35mm lens with shallow depth of field, photographed by a friend, slight motion blur in her hair from the wind, authentic unposed candid feel, no retouching. Hyperrealistic skin with visible pores, sun-kissed glow, natural freckles slightly more visible, no AI plastic look.

Vibe: dreamy beach moment, the kind of photo a {NICHE} {AGE}-year-old Instagram model posts in a carousel with the caption "summer". Composition full body or 3/4 length, vertical framing. Aspect ratio 4:5, 4K quality.`,

  photo_09_restaurant: `Candid photograph of a stunning {AGE}-year-old {ETHNICITY} woman sitting at an upscale restaurant table during an intimate dinner, taken from across the table by a friend. Follow her exact face features just like the reference image — same face shape, same {EYE_COLOR} eyes, same nose, same lips, same jawline, identical model.

{HAIR_COLOR_AND_LENGTH} hair styled in soft glossy waves with volume, parted in the middle, falling over her shoulders, freshly blown out and well-groomed.

Wearing a black silk slip dress with thin spaghetti straps, delicate gold necklace at her collarbone, small gold hoop earrings. Subtle elegant evening look.

Holding a glass of red wine, hand visible with simple manicured nails, soft mid-laugh natural expression with her head tilted slightly back, eyes squinting just a little from genuine laughter, lips parted in a real smile showing a hint of teeth. Not posing — captured in a real moment.

Warm intimate restaurant ambiance — flickering candlelight on the table, blurred amber and gold bokeh from background lighting, dark wood and burgundy tones, slightly out of focus, cinematic mood. A wine glass and plated food softly visible in the foreground.

Same model-level beauty as reference: {EYE_COLOR} eyes catching candlelight, defined brows, glossy plump lips, sharp jawline, high cheekbones with a warm flush.

Makeup: evening clean girl aesthetic with a slight upgrade — slightly bolder mascara, defined brows, glowy bronzed cheeks, glossy nude-pink lips, subtle highlight.

Shot on iPhone 15 Pro main camera with portrait mode, slightly soft focus, warm color cast from candles, no retouching. Hyperrealistic skin with visible pores, dewy glow under warm lighting, no AI plastic look.

Vibe: romantic dinner night out, the kind of candid a {NICHE} {AGE}-year-old Instagram model posts in a photo dump. Composition from chest up, slightly off-center framing. Aspect ratio 4:5, 4K quality.`,

  photo_10_city_street: `Candid full-body photograph of a stunning {AGE}-year-old {ETHNICITY} woman walking down a busy upscale city street during the day, taken from across the sidewalk by a friend a few steps behind, as if she didn't know. Follow her exact face features just like the reference image — same face shape, same {EYE_COLOR} eyes, same nose, same lips, same jawline, identical model.

{BODY_TYPE} body walking with natural confident stride, mid-step, holding a small designer handbag in one hand, the other hand swinging naturally.

{HAIR_COLOR_AND_LENGTH} hair glossy and smooth, slight movement from walking, parted in the middle, well-groomed salon blowout quality.

Wearing an oversized tailored cream blazer over a fitted white tank top, wide-leg dark wash jeans with a slight crop, clean white leather sneakers, small designer handbag, delicate gold layered necklaces, small gold hoop earrings, oversized black sunglasses.

Looking ahead, not at the camera, soft natural expression, lips slightly parted, focused on her destination. Effortless model-off-duty energy.

Modern upscale city street background slightly blurred with motion — storefronts, soft daylight, passing pedestrians out of focus, urban architecture, possibly SoHo NYC or West Hollywood vibes. Natural overcast or soft sunny daylight, gentle shadows.

Same model-level beauty as reference: 3/4 angle of her face, full plump lips, sharp jawline, high cheekbones, profile visible behind sunglasses.

Makeup: clean girl aesthetic, glowy skin, glossy lips, defined brows, mascara visible behind sunglasses.

Shot on a 35mm lens with shallow depth of field, photographed candidly by a friend, slight motion in her step, authentic street style photo feel, no retouching. Hyperrealistic skin tones, no AI plastic look. Slightly off-center framing.

Vibe: model-off-duty street style, the kind of candid a {NICHE} {AGE}-year-old Instagram model gets tagged in on a streetstyle account. Composition full body, vertical framing. Aspect ratio 4:5, 4K quality.`,

  photo_11_rooftop: `Candid photograph of a stunning {AGE}-year-old {ETHNICITY} woman standing on a rooftop balcony at sunset overlooking a city skyline, taken from a few steps behind and to the side by a friend. Follow her exact face features just like the reference image — same face shape, same {EYE_COLOR} eyes, same nose, same lips, same jawline, identical model.

{BODY_TYPE} body in 3/4 view leaning against the rooftop railing, weight on one leg, holding a glass cocktail with one hand, the other resting on the railing.

{HAIR_COLOR_AND_LENGTH} hair catching warm golden sunset backlight glowing at the edges, blowing very gently in the breeze, soft waves with natural movement, glossy and well-groomed.

Wearing high-waisted dark denim shorts and a fitted soft white ribbed cropped t-shirt, thin gold chain layered necklaces, small gold hoop earrings, simple delicate bracelet.

Looking out at the city skyline with a soft contemplative expression, slight subtle smile, eyes focused on the horizon not on the camera. Effortless dreamy candid moment.

Cinematic warm golden hour sunset — sky in deep pink, orange, and lavender gradients, city skyline silhouetted in the background slightly blurred, twinkling distant city lights starting to come on, strong warm backlight creating a glowing halo around her silhouette, gentle lens flare from the setting sun.

Same model-level beauty as reference: profile or 3/4 view of her face bathed in warm golden light, {EYE_COLOR} eyes catching the glow, glossy plump lips, sharp jawline, high cheekbones.

Makeup: clean girl aesthetic, golden hour glow naturally accentuated, glossy lips, bronzed cheeks, mascara.

Shot on a 35mm lens with shallow depth of field and cinematic wide framing, photographed candidly by a friend, no retouching. Hyperrealistic skin with visible pores, peach fuzz lit up by backlight, sun-kissed flush, no AI plastic look.

Vibe: rooftop magic hour, the kind of photo a {NICHE} {AGE}-year-old Instagram model posts as the closing shot of a carousel. Composition 3/4 body or chest up, vertical framing. Aspect ratio 4:5, 4K quality.`,
};

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  try {
    const body = await req.json();
    const orderId: string | null = body.record?.id || body.order_id;
    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), { status: 400 });
    }

    const { data: order, error: fetchErr } = await supabase
      .from("upsell_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return new Response(JSON.stringify({ error: `Order not found: ${fetchErr?.message}` }), { status: 404 });
    }

    if (order.status !== "form_submitted") {
      return new Response(JSON.stringify({ skipped: true, reason: `status is ${order.status}` }), { status: 200 });
    }

    // Parse form_responses if it came in as a JSON string
    let form: FormResponses;
    if (typeof order.form_responses === "string") {
      form = JSON.parse(order.form_responses);
    } else {
      form = (order.form_responses || {}) as FormResponses;
    }

    // Build photo 1 prompt and fire off the prediction (no reference yet)
    const photo1 = PHOTO_ORDER[0];
    const prompt = fillPrompt(PROMPTS[photo1.key as keyof typeof PROMPTS], form);

    await supabase.from("upsell_orders").update({
      status: "generating",
      generated_images: [],
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);

    await createReplicatePrediction(prompt, orderId, 1, order.reference_image_url ?? undefined);

    return new Response(JSON.stringify({ accepted: true, order_id: orderId, started_at: 1 }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("generate-images error:", errMsg);
    return new Response(JSON.stringify({ error: errMsg }), { status: 500 });
  }
});
