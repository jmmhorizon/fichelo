"use client";
import { useEffect, useState, Suspense } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, Timestamp, doc, getDoc, getDocs, limit, updateDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Users, Clock, MapPin, LogOut, Plus, CheckCircle, XCircle, BarChart2, FileText, Calendar, Lock, Navigation, Settings } from "lucide-react";

interface Fichaje {
  id: string;
  empleadoNombre: string;
  tipo: "entrada" | "salida";
  hora: Timestamp;
  dentro: boolean;
}

interface Empresa {
  nombre: string;
  plan: string;
  empleados: string[];
  activo?: boolean;
  creadoEn?: string;
  lat?: number;
  lng?: number;
  direccion?: string;
  logoUrl?: string;
  nombrePersonalizado?: string;
  sector?: string;
  modoDesplazamiento?: boolean;
  ubicaciones?: Ubicacion[];
}

interface EmpleadoData {
  id: string;
  nombre: string;
  email: string;
  sector?: string;
  rol?: string;
}

interface Ubicacion {
  id: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
}

const PLANES: Record<string, { label: string; limite: number; precio: string; priceId: string }> = {
  basico:      { label: "Básico",      limite: 15,   precio: "19,90€/mes", priceId: "basico"      },
  pro:         { label: "Pro",         limite: 50,   precio: "39,90€/mes", priceId: "pro"         },
  empresarial: { label: "Empresarial", limite: 200, precio: "89,90€/mes", priceId: "empresarial" },
};

const UPSELL: Record<string, { titulo: string; descripcion: string; planRequerido: "pro" | "empresarial"; beneficios: string[] }> = {
  csv: {
    titulo: "Exportar informes en CSV y PDF",
    descripcion: "Descarga el historial completo de fichajes para analizar en Excel o Google Sheets.",
    planRequerido: "pro",
    beneficios: ["Historial ilimitado", "Exportar a CSV y PDF", "Informes mensuales automáticos"],
  },
  informes: {
    titulo: "Informes y estadísticas avanzadas",
    descripcion: "Analiza el rendimiento de tu equipo con informes detallados por empleado y mes.",
    planRequerido: "pro",
    beneficios: ["Resumen mensual por empleado", "Estadísticas de puntualidad", "Exportar informes"],
  },
  vacaciones: {
    titulo: "Gestión de vacaciones y ausencias",
    descripcion: "Controla las vacaciones, bajas y ausencias de todos tus empleados desde un solo lugar.",
    planRequerido: "pro",
    beneficios: ["Registro de vacaciones", "Control de ausencias", "Calendario del equipo"],
  },
  ubicaciones: {
    titulo: "Múltiples ubicaciones de trabajo",
    descripcion: "Configura varias sedes o puntos de fichaje para tu empresa.",
    planRequerido: "pro",
    beneficios: ["Sedes ilimitadas", "GPS por ubicación", "Panel unificado"],
  },
  logo: {
    titulo: "Logo personalizado de tu empresa",
    descripcion: "Muestra el logo de tu empresa en la app de fichaje de tus empleados.",
    planRequerido: "empresarial",
    beneficios: ["Marca personalizada", "App con tu logo", "Experiencia profesional"],
  },
  api: {
    titulo: "API e integraciones",
    descripcion: "Conecta Fichelo con tu software de RRHH, nóminas o ERP mediante nuestra API.",
    planRequerido: "empresarial",
    beneficios: ["API REST completa", "Webhooks en tiempo real", "Soporte técnico dedicado"],
  },
};

