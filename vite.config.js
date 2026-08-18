import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({

    plugins: [
        VitePWA({
            registerType: "autoUpdate",
            injectRegister: "auto",
            includeAssets: [
                "smartoffice-icon-192-white.png",
                "smartoffice-icon-512-white.png"
            ],

            manifest: {
                name: "SmartOffice V2",
                short_name: "SmartOffice V2",
                description:
                    "Smart Office Puskesmas",
                lang: "id-ID",
                start_url: "/",
                scope: "/",
                display: "standalone",
                orientation:
                    "portrait-primary",
                background_color:
                    "#ffffff",
                theme_color:
                    "#ffffff",
                icons: [
                    {
                        src:
                            "/smartoffice-icon-192-white.png",
                        sizes:
                            "192x192",
                        type:
                            "image/png",
                        purpose:
                            "any"
                    },

                    {
                        src:
                            "/smartoffice-icon-512-white.png",
                        sizes:
                            "512x512",
                        type:
                            "image/png",
                        purpose:
                            "any"
                    }
                ]
            },

            workbox: {
                cleanupOutdatedCaches:
                    true,
                clientsClaim:
                    true,
                skipWaiting:
                    true
            }
        })
    ]
});