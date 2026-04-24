import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

function madridToUtc(madridDateStr: string, h: number, m: number): Date {
  const noon = new Date(`${madridDateStr}T12:00:00Z`);
  const madridNoonHour = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Madrid", hour: "numeric", hour12: false }).format(noon)
  );
  const offsetHours = madridNoonHour - 12;
  const shiftAsIfUtc = new Date(`${madridDateStr}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00Z`);
  return new Date(shiftAsIfUtc.getTime() - offsetHours * 3600000);
}

async function sendScheduled(
  resend: Resend,
  from: string,
  appUrl: string,
  email: string,
  nombre: string,
  empresaNombre: string,
  hora: string,
  scheduledAt: Date,
  tipo: "entrada" | "salida"
) {
  const esEntrada = tipo === "entrada";
  return resend.emails.send({
    from,
    to: email,
    subject: esEntrada
      ? `⏰ Recuerda fichar — empieza a las ${hora}`
      : `⏰ Recuerda fichar la salida — acaba a las ${hora}`,
    scheduledAt: scheduledAt.toISOString(),
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:32px 16px">
        <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
          <div style="background:#1B2E4B;padding:24px 32px">
            <span style="color:white;font-size:20px;font-weight:800">fichelo<span style="color:#2ECC8F">.es</span></span>
          </div>
          <div style="padding:32px">
            <p style="color:#6b7280;font-size:14px;margin:0 0 8px">Hola, <strong>${nombre}</strong> 👋</p>
            <h1 style="color:#1B2E4B;font-size:22px;font-weight:800;margin:0 0 8px">
              ${esEntrada ? "Tu turno empieza en 20 minutos" : "Tu turno acaba en 5 minutos"}
            </h1>
            <div style="background:#f0fdf4;border:2px solid #2ECC8F;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
              <p style="color:#6b7280;font-size:13px;margin:0 0 4px">${esEntrada ? "Hora de entrada" : "Hora de salida"}</p>
              <p style="color:#1B2E4B;font-size:36px;font-weight:900;margin:0;letter-spacing:-1px">${hora}</p>
              <p style="color:#6b7280;font-size:13px;margin:4px 0 0">${empresaNombre}</p>
            </div>
            <a href="${appUrl}/fichar" style="display:block;background:#2ECC8F;color:white;text-align:center;padding:16px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none">
              📍 ${esEntrada ? "Abrir app y fichar entrada" : "Abrir app y fichar salida"}
            </a>
          </div>
          <div style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center">
            <p style="color:#9ca3af;font-size:12px;margin:0">Fichelo.es · Recordatorio automático</p>
          </div>
        </div>
      </div>`,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    email: string; nombre: string; empresaNombre?: string;
    turnoInicio: string; turnoFin?: string; lunesTimestamp: number; dayIdx: number;
  };

  const { email, nombre, empresaNombre = "", turnoInicio, turnoFin, lunesTimestamp, dayIdx } = body;

  if (!email || !turnoInicio) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const fechaDia = new Date(lunesTimestamp + dayIdx * 86400000);
  const madridDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(fechaDia);

  const resend  = new Resend(process.env.RESEND_API_KEY);
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://fichelo.es";
  const from    = process.env.RESEND_FROM ?? "Fichelo <onboarding@resend.dev>";
  const now     = new Date();
  const results: Record<string, unknown> = {};

  // Recordatorio de entrada (20 min antes)
  const [ih, im] = turnoInicio.split(":").map(Number);
  const inicioUtc    = madridToUtc(madridDateStr, ih, im);
  const schedInicio  = new Date(inicioUtc.getTime() - 20 * 60000);

  if (schedInicio.getTime() - now.getTime() >= 2 * 60000) {
    const r = await sendScheduled(resend, from, appUrl, email, nombre, empresaNombre, turnoInicio, schedInicio, "entrada");
    results.entrada = r.error ? { error: r.error } : { ok: true, scheduledAt: schedInicio.toISOString(), id: r.data?.id };
  } else {
    results.entrada = { skipped: "too_soon" };
  }

  // Recordatorio de salida (5 min antes)
  if (turnoFin) {
    const [fh, fm] = turnoFin.split(":").map(Number);
    const finUtc   = madridToUtc(madridDateStr, fh, fm);
    const schedFin = new Date(finUtc.getTime() - 5 * 60000);

    if (schedFin.getTime() - now.getTime() >= 2 * 60000) {
      const r = await sendScheduled(resend, from, appUrl, email, nombre, empresaNombre, turnoFin, schedFin, "salida");
      results.salida = r.error ? { error: r.error } : { ok: true, scheduledAt: schedFin.toISOString(), id: r.data?.id };
    } else {
      results.salida = { skipped: "too_soon" };
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
