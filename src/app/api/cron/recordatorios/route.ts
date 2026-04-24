import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const PROJECT_ID = "fichelo";
const API_KEY    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

// Convierte un campo Firestore REST a valor JS
function parseField(field: Record<string, unknown>): unknown {
  if ("stringValue"  in field) return field.stringValue;
  if ("integerValue" in field) return parseInt(field.integerValue as string);
  if ("booleanValue" in field) return field.booleanValue;
  if ("mapValue"     in field) return parseDoc((field.mapValue as { fields: Record<string, Record<string, unknown>> }).fields);
  return null;
}
function parseDoc(fields: Record<string, Record<string, unknown>>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, parseField(v)]));
}

async function getToken(): Promise<string> {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: process.env.CRON_EMAIL, password: process.env.CRON_PASSWORD, returnSecureToken: true }) }
  );
  const d = await r.json();
  if (!d.idToken) throw new Error("Cron auth failed: " + JSON.stringify(d.error));
  return d.idToken as string;
}

async function fsGet(token: string, path: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!r.ok) return null;
  const d = await r.json();
  return d.fields ? parseDoc(d.fields as Record<string, Record<string, unknown>>) : null;
}

async function fsList(token: string, collection: string): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];
  let pageToken = "";
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=300${pageToken ? "&pageToken=" + pageToken : ""}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    for (const doc of (d.documents ?? [])) {
      if (doc.fields) {
        const id = (doc.name as string).split("/").pop()!;
        results.push({ _id: id, ...parseDoc(doc.fields as Record<string, Record<string, unknown>>) });
      }
    }
    pageToken = d.nextPageToken ?? "";
  } while (pageToken);
  return results;
}

async function fsSet(token: string, path: string, data: Record<string, unknown>): Promise<void> {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string") fields[k] = { stringValue: v };
    else if (typeof v === "number") fields[k] = { integerValue: String(v) };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
  }
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`,
    { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fields }) }
  );
}

function getMadridHM(date: Date = new Date()): { h: number; m: number; totalMin: number } {
  const fmt = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hour12: false });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  const h = parseInt(p.hour === "24" ? "0" : p.hour);
  const m = parseInt(p.minute);
  return { h, m, totalMin: h * 60 + m };
}

function getMadridWeekday(date: Date = new Date()): number {
  const s = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Madrid", weekday: "short" }).format(date);
  return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(s);
}

function getSemanaKey(date: Date = new Date()): string {
  const localStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const d = new Date(localStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${new Date(localStr + "T12:00:00Z").getFullYear()}W${String(week).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://fichelo.es";

  const now = new Date();
  const { totalMin: nowMin } = getMadridHM(now);
  const reminderHora = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  const dayIdx   = getMadridWeekday(now);
  const semanaKey = getSemanaKey(now);

  let token: string;
  try {
    token = await getToken();
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  const empleados = await fsList(token, "empleados");
  let enviados = 0;

  for (const emp of empleados) {
    if (!emp.email || !emp.empresaId) continue;

    const docId = `${emp.empresaId}_${semanaKey}`;
    const turnosDoc = await fsGet(token, `turnos/${docId}`);
    if (!turnosDoc) continue;

    const turno = turnosDoc[`${emp._id}_${dayIdx}`] as Record<string, unknown> | undefined;
    if (!turno || turno.libre || !turno.inicio) continue;

    const [th, tm] = (turno.inicio as string).split(":").map(Number);
    let minutosRestantes = th * 60 + tm - nowMin;
    if (minutosRestantes < 0) minutosRestantes += 1440; // turno al día siguiente (ej. medianoche)
    if (minutosRestantes < 5 || minutosRestantes > 35) continue;

    const recordKey = `${emp._id}_${semanaKey}_${dayIdx}_${(turno.inicio as string).replace(":", "")}`;
    const yaEnviado = await fsGet(token, `recordatoriosEnviados/${recordKey}`);
    if (yaEnviado) continue;

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
              <h1 style="color: #1B2E4B; font-size: 22px; font-weight: 800; margin: 0 0 8px;">Tu turno empieza en ${minutosRestantes} minutos</h1>
              <div style="background: #f0fdf4; border: 2px solid #2ECC8F; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px;">Hora de entrada</p>
                <p style="color: #1B2E4B; font-size: 36px; font-weight: 900; margin: 0; letter-spacing: -1px;">${turno.inicio}</p>
                <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">${emp.empresaNombre ?? ""}</p>
              </div>
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

    await fsSet(token, `recordatoriosEnviados/${recordKey}`, {
      empleadoId: emp._id as string,
      email: emp.email as string,
      turnoInicio: turno.inicio as string,
      semanaKey,
      dayIdx,
      enviadoEn: now.toISOString(),
    });

    enviados++;
  }

  return NextResponse.json({ ok: true, enviados, checkedAt: now.toISOString() });
}
