import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const priceMap: Record<string, string> = {
  basico: process.env.STRIPE_PRICE_BASIC!,
  pro: process.env.STRIPE_PRICE_PRO!,
  empresarial: process.env.STRIPE_PRICE_EMPRESARIAL!,
};

export async function POST(req: NextRequest) {
  const { plan, email, uid } = await req.json();

  const priceId = priceMap[plan];
  if (!priceId) {
    return NextResponse.json({ error: "Plan no válido" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 3,
      metadata: { uid, plan },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?pago=ok`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/registro?plan=${plan}`,
  });

  return NextResponse.json({ url: session.url });
}
