import CMS from "decap-cms-app";
import "./admin.css";
import { CatalogGitHubBackend } from "./backend";
import { decapConfig } from "./config";
import { ImageCropControl, ImageCropPreview } from "./image-control";
import { ProductPreview, SprayPreview, SpecialPreview } from "./preview";

CMS.registerWidget("image-crop", ImageCropControl as any, ImageCropPreview as any);
CMS.registerBackend("ambar-github", CatalogGitHubBackend as any);
CMS.registerPreviewTemplate("products", ProductPreview as any);
CMS.registerPreviewTemplate("sprays", SprayPreview as any);
CMS.registerPreviewTemplate("specials", SpecialPreview as any);

CMS.init({ config: decapConfig as any });
