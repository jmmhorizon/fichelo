import Navbar from "@/components/Navbar";
import VideoScroll from "@/components/VideoScroll";
import Pricing from "@/components/Pricing";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Mail, Shield, BarChart2, Users } from "lucide-react";

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
              Tus empleados fichan.
              <br />
              <span className="text-[#2ECC8F]">Tú lo controlas.</span>
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
                titulo: "Tiempo real",
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
          <div className="divide-y divide-gray-100" id="faq-list">
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
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <Image src="/logo.png" alt="Fichelo" width={100} height={32} className="h-8 w-auto brightness-200" />
          <p className="text-sm">© 2026 Fichelo.es · Todos los derechos reservados</p>
          <div className="flex flex-col md:flex-row gap-3 md:gap-6 text-sm items-center">
            <a href="mailto:fichelo@fichelo.es" className="hover:text-white transition-colors text-[#2ECC8F]">fichelo@fichelo.es</a>
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
