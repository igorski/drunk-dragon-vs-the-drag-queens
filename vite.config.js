import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import vue from "@vitejs/plugin-vue2";
import path from "path";

const dirSrc    = `./src`;
const dirPublic = `${dirSrc}/public`;
const dirAssets = `${dirSrc}/assets`;
const dest      = `${__dirname}/dist`;

// https://vitejs.dev/config/
export default defineConfig({
    base: "./",
    plugins: [
        vue(),
        viteStaticCopy({
            targets: [
                { src: `${dirAssets}/animations/**/*`,      dest: "assets/animations" },
                { src: `${dirAssets}/characters/**/*`,      dest: "assets/characters" },
                { src: `${dirAssets}/illustrations/**/*`,   dest: "assets/illustrations" },
                { src: `${dirAssets}/sprites/**/*`,         dest: "assets/sprites" },
                {
                    src: dirPublic,
                    dest: path.resolve( dest ),
                }
            ]
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve( __dirname, "./src" ),
        },
    },
});
