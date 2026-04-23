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
              <span className="text-[#2ECC8F]">T� lo controlas.</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Fichaje GPS verificado en tiempo real. Detecta si un empleado no ha fichado y recibe un aviso inmediato por email. Sin enga�os, sin papel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/registro" className="bg-[#2ECC8F] hover:bg-[#25a872] text-white px-8 py-4 rounded-full font-bold text-lg transition-colors text-center">
                Prueba gratis 7 d�as
              </Link>
              <Link href="#funciones" className="border-2 border-white/30 hover:border-white text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors text-center">
                Ver c�mo funciona
              </Link>
            </div>
            <p className="text-gray-400 text-sm mt-4">Sin tarjeta de cr�dito � Cancela cuando quieras</p>
          </div>

          <div className="flex justify-center">
            <Image
              src="/mockup.png"
              alt="App Fichelo en m�vil"
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
            <p className="text-gray-500 text-sm mt-1">Empresas conf�an en nosotros</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-[#2ECC8F]">99,9%</p>
            <p className="text-gray-500 text-sm mt-1">Disponibilidad garantizada</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-[#2ECC8F]">3 seg</p>
            <p className="text-gray-500 text-sm mt-1">Para fichar desde el m�vil</p>
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
                texto: "El sistema comprueba que el empleado est� en el lugar de trabajo antes de registrar el fichaje. Sin trampas.",
              },
              {
                icon: <Clock size={28} className="text-[#2ECC8F]" />,
                titulo: "Tiempo real",
                texto: "Ve en tu panel qui�n ha fichado, a qu� hora y desde d�nde. Actualizaci�n instant�nea.",
              },
              {
                icon: <Mail size={28} className="text-[#2ECC8F]" />,
                titulo: "Avisos por email",
                texto: "Si un empleado no ficha a su hora, recibes un aviso autom�tico en tu correo sin hacer nada.",
              },
              {
                icon: <Shield size={28} className="text-[#2ECC8F]" />,
                titulo: "Cumplimiento legal",
                texto: "Cumple con la obligaci�n de registro horario del Real Decreto-ley 8/2019. Historial exportable.",
              },
              {
                icon: <BarChart2 size={28} className="text-[#2ECC8F]" />,
                titulo: "Informes autom�ticos",
                texto: "Genera informes mensuales por empleado en PDF o Excel con un solo clic.",
              },
              {
                icon: <Users size={28} className="text-[#2ECC8F]" />,
                titulo: "Gesti�n de equipos",
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

      {/* PRICING */}
      <Pricing />

      {/* CTA FINAL */}
      <section className="py-24 bg-[#1B2E4B] text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">Empieza hoy mismo</h2>
          <p className="text-gray-300 text-lg mb-8">
            7 d�as gratis, sin compromisos. Configura tu empresa en menos de 5 minutos.
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
          <p className="text-sm">� 2026 Fichelo.es � Todos los derechos reservados</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white transition-colors">T�rminos</Link>
            <Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
