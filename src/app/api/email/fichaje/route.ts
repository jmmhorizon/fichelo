import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { empresaId, empleadoNombre, tipo, hora, lat, lng, dentro } = await req.json();

  const empresaDoc = await getDoc(doc(db, "empresas", empresaId));
  if (!empresaDoc.exists()) return NextResponse.json({ ok: false });

  const empresa = empresaDoc.data();
  const emailJefe = empresa.email;
  const nombreEmpresa = empresa.nombre;

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const horaStr = new Date(hora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const fechaStr = new Date(hora).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const tipoTexto = tipo === "entrada" ? "ha fichado ENTRADA" : "ha fichado SALIDA";
  const ubicacionTexto = dentro ? "✅ Dentro de la zona de trabajo" : "⚠️ Fuera de la zona de trabajo";
  const ubicacionColor = dentro ? "#2ECC8F" : "#ef4444";

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Fichelo <onboarding@resend.dev>",
    to: emailJefe,
    subject: `${empleadoNombre} ${tipoTexto} a las ${horaStr}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f9fafb; padding: 32px 16px;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">

          <div style="background: #1B2E4B; padding: 24px 32px; display: flex; align-items: center; gap: 12px;">
            <span style="color: white; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">fichelo<span style="color: #2ECC8F;">.es</span></span>
          </div>

          <div style="padding: 32px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Nuevo fichaje en <strong>${nombreEmpresa}</strong></p>
            <h1 style="color: #1B2E4B; font-size: 22px; font-weight: 800; margin: 0 0 4px;">${empleadoNombre}</h1>
            <p style="color: #1B2E4B; font-size: 16px; font-weight: 600; margin: 0 0 24px;">
              ${tipo === "entrada" ? "🟢" : "🟠"} ${tipoTexto.replace("ha fichado ", "")} · ${horaStr}
            </p>

            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 13px;">Fecha</span>
                <span style="color: #1B2E4B; font-size: 13px; font-weight: 600;">${fechaStr} a las ${horaStr}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 13px;">Ubicación</span>
                <span style="color: ${ubicacionColor}; font-size: 13px; font-weight: 600;">${ubicacionTexto}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 13px;">Coordenadas GPS</span>
                <span style="color: #1B2E4B; font-size: 13px; font-weight: 600;">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
              </div>
            </div>

            <a href="${mapsUrl}" target="_blank"
              style="display: block; background: #2ECC8F; color: white; text-align: center; padding: 14px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; margin-bottom: 24px;">
              📍 Ver ubicación en Google Maps
            </a>

            ${!dentro ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #dc2626; font-size: 13px; font-weight: 600; margin: 0;">
                ⚠️ Atención: Este empleado fichó fuera de la zona de trabajo asignada.
              </p>
            </div>` : ""}

            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
              style="display: block; border: 2px solid #e5e7eb; color: #1B2E4B; text-align: center; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 14px; text-decoration: none;">
              Ver panel completo →
            </a>
          </div>

          <div style="padding: 16px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Fichelo.es · Control de fichajes con GPS ·
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #2ECC8F;">fichelo.es</a>
            </p>
          </div>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
