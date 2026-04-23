"use client";
import { Check } from "lucide-react";
import Link from "next/link";

const planes = [
  {
    nombre: "B�sico",
    precio: "19,90",
    descripcion: "Ideal para peque�as empresas",
    empleados: "Hasta 15 empleados",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC,
    caracteristicas: [
      "Fichaje con GPS verificado",
      "Panel del jefe en tiempo real",
      "Historial 30 d�as",
      "Notificaciones por email",
      "1 ubicaci�n de trabajo",
      "Soporte por email",
    ],
    destacado: false,
  },
  {
    nombre: "Pro",
    precio: "39,90",
    descripcion: "Para empresas en crecimiento",
    empleados: "Hasta 50 empleados",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    caracteristicas: [
      "Todo lo del plan B�sico",
      "M�ltiples ubicaciones",
      "Historial ilimitado",
      "Exportar a Excel y PDF",
      "Informes mensuales autom�ticos",
      "Gesti�n de vacaciones y ausencias",
      "Soporte prioritario",
    ],
    destacado: true,
  },
  {
    nombre: "Empresarial",
    precio: "89,90",
    descripcion: "Para grandes empresas",
    empleados: "Empleados ilimitados",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_EMPRESARIAL,
    caracteristicas: [
      "Todo lo del plan Pro",
      "Logo personalizado de tu empresa",
      "API para integrar con otros sistemas",
      "Soporte telef�nico",
      "Gestor de cuenta dedicado",
    ],
    destacado: false,
  },
];

export default function Pricing() {
  return (
    <section id="precios" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#1B2E4B] mb-4">Planes y precios</h2>
          <p className="text-gray-500 text-lg">7 d�as gratis sin necesidad de comprometerte</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {planes.map((plan) => (
            <div
              key={plan.nombre}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.destacado
                  ? "bg-[#1B2E4B] text-white shadow-2xl scale-105"
                  : "bg-white text-[#1B2E4B] shadow-md"
              }`}
            >
              {plan.destacado && (
                <span className="text-xs font-bold text-[#2ECC8F] uppercase tracking-widest mb-2">
                  M�s popular
                </span>
              )}
              <h3 className="text-2xl font-bold mb-1">{plan.nombre}</h3>
              <p className={`text-sm mb-4 ${plan.destacado ? "text-gray-300" : "text-gray-500"}`}>
                {plan.descripcion}
              </p>
              <div className="mb-2">
                <span className="text-4xl font-extrabold">{plan.precio}�</span>
                <span className={`text-sm ${plan.destacado ? "text-gray-300" : "text-gray-500"}`}>/mes</span>
              </div>
              <p className={`text-sm font-medium mb-6 ${plan.destacado ? "text-[#2ECC8F]" : "text-[#2ECC8F]"}`}>
                {plan.empleados}
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.caracteristicas.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="text-[#2ECC8F] mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>

              <Link
                href={`/registro?plan=${plan.nombre.toLowerCase()}`}
                className={`text-center py-3 rounded-full font-semibold transition-colors ${
                  plan.destacado
                    ? "bg-[#2ECC8F] hover:bg-[#25a872] text-white"
                    : "border-2 border-[#2ECC8F] text-[#2ECC8F] hover:bg-[#2ECC8F] hover:text-white"
                }`}
              >
                Empezar 7 d�as gratis
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
