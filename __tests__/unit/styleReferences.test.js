const fs = require("fs");
const path = require("path");

// En React Native un `styles.algo` inexistente es `undefined` y se ignora sin
// avisar, asi que un estilo perdido al mover JSX entre archivos no lo detectan
// ni el lint ni el bundle. Esta prueba lo hace explicito.
const SRC = path.join(__dirname, "..", "..", "src");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".js") ? [full] : [];
  });
}

const IDENT_START = /[A-Za-z_$]/;
const IDENT_PART = /[\w$]/;
const KEY = /^([A-Za-z_$][\w$]*)\s*:/;

// Lee las claves de primer nivel del objeto pasado a StyleSheet.create(...),
// sin depender de la indentacion (algunas pantallas lo crean dentro de una
// funcion getStyles(colors)).
function definedStyles(source) {
  const start = source.indexOf("StyleSheet.create({");
  if (start < 0) return null;

  const keys = new Set();
  let depth = 0;
  let quote = null;

  for (let i = source.indexOf("{", start); i < source.length; i += 1) {
    const ch = source[i];

    if (quote) {
      if (ch === "\\") i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") {
      const eol = source.indexOf("\n", i);
      if (eol < 0) break;
      i = eol;
      continue;
    }

    if (ch === "{" || ch === "[" || ch === "(") {
      depth += 1;
    } else if (ch === "}" || ch === "]" || ch === ")") {
      depth -= 1;
      if (depth === 0) break;
    } else if (depth === 1 && IDENT_START.test(ch)) {
      const match = KEY.exec(source.slice(i));
      if (match) {
        keys.add(match[1]);
        i += match[1].length - 1;
      } else {
        while (IDENT_PART.test(source[i + 1] || "")) i += 1;
      }
    }
  }
  return keys;
}

describe("referencias a styles.*", () => {
  const files = walk(SRC);

  it.each(files.map((f) => [path.relative(SRC, f), f]))(
    "%s solo usa estilos definidos",
    (_name, file) => {
      const source = fs.readFileSync(file, "utf8");
      const used = [...source.matchAll(/\bstyles\.([A-Za-z_$][\w$]*)/g)].map(
        (m) => m[1],
      );
      if (!used.length) return;

      const defined = definedStyles(source);
      expect(defined).not.toBeNull();
      const missing = [...new Set(used)].filter((name) => !defined.has(name));
      expect(missing).toEqual([]);
    },
  );

  it("el verificador detecta un estilo faltante", () => {
    const source =
      "const a = styles.uno; const b = styles.dos;\n" +
      "const styles = StyleSheet.create({\n  uno: { flex: 1 },\n});";
    const defined = definedStyles(source);
    expect(defined.has("uno")).toBe(true);
    expect(defined.has("dos")).toBe(false);
  });

  it("lee claves aunque esten anidadas en una funcion getStyles", () => {
    const source =
      "const getStyles = (c) => {\n  return StyleSheet.create({\n" +
      "    caja: { color: c.a, margin: 2 },\n    // comentario: x\n" +
      "    texto: { fontSize: 12 },\n  });\n};";
    expect([...definedStyles(source)].sort()).toEqual(["caja", "texto"]);
  });
});
