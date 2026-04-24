import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

// Windows-1252 bytes 0x80-0x9F → Unicode code points
const w1252Special = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160,
  0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153,
  0x9E: 0x017E, 0x9F: 0x0178,
};

// Reverse: Unicode → W1252 byte
const unicodeToW1252 = {};
for (const [byte, unicode] of Object.entries(w1252Special)) {
  unicodeToW1252[unicode] = Number(byte);
}

function charToW1252Byte(char) {
  const code = char.charCodeAt(0);
  if (unicodeToW1252[code] !== undefined) return unicodeToW1252[code];
  if (code <= 0xFF) return code;
  return null; // No se puede convertir a un solo byte W1252
}

function fixMojibake(filePath) {
  let content = readFileSync(filePath, "utf-8");

  // Quitar BOM si existe
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  const bytes = [];
  for (const char of content) {
    const byte = charToW1252Byte(char);
    if (byte === null) return false; // Carácter fuera del rango W1252
    bytes.push(byte);
  }

  let fixed;
  try {
    fixed = Buffer.from(bytes).toString("utf-8");
  } catch {
    return false; // Los bytes no forman UTF-8 válido
  }

  if (fixed !== content) {
    writeFileSync(filePath, fixed, "utf-8");
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory() && entry !== "node_modules" && entry !== ".next") {
      files.push(...walkDir(full));
    } else if (stat.isFile() && /\.(tsx?|jsx?|mjs|css)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const root = path.join(process.cwd(), "src");
const allFiles = walkDir(root);

let count = 0;
for (const file of allFiles) {
  if (fixMojibake(file)) {
    console.log("✓", path.relative(process.cwd(), file));
    count++;
  }
}

console.log(`\n${count} archivos corregidos.`);
