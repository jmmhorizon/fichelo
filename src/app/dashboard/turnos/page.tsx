"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Users } from "lucide-react";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Plantillas de turno por sector
const PLANTILLAS: Record<string, { label: string; inicio: string; fin: string }[]> = {
  restaurante: [
    { label: "Mañana",       inicio: "09:00", fin: "16:00" },
    { label: "Tarde",        inicio: "16:00", fin: "00:00" },
    { label: "Noche",        inicio: "22:00", fin: "06:00" },
    { label: "Partido am",   inicio: "12:00", fin: "16:00" },
    { label: "Partido pm",   inicio: "20:00", fin: "00:00" },
    { label: "Media jorn.",  inicio: "10:00", fin: "14:00" },
  ],
  limpieza: [
    { label: "Mañana",       inicio: "07:00", fin: "15:00" },
    { label: "Tarde",        inicio: "15:00", fin: "23:00" },
    { label: "Media mañana", inicio: "07:00", fin: "11:00" },
    { label: "Media tarde",  inicio: "15:00", fin: "19:00" },
    { label: "Jornada",      inicio: "08:00", fin: "16:00" },
  ],
  albanileria: [
    { label: "Jornada",      inicio: "08:00", fin: "17:00" },
    { label: "Mañana",       inicio: "07:00", fin: "14:00" },
    { label: "Tarde",        inicio: "14:00", fin: "21:00" },
    { label: "Intensiva",    inicio: "07:00", fin: "15:00" },
  ],
  tiendas: [
    { label: "Mañana",       inicio: "09:00", fin: "15:00" },
    { label: "Tarde",        inicio: "15:00", fin: "21:00" },
    { label: "Jornada",      inicio: "09:00", fin: "21:00" },
    { label: "Apertura",     inicio: "08:00", fin: "14:00" },
    { label: "Cierre",       inicio: "16:00", fin: "22:00" },
    { label: "Media",        inicio: "10:00", fin: "14:00" },
  ],
  oficina: [
    { label: "Jornada",      inicio: "09:00", fin: "18:00" },
    { label: "Media mañana", inicio: "09:00", fin: "14:00" },
    { label: "Media tarde",  inicio: "14:00", fin: "18:00" },
    { label: "Intensiva",    inicio: "08:00", fin: "15:00" },
    { label: "Flexible",     inicio: "07:00", fin: "15:00" },
  ],
  otro: [
    { label: "Mañana",       inicio: "09:00", fin: "14:00" },
    { label: "Tarde",        inicio: "14:00", fin: "21:00" },
    { label: "Jornada",      inicio: "09:00", fin: "18:00" },
  ],
};

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

interface Empleado { id: string; nombre: string; email: string; sector?: string; rol?: string; empresaNombre?: string; }
interface Turno { inicio?: string; fin?: string; libre?: boolean; }
type Semana = Record<string, Turno>;

const SECTOR_LABELS: Record<string, string> = {
  restaurante: "Hostelería",
  limpieza:    "Limpieza",
  albanileria: "Albañilería",
  tiendas:     "Tiendas",
  oficina:     "Oficina",
};

