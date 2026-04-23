"use client";
import { useState, useEffect, Suspense } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { googleProvider } from "@/lib/firebase";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, CheckCircle, XCircle, Clock, Navigation } from "lucide-react";

const RADIO_METROS = 200;

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DEMO_EMPLEADO = { nombre: "Carlos García", empresaId: "demo", empresaLat: 40.4168, empresaLng: -3.7038 };

function FicharContent() {
  const [estado, setEstado]           = useState<"idle" | "localizando" | "ok" | "fuera" | "error">("idle");
  const [mensaje, setMensaje]         = useState("");
  const [coords, setCoords]           = useState<{ lat: number; lng: number } | null>(null);
  const [ultimoFichaje, setUltimoFichaje] = useState<string | null>(null);
  const [empleado, setEmpleado]       = useState<{ nombre: string; empresaId: string; empresaLat?: number; empresaLng?: number } | null>(null);
  const [esDemo, setEsDemo]           = useState(false);
  const [inicializado, setInicializado] = useState(false);
  const [autenticado, setAutenticado] = useState(false);

  // Login inline
  const [loginEmail, setLoginEmail]   = useState("");
  const [loginPass, setLoginPass]     = useState("");
  const [loginError, setLoginError]   = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const searchParams = useSearchParams();
  const demoParam    = searchParams.get("demo");

  useEffect(() => {
    if (demoParam === "1") {
      setEsDemo(true);
      setAutenticado(true);
      setInicializado(true);
      setEmpleado(DEMO_EMPLEADO);
      setUltimoFichaje("Último fichaje: entrada hace 4 horas");
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setInicializado(true);
      if (!user) { setAutenticado(false); return; }
      setAutenticado(true);

      try {
        const empleadoDoc = await getDoc(doc(db, "empleados", user.uid));
        if (!empleadoDoc.exists()) {
          setMensaje("No tienes acceso como empleado. Contacta con tu empresa.");
          return;
        }
        const data = empleadoDoc.data();
        const empresaDoc = await getDoc(doc(db, "empresas", data.empresaId));
        const emp = empresaDoc.data();
        setEmpleado({ nombre: data.nombre, empresaId: data.empresaId, empresaLat: emp?.lat, empresaLng: emp?.lng });

        const snap = await getDocs(query(collection(db, "fichajes"), where("empleadoId", "==", user.uid), orderBy("hora", "desc"), limit(1)));
        if (!snap.empty) {
          const uf = snap.docs[0].data();
          const hora = uf.hora.toDate().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
          setUltimoFichaje(`Último fichaje: ${uf.tipo} a las ${hora}`);
        }
      } catch {
        setMensaje("Error al cargar tus datos. Inténtalo de nuevo.");
      }
    });
    return () => unsub();
  }, [demoParam]);

  const loginConEmail = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPass);
    } catch {
      setLoginError("Email o contraseña incorrectos.");
    } finally { setLoginLoading(false); }
  };

  const loginConGoogle = async () => {
    setLoginLoading(true); setLoginError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setLoginError("No se pudo iniciar sesión con Google.");
    } finally { setLoginLoading(false); }
  };

  const fichar = async (tipo: "entrada" | "salida") => {
    setEstado("localizando");
    setCoords(null);
    setMensaje("Obteniendo tu ubicación GPS...");

    if (esDemo) {
      await new Promise((r) => setTimeout(r, 1500));
      const lat = DEMO_EMPLEADO.empresaLat + (Math.random() - 0.5) * 0.002;
      const lng = DEMO_EMPLEADO.empresaLng + (Math.random() - 0.5) * 0.002;
      const dist = calcularDistancia(lat, lng, DEMO_EMPLEADO.empresaLat, DEMO_EMPLEADO.empresaLng);
      const dentro = dist <= RADIO_METROS;
      setCoords({ lat, lng });
      setEstado(dentro ? "ok" : "fuera");
      setMensaje(dentro ? `¡${tipo === "entrada" ? "Entrada" : "Salida"} registrada!` : "Fichaje registrado fuera de la zona.");
      setUltimoFichaje(`Último fichaje: ${tipo} ahora`);
      return;
    }

    if (!navigator.geolocation) { setEstado("error"); setMensaje("Tu dispositivo no soporta geolocalización."); return; }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        const user = auth.currentUser;
        if (!user || !empleado) return;

        let dentro = true;
        if (empleado.empresaLat && empleado.empresaLng) {
          dentro = calcularDistancia(lat, lng, empleado.empresaLat, empleado.empresaLng) <= RADIO_METROS;
        }

        const now = Timestamp.now();
        await addDoc(collection(db, "fichajes"), {
          empleadoId: user.uid, empleadoNombre: empleado.nombre,
          empresaId: empleado.empresaId, tipo, hora: now, lat, lng, dentro,
        });

        fetch("/api/email/fichaje", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ empresaId: empleado.empresaId, empleadoNombre: empleado.nombre, tipo, hora: now.toDate().toISOString(), lat, lng, dentro }),
        });

        setEstado(dentro ? "ok" : "fuera");
        setMensaje(dentro ? `¡${tipo === "entrada" ? "Entrada" : "Salida"} registrada correctamente!` : "Fichaje registrado pero estás fuera de la zona.");
        setUltimoFichaje(`Último fichaje: ${tipo} ahora`);
      },
      () => { setEstado("error"); setMensaje("No se pudo obtener tu ubicación. Activa el GPS."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Pantalla de carga inicial
  if (!inicializado) return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B2E4B] to-[#243d62] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#2ECC8F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Login inline si no está autenticado
  if (!autenticado) return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B2E4B] to-[#243d62] flex flex-col items-center justify-center px-4 py-8">
      <Image src="/logo.png" alt="Fichelo" width={140} height={48} className="h-12 w-auto mb-8 brightness-200" />
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
        <h1 className="text-xl font-bold text-[#1B2E4B] mb-1 text-center">Accede para fichar</h1>
        <p className="text-gray-400 text-sm mb-6 text-center">Solo tienes que entrar una vez en este móvil</p>

        <button onClick={loginConGoogle} disabled={loginLoading}
          className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-all mb-4">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
          Entrar con Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" /><span className="text-gray-400 text-xs">o con email</span><div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={loginConEmail} className="space-y-3">
          <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required
            placeholder="tu@email.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F] transition-colors" />
          <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} required
            placeholder="Contraseña"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F] transition-colors" />
          {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
          <button type="submit" disabled={loginLoading}
            className="w-full bg-[#2ECC8F] hover:bg-[#25a872] text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60">
            {loginLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );

  // Pantalla principal de fichaje
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B2E4B] to-[#243d62] flex flex-col">
      {esDemo && (
        <div className="bg-amber-400 text-amber-900 text-center text-sm py-2 font-semibold">
          Modo demo — GPS simulado ·{" "}
          <Link href="/registro" className="underline">Crear cuenta real</Link>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <Image src="/logo.png" alt="Fichelo" width={140} height={48} className="h-12 w-auto mb-8 brightness-200" />

        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
          <h1 className="text-xl font-bold text-[#1B2E4B] mb-1">
            {empleado ? `Hola, ${empleado.nombre.split(" ")[0]}` : "Cargando..."}
          </h1>
          <p className="text-gray-400 text-sm mb-6">Registra tu entrada o salida</p>

          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${
            estado === "ok" ? "bg-[#2ECC8F]/10" :
            estado === "fuera" || estado === "error" ? "bg-red-50" :
            estado === "localizando" ? "bg-blue-50" : "bg-[#1B2E4B]/5"
          }`}>
            {estado === "idle"        && <MapPin size={40} className="text-[#2ECC8F]" />}
            {estado === "localizando" && <Navigation size={36} className="text-blue-400 animate-pulse" />}
            {estado === "ok"          && <CheckCircle size={48} className="text-[#2ECC8F]" />}
            {(estado === "fuera" || estado === "error") && <XCircle size={48} className="text-red-400" />}
          </div>

          {mensaje && (
            <p className={`text-sm font-medium mb-3 ${
              estado === "ok" ? "text-[#2ECC8F]" :
              estado === "fuera" || estado === "error" ? "text-red-400" : "text-gray-500"
            }`}>{mensaje}</p>
          )}

          {coords && (
            <a href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-[#2ECC8F] transition-colors mb-4 bg-gray-50 rounded-xl py-2 px-3">
              <MapPin size={12} />
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} · Ver en Maps
            </a>
          )}

          {(estado === "idle" || estado === "ok" || estado === "fuera") && empleado && (
            <div className="flex gap-3 mt-2">
              <button onClick={() => fichar("entrada")}
                className="flex-1 bg-[#2ECC8F] hover:bg-[#25a872] text-white py-4 rounded-2xl font-bold transition-colors text-sm">
                ✅ Entrada
              </button>
              <button onClick={() => fichar("salida")}
                className="flex-1 bg-[#1B2E4B] hover:bg-[#243d62] text-white py-4 rounded-2xl font-bold transition-colors text-sm">
                🚪 Salida
              </button>
            </div>
          )}

          {ultimoFichaje && (
            <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-4">
              <Clock size={11} />{ultimoFichaje}
            </div>
          )}

          {!esDemo && (
            <button onClick={() => auth.signOut()} className="mt-4 text-xs text-gray-300 hover:text-gray-400 transition-colors">
              Cerrar sesión
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
          {[
            { icon: "📍", label: "GPS verificado", sub: "Precisión alta" },
            { icon: "🔒", label: "100% seguro", sub: "Datos cifrados" },
            { icon: "⚡", label: "Instantáneo", sub: "En segundos" },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 rounded-2xl p-3 text-center">
              <p className="text-xl mb-1">{item.icon}</p>
              <p className="text-white text-xs font-semibold">{item.label}</p>
              <p className="text-gray-400 text-xs">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FicharPage() {
  return <Suspense><FicharContent /></Suspense>;
}
