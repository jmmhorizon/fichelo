"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

function RegistroForm() {
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "basico";

  const guardarEmpresa = async (uid: string, nombreUsuario: string, emailUsuario: string) => {
    await setDoc(doc(db, "empresas", uid), {
      nombre: empresa || nombreUsuario,
      email: emailUsuario,
      telefono,
      plan,
      creadoEn: new Date().toISOString(),
      empleados: [],
    });
  };

  const registroEmail = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!telefono.trim()) { setError("El teléfono es obligatorio"); return; }
    setLoading(true);
    setError("");
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: nombre });
      await guardarEmpresa(user.uid, nombre, email);
      router.push("/checkout?plan=" + plan);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("email-already-in-use")) {
        setError("Ya existe una cuenta con este email");
      } else {
        setError("Error al crear la cuenta. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const registroGoogle = async () => {
    if (!telefono.trim()) { setError("Introduce tu teléfono antes de continuar"); return; }
    setLoading(true);
    setError("");
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      await guardarEmpresa(user.uid, user.displayName || "", user.email || "");
      router.push("/checkout?plan=" + plan);
    } catch {
      setError("Error al registrarse con Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="Fichelo" width={130} height={44} className="h-11 w-auto mx-auto mb-6" />
          </Link>
          <h1 className="text-2xl font-bold text-[#1B2E4B]">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">
            Plan <span className="font-semibold text-[#2ECC8F] capitalize">{plan}</span> · 7 días gratis
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-red-400">*</span></label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F] transition-colors"
            placeholder="+34 600 000 000"
          />
        </div>

        <button
          onClick={registroGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all mb-6"
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
          Continuar con Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">o</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={registroEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F] transition-colors"
              placeholder="Juan García" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu empresa</label>
            <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F] transition-colors"
              placeholder="Mi Empresa S.L." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F] transition-colors"
              placeholder="tu@empresa.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F] transition-colors"
              placeholder="Mínimo 6 caracteres" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#2ECC8F] hover:bg-[#25a872] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-60">
            {loading ? "Creando cuenta..." : "Crear cuenta y continuar"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Al registrarte aceptas los{" "}
          <Link href="/terminos" className="underline">Términos de uso</Link> y la{" "}
          <Link href="/privacidad" className="underline">Política de privacidad</Link>
        </p>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[#2ECC8F] font-semibold hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}
