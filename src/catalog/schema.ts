export const MOODS = ["acolhimento", "leveza", "energia", "natureza"] as const;
export type Mood = (typeof MOODS)[number];

export type ImagePosition = string | { x: number; y: number };

export type CatalogBase = {
  id: string;
  name: string;
  description?: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
  visible: boolean;
  order: number;
};

export type ProductEntry = CatalogBase & {
  description: string;
  mood: Mood;
  moodLabel: string;
  notes: string;
  formats: string;
  accent: string;
};

export type SprayEntry = CatalogBase & {
  profile: string;
};

export type SpecialEntry = CatalogBase & {
  description: string;
  line: string;
};

export type Catalog = {
  products: ProductEntry[];
  sprays: SprayEntry[];
  specials: SpecialEntry[];
};

export class CatalogValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogValidationError";
  }
}

const MAX_NAME = 80;
const MAX_DESCRIPTION = 500;
const MAX_ALT = 160;
const IMAGE_PATH = /^(?:products|uploads)\/[A-Za-z0-9][A-Za-z0-9._/-]*\.(?:jpe?g|png|webp)$/i;
const LEGACY_POSITION = /^(?:left|center|right)(?:\s+(?:top|center|bottom|(?:0|[1-9][0-9]{0,2})(?:\.[0-9]+)?%))?$/i;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const fail = (source: string, field: string, reason: string): never => {
  throw new CatalogValidationError(`${source}: campo ${field} inválido — ${reason}`);
};

const asRecord = (value: unknown, source: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(source, "registro", "esperado um objeto JSON");
  }
  return value as Record<string, unknown>;
};

const text = (value: unknown, source: string, field: string, options: { min?: number; max?: number; required?: boolean } = {}): string => {
  if (typeof value !== "string") {
    fail(source, field, "esperado texto");
    return "";
  }
  const trimmed = value.trim();
  if (options.required !== false && trimmed.length < (options.min ?? 1)) {
    fail(source, field, `use pelo menos ${options.min ?? 1} caractere`);
  }
  if (options.max !== undefined && trimmed.length > options.max) {
    fail(source, field, `use no máximo ${options.max} caracteres`);
  }
  return trimmed;
};

const optionalText = (value: unknown, source: string, field: string, max: number): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  return text(value, source, field, { max });
};

export const normalizeImagePosition = (value: unknown, source: string, field = "imagePosition"): string => {
  if (typeof value === "string") {
    const position = value.trim();
    if (!LEGACY_POSITION.test(position)) fail(source, field, "use posições CSS simples ou porcentagens de 0% a 100%");
    for (const match of position.matchAll(/(\d+(?:\.\d+)?)%/g)) {
      if (Number(match[1]) > 100) fail(source, field, "use porcentagens entre 0% e 100%");
    }
    return position;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const { x, y } = value as { x?: unknown; y?: unknown };
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) {
      fail(source, field, "use x e y numéricos entre 0 e 100");
    }
    return `${x}% ${y}%`;
  }
  fail(source, field, "use uma posição CSS legada ou um objeto { x, y }");
  return "";
};

const common = (raw: Record<string, unknown>, source: string, expectedId: string): CatalogBase => {
  const id = text(raw.id, source, "id", { max: 80 });
  if (id !== expectedId) fail(source, "id", `deve ser ${expectedId}, igual ao nome do arquivo`);
  const image = text(raw.image, source, "image", { max: 240 });
  if (image.includes("..") || !IMAGE_PATH.test(image)) fail(source, "image", "use apenas caminho local products/ ou uploads/ com extensão jpg, png ou webp");
  const visible = raw.visible === undefined ? true : raw.visible;
  if (typeof visible !== "boolean") fail(source, "visible", "esperado booleano");
  const order = raw.order === undefined ? 0 : raw.order;
  if (typeof order !== "number" || !Number.isInteger(order) || order < 0) fail(source, "order", "esperado inteiro não negativo");
  return {
    id,
    name: text(raw.name, source, "name", { max: MAX_NAME }),
    image,
    imageAlt: text(raw.imageAlt, source, "imageAlt", { max: MAX_ALT }),
    imagePosition: normalizeImagePosition(raw.imagePosition, source),
    visible: visible as boolean,
    order: order as number,
  };
};

const description = (raw: Record<string, unknown>, source: string, required: boolean): string | undefined => {
  if (!required && (raw.description === undefined || raw.description === "")) return undefined;
  return text(raw.description, source, "description", { max: MAX_DESCRIPTION, required });
};

export const parseCatalogEntry = (value: unknown, kind: "products" | "sprays" | "specials", source: string, expectedId: string): ProductEntry | SprayEntry | SpecialEntry => {
  const raw = asRecord(value, source);
  const base = common(raw, source, expectedId);
  if (kind === "products") {
    const mood = raw.mood;
    if (typeof mood !== "string" || !(MOODS as readonly string[]).includes(mood)) fail(source, "mood", `use um destes valores: ${MOODS.join(", ")}`);
    const accent = text(raw.accent, source, "accent", { max: 7 });
    if (!HEX_COLOR.test(accent)) fail(source, "accent", "use uma cor hexadecimal de seis dígitos");
    return {
      ...base,
      description: description(raw, source, true)!,
      mood: mood as Mood,
      moodLabel: text(raw.moodLabel, source, "moodLabel", { max: 40 }),
      notes: text(raw.notes, source, "notes", { max: 180 }),
      formats: text(raw.formats, source, "formats", { max: 160 }),
      accent,
    };
  }
  if (kind === "sprays") {
    return {
      ...base,
      description: description(raw, source, false),
      profile: text(raw.profile, source, "profile", { max: 180 }),
    };
  }
  return {
    ...base,
    description: description(raw, source, true)!,
    line: text(raw.line, source, "line", { max: 80 }),
  };
};

export const sortCatalog = <T extends CatalogBase>(entries: T[]): T[] => [...entries].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, "pt-BR"));

export const assertUniqueIds = (entries: CatalogBase[], source: string): void => {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) fail(source, "id", `duplicado: ${entry.id}`);
    ids.add(entry.id);
  }
};

export const imagePositionToCss = (position: ImagePosition): string => {
  if (typeof position === "string") return position;
  return `${position.x}% ${position.y}%`;
};

export const optionalDescription = (value: unknown, source: string): string | undefined => optionalText(value, source, "description", MAX_DESCRIPTION);
