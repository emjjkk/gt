// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  vite: {
    server: {
      allowedHosts: ['lianoid-aracelis-ungroaning.ngrok-free.dev']
    },
    plugins: [tailwindcss()],
  },

  integrations: [react()],
});