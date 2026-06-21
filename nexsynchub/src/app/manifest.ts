import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexSyncHub",
    short_name: "NexSyncHub",
    description: "NexSyncHub brings chat, tasks, documents, and workspaces into one calm, fast, and focused environment.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