function UpsellBanner({ tipo }: { tipo: keyof typeof UPSELL }) {
  const u = UPSELL[tipo];
  const planDestino = PLANES[u.planRequerido];
  const color = "#7c3aed";
  const bgColor = "bg-purple-700";

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-dashed" style={{ borderColor: color }}>
      {/* Header impactante */}
      <div className={`${bgColor} px-8 py-5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Lock size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base">{u.titulo}</p>
            <p className="text-white/60 text-xs">Disponible en el plan {planDestino.label}</p>
          </div>
        </div>
        <span className="text-white font-extrabold text-2xl hidden md:block">
          {planDestino.precio.split("/")[0]}
          <span className="text-sm font-normal opacity-60">/mes</span>
        </span>
      </div>

      {/* Cuerpo */}
      <div className="bg-white px-8 py-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1">
          <p className="text-gray-500 text-sm mb-4">{u.descripcion}</p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {u.beneficios.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <CheckCircle size={15} style={{ color }} className="shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 min-w-[200px] text-center">
          <Link
            href={`/checkout?plan=${u.planRequerido}`}
            className="block text-white font-bold py-4 px-6 rounded-xl transition-all text-sm shadow-lg hover:shadow-xl hover:scale-105"
            style={{ backgroundColor: color }}
          >
            🚀 Activar Plan {planDestino.label} ahora
          </Link>
          <p className="text-xs text-gray-400">7 días gratis · Sin permanencia</p>
        </div>
      </div>
    </div>
  );
}

const ahora = Timestamp.now();
const hace1h = new Timestamp(ahora.seconds - 3600, 0);
const hace2h = new Timestamp(ahora.seconds - 7200, 0);
const hace3h = new Timestamp(ahora.seconds - 10800, 0);
const ayer   = new Timestamp(ahora.seconds - 86400, 0);
const hace2d = new Timestamp(ahora.seconds - 172800, 0);

const DEMO_FICHAJES: Fichaje[] = [
  { id: "1", empleadoNombre: "Carlos García",   tipo: "entrada", hora: hace3h, dentro: true  },
  { id: "2", empleadoNombre: "María López",     tipo: "entrada", hora: hace2h, dentro: true  },
  { id: "3", empleadoNombre: "Pedro Martínez",  tipo: "entrada", hora: hace1h, dentro: false },
  { id: "4", empleadoNombre: "Ana Fernández",   tipo: "entrada", hora: ahora,  dentro: true  },
  { id: "5", empleadoNombre: "Carlos García",   tipo: "salida",  hora: ahora,  dentro: true  },
];

const DEMO_HISTORIAL: Fichaje[] = [
  ...DEMO_FICHAJES,
  { id: "6",  empleadoNombre: "Carlos García",  tipo: "entrada", hora: ayer,   dentro: true  },
  { id: "7",  empleadoNombre: "María López",    tipo: "entrada", hora: ayer,   dentro: true  },
  { id: "8",  empleadoNombre: "Pedro Martínez", tipo: "salida",  hora: ayer,   dentro: true  },
  { id: "9",  empleadoNombre: "Ana Fernández",  tipo: "entrada", hora: hace2d, dentro: false },
  { id: "10", empleadoNombre: "Luis Sánchez",   tipo: "entrada", hora: hace2d, dentro: true  },
];

const DEMO_EMPRESAS: Record<string, Empresa> = {
  basico:      { nombre: "Taller Mecánico López",  plan: "basico",      empleados: ["Carlos García", "María López", "Pedro Martínez", "Ana Fernández"], activo: true },
  pro:         { nombre: "Distribuciones García",  plan: "pro",         empleados: ["Carlos García", "María López", "Pedro Martínez", "Ana Fernández", "Luis Sánchez", "Elena Torres", "Javier Ruiz"], activo: true },
  empresarial: { nombre: "Grupo Construcciones SA", plan: "empresarial", empleados: ["Carlos García", "María López", "Pedro Martínez", "Ana Fernández", "Luis Sánchez", "Elena Torres", "Javier Ruiz", "Carmen Díaz", "Roberto Gil", "Patricia Moreno"], activo: true },
};


const SECTORES_EMPRESA = [
  { value: "restaurante", label: "Hostelería / Restaurante", emoji: "🍽️" },
  { value: "limpieza",    label: "Limpieza",                 emoji: "🧹" },
  { value: "albanileria", label: "Albañilería / Reformas",   emoji: "🏗️" },
  { value: "tiendas",     label: "Tiendas / Supermercados",  emoji: "🛒" },
  { value: "oficina",     label: "Oficina / Administración", emoji: "💼" },
  { value: "otro",        label: "Otro sector",              emoji: "📋" },
];

function DashboardContent() {
  const [fichajes, setFichajes] = useState<Fichaje[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"hoy" | "historial" | "empleados" | "informes" | "vacaciones" | "configuracion">("hoy");
  const [historial, setHistorial] = useState<Fichaje[]>([]);
  const [esDemo, setEsDemo] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultadoBusqueda, setResultadoBusqueda] = useState<{ lat: number; lng: number; display: string } | null>(null);
  const [modalAusencia, setModalAusencia] = useState(false);
  const [ausenciaEmpleado, setAusenciaEmpleado] = useState("");
  const [ausenciaTipo, setAusenciaTipo] = useState("vacaciones");
  const [ausenciaDesde, setAusenciaDesde] = useState("");
  const [ausenciaHasta, setAusenciaHasta] = useState("");
  const [ausencias, setAusencias] = useState<{ empleado: string; tipo: string; desde: string; hasta: string }[]>([]);
  const [empleadosData, setEmpleadosData] = useState<EmpleadoData[]>([]);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [nombreEmpresaEdit, setNombreEmpresaEdit] = useState("");
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [sectorEmpresa, setSectorEmpresa] = useState("otro");
  const [guardandoSector, setGuardandoSector] = useState(false);
  const [modoDesplazamiento, setModoDesplazamiento] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [nuevoNombreUbic, setNuevoNombreUbic] = useState("");
  const [nuevaDireccionUbic, setNuevaDireccionUbic] = useState("");
  const [buscandoUbic, setBuscandoUbic] = useState(false);
  const [resultadoUbic, setResultadoUbic] = useState<{ lat: number; lng: number; display: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo");

  useEffect(() => {
    if (demoParam && DEMO_EMPRESAS[demoParam]) {
      setEmpresa(DEMO_EMPRESAS[demoParam]);
      setFichajes(DEMO_FICHAJES);
      setHistorial(DEMO_HISTORIAL);
      setEsDemo(true);
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      try {
        const [empresaDoc, fichajesSnap, empleadosRes] = await Promise.all([
          getDoc(doc(db, "empresas", user.uid)),
          getDocs(query(collection(db, "fichajes"), where("empresaId", "==", user.uid), limit(200))),
          fetch(`/api/empresa/empleados?empresaId=${user.uid}`),
        ]);

        if (empresaDoc.exists()) {
          const emp = empresaDoc.data() as Empresa;
          setEmpresa(emp);
          setLogoUrl(emp.logoUrl ?? "");
          setNombreEmpresaEdit(emp.nombrePersonalizado ?? emp.nombre ?? "");
          setSectorEmpresa(emp.sector ?? "otro");
          setModoDesplazamiento(emp.modoDesplazamiento ?? false);
          setUbicaciones(emp.ubicaciones ?? []);
          if (!emp.activo) {
            const created = emp.creadoEn ? new Date(emp.creadoEn) : null;
            const days = created
              ? Math.max(0, 7 - Math.floor((Date.now() - created.getTime()) / 86400000))
              : 7;
            setTrialDaysLeft(days);
          }
        }
        if (empleadosRes.ok) {
          const empleadosJson = await empleadosRes.json() as EmpleadoData[];
          setEmpleadosData(empleadosJson);
        }

        const todos = fichajesSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Fichaje))
          .sort((a, b) => b.hora.seconds - a.hora.seconds);

        const hoyTs = new Date(); hoyTs.setHours(0, 0, 0, 0);
        const hace30Ts = new Date(Date.now() - 30 * 86400 * 1000);

        setFichajes(todos.filter((f) => f.hora.toDate() >= hoyTs));
        setHistorial(todos.filter((f) => f.hora.toDate() >= hace30Ts));
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router, demoParam]);

  const logout = () => { auth.signOut(); router.push("/"); };
  const plan = empresa?.plan || "basico";
  const planInfo = PLANES[plan] || PLANES.basico;
  const esPro = plan === "pro" || plan === "empresarial";

  const formatHora  = (ts: Timestamp) => ts.toDate().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const formatFecha = (ts: Timestamp) => ts.toDate().toLocaleDateString("es-ES", { day: "2-digit", month: "short" });

  const buscarDireccion = async () => {
    if (!direccion.trim()) return;
    setBuscando(true);
    setResultadoBusqueda(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(direccion)}&format=json&limit=1`,
        { headers: { "User-Agent": "Fichelo/1.0 (fichelo.es)" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        setResultadoBusqueda({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name });
      } else {
        alert("No se encontró esa dirección. Añade la ciudad o el código postal.");
      }
    } catch {
      alert("Error al buscar la dirección. Comprueba tu conexión.");
    } finally {
      setBuscando(false);
    }
  };

  const guardarDireccion = async () => {
    if (!resultadoBusqueda) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const { lat, lng } = resultadoBusqueda;
    await updateDoc(doc(db, "empresas", uid), { lat, lng, direccion });
    setEmpresa((prev) => prev ? { ...prev, lat, lng, direccion } : prev);
    setResultadoBusqueda(null);
  };

  const buscarDireccionUbic = async () => {
    if (!nuevaDireccionUbic.trim()) return;
    setBuscandoUbic(true); setResultadoUbic(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nuevaDireccionUbic)}&format=json&limit=1`,
        { headers: { "User-Agent": "Fichelo/1.0 (fichelo.es)" } }
      );
      const data = await res.json();
      if (data.length > 0) setResultadoUbic({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name });
      else alert("No se encontró esa dirección. Añade la ciudad.");
    } catch { alert("Error al buscar la dirección."); }
    finally { setBuscandoUbic(false); }
  };

  const agregarUbicacion = async () => {
    if (!resultadoUbic || !nuevoNombreUbic.trim()) return;
    const uid = auth.currentUser?.uid; if (!uid) return;
    const nueva: Ubicacion = { id: Date.now().toString(), nombre: nuevoNombreUbic.trim(), direccion: resultadoUbic.display.slice(0, 100), lat: resultadoUbic.lat, lng: resultadoUbic.lng };
    const nuevas = [...ubicaciones, nueva];
    await updateDoc(doc(db, "empresas", uid), { ubicaciones: nuevas });
    setUbicaciones(nuevas); setNuevoNombreUbic(""); setNuevaDireccionUbic(""); setResultadoUbic(null);
  };

  const eliminarUbicacion = async (id: string) => {
    const uid = auth.currentUser?.uid; if (!uid) return;
    const nuevas = ubicaciones.filter((u) => u.id !== id);
    await updateDoc(doc(db, "empresas", uid), { ubicaciones: nuevas });
    setUbicaciones(nuevas);
  };

  const toggleModoDesplazamiento = async () => {
    const uid = auth.currentUser?.uid; if (!uid) return;
    const nuevo = !modoDesplazamiento;
    await updateDoc(doc(db, "empresas", uid), { modoDesplazamiento: nuevo });
    setModoDesplazamiento(nuevo);
  };

  const exportarCSV = () => {
    const csv = ["Empleado,Tipo,Fecha y hora,Ubicación",
      ...historial.map((f) => `${f.empleadoNombre},${f.tipo},${f.hora.toDate().toLocaleString("es-ES")},${f.dentro ? "En ubicación" : "Fuera"}`)
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "fichajes.csv"; a.click();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#2ECC8F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tabs = [
    { id: "hoy",           label: "Hoy",            disponible: true  },
    { id: "historial",     label: "Historial",      disponible: true  },
    { id: "empleados",     label: "Empleados",      disponible: true  },
    { id: "informes",      label: "Informes",       disponible: esPro },
    { id: "vacaciones",    label: "Vacaciones",     disponible: esPro },
    { id: "configuracion", label: "Configuración",  disponible: true  },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner demo */}
      {esDemo && (
        <div className="bg-amber-400 text-amber-900 text-center text-sm py-2 font-semibold">
          Modo demo — Plan {planInfo.label} · Datos de ejemplo · {" "}
          <Link href="/registro" className="underline">Crear cuenta real</Link>
        </div>
      )}

      {/* Banner trial activo */}
      {!esDemo && trialDaysLeft !== null && trialDaysLeft > 0 && (
        <div className="bg-amber-400 text-amber-900 text-center text-sm py-2 font-semibold">
          Período de prueba — te quedan <strong>{trialDaysLeft} día{trialDaysLeft !== 1 ? "s" : ""}</strong> gratis ·{" "}
          <Link href={`/checkout?plan=${plan}`} className="underline">Activar plan ahora</Link>
        </div>
      )}

      {/* Overlay trial expirado */}
      {!esDemo && trialDaysLeft === 0 && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-[#1B2E4B] mb-2">Tu prueba gratuita ha terminado</h2>
            <p className="text-gray-500 text-sm mb-6">
              Activa tu plan para seguir usando Fichelo y no perder tus datos.
            </p>
            <Link
              href={`/checkout?plan=${plan}`}
              className="block bg-[#2ECC8F] hover:bg-[#25a872] text-white font-bold py-4 rounded-xl transition-colors text-sm mb-3"
            >
              Activar plan {planInfo.label} — {planInfo.precio}
            </Link>
            <button
              onClick={logout}
              className="text-gray-400 text-xs hover:text-gray-600 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {plan === "empresarial" && logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo empresa" className="h-12 w-auto object-contain max-w-[160px]" />
          ) : (
            <Image src="/logo.png" alt="Fichelo" width={160} height={52} className="h-12 w-auto" />
          )}
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            plan === "empresarial" ? "bg-purple-50 text-purple-500" :
            plan === "pro" ? "bg-[#2ECC8F]/10 text-[#2ECC8F]" : "bg-gray-100 text-gray-500"
          }`}>{planInfo.label}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden md:block">{empresa?.nombre}</span>
          {!esDemo && (
            <button onClick={logout} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm">
              <LogOut size={15} /> Salir
            </button>
          )}
          {esDemo && (
            <div className="flex gap-2 text-xs">
              {["basico", "pro", "empresarial"].map((p) => (
                <Link key={p} href={`/dashboard?demo=${p}`}
                  className={`px-3 py-1 rounded-full font-semibold capitalize transition-colors ${plan === p ? "bg-[#1B2E4B] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {PLANES[p].label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Users size={16} className="text-[#2ECC8F]" />, label: "Empleados", valor: `${esDemo ? (empresa?.empleados?.length ?? 0) : empleadosData.length}/${planInfo.limite}` },
            { icon: <CheckCircle size={16} className="text-[#2ECC8F]" />, label: "Fichados hoy", valor: fichajes.filter((f) => f.tipo === "entrada").length },
            { icon: <XCircle size={16} className="text-red-300" />, label: "Sin fichar", valor: Math.max(0, (esDemo ? (empresa?.empleados?.length ?? 0) : empleadosData.length) - fichajes.filter((f) => f.tipo === "entrada").length) },
            { icon: <MapPin size={16} className="text-[#2ECC8F]" />, label: "Fuera ubicación", valor: fichajes.filter((f) => !f.dentro).length },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-gray-400 text-xs">{s.label}</span></div>
              <p className="text-3xl font-bold text-[#1B2E4B]">{s.valor}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => t.disponible && setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === t.id ? "bg-[#1B2E4B] text-white" :
                t.disponible ? "bg-white text-gray-500 hover:bg-gray-100" :
                "bg-purple-50 text-purple-500 border border-purple-200 cursor-not-allowed hover:bg-purple-100"
              }`}>
              {!t.disponible && <Lock size={12} className="text-purple-400" />}
              {t.label}
              {!t.disponible && <span className="ml-1 text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-bold">PRO</span>}
            </button>
          ))}
        </div>

        {/* HOY */}
        {tab === "hoy" && (
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-[#1B2E4B]">Fichajes de hoy en tiempo real</h2>
              <span className="flex items-center gap-1 text-xs text-[#2ECC8F] font-semibold">
                <span className="w-2 h-2 bg-[#2ECC8F] rounded-full animate-pulse" /> En vivo
              </span>
            </div>
            {fichajes.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Clock size={36} className="mx-auto mb-3 opacity-20" /><p>Aún no hay fichajes hoy</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {fichajes.map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${f.tipo === "entrada" ? "bg-[#2ECC8F]/10 text-[#2ECC8F]" : "bg-orange-50 text-orange-400"}`}>
                        {f.empleadoNombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#1B2E4B] text-sm">{f.empleadoNombre}</p>
                        <p className="text-xs text-gray-400 capitalize">{f.tipo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 flex items-center gap-1"><Clock size={13} />{formatHora(f.hora)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${f.dentro ? "bg-[#2ECC8F]/10 text-[#2ECC8F]" : "bg-red-50 text-red-400"}`}>
                        <MapPin size={11} />{f.dentro ? "En ubicación" : "Fuera"}
                      </span>
                      {"lat" in f && (f as Fichaje & { lat?: number; lng?: number }).lat ? (
                        <a href={`https://www.google.com/maps?q=${(f as Fichaje & { lat?: number }).lat},${(f as Fichaje & { lng?: number }).lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-[#2ECC8F] transition-colors underline">
                          Ver mapa
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORIAL */}
        {tab === "historial" && (
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-[#1B2E4B]">Historial {esPro ? "completo" : "últimos 30 días"}</h2>
              {esPro ? (
                <button onClick={exportarCSV} className="flex items-center gap-2 text-sm bg-[#2ECC8F] hover:bg-[#25a872] text-white px-4 py-2 rounded-full font-semibold">
                  <FileText size={14} /> Exportar CSV
                </button>
              ) : (
                <Link href="/checkout?plan=pro" className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-semibold transition-colors shadow-sm">
                  <Lock size={13} /> Exportar CSV · Activar Pro
                </Link>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {historial.map((f) => (
                <div key={f.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${f.tipo === "entrada" ? "bg-[#2ECC8F]/10 text-[#2ECC8F]" : "bg-orange-50 text-orange-400"}`}>
                      {f.empleadoNombre.charAt(0)}
                    </div>
                    <p className="font-medium text-[#1B2E4B] text-sm">{f.empleadoNombre}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="capitalize">{f.tipo}</span>
                    <span>{formatFecha(f.hora)} {formatHora(f.hora)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${f.dentro ? "bg-[#2ECC8F]/10 text-[#2ECC8F]" : "bg-red-50 text-red-400"}`}>
                      {f.dentro ? "OK" : "Fuera"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMPLEADOS */}
        {tab === "empleados" && (
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-[#1B2E4B]">
                Empleados ({esDemo ? (empresa?.empleados?.length ?? 0) : empleadosData.length}/{planInfo.limite})
              </h2>
              {!esDemo && (
                <div className="flex gap-2">
                  <Link href="/dashboard/turnos" className="flex items-center gap-1 text-sm border-2 border-[#1B2E4B] text-[#1B2E4B] hover:bg-[#1B2E4B] hover:text-white px-4 py-2 rounded-full font-semibold transition-colors">
                    <Calendar size={14} /> Turnos
                  </Link>
                  <Link href="/dashboard/empleados" className="flex items-center gap-1 text-sm bg-[#2ECC8F] hover:bg-[#25a872] text-white px-4 py-2 rounded-full font-semibold transition-colors">
                    <Plus size={14} /> Añadir empleado
                  </Link>
                </div>
              )}
            </div>
            {(esDemo ? (empresa?.empleados?.length ?? 0) : empleadosData.length) === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users size={36} className="mx-auto mb-3 opacity-20" /><p>Aún no tienes empleados</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {esDemo
                  ? empresa?.empleados?.map((nombre, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#1B2E4B]/10 rounded-full flex items-center justify-center font-bold text-sm text-[#1B2E4B]">
                            {String(nombre).charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium text-[#1B2E4B] text-sm">{nombre}</p>
                        </div>
                        <span className="text-xs text-[#2ECC8F] font-medium flex items-center gap-1">
                          <CheckCircle size={12} /> Activo
                        </span>
                      </div>
                    ))
                  : empleadosData.map((e) => (
                      <div key={e.id} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#1B2E4B]/10 rounded-full flex items-center justify-center font-bold text-sm text-[#1B2E4B]">
                            {e.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#1B2E4B] text-sm">{e.nombre}</p>
                            <p className="text-xs text-gray-400">{e.email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-[#2ECC8F] font-medium flex items-center gap-1">
                          <CheckCircle size={12} /> Activo
                        </span>
                      </div>
                    ))
                }
              </div>
            )}
          </div>
        )}

        {/* INFORMES */}
        {tab === "informes" && !esPro && <UpsellBanner tipo="informes" />}
        {tab === "informes" && esPro && (
          <div className="flex flex-col gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart2 size={20} className="text-[#2ECC8F]" />
                  <h3 className="font-bold text-[#1B2E4B]">Resumen del mes</h3>
                </div>
                <div className="space-y-4">
                  {[
                    ["Total fichajes", historial.length],
                    ["Entradas registradas", historial.filter((f) => f.tipo === "entrada").length],
                    ["Fuera de ubicación", historial.filter((f) => !f.dentro).length],
                    ["Empleados activos", empresa?.empleados?.length || 0],
                  ].map(([label, valor]) => (
                    <div key={String(label)} className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">{label}</span>
                      <span className="font-bold text-[#1B2E4B]">{valor}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText size={20} className="text-[#2ECC8F]" />
                  <h3 className="font-bold text-[#1B2E4B]">Exportar informe</h3>
                </div>
                <p className="text-gray-400 text-sm mb-6">Descarga el historial completo en CSV para abrir en Excel o Google Sheets.</p>
                <button onClick={exportarCSV} className="w-full bg-[#2ECC8F] hover:bg-[#25a872] text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                  Descargar CSV
                </button>
              </div>
            </div>
            {plan === "pro" && <UpsellBanner tipo="api" />}
          </div>
        )}

        {/* VACACIONES */}
        {tab === "vacaciones" && !esPro && <UpsellBanner tipo="vacaciones" />}
        {tab === "vacaciones" && esPro && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-[#2ECC8F]" />
                  <h3 className="font-bold text-[#1B2E4B]">Vacaciones y ausencias</h3>
                </div>
                {!esDemo && (
                  <button
                    onClick={() => { setAusenciaEmpleado(empleadosData[0]?.nombre ?? empresa?.empleados?.[0] ?? ""); setAusenciaDesde(""); setAusenciaHasta(""); setModalAusencia(true); }}
                    className="flex items-center gap-1 text-sm bg-[#2ECC8F] hover:bg-[#25a872] text-white px-4 py-2 rounded-full font-semibold transition-colors"
                  >
                    <Plus size={14} /> Nueva ausencia
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {ausencias.length === 0 && empleadosData.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-8">No hay empleados registrados aún.</p>
                )}
                {ausencias.length === 0 && empleadosData.length > 0 && (
                  <p className="text-gray-400 text-sm text-center py-8">No hay ausencias registradas. Pulsa &quot;Nueva ausencia&quot; para añadir.</p>
                )}
                {ausencias.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1B2E4B]/10 rounded-full flex items-center justify-center font-bold text-xs text-[#1B2E4B]">
                        {a.empleado.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-[#1B2E4B] text-sm">{a.empleado}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-orange-50 text-orange-400">
                      {a.tipo.charAt(0).toUpperCase() + a.tipo.slice(1)} {a.desde} – {a.hasta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {plan === "pro" && <UpsellBanner tipo="logo" />}
          </div>
        )}

        {/* MODAL NUEVA AUSENCIA */}
        {modalAusencia && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <h3 className="text-lg font-bold text-[#1B2E4B] mb-6">Nueva ausencia</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Empleado</label>
                  <select
                    value={ausenciaEmpleado}
                    onChange={(e) => setAusenciaEmpleado(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F]"
                  >
                    {(empleadosData.length > 0 ? empleadosData.map((e) => e.nombre) : (empresa?.empleados ?? [])).map((emp) => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                  <select
                    value={ausenciaTipo}
                    onChange={(e) => setAusenciaTipo(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F]"
                  >
                    <option value="vacaciones">Vacaciones</option>
                    <option value="baja">Baja médica</option>
                    <option value="ausencia">Ausencia justificada</option>
                    <option value="permiso">Permiso personal</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
                    <input type="date" value={ausenciaDesde} onChange={(e) => setAusenciaDesde(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
                    <input type="date" value={ausenciaHasta} onChange={(e) => setAusenciaHasta(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F]" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setModalAusencia(false)}
                  className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!ausenciaEmpleado || !ausenciaDesde || !ausenciaHasta) return;
                    setAusencias((prev) => [...prev, { empleado: ausenciaEmpleado, tipo: ausenciaTipo, desde: ausenciaDesde, hasta: ausenciaHasta }]);
                    setModalAusencia(false);
                  }}
                  className="flex-1 bg-[#2ECC8F] hover:bg-[#25a872] text-white py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURACIÓN */}
        {tab === "configuracion" && !esDemo && (
          <>
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-xl">
            <div className="flex items-center gap-3 mb-2">
              <Settings size={20} className="text-[#2ECC8F]" />
              <h2 className="font-bold text-[#1B2E4B]">Ubicación del centro de trabajo</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Define dónde está tu empresa. Los empleados solo podrán fichar dentro de un radio de 200 metros.
            </p>

            {/* Dirección actual guardada */}
            {empresa?.lat && empresa?.lng && (
              <div className="bg-[#2ECC8F]/10 border border-[#2ECC8F]/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                <MapPin size={20} className="text-[#2ECC8F] shrink-0" />
                <div>
                  <p className="font-semibold text-[#1B2E4B] text-sm">
                    {empresa.direccion || "Ubicación configurada"} ✓
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${empresa.lat},${empresa.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-[#2ECC8F] transition-colors"
                  >
                    Ver en Google Maps · radio 200 m
                  </a>
                </div>
              </div>
            )}
            {!empresa?.lat && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <MapPin size={20} className="text-amber-500 shrink-0" />
                <p className="text-amber-700 text-sm font-medium">
                  Sin ubicación configurada — los empleados fichan sin verificación GPS.
                </p>
              </div>
            )}

            {/* Buscador de dirección */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarDireccion()}
                placeholder="Calle Gran Vía 25, Madrid"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F] transition-colors"
              />
              <button
                onClick={buscarDireccion}
                disabled={buscando || !direccion.trim()}
                className="flex items-center gap-2 bg-[#1B2E4B] hover:bg-[#243d62] text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
              >
                <Navigation size={15} />
                {buscando ? "Buscando..." : "Buscar"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Incluye la ciudad para mayor precisión. Ej: «Calle Alcalá 10, Madrid»
            </p>

            {/* Resultado de la búsqueda */}
            {resultadoBusqueda && (
              <div className="border-2 border-[#2ECC8F] rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">Dirección encontrada:</p>
                <p className="text-sm font-medium text-[#1B2E4B] mb-3 leading-snug">{resultadoBusqueda.display}</p>
                <div className="flex gap-3">
                  <a href={`https://www.google.com/maps?q=${resultadoBusqueda.lat},${resultadoBusqueda.lng}`}
                    target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-[#2ECC8F] underline">
                    Verificar en Maps
                  </a>
                  <button onClick={guardarDireccion}
                    className="ml-auto flex items-center gap-2 bg-[#2ECC8F] hover:bg-[#25a872] text-white px-5 py-2 rounded-xl font-bold text-sm transition-colors">
                    ✓ Guardar esta ubicación
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tipo de negocio — Pro y Empresarial */}
          {esPro && <div className="bg-white rounded-2xl shadow-sm p-8 max-w-xl mt-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg">🏪</span>
              <h2 className="font-bold text-[#1B2E4B]">Tipo de negocio</h2>
            </div>
            <p className="text-gray-500 text-sm mb-5">
              Selecciona el sector de tu empresa. El calendario de turnos mostrará plantillas horarias adaptadas a tu negocio.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {SECTORES_EMPRESA.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSectorEmpresa(s.value)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    sectorEmpresa === s.value
                      ? "border-[#2ECC8F] bg-[#2ECC8F]/5"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-sm font-semibold text-[#1B2E4B] leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
            <button
              disabled={guardandoSector}
              onClick={async () => {
                const uid = auth.currentUser?.uid;
                if (!uid) return;
                setGuardandoSector(true);
                await updateDoc(doc(db, "empresas", uid), { sector: sectorEmpresa });
                setEmpresa((prev) => prev ? { ...prev, sector: sectorEmpresa } : prev);
                setGuardandoSector(false);
                alert("Sector guardado. Ahora el calendario de turnos usará las plantillas de " + (SECTORES_EMPRESA.find(s => s.value === sectorEmpresa)?.label ?? sectorEmpresa) + ".");
              }}
              className="w-full bg-[#1B2E4B] hover:bg-[#243d62] text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60"
            >
              {guardandoSector ? "Guardando..." : "Guardar tipo de negocio"}
            </button>
          </div>}

          {/* Modo desplazamiento */}
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-xl mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-lg">🚗</span>
                <h2 className="font-bold text-[#1B2E4B]">Modo desplazamiento</h2>
              </div>
              <button
                onClick={toggleModoDesplazamiento}
                className={`relative w-12 h-6 rounded-full transition-colors ${modoDesplazamiento ? "bg-[#2ECC8F]" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${modoDesplazamiento ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-5">
              Actívalo si tus empleados trabajan en distintas ubicaciones (limpieza, obras, visitas a clientes…).
              Cada empleado elige dónde trabaja al fichar y el GPS se verifica en ese sitio.
            </p>

            {modoDesplazamiento && (
              <>
                {/* Empleados que usarán este modo */}
                {empleadosData.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Empleados en modo desplazamiento</p>
                    <div className="flex flex-col gap-1">
                      {empleadosData.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                          <div className="w-7 h-7 bg-[#1B2E4B]/10 rounded-full flex items-center justify-center font-bold text-xs text-[#1B2E4B] shrink-0">
                            {e.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1B2E4B] truncate">{e.nombre}</p>
                            <p className="text-xs text-gray-400 truncate">{e.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de ubicaciones guardadas */}
                {ubicaciones.length > 0 && (
                  <div className="flex flex-col gap-2 mb-5">
                    {ubicaciones.map((u) => (
                      <div key={u.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin size={14} className="text-[#2ECC8F] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1B2E4B]">{u.nombre}</p>
                            <p className="text-xs text-gray-400 truncate">{u.direccion}</p>
                          </div>
                        </div>
                        <button onClick={() => eliminarUbicacion(u.id)} className="text-xs text-red-400 hover:text-red-500 ml-3 shrink-0">Eliminar</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulario para añadir nueva ubicación */}
                <div className={ubicaciones.length > 0 ? "border-t border-gray-100 pt-5" : ""}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Añadir ubicación de trabajo</p>
                  <input
                    type="text"
                    value={nuevoNombreUbic}
                    onChange={(e) => setNuevoNombreUbic(e.target.value)}
                    placeholder="Nombre del cliente o lugar (ej. Clínica Norte)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-2 focus:outline-none focus:border-[#2ECC8F] transition-colors"
                  />
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={nuevaDireccionUbic}
                      onChange={(e) => setNuevaDireccionUbic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && buscarDireccionUbic()}
                      placeholder="Dirección (ej. Calle Alcalá 10, Madrid)"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F] transition-colors"
                    />
                    <button
                      onClick={buscarDireccionUbic}
                      disabled={buscandoUbic || !nuevaDireccionUbic.trim()}
                      className="flex items-center gap-1 bg-[#1B2E4B] hover:bg-[#243d62] text-white px-4 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                    >
                      <Navigation size={14} />
                      {buscandoUbic ? "..." : "Buscar"}
                    </button>
                  </div>
                  {resultadoUbic && (
                    <div className="border-2 border-[#2ECC8F] rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">Dirección encontrada:</p>
                      <p className="text-sm font-medium text-[#1B2E4B] leading-snug mb-3">{resultadoUbic.display}</p>
                      <button
                        onClick={agregarUbicacion}
                        disabled={!nuevoNombreUbic.trim()}
                        className="w-full bg-[#2ECC8F] hover:bg-[#25a872] disabled:opacity-50 text-white py-2 rounded-xl text-sm font-bold transition-colors"
                      >
                        {nuevoNombreUbic.trim() ? `+ Guardar "${nuevoNombreUbic}"` : "Escribe un nombre para guardar"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Personalización empresarial */}
          {plan === "empresarial" && !esDemo && (
            <div className="bg-white rounded-2xl shadow-sm p-8 max-w-xl mt-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">🏢</span>
                <h2 className="font-bold text-[#1B2E4B]">Logo y nombre de empresa</h2>
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-semibold">Empresarial</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                Personaliza cómo ven tu empresa los empleados en la app de fichaje.
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre que verán los empleados</label>
                  <input
                    type="text"
                    value={nombreEmpresaEdit}
                    onChange={(e) => setNombreEmpresaEdit(e.target.value)}
                    placeholder={empresa?.nombre ?? "Nombre de empresa"}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Logo de la empresa</label>
                  {(logoPreview || logoUrl) && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoPreview || logoUrl}
                        alt="Logo"
                        className="h-12 w-auto object-contain rounded"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      <span className="text-xs text-gray-400">Vista previa</span>
                      {logoUrl && !logoPreview && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="ml-auto text-xs text-red-400 hover:text-red-500"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  )}
                  <label className="flex items-center gap-3 w-full border-2 border-dashed border-gray-200 hover:border-[#2ECC8F] rounded-xl px-4 py-5 cursor-pointer transition-colors group">
                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#2ECC8F]/10 rounded-xl flex items-center justify-center transition-colors shrink-0">
                      <span className="text-xl">📁</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1B2E4B]">
                        {logoFile ? logoFile.name : "Seleccionar imagen"}
                      </p>
                      <p className="text-xs text-gray-400">PNG, JPG, SVG o WebP · Máximo 2 MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { alert("La imagen no puede superar 2 MB"); return; }
                        setLogoFile(file);
                        setLogoPreview(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                </div>
                <button
                  disabled={guardandoConfig}
                  onClick={async () => {
                    const uid = auth.currentUser?.uid;
                    if (!uid) return;
                    setGuardandoConfig(true);
                    try {
                      let urlFinal = logoUrl;
                      if (logoFile) {
                        // Comprimir y convertir a base64 (máx ~200KB para no superar límite de Firestore)
                        urlFinal = await new Promise<string>((resolve, reject) => {
                          const img = new window.Image();
                          const objectUrl = URL.createObjectURL(logoFile);
                          img.onload = () => {
                            const MAX = 400;
                            const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
                            const canvas = document.createElement("canvas");
                            canvas.width  = Math.round(img.width  * ratio);
                            canvas.height = Math.round(img.height * ratio);
                            canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
                            URL.revokeObjectURL(objectUrl);
                            resolve(canvas.toDataURL("image/jpeg", 0.75));
                          };
                          img.onerror = reject;
                          img.src = objectUrl;
                        });
                        setLogoUrl(urlFinal);
                        setLogoFile(null);
                        setLogoPreview("");
                      }
                      await updateDoc(doc(db, "empresas", uid), {
                        nombrePersonalizado: nombreEmpresaEdit,
                        logoUrl: urlFinal,
                      });
                      setEmpresa((prev) => prev ? { ...prev, nombrePersonalizado: nombreEmpresaEdit, logoUrl: urlFinal } : prev);
                      alert("¡Cambios guardados!");
                    } catch (err) {
                      alert("Error al guardar: " + String(err));
                    } finally {
                      setGuardandoConfig(false);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60"
                >
                  {guardandoConfig ? "Subiendo y guardando..." : "Guardar personalización"}
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
