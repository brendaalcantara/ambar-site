import {
  assertUniqueIds,
  parseCatalogEntry,
  sortCatalog,
  type Catalog,
  type ProductEntry,
  type SprayEntry,
  type SpecialEntry,
} from "./schema";

type JsonModules = Record<string, unknown>;

const idFromFile = (file: string): string => {
  const name = file.split("/").pop() ?? file;
  return name.replace(/\.json$/i, "");
};

const sourceFromFile = (file: string): string => file.replace(/^.*?content\//, "content/");

const loadCollection = <T extends ProductEntry | SprayEntry | SpecialEntry>(modules: JsonModules, kind: "products" | "sprays" | "specials"): T[] => {
  const entries = Object.entries(modules).map(([file, value]) => parseCatalogEntry(value, kind, sourceFromFile(file), idFromFile(file)) as T);
  assertUniqueIds(entries, `content/${kind}`);
  return sortCatalog(entries);
};

const productModules = import.meta.glob("../../content/products/*.json", { eager: true, import: "default" }) as JsonModules;
const sprayModules = import.meta.glob("../../content/sprays/*.json", { eager: true, import: "default" }) as JsonModules;
const specialModules = import.meta.glob("../../content/specials/*.json", { eager: true, import: "default" }) as JsonModules;

export const catalog: Catalog = {
  products: loadCollection<ProductEntry>(productModules, "products"),
  sprays: loadCollection<SprayEntry>(sprayModules, "sprays"),
  specials: loadCollection<SpecialEntry>(specialModules, "specials"),
};

export const visibleCatalog: Catalog = {
  products: catalog.products.filter((entry) => entry.visible),
  sprays: catalog.sprays.filter((entry) => entry.visible),
  specials: catalog.specials.filter((entry) => entry.visible),
};
