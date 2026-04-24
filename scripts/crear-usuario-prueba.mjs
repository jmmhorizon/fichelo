const API_KEY = "AIzaSyB_2uvpgYOUjeEt6skD7u7zaujvng9SaGg";
const PROJECT_ID = "fichelo";
const EMAIL = "magopitito@hotmail.com";
const PASSWORD = "Test1234!";

async function main() {
  console.log("Creando usuario de prueba...");

  // 1. Crear usuario en Firebase Auth
  let uid, idToken;

  // Intentar crear; si ya existe, hacer sign-in
  const signUpRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
    }
  );
  const signUpData = await signUpRes.json();
  if (!signUpRes.ok) {
    if (signUpData.error?.message === "EMAIL_EXISTS") {
      console.log("El email ya existe en Auth, haciendo sign-in...");
      const signInRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
        }
      );
      const signInData = await signInRes.json();
      if (!signInRes.ok) {
        console.error("Error en sign-in (contraseña incorrecta o usuario no activado):", JSON.stringify(signInData.error));
        console.log("Puede que el usuario se creó con otra contraseña. Prueba a restablecer desde Firebase Console.");
        process.exit(1);
      }
      uid = signInData.localId;
      idToken = signInData.idToken;
      console.log("Sign-in OK, UID:", uid);
    } else {
      console.error("Error creando usuario Auth:", JSON.stringify(signUpData.error));
      process.exit(1);
    }
  } else {
    uid = signUpData.localId;
    idToken = signUpData.idToken;
    console.log("Usuario Auth creado, UID:", uid);
  }
  console.log("Usuario Auth creado, UID:", uid);

  // 2. Actualizar displayName
  const updateRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, displayName: "Usuario Prueba", returnSecureToken: false }),
    }
  );
  if (!updateRes.ok) console.warn("No se pudo actualizar displayName (no crítico)");

  // 3. Crear documento en Firestore (colección empresas)
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/empresas/${uid}`;
  const docRes = await fetch(firestoreUrl, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      fields: {
        nombre:    { stringValue: "Empresa Demo" },
        email:     { stringValue: EMAIL },
        plan:      { stringValue: "basico" },
        creadoEn:  { stringValue: new Date().toISOString() },
        empleados: { arrayValue: { values: [] } },
      },
    }),
  });
  const docData = await docRes.json();
  if (!docRes.ok) {
    console.error("Error creando documento Firestore:", JSON.stringify(docData.error));
    console.log("Tip: revisa las reglas de seguridad de Firestore en Firebase Console.");
    process.exit(1);
  }

  console.log("\n✅ Usuario de prueba creado con éxito");
  console.log("──────────────────────────────────────");
  console.log("📧 Email   :", EMAIL);
  console.log("🔑 Contraseña:", PASSWORD);
  console.log("🏢 Plan    : basico");
  console.log("🆔 UID     :", uid);
  console.log("──────────────────────────────────────");
  console.log("Entra en: https://fichelo.es/login");
}

main().catch((err) => { console.error(err); process.exit(1); });
