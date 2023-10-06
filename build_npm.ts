import { emptyDirSync } from "https://deno.land/std/fs/mod.ts"
import { basename } from "https://deno.land/std/path/mod.ts"
import { build } from "https://deno.land/x/dnt@0.38.1/mod.ts"
import { PackageJson } from "https://deno.land/x/dnt@0.38.1/lib/types.ts"

/** use:
 * - `"/"` for localhost (default if unspecified in `Deno.args`)
 * - `"/kitchensink_ts/"` for github pages
*/
const site_root = Deno.args[0] ?? "/"
const npm_dir = "./npm/"
const main_entrypoint: string = "./src/mod.ts"
const sub_entrypoints: string[] = [
	"./src/array2d.ts",
	"./src/binder.ts",
	"./src/browser.ts",
	"./src/builtin_aliases_deps.ts",
	"./src/builtin_aliases.ts",
	"./src/collections.ts",
	"./src/crypto.ts",
	"./src/devdebug.ts",
	"./src/dotkeypath.ts",
	"./src/eightpack.ts",
	"./src/eightpack_varint.ts",
	"./src/formattable.ts",
	"./src/image.ts",
	"./src/lambdacalc.ts",
	"./src/mapper.ts",
	"./src/numericarray.ts",
	"./src/numericmethods.ts",
	"./src/stringman.ts",
	"./src/struct.ts",
	"./src/typedbuffer.ts",
	"./src/typedefs.ts",
]
const tsconfig = {
	"$schema": "https://json.schemastore.org/tsconfig",
	compilerOptions: {
		lib: ["ESNext", "DOM"],
		target: "ESNext",
		strict: true,
		allowJs: true,
		forceConsistentCasingInFileNames: true,
		skipLibCheck: true,
		moduleResolution: "nodenext",
	},
}
const typedoc = {
	$schema: "https://typedoc.org/schema.json",
	entryPoints: [main_entrypoint, ...sub_entrypoints],
	out: "./docs/",
	readme: "./src/readme.md",
	sidebarLinks: {
		"github": "",
		"readme": site_root,
		/*
		"array2d": site_root + "modules/array2d.html",
		"binder": site_root + "modules/binder.html",
		"browser": site_root + "modules/browser.html",
		"builtin_aliases": site_root + "modules/builtin_aliases.html",
		"collections": site_root + "modules/collections.html",
		"crypto": site_root + "modules/crypto.html",
		"devdebug": site_root + "modules/devdebug.html",
		"dotkeypath": site_root + "modules/dotkeypath.html",
		"eightpack": site_root + "modules/eightpack.html",
		"eightpack_varint": site_root + "modules/eightpack_varint.html",
		"formattable": site_root + "modules/formattable.html",
		"image": site_root + "modules/image.html",
		"lambdacalc": site_root + "modules/lambdacalc.html",
		"mapper": site_root + "modules/mapper.html",
		"numericarray": site_root + "modules/numericarray.html",
		"numericmethods": site_root + "modules/numericmethods.html",
		"stringman": site_root + "modules/stringman.html",
		"struct": site_root + "modules/struct.html",
		"typedbuffer": site_root + "modules/typedbuffer.html",
		"typedefs": site_root + "modules/typedefs.html",
		*/
	},
	skipErrorChecking: true,
	githubPages: true,
	includeVersion: true,
	sort: ["source-order", "required-first", "kind"],
}

const deno_package = JSON.parse(Deno.readTextFileSync("./deno.json"))
const npm_package_partial: PackageJson = { name: "", version: "0.0.0" }
{
	const { name, version, description, author, license, repository, bugs, devDependencies, compilerOptions } = deno_package
	Object.assign(npm_package_partial, { name, version, description, author, license, repository, bugs, devDependencies })
	typedoc.sidebarLinks.github = repository.url.replace("git+", "").replace(".git", "")
	npm_package_partial.scripts = {
		"build-docs": `npx typedoc`,
		"build-dist": `npm run build-esm && npm run build-esm-minify && npm run build-iife && npm run build-iife-minify`,
		"build-esm": `npx esbuild "${main_entrypoint}" --bundle --format=esm --outfile="./dist/${name}.esm.js"`,
		"build-esm-minify": `npx esbuild "${main_entrypoint}" --bundle --minify --format=esm --outfile="./dist/${name}.esm.min.js"`,
		"build-iife": `npx esbuild "${main_entrypoint}" --bundle --format=iife --outfile="./dist/${name}.iife.js"`,
		"build-iife-minify": `npx esbuild "${main_entrypoint}" --bundle --minify --format=iife --outfile="./dist/${name}.iife.min.js"`,
	}
	compilerOptions.lib = (compilerOptions.lib as string[]).filter((v) => v.toLowerCase() !== "deno.ns")
}
emptyDirSync(npm_dir)
await build({
	entryPoints: [
		main_entrypoint,
		...sub_entrypoints.map(path => ({ name: "./" + basename(path, ".ts"), path: path })),
	],
	outDir: npm_dir,
	shims: { deno: true },
	packageManager: deno_package.node_packageManager,
	package: {
		...npm_package_partial
	},
	compilerOptions: deno_package.compilerOptions,
	typeCheck: false,
	declaration: "inline",
	esModule: true,
	scriptModule: false,
	test: false,
})

// copy other files
Deno.copyFileSync("./src/readme.md", npm_dir + "src/readme.md")
Deno.copyFileSync("./src/readme.md", npm_dir + "readme.md")
Deno.copyFileSync("./src/license.md", npm_dir + "license.md")
Deno.copyFileSync("./.github/code_of_conduct.md", npm_dir + "code_of_conduct.md")
Deno.writeTextFileSync(npm_dir + ".gitignore", "/node_modules/\n")
Deno.writeTextFileSync(npm_dir + "tsconfig.json", JSON.stringify(tsconfig))
Deno.writeTextFileSync(npm_dir + "typedoc.json", JSON.stringify(typedoc))
Deno.writeTextFileSync(npm_dir + ".npmignore", `
code_of_conduct.md
dist/
docs/
test/
tsconfig.json
typedoc.json
`, { append: true })
