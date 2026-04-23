"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { auth, db, googleProvider } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Invitacion {
  empresaId: string;
  empresaNombre: string;
  nombreEmpleado: string;
  emailEmpleado: string;
  expira: string;
  usado: boolean;
}

export default function UnirsePage() {
  const { token } = useParams<{ token: string }>();
  const [invitacion, setInvitacion] = useState<Invitacion | null>(null);
  const [estado, setEstado] = useState<"cargando" | "valida" | "usada" | "expirada" | "completado" | "error">("cargando");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    const cargar = async () => {
      try {
        const snap = await getDoc(doc(db, "invitaciones", token));
        if (!snap.exists()) { setEstado("error"); return; }
        const inv = snap.data() as Invitacion;
        if (inv.usado) { setEstado("usada"); return; }
        if (new Date(inv.expira) < new Date()) { setEstado("expirada"); return; }
        setInvitacion(inv);
        setEstado("valida");
      } catch {
        setEstado("error");
      }
    };
    cargar();
  }, [token]);

  const completarRegistro = async (uid: string) => {
    if (!invitacion) return;
    await setDoc(doc(db, "empleados", uid), {
      nombre: invitacion.nombreEmpleado,
      email: invitacion.emailEmpleado,
      empresaId: invitacion.empresaId,
      empresaNombre: invitacion.empresaNombre,
      creadoEn: new Date().toISOString(),
    });
    await updateDoc(doc(db, "empresas", invitacion.empresaId), {
      empleados: arrayUnion(invitacion.nombreEmpleado),
    });
    await updateDoc(doc(db, "invitaciones", token), { usado: true });
    setEstado("completado");
    setTimeout(() => router.push("/fichar"), 2000);
  };

  const registroEmail = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!invitacion) return;
    setLoading(true); setErrMsg("");
    try {
      const { user } = await createUserWithEmailAndPassword(auth, invitacion.emailEmpleado, password);
      await updateProfile(user, { displayName: invitacion.nombreEmpleado });
      await completarRegistro(user.uid);
    } catch {
      setErrMsg("Error al crear la cuenta. Puede que el email ya esté registrado.");
    } finally { setLoading(false); }
  };

  const registroGoogle = async () => {
    setLoading(true); setErrMsg("");
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      await completarRegistro(user.uid);
    } catch {
      setErrMsg("Error al iniciar sesión con Google.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B2E4B] to-[#243d62] flex flex-col items-center justify-center px-4 py-12">
      <Image src="/logo.png" alt="Fichelo" width={140} height={48} className="h-12 w-auto mb-8 brightness-200" />

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">

        {estado === "cargando" && (
          <div className="py-8"><div className="w-10 h-10 border-4 border-[#2ECC8F] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        )}

        {estado === "error" && (
          <>
            <p className="text-4xl mb-4">❌</p>
            <h2 className="text-xl font-bold text-[#1B2E4B] mb-2">Invitación no válida</h2>
            <p className="text-gray-500 text-sm">Este enlace no existe. Pide a tu empresa que te reenvíe la invitación.</p>
          </>
        )}

        {estado === "usada" && (
          <>
            <p className="text-4xl mb-4">✅</p>
            <h2 className="text-xl font-bold text-[#1B2E4B] mb-2">Invitación ya usada</h2>
            <p className="text-gray-500 text-sm mb-4">Ya te registraste con esta invitación.</p>
            <Link href="/fichar" className="bg-[#2ECC8F] text-white px-6 py-3 rounded-xl font-bold text-sm">Ir a fichar</Link>
          </>
        )}

        {estado === "expirada" && (
          <>
            <p className="text-4xl mb-4">⏰</p>
            <h2 className="text-xl font-bold text-[#1B2E4B] mb-2">Invitación caducada</h2>
            <p className="text-gray-500 text-sm">Han pasado más de 7 días. Pide a tu empresa que te reenvíe la invitación.</p>
          </>
        )}

        {estado === "completado" && (
          <>
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-xl font-bold text-[#1B2E4B] mb-2">¡Ya eres parte del equipo!</h2>
            <p className="text-gray-500 text-sm">Redirigiendo a la página de fichaje...</p>
            <div className="w-8 h-8 border-4 border-[#2ECC8F] border-t-transparent rounded-full animate-spin mx-auto mt-4" />
          </>
        )}

        {estado === "valida" && invitacion && (
          <>
            <div className="w-16 h-16 bg-[#2ECC8F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h2 className="text-xl font-bold text-[#1B2E4B] mb-1">¡Hola, {invitacion.nombreEmpleado.split(" ")[0]}!</h2>
            <p className="text-gray-500 text-sm mb-6">
              <strong className="text-[#1B2E4B]">{invitacion.empresaNombre}</strong> te ha invitado a fichar con Fichelo
            </p>

            <button onClick={registroGoogle} disabled={loading}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all mb-4">
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
              Unirme con Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" /><span className="text-gray-400 text-xs">o crea una contraseña</span><div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={registroEmail} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input value={invitacion.emailEmpleado} readOnly
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F]" />
              </div>
              {errMsg && <p className="text-red-500 text-xs">{errMsg}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-[#2ECC8F] hover:bg-[#25a872] text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60">
                {loading ? "Creando cuenta..." : "Crear cuenta y unirme"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
