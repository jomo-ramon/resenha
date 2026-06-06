import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "resenha — plataforma da sua pelada",
    short_name: "resenha",
    description: "Organize sua pelada de futebol: lista de presença, times e ranking.",
    start_url: "/peladas",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#18181b",
    orientation: "portrait",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
