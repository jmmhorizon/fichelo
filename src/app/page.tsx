import Navbar from "@/components/Navbar";
import VideoScroll from "@/components/VideoScroll";
import Pricing from "@/components/Pricing";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Mail, Shield, BarChart2, Users, UserPlus, Smartphone, Bell } from "lucide-react";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="min-h-screen flex items-center bg-gradient-to-br from-[#1B2E4B] to-[#243d62] pt-16">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center py-20">
          <div className="text-white">
            <span className="inline-block bg-[#2ECC8F]/20 text-[#2ECC8F] text-sm font-semibold px-4 py-1 rounded-full mb-6">
              Control de fichajes con GPS
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Olvídate del Excel.
              <br />
              <span className="text-[#2ECC8F]">Tu equipo ficha en 3 segundos.</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Fichaje GPS verificado en tiempo real. Detecta si un empleado no ha fichado y recibe un aviso inmediato por email. Sin engaños, sin papel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/registro" className="bg-[#2ECC8F] hover:bg-[#25a872] text-white px-8 py-4 rounded-full font-bold text-lg transition-colors text-center">
                Prueba gratis 7 días
              </Link>
              <Link href="#funciones" className="border-2 border-white/30 hover:border-white text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors text-center">
                Ver cómo funciona
              </Link>
            </div>
            <p className="text-gray-400 text-sm mt-4">Sin tarjeta de crédito · Cancela cuando quieras</p>
            <p className="text-[#2ECC8F] text-sm font-semibold mt-2">+ de 500 empresas ya cumplen la normativa con Fichelo</p>
          </div>

          <div className="flex justify-center">
            <Image
              src="/mockup.png"
              alt="App Fichelo en móvil"
              width={400}
              height={500}
              className="w-full max-w-sm drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-4xl font-extrabold text-[#2ECC8F]">+500</p>
            <p className="text-gray-500 text-sm mt-1">Empresas confían en nosotros</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-[#2ECC8F]">99,9%</p>
            <p className="text-gray-500 text-sm mt-1">Disponibilidad garantizada</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-[#2ECC8F]">3 seg</p>
            <p className="text-gray-500 text-sm mt-1">Para fichar desde el móvil</p>
          </div>
        </div>
      </section>

      {/* VIDEO SCROLL */}
      <VideoScroll />

      {/* CÓMO FUNCIONA EN 3 PASOS */}
      <section className="py-24 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1B2E4B] mb-4">Empieza en 3 pasos</h2>
            <p className="text-gray-500 text-lg">Sin instalaciones, sin formación. Listo en menos de 5 minutos.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* línea conectora solo en desktop */}
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-0.5 bg-[#2ECC8F]/30" />
            {[
              {
                num: "1",
                icon: <UserPlus size={28} className="text-[#2ECC8F]" />,
                titulo: "Da de alta a tus empleados",
                subtitulo: "1 minuto",
                texto: "Introduce el email de cada empleado y les llegará un enlace directo. Sin apps, sin contraseñas complicadas.",
              },
              {
                num: "2",
                icon: <Smartphone size={28} className="text-[#2ECC8F]" />,
                titulo: "Tus empleados fichan desde su móvil",
                subtitulo: "GPS verificado",
                texto: "Abren el enlace, pulsan 'Fichar' y listo. El sistema verifica su ubicación GPS en tiempo real.",
              },
              {
                num: "3",
                icon: <Bell size={28} className="text-[#2ECC8F]" />,
                titulo: "Tú recibes informes y avisos",
                subtitulo: "Email automático",
                texto: "Si alguien no ficha, recibes un aviso inmediato. Informes mensuales generados solos, sin hacer nada.",
              },
            ].map((p) => (
              <div key={p.num} className="relative bg-white rounded-2xl p-8 shadow-sm text-center">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#1B2E4B] text-white rounded-full flex items-center justify-center font-extrabold text-lg shadow-md">
                  {p.num}
                </div>
                <div className="w-14 h-14 bg-[#2ECC8F]/10 rounded-2xl flex items-center justify-center mx-auto mt-4 mb-4">
                  {p.icon}
                </div>
                <span className="text-xs font-bold text-[#2ECC8F] uppercase tracking-widest">{p.subtitulo}</span>
                <h3 className="text-base font-bold text-[#1B2E4B] mt-1 mb-2">{p.titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1B2E4B] mb-4">Todo lo que necesitas</h2>
            <p className="text-gray-500 text-lg">Una plataforma completa para el control horario de tu empresa</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin size={28} className="text-[#2ECC8F]" />,
                titulo: "GPS verificado",
                texto: "El sistema comprueba que el empleado está en el lugar de trabajo antes de registrar el fichaje. Sin trampas.",
              },
              {
                icon: <Clock size={28} className="text-[#2ECC8F]" />,
                titulo: "Control en tiempo real desde cualquier sitio",
                texto: "Ve en tu panel quién ha fichado, a qué hora y desde dónde. Actualización instantánea.",
              },
              {
                icon: <Mail size={28} className="text-[#2ECC8F]" />,
                titulo: "Avisos por email",
                texto: "Si un empleado no ficha a su hora, recibes un aviso automático en tu correo sin hacer nada.",
              },
              {
                icon: <Shield size={28} className="text-[#2ECC8F]" />,
                titulo: "Cumplimiento legal",
                texto: "Cumple con la obligación de registro horario del Real Decreto-ley 8/2019. Historial exportable.",
              },
              {
                icon: <BarChart2 size={28} className="text-[#2ECC8F]" />,
                titulo: "Informes automáticos",
                texto: "Genera informes mensuales por empleado en PDF o Excel con un solo clic.",
              },
              {
                icon: <Users size={28} className="text-[#2ECC8F]" />,
                titulo: "Gestión de equipos",
                texto: "Organiza empleados por equipos o sedes. Gestiona vacaciones y ausencias desde el panel.",
              },
            ].map((f) => (
              <div key={f.titulo} className="bg-gray-50 rounded-2xl p-8 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#2ECC8F]/10 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-[#1B2E4B] mb-2">{f.titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTORES */}
      <section className="py-24 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1B2E4B] mb-4">Diseñado para tu sector</h2>
            <p className="text-gray-500 text-lg">Fichelo funciona en cualquier empresa que tenga empleados por horas o turnos</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { emoji: "🍽️", sector: "Hostelería", desc: "Turnos partidos, distintas sedes, personal de sala y cocina. Todo centralizado." },
              { emoji: "🏗️", sector: "Construcción", desc: "Control de presencia en obra con GPS. Ficha desde cualquier punto de la obra." },
              { emoji: "🧹", sector: "Limpieza", desc: "Empleados en casa del cliente. GPS verifica el fichaje en cada domicilio." },
              { emoji: "💼", sector: "Servicios profesionales", desc: "Oficinas con teletrabajo. Control horario flexible con verificación remota." },
              { emoji: "🛒", sector: "Retail / Comercio", desc: "Control multi-tienda desde un solo panel. Gestión de turnos y coberturas." },
              { emoji: "🏥", sector: "Clínicas y centros sanitarios", desc: "Turnos rotativos, guardias y jornadas partidas con registro 100% digital." },
            ].map((s) => (
              <div key={s.sector} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex gap-4 items-start">
                <span className="text-3xl">{s.emoji}</span>
                <div>
                  <h3 className="font-bold text-[#1B2E4B] text-sm mb-1">{s.sector}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EMAILS DIFFERENTIAL */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1B2E4B] mb-4">
              Te avisamos antes de que sea un problema
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              No tienes que entrar al panel cada día. Fichelo te manda un email en el momento justo, para que tú solo actúes cuando hace falta.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Lista de avisos */}
            <div className="flex flex-col gap-3">
              {[
                { color: "bg-red-50 border-red-200 text-red-700",   dot: "bg-red-400",   texto: "Empleado no ha fichado entrada a la hora prevista" },
                { color: "bg-orange-50 border-orange-200 text-orange-700", dot: "bg-orange-400", texto: "Empleado no ha fichado la salida" },
                { color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-400",  texto: "Resumen diario y semanal de incidencias" },
                { color: "bg-purple-50 border-purple-200 text-purple-700", dot: "bg-purple-400", texto: "Solicitud de vacaciones pendiente de aprobar" },
                { color: "bg-[#2ECC8F]/10 border-[#2ECC8F]/30 text-[#1B2E4B]", dot: "bg-[#2ECC8F]", texto: "Informe mensual automático por empleado" },
                { color: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-400", texto: "Aviso de horas extras detectadas" },
              ].map((a) => (
                <div key={a.texto} className={`flex items-center gap-3 border rounded-xl px-4 py-3 text-sm font-medium ${a.color}`}>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${a.dot}`} />
                  {a.texto}
                </div>
              ))}
            </div>
            {/* Mockup email */}
            <div className="bg-gray-50 rounded-2xl p-6 shadow-inner border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-300" />
                <div className="w-3 h-3 rounded-full bg-yellow-300" />
                <div className="w-3 h-3 rounded-full bg-green-300" />
                <span className="ml-3 text-xs text-gray-400 font-mono">Bandeja de entrada</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="bg-[#1B2E4B] px-5 py-3">
                  <span className="text-white font-bold text-sm">fichelo<span className="text-[#2ECC8F]">.es</span></span>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-gray-400 mb-1">De: Fichelo &lt;avisos@fichelo.es&gt;</p>
                  <p className="text-xs text-gray-400 mb-3">Asunto: <span className="text-[#1B2E4B] font-semibold">⚠️ Carlos García no ha fichado entrada</span></p>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                    <p className="text-red-700 text-xs font-semibold">Empleado sin fichar a las 09:00</p>
                    <p className="text-red-600 text-xs mt-1">Carlos García tenía turno a las 09:00 y aún no ha fichado (son las 09:22).</p>
                  </div>
                  <a className="block bg-[#2ECC8F] text-white text-center text-xs font-bold py-2.5 rounded-lg">
                    Ver panel en tiempo real →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALERTA LEGAL */}
      <section className="py-12 bg-red-50 border-y-2 border-red-200">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold text-red-700 mb-2">
              Multas de hasta 10.000€ por no tener registro horario digital
            </h2>
            <p className="text-red-800/80 text-base mb-4 leading-relaxed">
              La nueva normativa de 2026 obliga a todas las empresas a tener un sistema digital de registro de jornada accesible en tiempo real para Inspección de Trabajo. Cúbrete desde <strong>19,90€/mes</strong>.
            </p>
            <Link
              href="/registro"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full transition-colors text-sm"
            >
              Cumple la normativa hoy
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <Pricing />

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1B2E4B] text-center mb-12">
            Preguntas frecuentes
          </h2>
          <div className="divide-y divide-gray-100">
            {[
              {
                q: "¿Fichelo cumple con la nueva normativa de registro horario digital de 2026?",
                a: "Sí. Fichelo registra cada fichaje con marca de tiempo exacta, geolocalización GPS verificada y exportación de datos en tiempo real. La información está disponible para Inspección de Trabajo en cualquier momento, cumpliendo con los requisitos de la nueva normativa.",
              },
              {
                q: "¿Funciona si mi empleado va a casa de un cliente o trabaja en obras?",
                a: "Sí, es nuestro punto fuerte. Con el modo desplazamiento, cada empleado ficha desde su móvil con GPS verificado en la ubicación exacta donde está trabajando — en casa de un cliente, en una obra o en cualquier punto. Tú ves en el mapa exactamente dónde fichó.",
              },
              {
                q: "¿Se puede integrar con mi gestoría o software de nóminas?",
                a: "Puedes exportar el historial completo de fichajes en CSV con un clic (plan Pro y Empresarial) para importarlo directamente en tu gestoría, Excel o cualquier software de nóminas. La integración vía API está disponible en el plan Empresarial.",
              },
              {
                q: "¿Qué pasa si el empleado no tiene móvil de empresa?",
                a: "No es necesario. Cada empleado usa su propio smartphone personal: solo necesita abrir el enlace que le envías y fichar. No hay que instalar ninguna app. También puedes configurar un acceso por PIN o código QR fijo en la entrada.",
              },
              {
                q: "¿Y si falla el GPS o no hay cobertura?",
                a: "Si no hay GPS disponible, el fichaje se registra igualmente con la hora exacta y se marca como 'sin verificación GPS'. Nunca se pierde un fichaje. Cuando el empleado recupera cobertura, la app sincroniza automáticamente.",
              },
              {
                q: "¿Cuánto tarda en configurarse?",
                a: "Menos de 5 minutos. Creas tu cuenta, introduces la dirección de tu empresa (o activas el modo desplazamiento) e invitas a tus empleados por email. Pueden empezar a fichar de inmediato.",
              },
              {
                q: "¿Qué pasa con los datos de mis empleados? ¿Cumple RGPD?",
                a: "Sí. Todos los datos se almacenan en servidores europeos, cifrados y con acceso restringido. Solo tú como administrador tienes acceso a los datos de tu empresa. Nunca vendemos ni compartimos datos con terceros.",
              },
              {
                q: "¿Puedo cancelar cuando quiera?",
                a: "Sí, sin penalizaciones. Puedes cancelar tu suscripción en cualquier momento desde tu panel. Tus datos quedan disponibles para exportar durante 30 días tras la cancelación.",
              },
              {
                q: "¿Hay permanencia?",
                a: "No. La suscripción es mensual y sin permanencia. Pagas mes a mes y puedes darte de baja cuando quieras.",
              },
              {
                q: "¿Ofrecéis soporte en español?",
                a: "Sí, soporte 100% en español por email. El plan Empresarial incluye soporte prioritario con tiempo de respuesta garantizado en menos de 4 horas en horario laboral.",
              },
            ].map(({ q, a }, i) => (
              <details key={i} className="group py-5 cursor-pointer">
                <summary className="flex items-center justify-between gap-4 text-[#1B2E4B] font-semibold text-base list-none">
                  {q}
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 group-open:bg-[#2ECC8F]/20 flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-500 group-open:text-[#2ECC8F] group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-gray-500 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-[#1B2E4B] text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">Empieza hoy mismo</h2>
          <p className="text-gray-300 text-lg mb-8">
            7 días gratis, sin compromisos. Configura tu empresa en menos de 5 minutos.
          </p>
          <Link href="/registro" className="bg-[#2ECC8F] hover:bg-[#25a872] text-white px-10 py-4 rounded-full font-bold text-lg transition-colors inline-block">
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Col 1: Marca */}
            <div className="col-span-2 md:col-span-1">
              <Image src="/logo.png" alt="Fichelo" width={110} height={36} className="h-9 w-auto brightness-200 mb-4" />
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Sistema de control horario con GPS para empresas. Cumple la normativa sin esfuerzo.
              </p>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/fichelo.es" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-[#2ECC8F] flex items-center justify-center transition-colors" aria-label="Instagram">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://www.linkedin.com/company/fichelo" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-[#2ECC8F] flex items-center justify-center transition-colors" aria-label="LinkedIn">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            {/* Col 2: Producto */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-widest">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#funciones" className="hover:text-white transition-colors">Funciones</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Precios</Link></li>
                <li><Link href="/dashboard?demo=basico" className="hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="#faq" className="hover:text-white transition-colors">Seguridad y RGPD</Link></li>
              </ul>
            </div>

            {/* Col 3: Empresa */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-widest">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:fichelo@fichelo.es" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href={`https://wa.me/34636147135`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp soporte</a></li>
              </ul>
            </div>

            {/* Col 4: Legal */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-widest">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link href="/terminos" className="hover:text-white transition-colors">Términos de uso</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Política de cookies</Link></li>
                <li><Link href="/aviso-legal" className="hover:text-white transition-colors">Aviso legal</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-600">
            <p>© 2026 Fichelo.es · Todos los derechos reservados</p>
            <p>
              <a href="mailto:fichelo@fichelo.es" className="hover:text-gray-400 transition-colors">fichelo@fichelo.es</a>
            </p>
          </div>
        </div>
      </footer>

      {/* BOTÓN FLOTANTE WHATSAPP */}
      <a
        href="https://wa.me/34636147135?text=Hola%2C%20me%20interesa%20Fichelo"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20b858] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
      >
        <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </>
  );
}
