import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const collections = ["products", "sprays", "specials"];
const moods = new Set(["acolhimento", "leveza", "energia", "natureza"]);
const imagePathPattern = /^(?:products|uploads)\/[A-Za-z0-9][A-Za-z0-9._/-]*\.(?:jpe?g|png|webp)$/i;
const positionPattern = /^(?:left|center|right)(?:\s+(?:top|center|bottom|(?:0|[1-9][0-9]{0,2})(?:\.[0-9]+)?%))?$/i;
const errors = [];

const fail = (source, field, message) => errors.push(`${source}: campo ${field} inválido — ${message}`);
const isText = (value, max) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
const isPosition = (value) => typeof value === "string"
  ? positionPattern.test(value.trim()) && [...value.matchAll(/(\d+(?:\.\d+)?)%/g)].every((match) => Number(match[1]) <= 100)
  : value && typeof value === "object" && !Array.isArray(value)
    && typeof value.x === "number" && typeof value.y === "number"
    && Number.isFinite(value.x) && Number.isFinite(value.y)
    && value.x >= 0 && value.x <= 100 && value.y >= 0 && value.y <= 100;

for (const collection of collections) {
  const directory = path.join(root, "content", collection);
  const ids = new Set();
  const files = fs.existsSync(directory) ? fs.readdirSync(directory).filter((file) => file.endsWith(".json")).sort() : [];
  if (!files.length) errors.push(`content/${collection}: nenhum registro JSON encontrado`);

  for (const file of files) {
    const source = `content/${collection}/${file}`;
    const expectedId = file.replace(/\.json$/i, "");
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"));
    } catch (error) {
      errors.push(`${source}: JSON inválido — ${error instanceof Error ? error.message : "erro de leitura"}`);
      continue;
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      errors.push(`${source}: registro precisa ser um objeto JSON`);
      continue;
    }
    const id = raw.id;
    if (!isText(id, 80) || id !== expectedId) fail(source, "id", `deve ser ${expectedId}, igual ao nome do arquivo`);
    if (ids.has(id)) fail(source, "id", `duplicado: ${id}`);
    ids.add(id);
    if (!isText(raw.name, 80)) fail(source, "name", "use de 1 a 80 caracteres");
    if (collection !== "sprays" && !isText(raw.description, 500)) fail(source, "description", "use de 1 a 500 caracteres");
    if (collection === "sprays" && raw.description !== undefined && raw.description !== "" && !isText(raw.description, 500)) fail(source, "description", "use até 500 caracteres");
    if (!isText(raw.imageAlt, 160)) fail(source, "imageAlt", "use de 1 a 160 caracteres");
    if (!isText(raw.image, 240) || raw.image.includes("..") || !imagePathPattern.test(raw.image)) fail(source, "image", "use apenas caminho local products/ ou uploads/ com extensão jpg, png ou webp");
    if (isText(raw.image, 240) && imagePathPattern.test(raw.image)) {
      const imageFile = path.join(root, "public", raw.image);
      if (!fs.existsSync(imageFile) || !fs.statSync(imageFile).isFile()) fail(source, "image", `arquivo não encontrado em public/${raw.image}`);
    }
    if (!isPosition(raw.imagePosition)) fail(source, "imagePosition", "use posição CSS simples ou x/y entre 0 e 100");
    if (raw.visible !== undefined && typeof raw.visible !== "boolean") fail(source, "visible", "esperado booleano");
    if (raw.order !== undefined && (!Number.isInteger(raw.order) || raw.order < 0)) fail(source, "order", "esperado inteiro não negativo");
    if (collection === "products") {
      if (!moods.has(raw.mood)) fail(source, "mood", "valor de filtro desconhecido");
      if (!isText(raw.moodLabel, 40)) fail(source, "moodLabel", "use de 1 a 40 caracteres");
      if (!isText(raw.notes, 180)) fail(source, "notes", "use de 1 a 180 caracteres");
      if (!isText(raw.formats, 160)) fail(source, "formats", "use de 1 a 160 caracteres");
      if (typeof raw.accent !== "string" || !/^#[0-9a-f]{6}$/i.test(raw.accent)) fail(source, "accent", "use uma cor hexadecimal de seis dígitos");
    }
    if (collection === "sprays" && !isText(raw.profile, 180)) fail(source, "profile", "use de 1 a 180 caracteres");
    if (collection === "specials" && !isText(raw.line, 80)) fail(source, "line", "use de 1 a 80 caracteres");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const counts = collections.map((collection) => `${collection}: ${fs.readdirSync(path.join(root, "content", collection)).filter((file) => file.endsWith(".json")).length}`);
  console.log(`Catálogo válido — ${counts.join(", ")}`);
}
