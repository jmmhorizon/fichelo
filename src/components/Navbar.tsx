"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Fichelo" width={180} height={60} className="h-16 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#funciones" className="text-gray-600 hover:text-[#2ECC8F] transition-colors text-sm font-medium">Funciones</Link>
          <Link href="#precios" className="text-gray-600 hover:text-[#2ECC8F] transition-colors text-sm font-medium">Precios</Link>
          <Link href="/login" className="text-gray-600 hover:text-[#2ECC8F] transition-colors text-sm font-medium">Iniciar sesión</Link>
          <Link href="/registro" className="bg-[#2ECC8F] hover:bg-[#25a872] text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors">
            Prueba gratis 3 días
          </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          <div className="w-5 h-0.5 bg-gray-700 mb-1" />
          <div className="w-5 h-0.5 bg-gray-700 mb-1" />
          <div className="w-5 h-0.5 bg-gray-700" />
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-4">
          <Link href="#funciones" className="text-gray-600 text-sm font-medium" onClick={() => setOpen(false)}>Funciones</Link>
          <Link href="#precios" className="text-gray-600 text-sm font-medium" onClick={() => setOpen(false)}>Precios</Link>
          <Link href="/login" className="text-gray-600 text-sm font-medium" onClick={() => setOpen(false)}>Iniciar sesión</Link>
          <Link href="/registro" className="bg-[#2ECC8F] text-white px-5 py-2 rounded-full text-sm font-semibold text-center" onClick={() => setOpen(false)}>
            Prueba gratis 3 días
          </Link>
        </div>
      )}
    </nav>
  );
}