export default function TurnosPage() {
  const [empleados, setEmpleados]         = useState<Empleado[]>([]);
  const [lunes, setLunes]                 = useState<Date>(getMonday(new Date()));
  const [turnos, setTurnos]               = useState<Semana>({});
  const [loading, setLoading]             = useState(true);
  const [uid, setUid]                     = useState("");
  const [editando, setEditando]           = useState<string | null>(null);
  const [inputInicio, setInputInicio]     = useState("09:00");
  const [inputFin, setInputFin]           = useState("17:00");
  const [empresaSector, setEmpresaSector] = useState("otro");
  const [empresaNombre, setEmpresaNombre] = useState("");
  const [filtro, setFiltro]               = useState<"asignado" | "libre" | "vacio" | null>(null);
  const router = useRouter();

  const semanaKey = `${lunes.getFullYear()}W${String(getWeekNumber(lunes)).padStart(2, "0")}`;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);
      try {
        const [snap, empDoc] = await Promise.all([
          getDocs(query(collection(db, "empleados"), where("empresaId", "==", user.uid))),
          getDoc(doc(db, "empresas", user.uid)),
        ]);
        setEmpleados(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empleado)));
        if (empDoc.exists()) {
          const d = empDoc.data() as { sector?: string; nombre?: string; nombrePersonalizado?: string };
          setEmpresaSector(d.sector ?? "otro");
          setEmpresaNombre(d.nombrePersonalizado ?? d.nombre ?? "");
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "turnos", `${uid}_${semanaKey}`)).then((snap) => {
      setTurnos(snap.exists() ? (snap.data() as Semana) : {});
    });
  }, [uid, semanaKey]);

  const guardarTurno = async (clave: string, turno: Turno | null, emp?: Empleado, dayIdx?: number) => {
    const nuevos = { ...turnos };
    if (turno === null) delete nuevos[clave];
    else nuevos[clave] = turno;
    setTurnos(nuevos);
    await setDoc(doc(db, "turnos", `${uid}_${semanaKey}`), nuevos);
    setEditando(null);

    // Programar recordatorio si hay hora de inicio y tenemos datos del empleado
    if (turno?.inicio && emp && dayIdx !== undefined) {
      try {
        const res = await fetch("/api/programar-recordatorio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emp.email,
            nombre: emp.nombre,
            empresaNombre,
            semanaKey,
            dayIdx,
            turnoInicio: turno.inicio,
            turnoFin: turno.fin,
            lunesTimestamp: lunes.getTime(),
          }),
        });
        const json = await res.json();
        console.log("[recordatorio]", json);
      } catch (err) {
        console.error("[recordatorio] error:", err);
      }
    }
  };

  const navSemana = (delta: number) => {
    const d = new Date(lunes);
    d.setDate(d.getDate() + delta * 7);
    setLunes(d);
    setEditando(null);
  };

  const semanaLabel = () => {
    const fin = new Date(lunes); fin.setDate(fin.getDate() + 6);
    const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleString("es-ES", { month: "short" })}`;
    return `${fmt(lunes)} – ${fmt(fin)} ${lunes.getFullYear()}`;
  };

  // Plantillas basadas en el sector de la empresa (configurado en Ajustes)
  const plantillasDeEmp = (_emp: Empleado) =>
    PLANTILLAS[empresaSector] ?? PLANTILLAS.otro;

  const empleadosFiltrados = filtro === null ? empleados : empleados.filter((emp) => {
    const tieneAsignado = [0,1,2,3,4,5,6].some(d => { const t = turnos[`${emp.id}_${d}`]; return !!(t && !t.libre && t.inicio); });
    const tieneLibre    = [0,1,2,3,4,5,6].some(d => !!turnos[`${emp.id}_${d}`]?.libre);
    const sinNada       = ![0,1,2,3,4,5,6].some(d => !!turnos[`${emp.id}_${d}`]);
    if (filtro === "asignado") return tieneAsignado;
    if (filtro === "libre")    return tieneLibre;
    if (filtro === "vacio")    return sinNada;
    return true;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#2ECC8F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <Image src="/logo.png" alt="Fichelo" width={140} height={48} className="h-11 w-auto" />
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B2E4B] transition-colors">
          <ArrowLeft size={16} /> Volver al panel
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2E4B]">Turnos semanales</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-500 text-sm">Haz clic en una celda para asignar el turno</p>
              {empresaSector !== "otro" && (
                <span className="text-xs bg-[#2ECC8F]/10 text-[#2ECC8F] px-2 py-0.5 rounded-full font-semibold">
                  {SECTOR_LABELS[empresaSector] ?? empresaSector}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navSemana(-1)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-[#1B2E4B] min-w-[200px] text-center">{semanaLabel()}</span>
            <button onClick={() => navSemana(1)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
            <button onClick={() => { setLunes(getMonday(new Date())); setEditando(null); }}
              className="ml-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-xl font-semibold transition-colors">
              Hoy
            </button>
          </div>
        </div>

        {empleados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Users size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-semibold mb-2">No tienes empleados registrados aún</p>
            <Link href="/dashboard/empleados" className="text-[#2ECC8F] font-semibold text-sm hover:underline">
              Invitar empleados →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wide w-40 sticky left-0 bg-white z-10">
                      Empleado
                    </th>
                    {DIAS.map((dia, i) => {
                      const fecha = new Date(lunes); fecha.setDate(fecha.getDate() + i);
                      const esHoy = fecha.toDateString() === new Date().toDateString();
                      return (
                        <th key={dia} className="px-2 py-3 text-center min-w-[130px]">
                          <span className={`text-xs font-semibold uppercase tracking-wide ${esHoy ? "text-[#2ECC8F]" : "text-gray-400"}`}>{dia}</span>
                          <div className={`text-lg font-bold mt-0.5 ${esHoy ? "text-[#2ECC8F]" : "text-[#1B2E4B]"}`}>{fecha.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {empleadosFiltrados.map((emp, empIdx) => {
                    const plantillas = plantillasDeEmp(emp);
                    return (
                      <tr key={emp.id} className={`border-b border-gray-50 last:border-0 ${empIdx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-5 py-3 sticky left-0 bg-inherit z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#1B2E4B]/10 rounded-full flex items-center justify-center font-bold text-xs text-[#1B2E4B] shrink-0">
                              {emp.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-[#1B2E4B] block truncate max-w-[80px]">
                                {emp.nombre.split(" ")[0]}
                              </span>
                              {emp.rol && (
                                <span className="text-[10px] text-gray-400 truncate max-w-[80px] block">{emp.rol}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                          const clave = `${emp.id}_${dayIdx}`;
                          const turno = turnos[clave];
                          const isEditando = editando === clave;

                          return (
                            <td key={dayIdx} className="px-1 py-2 text-center align-top">
                              {isEditando ? (
                                <div className="flex flex-col gap-1 items-center bg-white border-2 border-[#2ECC8F] rounded-xl p-2 shadow-lg z-20 relative min-w-[120px]">

                                  {/* Plantillas rápidas del sector */}
                                  <div className="w-full mb-1">
                                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide text-left mb-1">Accesos rápidos</p>
                                    <div className="flex flex-wrap gap-1">
                                      {plantillas.map((p) => (
                                        <button
                                          key={p.label}
                                          onClick={() => { setInputInicio(p.inicio); setInputFin(p.fin); }}
                                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors font-medium ${
                                            inputInicio === p.inicio && inputFin === p.fin
                                              ? "bg-[#2ECC8F] text-white border-[#2ECC8F]"
                                              : "border-gray-200 text-gray-500 hover:border-[#2ECC8F] hover:text-[#2ECC8F]"
                                          }`}
                                        >
                                          {p.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="w-full h-px bg-gray-100 mb-1" />

                                  {/* Inputs manuales */}
                                  <input type="time" value={inputInicio} onChange={(e) => setInputInicio(e.target.value)}
                                    className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center" />
                                  <span className="text-xs text-gray-400">hasta</span>
                                  <input type="time" value={inputFin} onChange={(e) => setInputFin(e.target.value)}
                                    className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center" />

                                  <div className="flex gap-1 mt-1 w-full">
                                    <button onClick={() => guardarTurno(clave, { inicio: inputInicio, fin: inputFin }, emp, dayIdx)}
                                      className="flex-1 text-xs bg-[#2ECC8F] hover:bg-[#25a872] text-white py-1.5 rounded-lg font-bold transition-colors">
                                      Guardar
                                    </button>
                                    <button onClick={() => guardarTurno(clave, { libre: true })}
                                      className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 py-1.5 rounded-lg font-semibold transition-colors">
                                      Libre
                                    </button>
                                  </div>
                                  <div className="flex gap-1 w-full">
                                    {turno && (
                                      <button onClick={() => guardarTurno(clave, null)}
                                        className="flex-1 text-xs text-red-400 hover:text-red-500 py-1 rounded-lg transition-colors">
                                        Borrar
                                      </button>
                                    )}
                                    <button onClick={() => setEditando(null)}
                                      className="flex-1 text-xs text-gray-400 hover:text-gray-500 py-1 rounded-lg transition-colors">
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditando(clave);
                                    setInputInicio(turno?.inicio || plantillas[0]?.inicio || "09:00");
                                    setInputFin(turno?.fin || plantillas[0]?.fin || "17:00");
                                  }}
                                  className={`w-full min-h-[52px] rounded-xl px-1 py-2 text-xs font-semibold transition-all hover:scale-105 ${
                                    turno?.libre
                                      ? "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                      : turno?.inicio
                                      ? "bg-[#2ECC8F]/15 text-[#1a9e6d] hover:bg-[#2ECC8F]/25"
                                      : "bg-gray-50 text-gray-300 border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-400"
                                  }`}
                                >
                                  {turno?.libre ? (
                                    <span>Libre</span>
                                  ) : turno?.inicio ? (
                                    <span className="leading-tight">
                                      {turno.inicio}<br />
                                      <span className="text-gray-400 font-normal">–</span><br />
                                      {turno.fin}
                                    </span>
                                  ) : (
                                    <span className="text-lg">+</span>
                                  )}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs text-gray-400 font-medium mr-1">Filtrar:</span>
              {([
                { key: "asignado", label: "Turno asignado", dot: "bg-[#2ECC8F]/50" },
                { key: "libre",    label: "Día libre",       dot: "bg-gray-300" },
                { key: "vacio",    label: "Sin asignar",     dot: "border-2 border-dashed border-gray-300" },
              ] as const).map(({ key, label, dot }) => (
                <button
                  key={key}
                  onClick={() => setFiltro(f => f === key ? null : key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filtro === key
                      ? "bg-[#1B2E4B] text-white border-[#1B2E4B]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-sm shrink-0 ${dot}`} />
                  {label}
                </button>
              ))}
              {filtro && (
                <button onClick={() => setFiltro(null)} className="text-xs text-gray-400 hover:text-gray-600 underline ml-1">
                  Ver todos
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
