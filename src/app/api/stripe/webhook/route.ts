import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook inv�lido" }, { status: 400 });
  }

  if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const uid = sub.metadata?.uid;
    if (uid) {
      const { db } = await import("@/lib/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      if (event.type === "customer.subscription.deleted") {
        await updateDoc(doc(db, "empresas", uid), { plan: "cancelado", activo: false });
      } else {
        await updateDoc(doc(db, "empresas", uid), {
          activo: sub.status === "active" || sub.status === "trialing",
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
