import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const { emailJefe, nombreEmpresa, empleadoNombre, tipo, hora, lat, lng, dentro } = await req.json();
  if (!emailJefe) return NextResponse.json({ ok: false, error: "Sin email del jefe" });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const horaStr = new Date(hora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const fechaStr = new Date(hora).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const ubicacionColor = dentro ? "#2ECC8F" : "#ef4444";
  const ubicacionTexto = dentro ? "✅ Dentro de la zona de trabajo" : "⚠️ Fuera de la zona de trabajo";

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Fichelo <onboarding@resend.dev>",
    to: emailJefe,
    subject: `${empleadoNombre.toUpperCase()} YA FICHÓ ${dentro ? "EN LA UBICACIÓN CORRECTA" : "FUERA DE ZONA"} A LAS ${horaStr}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f9fafb; padding: 32px 16px;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">

          <div style="background: #1B2E4B; padding: 24px 32px;">
            <span style="color: white; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">fichelo<span style="color: #2ECC8F;">.es</span></span>
          </div>

          <div style="padding: 32px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Nuevo fichaje en <strong>${nombreEmpresa}</strong></p>
            <h1 style="color: #1B2E4B; font-size: 24px; font-weight: 900; margin: 0 0 4px; text-transform: uppercase; letter-spacing: -0.5px;">${empleadoNombre}</h1>
            <p style="color: #1B2E4B; font-size: 18px; font-weight: 700; margin: 0 0 24px;">
              ${tipo === "entrada" ? "🟢 ENTRADA" : "🟠 SALIDA"} · ${horaStr}
            </p>

            <div style="background: ${dentro ? "#f0fdf4" : "#fef2f2"}; border: 2px solid ${ubicacionColor}; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
              <p style="color: ${ubicacionColor}; font-size: 16px; font-weight: 800; margin: 0;">
                ${ubicacionTexto}
              </p>
            </div>

            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6b7280; font-size: 13px;">Fecha</span>
                <span style="color: #1B2E4B; font-size: 13px; font-weight: 600;">${fechaStr}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6b7280; font-size: 13px;">Hora</span>
                <span style="color: #1B2E4B; font-size: 13px; font-weight: 600;">${horaStr}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 13px;">GPS</span>
                <span style="color: #1B2E4B; font-size: 13px; font-weight: 600;">${(lat as number).toFixed(5)}, ${(lng as number).toFixed(5)}</span>
              </div>
            </div>

            <a href="${mapsUrl}" target="_blank"
              style="display: block; background: #2ECC8F; color: white; text-align: center; padding: 14px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; margin-bottom: 16px;">
              📍 Ver ubicación en Google Maps
            </a>

            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://fichelo.es"}/dashboard"
              style="display: block; border: 2px solid #e5e7eb; color: #1B2E4B; text-align: center; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 14px; text-decoration: none;">
              Ver panel completo →
            </a>
          </div>

          <div style="padding: 16px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Fichelo.es · Control de fichajes con GPS</p>
          </div>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
