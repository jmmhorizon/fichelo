import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = "fichelo";
const API_KEY    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

async function getCronToken(): Promise<string> {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: process.env.CRON_EMAIL, password: process.env.CRON_PASSWORD, returnSecureToken: true }) }
  );
  const d = await r.json();
  if (!d.idToken) throw new Error("auth failed");
  return d.idToken as string;
}

function parseField(f: Record<string, unknown>): unknown {
  if ("stringValue"  in f) return f.stringValue;
  if ("integerValue" in f) return parseInt(f.integerValue as string);
  if ("booleanValue" in f) return f.booleanValue;
  return null;
}
function parseDoc(fields: Record<string, Record<string, unknown>>) {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, parseField(v)]));
}

export async function GET(req: NextRequest) {
  const empresaId = req.nextUrl.searchParams.get("empresaId");
  if (!empresaId) return NextResponse.json({ error: "empresaId required" }, { status: 400 });

  let token: string;
  try { token = await getCronToken(); }
  catch { return NextResponse.json({ error: "auth" }, { status: 500 }); }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "empleados" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "empresaId" },
            op: "EQUAL",
            value: { stringValue: empresaId },
          },
        },
      },
    }),
  });
  const rows = await r.json() as { document?: { name: string; fields: Record<string, Record<string, unknown>> } }[];

  const results = rows
    .filter(row => row.document?.fields)
    .map(row => {
      const doc = row.document!;
      const data = parseDoc(doc.fields);
      const id = doc.name.split("/").pop()!;
      return { id, nombre: data.nombre as string, email: data.email as string, rol: data.rol as string | undefined };
    });

  return NextResponse.json(results);
}
