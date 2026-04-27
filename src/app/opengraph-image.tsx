import { ImageResponse } from "next/og";

export const runtime     = "edge";
export const alt         = "Fichelo.es — Control horario con GPS para empresas";
export const size        = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1B2E4B 0%, #243d62 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Círculos decorativos de fondo */}
        <div style={{
          position: "absolute", width: 600, height: 600,
          borderRadius: "50%", border: "1px solid rgba(46,204,143,0.12)",
          top: -200, right: -150, display: "flex",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400,
          borderRadius: "50%", border: "1px solid rgba(46,204,143,0.08)",
          bottom: -150, left: -100, display: "flex",
        }} />

        {/* Badge superior */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(46,204,143,0.15)",
          border: "1px solid rgba(46,204,143,0.3)",
          borderRadius: 100, padding: "8px 20px",
          marginBottom: 32,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#2ECC8F", display: "flex",
          }} />
          <span style={{ color: "#2ECC8F", fontSize: 18, fontWeight: 700 }}>
            Control de fichajes con GPS
          </span>
        </div>

        {/* Logo / marca */}
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 24 }}>
          <span style={{
            color: "white", fontSize: 72, fontWeight: 900,
            letterSpacing: "-2px", lineHeight: 1,
          }}>
            fichelo
          </span>
          <span style={{
            color: "#2ECC8F", fontSize: 72, fontWeight: 900,
            letterSpacing: "-2px", lineHeight: 1,
          }}>
            .es
          </span>
        </div>

        {/* Título principal */}
        <div style={{
          color: "white", fontSize: 38, fontWeight: 800,
          textAlign: "center", lineHeight: 1.25,
          maxWidth: 800, marginBottom: 20,
        }}>
          Olvídate del Excel.
          Tu equipo ficha en 3 segundos.
        </div>

        {/* Subtítulo */}
        <div style={{
          color: "rgba(255,255,255,0.65)", fontSize: 22,
          textAlign: "center", marginBottom: 40,
        }}>
          Cumple la normativa 2026 · GPS verificado · Avisos por email
        </div>

        {/* Pills de precio y prueba */}
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{
            background: "#2ECC8F", color: "white",
            borderRadius: 100, padding: "12px 28px",
            fontSize: 20, fontWeight: 800,
          }}>
            Desde 19,90€/mes
          </div>
          <div style={{
            border: "2px solid rgba(255,255,255,0.3)", color: "white",
            borderRadius: 100, padding: "12px 28px",
            fontSize: 20, fontWeight: 600,
          }}>
            7 días gratis · Sin tarjeta
          </div>
        </div>

        {/* URL inferior */}
        <div style={{
          position: "absolute", bottom: 32,
          color: "rgba(255,255,255,0.3)", fontSize: 16,
          display: "flex",
        }}>
          www.fichelo.es
        </div>
      </div>
    ),
    { ...size }
  );
}
