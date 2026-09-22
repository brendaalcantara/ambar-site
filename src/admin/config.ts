const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const basePath = import.meta.env.BASE_URL || "/";
const origin = window.location.origin;
const normalizedBasePath = trimSlashes(basePath);
const siteUrl = normalizedBasePath ? `${origin}/${normalizedBasePath}` : origin;
const authEndpoint = normalizedBasePath ? `${normalizedBasePath}/api/auth` : "api/auth";

const imagePositionOptions = [
  "left top",
  "left center",
  "left bottom",
  "center top",
  "center 50%",
  "center bottom",
  "right top",
  "right center",
  "right bottom",
  "center 55%",
  "center 56%",
  "center 57%",
  "center 58%",
  "center 59%",
  "center 60%",
  "center 61%",
  "center 62%",
  "center 63%",
  "center 64%",
];

const baseFields = [
  {
    label: "ID estável",
    name: "id",
    widget: "uuid",
    required: true,
    hint: "Gerado uma vez para manter links e integrações estáveis.",
    read_only: true,
  },
  {
    label: "Nome",
    name: "name",
    widget: "string",
    required: true,
    pattern: ["^.{1,80}$", "Use entre 1 e 80 caracteres."],
  },
  {
    label: "Imagem",
    name: "image",
    widget: "image-crop",
    required: true,
    hint: "JPEG, PNG ou WebP. Até 15 MB e 40 megapixels; o painel converte para WebP.",
  },
  {
    label: "Texto alternativo da imagem",
    name: "imageAlt",
    widget: "string",
    required: true,
    pattern: ["^.{1,160}$", "Descreva a imagem em até 160 caracteres."],
  },
  {
    label: "Enquadramento",
    name: "imagePosition",
    widget: "select",
    required: true,
    options: imagePositionOptions,
    default: "center 50%",
    hint: "Ajusta o ponto focal sem alterar a imagem original.",
  },
  {
    label: "Visível no catálogo",
    name: "visible",
    widget: "boolean",
    default: true,
    hint: "Desative para ocultar temporariamente sem apagar o registro.",
  },
  {
    label: "Ordem",
    name: "order",
    widget: "number",
    value_type: "int",
    min: 0,
    default: 10,
    hint: "Menor número aparece primeiro.",
  },
];

const productFields = [
  ...baseFields,
  { label: "Descrição", name: "description", widget: "text", required: true, pattern: ["^.{1,500}$", "Use até 500 caracteres."] },
  { label: "Intenção", name: "mood", widget: "select", required: true, options: ["acolhimento", "leveza", "energia", "natureza"] },
  { label: "Nome da intenção", name: "moodLabel", widget: "string", required: true },
  { label: "Notas olfativas", name: "notes", widget: "string", required: true },
  { label: "Formatos", name: "formats", widget: "string", required: true },
  { label: "Cor de destaque", name: "accent", widget: "color", required: true, enableAlpha: false },
];

const sprayFields = [
  ...baseFields,
  { label: "Descrição", name: "description", widget: "text", required: false, hint: "Opcional em registros migrados; novos textos podem ser adicionados aqui." },
  { label: "Perfil olfativo", name: "profile", widget: "string", required: true },
];

const specialFields = [
  ...baseFields,
  { label: "Descrição", name: "description", widget: "text", required: true, pattern: ["^.{1,500}$", "Use até 500 caracteres."] },
  { label: "Linha", name: "line", widget: "string", required: true },
];

const folderCollection = (name: string, label: string, folder: string, fields: unknown[]) => ({
  name,
  label,
  folder,
  create: true,
  delete: true,
  format: "json",
  identifier_field: "name",
  slug: "{{id}}",
  editor: { preview: true },
  fields,
});

export const decapConfig = {
  backend: {
    name: "github",
    repo: "brendaalcantara/ambar-site",
    branch: "main",
    base_url: origin,
    site_domain: siteUrl,
    auth_endpoint: authEndpoint,
    auth_scope: "public_repo",
  },
  local_backend: false,
  locale: "pt",
  publish_mode: "simple",
  site_url: siteUrl,
  display_url: siteUrl,
  media_folder: "public/uploads",
  public_folder: "/uploads",
  collections: [
    folderCollection("products", "Velas", "content/products", productFields),
    folderCollection("sprays", "Home sprays", "content/sprays", sprayFields),
    folderCollection("specials", "Edições especiais", "content/specials", specialFields),
  ],
};

export const adminRuntime = {
  origin,
  siteUrl,
  basePath,
  authEndpoint,
};
