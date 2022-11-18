import { emptyDirSync } from "https://deno.land/std/fs/mod.ts"
import { basename } from "https://deno.land/std/path/mod.ts"
import { build } from "https://deno.land/x/dnt/mod.ts"
import { PackageJsonObject } from "https://deno.land/x/dnt@0.31.0/lib/types.ts"

const npm_dir = "./npm/"
const main_entrypoint = "./src/mod.ts"
const sub_entrypoints = [
	"./src/browser.ts",
	"./src/crypto.ts",
	"./src/devdebug.ts",
	"./src/eightpack.ts",
	"./src/image.ts",
	"./src/lambdacalc.ts",
	"./src/numericarray.ts",
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
	},
}
const typedoc = {
	$schema: "https://typedoc.org/schema.json",
	entryPoints: [main_entrypoint, ...sub_entrypoints],
	out: "./docs/",
}

const deno_package = JSON.parse(Deno.readTextFileSync("./deno.json"))
const npm_package_partial: PackageJsonObject = { name: "", version: "0.0.0" }
{
	const { name, version, description, author, license, repository, bugs, devDependencies } = deno_package
	Object.assign(npm_package_partial, { name, version, description, author, license, repository, bugs, devDependencies })
	npm_package_partial.scripts = {
		"build-docs": "npx typedoc"
	}
}
emptyDirSync(npm_dir)
await build({
	entryPoints: [
		main_entrypoint,
		...sub_entrypoints.map(path => ({ name: "./" + basename(path, ".ts"), path: path })),
	],
	outDir: npm_dir,
	shims: {},
	packageManager: deno_package.node_packageManager,
	package: {
		...npm_package_partial
	},
	compilerOptions: deno_package.compilerOptions,
	typeCheck: false,
	declaration: true,
	esModule: true,
	scriptModule: false,
})

// copy other files
Deno.copyFileSync("./readme.md", npm_dir + "readme.md")
Deno.writeTextFileSync(npm_dir + "tsconfig.json", JSON.stringify(tsconfig))
Deno.writeTextFileSync(npm_dir + "typedoc.json", JSON.stringify(typedoc))
