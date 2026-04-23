"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Users, Building2, TrendingUp, LogOut, CheckCircle, XCircle, Clock } from "lucide-react";

const ADMIN_EMAIL = "mijael_6@hotmail.com";

interface Empresa {
  id: string;
  nombre: string;
  email: string;
  plan: string;
  activo: boolean;
  creadoEn: string;
  empleados: string[];
}

interface Fichaje {
  id: string;
  empleadoNombre: string;
  empresaId: string;
  tipo: string;
  hora: { seconds: number };
  dentro: boolean;
}

const PRECIO: Record<string, number> = {
  basico: 19.9,
  pro: 39.9,
  empresarial: 89.9,
};

export default function AdminPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [fichajes, setFichajes] = useState<Fichaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"resumen" | "empresas" | "fichajes">("resumen");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/");
        return;
      }

      const unsubEmpresas = onSnapshot(
        query(collection(db, "empresas"), orderBy("creadoEn", "desc")),
        (snap) => {
          setEmpresas(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Empresa)));
          setLoading(false);
        }
      );

      const unsubFichajes = onSnapshot(
        query(collection(db, "fichajes"), orderBy("hora", "desc"), limit(100)),
        (snap) => {
          setFichajes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Fichaje)));
        }
      );

      return () => {
        unsubEmpresas();
        unsubFichajes();
      };
    });
    return () => unsub();
  }, [router]);

  const ingresosMes = empresas
    .filter((e) => e.activo && e.plan !== "cancelado")
    .reduce((acc, e) => acc + (PRECIO[e.plan] || 0), 0);

  const formatFecha = (iso: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatHora = (ts: { seconds: number }) => {
    return new Date(ts.seconds * 1000).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2ECC8F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-[#1B2E4B] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Fichelo" width={180} height={60} className="h-14 w-auto brightness-200" />
          <span className="text-[#2ECC8F] font-bold text-sm bg-[#2ECC8F]/20 px-3 py-1 rounded-full">Admin</span>
        </div>
        <button
          onClick={() => { auth.signOut(); router.push("/"); }}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
        >
          <LogOut size={16} /> Salir
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={18} className="text-[#2ECC8F]" />
              <span className="text-gray-500 text-sm">Empresas totales</span>
            </div>
            <p className="text-3xl font-bold text-[#1B2E4B]">{empresas.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-[#2ECC8F]" />
              <span className="text-gray-500 text-sm">Activas</span>
            </div>
            <p className="text-3xl font-bold text-[#1B2E4B]">
              {empresas.filter((e) => e.activo).length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-[#2ECC8F]" />
              <span className="text-gray-500 text-sm">Empleados totales</span>
            </div>
            <p className="text-3xl font-bold text-[#1B2E4B]">
              {empresas.reduce((acc, e) => acc + (e.empleados?.length || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[#2ECC8F]/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-[#2ECC8F]" />
              <span className="text-gray-500 text-sm">Ingresos/mes</span>
            </div>
            <p className="text-3xl font-bold text-[#2ECC8F]">{ingresosMes.toFixed(2)}€</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["resumen", "empresas", "fichajes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
                tab === t ? "bg-[#1B2E4B] text-white" : "bg-white text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Resumen */}
        {tab === "resumen" && (
          <div className="grid md:grid-cols-3 gap-4">
            {(["basico", "pro", "empresarial"] as const).map((plan) => {
              const count = empresas.filter((e) => e.plan === plan && e.activo).length;
              return (
                <div key={plan} className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-[#1B2E4B] capitalize mb-1">{plan}</h3>
                  <p className="text-4xl font-extrabold text-[#2ECC8F] mb-1">{count}</p>
                  <p className="text-sm text-gray-400">empresas activas</p>
                  <p className="text-sm font-semibold text-gray-600 mt-2">
                    {(count * PRECIO[plan]).toFixed(2)}€/mes
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Empresas */}
        {tab === "empresas" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Empresa</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Email</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Plan</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Estado</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Empleados</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {empresas.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#1B2E4B]">{e.nombre}</td>
                    <td className="px-6 py-4 text-gray-500">{e.email}</td>
                    <td className="px-6 py-4">
                      <span className="bg-[#2ECC8F]/10 text-[#2ECC8F] px-2 py-1 rounded-full text-xs font-semibold capitalize">
                        {e.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {e.activo ? (
                        <span className="flex items-center gap-1 text-[#2ECC8F] text-xs font-medium">
                          <CheckCircle size={14} /> Activa
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
                          <XCircle size={14} /> Inactiva
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{e.empleados?.length || 0}</td>
                    <td className="px-6 py-4 text-gray-400">{formatFecha(e.creadoEn)}</td>
                  </tr>
                ))}
                {empresas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      Aún no hay empresas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Fichajes */}
        {tab === "fichajes" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Clock size={16} className="text-[#2ECC8F]" />
              <h3 className="font-bold text-[#1B2E4B]">Últimos 100 fichajes</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Empleado</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Tipo</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Hora</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Ubicación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fichajes.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#1B2E4B]">{f.empleadoNombre}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                        f.tipo === "entrada" ? "bg-[#2ECC8F]/10 text-[#2ECC8F]" : "bg-orange-50 text-orange-400"
                      }`}>
                        {f.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatHora(f.hora)}</td>
                    <td className="px-6 py-4">
                      {f.dentro ? (
                        <span className="flex items-center gap-1 text-[#2ECC8F] text-xs">
                          <CheckCircle size={12} /> En ubicación
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <XCircle size={12} /> Fuera
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {fichajes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      Aún no hay fichajes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
