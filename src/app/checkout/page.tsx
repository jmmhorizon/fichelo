"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "basico";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email: user.email, uid: user.uid }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    });
    return () => unsub();
  }, [plan]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <Image src="/logo.png" alt="Fichelo" width={130} height={44} className="h-11 w-auto" />
      <p className="text-gray-600 text-lg font-medium">Preparando tu pago seguro...</p>
      <div className="w-8 h-8 border-4 border-[#2ECC8F] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
