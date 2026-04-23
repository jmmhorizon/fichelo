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

interface Empleado { id: string; nombre: string; email: string; }
interface Turno { inicio?: string; fin?: string; libre?: boolean; }
type Semana = Record<string, Turno>;

export default function TurnosPage() {
  const [empleados, setEmpleados]     = useState<Empleado[]>([]);
  const [lunes, setLunes]             = useState<Date>(getMonday(new Date()));
  const [turnos, setTurnos]           = useState<Semana>({});
  const [loading, setLoading]         = useState(true);
  const [uid, setUid]                 = useState("");
  const [editando, setEditando]       = useState<string | null>(null);
  const [inputInicio, setInputInicio] = useState("09:00");
  const [inputFin, setInputFin]       = useState("17:00");
  const router = useRouter();

  const semanaKey = `${lunes.getFullYear()}W${String(getWeekNumber(lunes)).padStart(2, "0")}`;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);
      const snap = await getDocs(query(collection(db, "empleados"), where("empresaId", "==", user.uid)));
      setEmpleados(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empleado)));
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "turnos", `${uid}_${semanaKey}`)).then((snap) => {
      setTurnos(snap.exists() ? (snap.data() as Semana) : {});
    });
  }, [uid, semanaKey]);

  const guardarTurno = async (clave: string, turno: Turno | null) => {
    const nuevos = { ...turnos };
    if (turno === null) delete nuevos[clave];
    else nuevos[clave] = turno;
    setTurnos(nuevos);
    await setDoc(doc(db, "turnos", `${uid}_${semanaKey}`), nuevos);
    setEditando(null);
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
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2E4B]">Turnos semanales</h1>
            <p className="text-gray-500 text-sm mt-1">Haz clic en una celda para asignar o editar el turno</p>
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
                    <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wide w-36 sticky left-0 bg-white z-10">
                      Empleado
                    </th>
                    {DIAS.map((dia, i) => {
                      const fecha = new Date(lunes); fecha.setDate(fecha.getDate() + i);
                      const esHoy = fecha.toDateString() === new Date().toDateString();
                      return (
                        <th key={dia} className="px-2 py-3 text-center min-w-[110px]">
                          <span className={`text-xs font-semibold uppercase tracking-wide ${esHoy ? "text-[#2ECC8F]" : "text-gray-400"}`}>
                            {dia}
                          </span>
                          <div className={`text-lg font-bold mt-0.5 ${esHoy ? "text-[#2ECC8F]" : "text-[#1B2E4B]"}`}>
                            {fecha.getDate()}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {empleados.map((emp, empIdx) => (
                    <tr key={emp.id} className={`border-b border-gray-50 last:border-0 ${empIdx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                      <td className="px-5 py-3 sticky left-0 bg-inherit z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#1B2E4B]/10 rounded-full flex items-center justify-center font-bold text-xs text-[#1B2E4B] shrink-0">
                            {emp.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-[#1B2E4B] truncate max-w-[80px]">
                            {emp.nombre.split(" ")[0]}
                          </span>
                        </div>
                      </td>

                      {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                        const clave = `${emp.id}_${dayIdx}`;
                        const turno = turnos[clave];
                        const isEditando = editando === clave;

                        return (
                          <td key={dayIdx} className="px-2 py-2 text-center align-middle">
                            {isEditando ? (
                              <div className="flex flex-col gap-1 items-center bg-white border-2 border-[#2ECC8F] rounded-xl p-2 shadow-md z-20 relative">
                                <input
                                  type="time"
                                  value={inputInicio}
                                  onChange={(e) => setInputInicio(e.target.value)}
                                  className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center"
                                />
                                <span className="text-xs text-gray-400">hasta</span>
                                <input
                                  type="time"
                                  value={inputFin}
                                  onChange={(e) => setInputFin(e.target.value)}
                                  className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center"
                                />
                                <div className="flex gap-1 mt-1 w-full">
                                  <button
                                    onClick={() => guardarTurno(clave, { inicio: inputInicio, fin: inputFin })}
                                    className="flex-1 text-xs bg-[#2ECC8F] hover:bg-[#25a872] text-white py-1.5 rounded-lg font-bold transition-colors"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => guardarTurno(clave, { libre: true })}
                                    className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 py-1.5 rounded-lg font-semibold transition-colors"
                                  >
                                    Libre
                                  </button>
                                </div>
                                <div className="flex gap-1 w-full">
                                  {turno && (
                                    <button
                                      onClick={() => guardarTurno(clave, null)}
                                      className="flex-1 text-xs text-red-400 hover:text-red-500 py-1 rounded-lg transition-colors"
                                    >
                                      Borrar
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setEditando(null)}
                                    className="flex-1 text-xs text-gray-400 hover:text-gray-500 py-1 rounded-lg transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditando(clave);
                                  setInputInicio(turno?.inicio || "09:00");
                                  setInputFin(turno?.fin || "17:00");
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#2ECC8F]/15" />
                <span className="text-xs text-gray-500">Turno asignado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-100" />
                <span className="text-xs text-gray-500">Día libre</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-dashed border-gray-200" />
                <span className="text-xs text-gray-500">Sin asignar</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
