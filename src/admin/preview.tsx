import type { CSSProperties, ReactNode } from "react";

type PreviewProps = {
  entry: { getIn?: (path: string[]) => unknown };
  getAsset?: (path: string) => { url?: string };
};

const read = (entry: PreviewProps["entry"], key: string) => {
  const value = entry.getIn?.(["data", key]);
  return value === undefined || value === null ? "" : String(value);
};

const imageFor = (path: string, getAsset?: PreviewProps["getAsset"]) => {
  if (!path) return "";
  try {
    return getAsset?.(path)?.url || path;
  } catch {
    return path;
  }
};

const pageStyle: CSSProperties = { minHeight: "100vh", padding: "32px", background: "#f7f3ed", color: "#32251e", fontFamily: "Georgia, serif" };
const cardStyle: CSSProperties = { maxWidth: "620px", margin: "0 auto", borderRadius: "20px", overflow: "hidden", background: "#fffaf4", boxShadow: "0 12px 32px rgba(50,37,30,.12)" };
const copyStyle: CSSProperties = { padding: "24px 26px 30px" };

function CatalogPreview({ entry, getAsset, kind }: PreviewProps & { kind: "product" | "spray" | "special" }) {
  const name = read(entry, "name");
  const image = imageFor(read(entry, "image"), getAsset);
  const position = read(entry, "imagePosition") || "center 50%";
  const description = read(entry, "description");
  const imageStyle: CSSProperties = { width: "100%", aspectRatio: "4 / 3", objectFit: "cover", objectPosition: position, display: "block", background: "#dfd4c7" };
  let metadata: ReactNode = null;
  if (kind === "product") metadata = <p>{read(entry, "moodLabel")} · {read(entry, "notes")} · {read(entry, "formats")}</p>;
  if (kind === "spray") metadata = <p>Home spray · {read(entry, "profile")}</p>;
  if (kind === "special") metadata = <p>{read(entry, "line")}</p>;
  return (
    <main style={pageStyle}>
      <article style={cardStyle}>
        {image ? <img src={image} alt={read(entry, "imageAlt") || name} style={imageStyle} /> : <div style={{ ...imageStyle, display: "grid", placeItems: "center" }}>Escolha uma imagem</div>}
        <div style={copyStyle}>
          <small style={{ letterSpacing: ".16em", textTransform: "uppercase", color: "#8b5f40" }}>{kind === "product" ? "Vela aromática" : kind === "spray" ? "Home spray" : "Edição especial"}</small>
          <h1 style={{ margin: "10px 0", fontSize: "34px", fontWeight: 400 }}>{name || "Nome do item"}</h1>
          {description && <p style={{ lineHeight: 1.7, color: "#67574d" }}>{description}</p>}
          <div style={{ lineHeight: 1.6, color: "#8b5f40", fontSize: "13px" }}>{metadata}</div>
        </div>
      </article>
    </main>
  );
}

export const ProductPreview = (props: PreviewProps) => <CatalogPreview {...props} kind="product" />;
export const SprayPreview = (props: PreviewProps) => <CatalogPreview {...props} kind="spray" />;
export const SpecialPreview = (props: PreviewProps) => <CatalogPreview {...props} kind="special" />;
