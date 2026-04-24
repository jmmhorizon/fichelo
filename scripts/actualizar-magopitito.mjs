const API_KEY    = "AIzaSyB_2uvpgYOUjeEt6skD7u7zaujvng9SaGg";
const PROJECT_ID = "fichelo";
const EMAIL      = "magopitito@hotmail.com";
const PASS_OLD   = "jimenez88clg";
const PASS_NEW   = "jimenez88clg";

async function main() {
  // 1. Sign in
  const signInRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASS_OLD, returnSecureToken: true }) }
  );
  const signInData = await signInRes.json();
  if (!signInRes.ok) { console.error("Sign-in error:", signInData.error); process.exit(1); }
  const { localId: uid, idToken } = signInData;
  console.log("Sign-in OK, UID:", uid);

  // 2. Cambiar contraseña
  const passRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, password: PASS_NEW, returnSecureToken: true }) }
  );
  const passData = await passRes.json();
  if (!passRes.ok) { console.error("Error cambiando contraseña:", passData.error); process.exit(1); }
  const newToken = passData.idToken || idToken;
  console.log("Contraseña actualizada a:", PASS_NEW);

  // 3. Actualizar plan a empresarial en Firestore
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/empresas/${uid}`;
  const docRes = await fetch(firestoreUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${newToken}` },
    body: JSON.stringify({
      fields: {
        plan:  { stringValue: "empresarial" },
        email: { stringValue: EMAIL },
      },
    }),
  });
  if (!docRes.ok) {
    const err = await docRes.json();
    console.error("Error actualizando Firestore:", err.error);
    process.exit(1);
  }
  console.log("Plan actualizado a: empresarial");
  console.log("\n✅ Listo");
  console.log("Email     :", EMAIL);
  console.log("Contraseña:", PASS_NEW);
  console.log("Plan      : empresarial");
}

main().catch(e => { console.error(e); process.exit(1); });
