import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/index.ts",
	format: ["esm"],
	platform: "node",
	target: "node20",
	outDir: "dist",
	clean: true,
	sourcemap: true,
	dts: false,
	banner: {
		js: `
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);`,
	},
});
