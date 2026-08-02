import {
  defineConfig
} from "vite";

import {
  VitePWA
} from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        id: "/",

        name:
          "MSH Patente – Quiz e Teoria",

        short_name:
          "MSH Patente",

        description:
          "Quiz, simulazioni d'esame e teoria per la patente italiana.",

        lang: "it",

        dir: "ltr",

        start_url: "/",

        scope: "/",

        display: "standalone",

        orientation:
          "portrait-primary",

        background_color:
          "#ffffff",

        theme_color:
          "#2563eb",

        categories: [
          "education",
          "productivity"
        ],

        icons: [
          {
            src:
              "/pwa-192x192.png",

            sizes:
              "192x192",

            type:
              "image/png",

            purpose:
              "any"
          },
          {
            src:
              "/pwa-512x512.png",

            sizes:
              "512x512",

            type:
              "image/png",

            purpose:
              "any"
          },
          {
            src:
              "/pwa-maskable-512x512.png",

            sizes:
              "512x512",

            type:
              "image/png",

            purpose:
              "maskable"
          }
        ]
      },

      workbox: {
        cleanupOutdatedCaches: true,

        clientsClaim: true,

        skipWaiting: true,

        navigateFallback:
          "/index.html",

        navigateFallbackDenylist: [
          /^\/__/,
          /^\/api\//
        ],

        /*
         * বড় lesson images precache হবে না।
         * প্রয়োজন হলে runtime-এ load ও cache হবে।
         */
        globIgnores: [
          "images/lessons/**",
          "**/images/lessons/**"
        ],

        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"
        ],

        runtimeCaching: [
          /*
           * Lesson images:
           * প্রথমবার network থেকে load হবে,
           * পরে আলাদা runtime cache থেকে আসবে।
           */
          {
            urlPattern:
              /\/images\/lessons\/.*\.(?:png|jpg|jpeg|webp|gif)$/i,

            handler:
              "CacheFirst",

            options: {
              cacheName:
                "lesson-images-v1",

              cacheableResponse: {
                statuses: [
                  0,
                  200
                ]
              },

              expiration: {
                maxEntries: 300,

                maxAgeSeconds:
                  60 * 60 * 24 * 30
              }
            }
          },

          /*
           * Application pages
           */
          {
            urlPattern: ({
              request
            }) =>
              request.mode ===
              "navigate",

            handler:
              "NetworkFirst",

            options: {
              cacheName:
                "msh-pages",

              networkTimeoutSeconds:
                4,

              expiration: {
                maxEntries:
                  40,

                maxAgeSeconds:
                  60 * 60 * 24 * 7
              },

              cacheableResponse: {
                statuses: [
                  0,
                  200
                ]
              }
            }
          },

          /*
           * Google Fonts styles
           */
          {
            urlPattern:
              /^https:\/\/fonts\.googleapis\.com\/.*/i,

            handler:
              "StaleWhileRevalidate",

            options: {
              cacheName:
                "google-font-styles",

              expiration: {
                maxEntries: 10,

                maxAgeSeconds:
                  60 * 60 * 24 * 30
              }
            }
          },

          /*
           * Google Fonts files
           */
          {
            urlPattern:
              /^https:\/\/fonts\.gstatic\.com\/.*/i,

            handler:
              "CacheFirst",

            options: {
              cacheName:
                "google-font-files",

              expiration: {
                maxEntries: 20,

                maxAgeSeconds:
                  60 * 60 * 24 * 365
              },

              cacheableResponse: {
                statuses: [
                  0,
                  200
                ]
              }
            }
          },

          /*
           * Other images.
           * Lesson images আগের rule-এ match করবে।
           */
          {
            urlPattern: ({
              request,
              url
            }) =>
              request.destination ===
                "image" &&
              !url.pathname.startsWith(
                "/images/lessons/"
              ),

            handler:
              "StaleWhileRevalidate",

            options: {
              cacheName:
                "msh-images",

              expiration: {
                maxEntries: 150,

                maxAgeSeconds:
                  60 * 60 * 24 * 30
              },

              cacheableResponse: {
                statuses: [
                  0,
                  200
                ]
              }
            }
          },

          /*
           * Scripts, styles and fonts
           */
          {
            urlPattern: ({
              request,
              url
            }) =>
              url.origin ===
                self.location.origin &&
              [
                "script",
                "style",
                "font"
              ].includes(
                request.destination
              ),

            handler:
              "StaleWhileRevalidate",

            options: {
              cacheName:
                "msh-static-assets",

              expiration: {
                maxEntries: 100,

                maxAgeSeconds:
                  60 * 60 * 24 * 30
              }
            }
          }
        ]
      },

      devOptions: {
        enabled: false
      }
    })
  ],

  build: {
    sourcemap: false,

    target:
      "es2020",

    cssCodeSplit: true,

    chunkSizeWarningLimit:
      700,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes(
              "node_modules/firebase"
            ) ||
            id.includes(
              "node_modules/@firebase"
            )
          ) {
            return "firebase";
          }

          if (
            id.includes(
              "node_modules/workbox"
            ) ||
            id.includes(
              "node_modules/vite-plugin-pwa"
            )
          ) {
            return "pwa";
          }

          if (
            id.includes(
              "node_modules"
            )
          ) {
            return "vendor";
          }

          return undefined;
        }
      }
    }
  }
});