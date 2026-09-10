import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        VitePWA({
            strategies: "generateSW",
            registerType: "autoUpdate",
            injectRegister: "auto",

            includeAssets: [
                "smartoffice-icon-192-maskable.png",
                "smartoffice-icon-512-maskable.png",
                "smartoffice-icon-192-white.png",
                "smartoffice-icon-512-white.png",
                "firebase-messaging-sw.js"
            ],

            workbox: {
                importScripts: [
                    "firebase-messaging-sw.js"
                ]
            },

            manifest: {
                name: "SmartOffice V2",
                short_name: "SmartOffice V2",
                description: "Smart Office Puskesmas",
                lang: "id-ID",
                start_url: "/",
                scope: "/",
                display: "standalone",
                orientation: "portrait-primary",
                background_color: "#ffffff",
                theme_color: "#ffffff",

                icons: [
                    {
                        src: "/smartoffice-icon-192-maskable.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "maskable"
                    },
                    {
                        src: "/smartoffice-icon-512-maskable.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable"
                    }
                ]
            }
        })
    ]
});