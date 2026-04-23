import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { empresaNombre, nombreEmpleado, emailEmpleado, token } = await req.json();

  if (!empresaNombre || !nombreEmpleado || !emailEmpleado || !token) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/unirse/${token}`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Fichelo <onboarding@resend.dev>",
    to: emailEmpleado,
    subject: `${empresaNombre} te invita a usar Fichelo`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #f9fafb; padding: 32px 16px;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
          <div style="background: #1B2E4B; padding: 24px 32px;">
            <span style="color: white; font-size: 20px; font-weight: 800;">fichelo<span style="color: #2ECC8F;">.es</span></span>
          </div>
          <div style="padding: 32px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Hola, <strong>${nombreEmpleado}</strong></p>
            <h1 style="color: #1B2E4B; font-size: 22px; font-weight: 800; margin: 0 0 8px;">
              <strong>${empresaNombre}</strong> te ha invitado a fichar en Fichelo
            </h1>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
              A partir de ahora registrarás tu entrada y salida del trabajo desde tu móvil con verificación GPS. Es rápido y sencillo.
            </p>
            <a href="${link}" style="display: block; background: #2ECC8F; color: white; text-align: center; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 16px; text-decoration: none; margin-bottom: 16px;">
              ✅ Aceptar invitación y registrarme
            </a>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Este enlace caduca en 7 días · Fichelo.es
            </p>
          </div>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Error al enviar el email: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
