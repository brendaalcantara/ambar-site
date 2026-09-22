import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent } from "react";
import { adminRuntime } from "./config";
import { fileSizeLabel, ImageProcessingError, processImageFile } from "./image-processing";
import type { CropRatio } from "./image-processing";

type ImageControlProps = {
  value?: string;
  field?: { get?: (key: string) => unknown };
  onChange: (value: string) => void;
  onPersistMedia?: (file: File, options: { field?: unknown }) => Promise<unknown>;
  getAsset?: (path: string) => { url?: string };
  forID?: string;
  classNameWrapper?: string;
  entry?: { get?: (key: string) => unknown };
};

const publicPath = (value: string) => {
  const normalized = value.replace(/^\/+/, "").replace(/^public\//, "");
  return `${adminRuntime.basePath}${normalized}`.replace(/([^:]\/)\/+/, "$1");
};

const persistedPath = (result: any) => {
  const file = result?.payload?.file ?? result?.payload ?? result?.file ?? result;
  const path = typeof file?.path === "string" ? file.path : typeof file?.url === "string" ? file.url : "";
  return path.replace(/^\/+/, "").replace(/^public\//, "");
};

const assetUrl = (value: string | undefined, getAsset?: ImageControlProps["getAsset"]) => {
  if (!value) return "";
  try {
    const asset = getAsset?.(value);
    if (asset?.url) return asset.url;
  } catch {
    // A missing media entry is shown as an empty preview and can be replaced.
  }
  return publicPath(value);
};

const focusFromPointer = (event: PointerEvent<HTMLDivElement>) => {
  const bounds = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.round(Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100))),
    y: Math.round(Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100))),
  };
};

export function ImageCropControl({ value, field, onChange, onPersistMedia, getAsset, forID, classNameWrapper, entry }: ImageControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [focusX, setFocusX] = useState(50);
  const [focusY, setFocusY] = useState(50);
  const [ratio, setRatio] = useState<CropRatio>("original");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const existingUrl = useMemo(() => assetUrl(value, getAsset), [value, getAsset]);
  const imageUrl = previewUrl || existingUrl;
  const stableId = typeof entry?.get === "function" ? String(entry.get("slug") || entry.get("path") || "imagem") : "imagem";
  const fieldName = typeof field?.get === "function" ? String(field.get("name") || "image") : "image";

  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    if (!next) return;
    setError("");
    setMessage(`Pré-visualização pronta · ${fileSizeLabel(next.size)}`);
    setSelectedFile(next);
    setFocusX(50);
    setFocusY(50);
    event.target.value = "";
  };

  const moveFocus = (event: PointerEvent<HTMLDivElement>) => {
    if (!selectedFile) return;
    const next = focusFromPointer(event);
    setFocusX(next.x);
    setFocusY(next.y);
  };

  const startFocusDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!selectedFile) return;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveFocus(event);
  };

  const continueFocusDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) moveFocus(event);
  };

  const endFocusDrag = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const saveImage = async () => {
    if (!selectedFile) return;
    setBusy(true);
    setError("");
    setMessage("Preparando imagem…");
    try {
      if (!onPersistMedia) throw new ImageProcessingError("O editor não disponibilizou o salvamento de mídia nesta sessão.");
      const prepared = await processImageFile(selectedFile, { focusX, focusY, ratio });
      const result = await onPersistMedia(prepared, { field });
      const path = persistedPath(result);
      if (!path) throw new ImageProcessingError("O editor não retornou o caminho do arquivo processado.");
      onChange(path);
      setSelectedFile(null);
      setPreviewUrl("");
      setMessage(`Imagem preparada e anexada · ${prepared.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível processar a imagem.");
      setMessage("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`ambar-image-control ${classNameWrapper || ""}`}>
      <div
        className="ambar-image-control__preview"
        onPointerDown={startFocusDrag}
        onPointerMove={continueFocusDrag}
        onPointerUp={endFocusDrag}
        onPointerCancel={endFocusDrag}
        role="img"
        aria-label="Pré-visualização e ponto focal da imagem"
        style={imageUrl ? { backgroundImage: `url("${imageUrl}")`, backgroundPosition: `${focusX}% ${focusY}%` } : undefined}
      >
        {!imageUrl && <span>Escolha uma foto para visualizar</span>}
        {selectedFile && <span className="ambar-image-control__focus">Ponto focal: {focusX}% · {focusY}%</span>}
      </div>
      <div className="ambar-image-control__actions">
        <input ref={inputRef} id={forID} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={chooseFile} hidden />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>{selectedFile ? "Trocar foto" : value ? "Trocar imagem" : "Escolher foto"}</button>
        {selectedFile && <button type="button" onClick={saveImage} disabled={busy}>{busy ? "Processando…" : "Preparar e anexar"}</button>}
      </div>
      {selectedFile && (
        <div className="ambar-image-control__settings">
          <label>Foco horizontal <input type="range" min="0" max="100" value={focusX} onChange={event => setFocusX(Number(event.target.value))} /></label>
          <label>Foco vertical <input type="range" min="0" max="100" value={focusY} onChange={event => setFocusY(Number(event.target.value))} /></label>
          <label>Enquadramento
            <select value={ratio} onChange={event => setRatio(event.target.value as CropRatio)}>
              <option value="original">Manter proporção original</option>
              <option value="4:5">Retrato 4:5</option>
              <option value="4:3">Paisagem 4:3</option>
              <option value="1:1">Quadrado 1:1</option>
            </select>
          </label>
          <small>Toque ou arraste na prévia para mover o ponto focal. Com a proporção original, escolha um recorte para aplicar esse foco ao arquivo. Os controles também aceitam teclado.</small>
        </div>
      )}
      {message && <p className="ambar-image-control__message" role="status">{message}</p>}
      {error && <p className="ambar-image-control__error" role="alert">{error}</p>}
      <small className="ambar-image-control__hint">{stableId} · campo {fieldName} · imagens antigas permanecem intactas até serem substituídas.</small>
    </div>
  );
}

export function ImageCropPreview({ value, getAsset }: { value?: string; getAsset?: ImageControlProps["getAsset"] }) {
  const url = assetUrl(value, getAsset);
  return url ? <img className="ambar-image-preview" src={url} alt="Prévia da imagem do catálogo" /> : <span>Sem imagem</span>;
}
