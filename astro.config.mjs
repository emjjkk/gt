// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel"; 

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  output: "server", // important for API routes
  adapter: vercel(),
  vite: {
    server: {
      allowedHosts: ['lianoid-aracelis-ungroaning.ngrok-free.dev']
    },
    plugins: [tailwindcss()],
  },

  integrations: [react()],
});