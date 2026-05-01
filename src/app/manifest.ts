import type { MetadataRoute } from "next";
import { BRAND_DESCRIPTION } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "댕냥지도",
    short_name: "댕냥지도",
    description: BRAND_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#fbf6f0",
    theme_color: "#1f4a40",
    lang: "ko",
  };
}