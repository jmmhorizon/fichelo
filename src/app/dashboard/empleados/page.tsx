"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, Users, Copy } from "lucide-react";

interface Empleado { id: string; nombre: string; email: string; creadoEn: string; }
interface Empresa  { nombre: string; plan: string; empleados: string[]; email: string; }

const LIMITE: Record<string, number> = { basico: 15, pro: 50, empresarial: 9999 };

export default function EmpleadosPage() {
  const [empresa, setEmpresa]         = useState<Empresa | null>(null);
  const [empleados, setEmpleados]     = useState<Empleado[]>([]);
  const [nombre, setNombre]           = useState("");
  const [email, setEmail]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [enviado, setEnviado]         = useState(false);
  const [error, setError]             = useState("");
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null);
  const [uid, setUid]                 = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);
      const snap = await getDoc(doc(db, "empresas", user.uid));
      if (snap.exists()) setEmpresa(snap.data() as Empresa);

      const q = query(collection(db, "empleados"), where("empresaId", "==", user.uid));
      const empSnap = await getDocs(q);
      setEmpleados(empSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Empleado)));
    });
    return () => unsub();
  }, [router]);

  const limite = LIMITE[empresa?.plan || "basico"] ?? 15;
  const totalEmpleados = empleados.length;

  const invitar = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (totalEmpleados >= limite) { setError(`Has alcanzado el lÃ­mite de ${limite} empleados de tu plan.`); return; }
    setLoading(true); setError(""); setEnviado(false);
    try {
      const res = await fetch("/api/invitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: uid, nombreEmpleado: nombre, emailEmpleado: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEnviado(true);
      setLinkCopiado(`${window.location.origin}/unirse/${data.token}`);
      setNombre(""); setEmail("");
    } catch {
      setError("Error al enviar la invitaciÃ³n. IntÃ©ntalo de nuevo.");
    } finally { setLoading(false); }
  };

  const copiarLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert("Â¡Link copiado! Puedes enviÃ¡rselo por WhatsApp o SMS.");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Fichelo" width={140} height={48} className="h-11 w-auto" />
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B2E4B] transition-colors">
          <ArrowLeft size={16} /> Volver al panel
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1B2E4B]">GestiÃ³n de empleados</h1>
          <p className="text-gray-500 text-sm mt-1">
            {totalEmpleados} de {limite === 9999 ? "âˆž" : limite} empleados Â· Plan <span className="font-semibold capitalize">{empresa?.plan}</span>
          </p>
        </div>

        {/* Formulario de invitaciÃ³n */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-bold text-[#1B2E4B] mb-1">Invitar nuevo empleado</h2>
          <p className="text-gray-400 text-sm mb-5">Le llegarÃ¡ un email con un enlace para registrarse y unirse a tu empresa automÃ¡ticamente.</p>

          {enviado && linkCopiado && (
            <div className="bg-[#2ECC8F]/10 border border-[#2ECC8F]/30 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-[#2ECC8F]" />
                <p className="text-[#1B2E4B] font-semibold text-sm">Â¡InvitaciÃ³n enviada por email!</p>
              </div>
              <p className="text-gray-500 text-xs mb-3">TambiÃ©n puedes compartir el enlace directamente por WhatsApp:</p>
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                <p className="text-xs text-gray-500 flex-1 truncate">{linkCopiado}</p>
                <button onClick={() => copiarLink(linkCopiado)} className="flex items-center gap-1 text-xs text-[#2ECC8F] font-semibold shrink-0 hover:underline">
                  <Copy size={12} /> Copiar
                </button>
              </div>
            </div>
          )}

          <form onSubmit={invitar} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del empleado</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
                  placeholder="Juan GarcÃ­a"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email del empleado</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="juan@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECC8F] transition-colors" />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading || totalEmpleados >= limite}
              className="flex items-center gap-2 bg-[#2ECC8F] hover:bg-[#25a872] text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
              <Send size={15} />
              {loading ? "Enviando..." : "Enviar invitaciÃ³n"}
            </button>
            {totalEmpleados >= limite && (
              <p className="text-amber-500 text-xs font-medium">
                Has alcanzado el lÃ­mite de tu plan. <Link href="/dashboard?upgrade=1" className="underline">Mejora tu plan</Link> para aÃ±adir mÃ¡s empleados.
              </p>
            )}
          </form>
        </div>

        {/* Lista de empleados */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 p-6 border-b border-gray-100">
            <Users size={18} className="text-[#2ECC8F]" />
            <h2 className="font-bold text-[#1B2E4B]">Empleados registrados ({totalEmpleados})</h2>
          </div>
          {empleados.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Users size={36} className="mx-auto mb-3 opacity-20" />
              <p>AÃºn no tienes empleados registrados</p>
              <p className="text-xs mt-1">Usa el formulario de arriba para invitar al primero</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {empleados.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#1B2E4B]/10 rounded-full flex items-center justify-center font-bold text-sm text-[#1B2E4B]">
                      {emp.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[#1B2E4B] text-sm">{emp.nombre}</p>
                      <p className="text-xs text-gray-400">{emp.email}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-[#2ECC8F] font-semibold">
                    <CheckCircle size={13} /> Activo
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
