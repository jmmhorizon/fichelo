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
  activo: boolean;
  lat?: number;
  lng?: number;
  direccion?: string;
}

const PLANES: Record<string, { label: string; limite: number; precio: string; priceId: string }> = {
  basico:      { label: "Básico",      limite: 15,   precio: "19,90€/mes", priceId: "basico"      },
  pro:         { label: "Pro",         limite: 50,   precio: "39,90€/mes", priceId: "pro"         },
  empresarial: { label: "Empresarial", limite: 9999, precio: "89,90€/mes", priceId: "empresarial" },
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
  const esPro = u.planRequerido === "pro";
  const color = esPro ? "#2ECC8F" : "#7c3aed";
  const bgColor = esPro ? "bg-[#1B2E4B]" : "bg-purple-700";

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
        const [empresaDoc, fichajesSnap] = await Promise.all([
          getDoc(doc(db, "empresas", user.uid)),
          getDocs(query(
            collection(db, "fichajes"),
            where("empresaId", "==", user.uid),
            limit(200)
          )),
        ]);

        if (empresaDoc.exists()) setEmpresa(empresaDoc.data() as Empresa);

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

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Fichelo" width={160} height={52} className="h-12 w-auto" />
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
            { icon: <Users size={16} className="text-[#2ECC8F]" />, label: "Empleados", valor: `${empresa?.empleados?.length || 0}/${planInfo.limite === 9999 ? "∞" : planInfo.limite}` },
            { icon: <CheckCircle size={16} className="text-[#2ECC8F]" />, label: "Fichados hoy", valor: fichajes.filter((f) => f.tipo === "entrada").length },
            { icon: <XCircle size={16} className="text-red-300" />, label: "Sin fichar", valor: Math.max(0, (empresa?.empleados?.length || 0) - fichajes.filter((f) => f.tipo === "entrada").length) },
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
                "bg-white text-gray-300 cursor-not-allowed"
              }`}>
              {!t.disponible && <Lock size={12} />}{t.label}
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
                          className="text-xs text-gray-400 hover:text-[#2ECC8F] transition-colors underline hidden md:block">
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
                <Link href="/registro?plan=pro" className="flex items-center gap-2 text-sm border-2 border-gray-200 text-gray-400 px-4 py-2 rounded-full font-semibold hover:border-[#2ECC8F] hover:text-[#2ECC8F] transition-colors">
                  <Lock size={13} /> Exportar CSV — Solo Pro
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
                Empleados ({empresa?.empleados?.length || 0}/{planInfo.limite === 9999 ? "∞" : planInfo.limite})
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
            {(empresa?.empleados?.length || 0) === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users size={36} className="mx-auto mb-3 opacity-20" /><p>Aún no tienes empleados</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {empresa?.empleados?.map((e, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1B2E4B]/10 rounded-full flex items-center justify-center font-bold text-sm text-[#1B2E4B]">
                        {String(e).charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-[#1B2E4B] text-sm">{e}</p>
                    </div>
                    <span className="text-xs text-[#2ECC8F] font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> Activo
                    </span>
                  </div>
                ))}
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
                  <button className="flex items-center gap-1 text-sm bg-[#2ECC8F] hover:bg-[#25a872] text-white px-4 py-2 rounded-full font-semibold">
                    <Plus size={14} /> Nueva ausencia
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {empresa?.empleados?.slice(0, 3).map((e, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1B2E4B]/10 rounded-full flex items-center justify-center font-bold text-xs text-[#1B2E4B]">
                        {String(e).charAt(0)}
                      </div>
                      <p className="font-medium text-[#1B2E4B] text-sm">{e}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${i === 1 ? "bg-orange-50 text-orange-400" : "bg-[#2ECC8F]/10 text-[#2ECC8F]"}`}>
                      {i === 1 ? "Vacaciones 1-15 may" : "Sin ausencias"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {plan === "pro" && <UpsellBanner tipo="logo" />}
          </div>
        )}

        {/* CONFIGURACIÓN */}
        {tab === "configuracion" && !esDemo && (
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
                  <a
                    href={`https://www.google.com/maps?q=${resultadoBusqueda.lat},${resultadoBusqueda.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-[#2ECC8F] underline"
                  >
                    Verificar en Maps
                  </a>
                  <button
                    onClick={guardarDireccion}
                    className="ml-auto flex items-center gap-2 bg-[#2ECC8F] hover:bg-[#25a872] text-white px-5 py-2 rounded-xl font-bold text-sm transition-colors"
                  >
                    ✓ Guardar esta ubicación
                  </button>
                </div>
              </div>
            )}
          </div>
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
