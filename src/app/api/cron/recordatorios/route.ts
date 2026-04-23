import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

function getMadridTime(date: Date = new Date()) {
  const fmt = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit", minute: "2-digit",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  const h = parseInt(p.hour === "24" ? "0" : p.hour);
  const m = parseInt(p.minute);
  return { h, m, totalMin: h * 60 + m };
}

function getMadridWeekday(date: Date = new Date()): number {
  // 0 = Lunes, 6 = Domingo
  const utcOffset = new Date(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Madrid", hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date)
  );
  return (utcOffset.getDay() + 6) % 7;
}

function getSemanaKey(date: Date = new Date()): string {
  const madridStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
  const d = new Date(madridStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${new Date(madridStr).getFullYear()}W${String(week).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { adminDb } = await import("@/lib/firebase-admin");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://fichelo.es";

  const now = new Date();
  const reminderDate = new Date(now.getTime() + 10 * 60 * 1000);
  const { h: rH, m: rM, totalMin: rMin } = getMadridTime(reminderDate);
  const reminderHora = `${String(rH).padStart(2, "0")}:${String(rM).padStart(2, "0")}`;
  const dayIdx = getMadridWeekday(reminderDate);
  const semanaKey = getSemanaKey(reminderDate);

  const empleadosSnap = await adminDb.collection("empleados").get();
  let enviados = 0;

  for (const empDoc of empleadosSnap.docs) {
    const emp = empDoc.data();
    if (!emp.email || !emp.empresaId) continue;

    const turnosDoc = await adminDb.doc(`turnos/${emp.empresaId}_${semanaKey}`).get();
    if (!turnosDoc.exists) continue;

    const turno = (turnosDoc.data() ?? {})[`${empDoc.id}_${dayIdx}`];
    if (!turno || turno.libre || !turno.inicio) continue;

    const [th, tm] = (turno.inicio as string).split(":").map(Number);
    const turnoMin = th * 60 + tm;
    if (Math.abs(turnoMin - rMin) > 3) continue;

    // Evitar duplicados
    const recordKey = `${empDoc.id}_${semanaKey}_${dayIdx}_${turno.inicio.replace(":", "")}`;
    const yaEnviado = await adminDb.doc(`recordatoriosEnviados/${recordKey}`).get();
    if (yaEnviado.exists) continue;

    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Fichelo <onboarding@resend.dev>",
      to: emp.email as string,
      subject: `⏰ Recuerda fichar — empieza a las ${turno.inicio}`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9fafb; padding: 32px 16px;">
          <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
            <div style="background: #1B2E4B; padding: 24px 32px;">
              <span style="color: white; font-size: 20px; font-weight: 800;">fichelo<span style="color: #2ECC8F;">.es</span></span>
            </div>
            <div style="padding: 32px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Hola, <strong>${emp.nombre}</strong> 👋</p>
              <h1 style="color: #1B2E4B; font-size: 22px; font-weight: 800; margin: 0 0 8px;">Tu turno empieza en 10 minutos</h1>
              <div style="background: #f0fdf4; border: 2px solid #2ECC8F; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px;">Hora de entrada</p>
                <p style="color: #1B2E4B; font-size: 36px; font-weight: 900; margin: 0; letter-spacing: -1px;">${turno.inicio}</p>
                <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">${emp.empresaNombre ?? ""}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px;">
                Abre la app, activa el GPS y ficha cuando llegues al trabajo.
              </p>
              <a href="${appUrl}/fichar"
                style="display: block; background: #2ECC8F; color: white; text-align: center; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 16px; text-decoration: none;">
                📍 Abrir app y fichar
              </a>
            </div>
            <div style="padding: 16px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">Fichelo.es · ${reminderHora} · Recordatorio automático</p>
            </div>
          </div>
        </div>
      `,
    });

    await adminDb.doc(`recordatoriosEnviados/${recordKey}`).set({
      empleadoId: empDoc.id,
      email: emp.email,
      turnoInicio: turno.inicio,
      semanaKey,
      dayIdx,
      enviadoEn: now.toISOString(),
    });

    enviados++;
  }

  return NextResponse.json({ ok: true, enviados, checkedAt: now.toISOString() });
}
