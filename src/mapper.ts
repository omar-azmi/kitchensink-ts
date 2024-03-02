/** utility functions for mapping generic arrays and objects (records/dictionaries) <br>
 * to utilize the strict-narrow typing features of this submodule, you will have to write your mapping functions in a certain way. <br>
 * moreover you will need to use `typescript 4.9`'s `satisfies` operator for further better type checking.
 * @module
*/

/** represents an `Object` consisting of a collection of single-parameter functions that map the entries of type `R` to entries of type `U` <br>
 * however, if `U` does not contain a certain key that's in `R`, then we will assume that it is being mapped to a single default type `D` <br>
 * to give you an idea, here is a flawed example: (more is covered on the flaw right after)
 * @example
 * ```ts
 * declare RepeatedNamesDB: { name: string, repeatitions: number}
 * const my_stats_v1 = {name: "haxxor", game: "league of fools and falafel", fame: 505, tame: false, lame: ["yes", 735]}
 * const stats_v1_to_v2: RecordMapper<typeof my_stats_v1> = {
 * 	name: (s) => {
 * 		// `s` is automatically inferred as a `string`, thanks to `typeof my_stats_v1` generic parameter
 * 		let rep = RepeatedNamesDB[s]++
 * 		return [s, rep]
 * 	},
 * 	game: (s) => s,
 * 	fame: (v) => v * 1.5,
 * 	tame: (b) => undefined,
 * 	lame: (a) => ({
 * 		current_status: a[0] === "yes" ? true : false,
 * 		bad_reputation_history: [["pre-v2", a[1]], ["original-sin", 5], ]
 * 	})
 * }
 * ```
 * uh oh, did you notice the problem? the IDE thinks that `stats_v1_to_v2` maps each entry of `my_stats_v1` to `unknown`. <br>
 * you must provide a second type parameter that specifies the new type of each entry (which in this context would be `stats_v2`). <br>
 * @example
 * ```ts
 * // declare RepeatedNamesDB; const my_stats_v1 = {...};
 * type my_stats_v2 = {
 * 	name: [string, number],
 * 	game: string,
 * 	fame: number,
 * 	tame: undefined,
 * 	lame: {
 * 		current_status: boolean,
 * 		bad_reputation_history: Array<[occasion: string, value: number]>
 * 	}
 * }
 * const stats_v1_to_v2: RecordMapper<typeof my_stats_v1, my_stats_v2> = {
 * 	// just as before
 * }
 * ```
 * but this is a lot of repetition in typing, and the additional type will be utterly useless if it's not being used elsewhere. <br>
 * luckily, with the introduction of the `satisfies` operator in `tsc 4.9`, you can be far more consise:
 * @example
 * ```ts
 * declare RepeatedNamesDB: { name: string, repeatitions: number}
 * const my_stats_v1 = {name: "haxxor", game: "league of fools and falafel", fame: 505, tame: false, lame: ["yes", 735]}
 * // the map function parameters `s`, `v`, `b`, and `a` all have their types automatically inferred thanks to the `satisfies` operator
 * // `stats_v1_to_v2` now indeed maps the correct `stats_v2` interface
 * const stats_v1_to_v2 = {
 * 	name: (s) => {
 * 		let rep = RepeatedNamesDB[s]++
 * 		return [s, rep]
 * 	},
 * 	game: (s) => s,
 * 	fame: (v) => v * 1.5,
 * 	tame: (b) => undefined,
 * 	lame: (a) => ({
 * 		current_status: a[0] === "yes" ? true : false,
 * 		bad_reputation_history: [["pre-v2", a[1]], ["original-sin", 5], ]
 * 	})
 * } satisfies RecordMapper<typeof my_stats_v1>
 * ```
 * now, for an example that uses the `D` default type generic parameter (3rd parameter):
 * @example
 * ```ts
 * const now_i_know_my = { a: 1, b: 2, c: 3, s: "nein" }
 * const latin_to_greek: RecordMapper<
 * 	typeof now_i_know_my, // these are the inputs that will be mapped
 * 	{ s: number },        // entry `"s"` will be mapped to a `number`
 * 	string                // all other entries will be mapped to `string`
 * > = {
 * 	a: (v) => `${v}-alpha`,
 * 	b: (v) => `${v}-beta`,
 * 	c: (v) => `${v}-theta`,
 * 	s: (v) => 9
 * }
 * ```
*/
export type RecordMapper<
	R,
	U extends { [K in keyof R]?: any } = { [K in keyof R]: unknown },
	D extends any = unknown,
> = { [K in keyof R]: (value: R[K]) => unknown extends U[K] ? D : U[K] }

/** this is analogous to {@link RecordMapper}, except now, we deal with variable number of argument parameters instead of just one. <br>
 * as a compromise, `R` now has to contain `Array`s as its entry values.
 * @example
 * ```ts
 * type Vec1 = [number]
 * type Vec2 = [number, number]
 * type Vec3 = [number, number, number]
 * const now_i_know_my = { a: [1] as Vec1, b: [2, 2] as Vec2, c: [3, 4, 5] as Vec3, s: ["nein" as string, "mein", "fuhrer"] as const }
 * const fuhrer_mapper: RecordArgsMapper<typeof now_i_know_my, { s: [string | 9, ...any[]] }, number> = {
 * 	a: (v0) => v0 ** 2,
 * 	b: (...vs) => vs[0] + vs[1] ** 2,
 * 	c: (v0, v1, v2) => v0 ** 0.5 + v1 + v2 ** 2,
 * 	s: (arg0, ...args) => [arg0 === "nein" ? 9 : arg0, ...args]
 * }
 * ```
*/
export type RecordArgsMapper<
	R extends Record<any, readonly any[]>,
	U extends { [K in keyof R]?: any } = { [K in keyof R]: unknown },
	D extends any = unknown,
> = { [K in keyof R]: (...args: R[K]) => [] extends U[K] ? D : U[K] }

/** applies the function `mapping_funcs[K]` to input `input_data[K]`, for every key `K in mapping_funcs` <br>
 * see {@link RecordMapper} to get an understanding of what `mapping_funcs` is supposed to look like, and how to type it. <br>
 * moreover, the 3 generic parameters (`R`, `U`, `D`) used here are the same as the ones at {@link RecordMapper}, so check it out. <br>
 * @example
 * ```ts
 * const now_i_know_my = { a: 1, b: 2, c: 3, s: "nein" }
 * const now_i_know_my_greek = recordMap({
 * 	a: (v) => `${v}-alpha`,
 * 	b: (v) => `${v}-beta`,
 * 	c: (v) => `${v}-theta`,
 * 	s: (v) => 9
 * }, now_i_know_my)
 * // assert typeof now_i_know_my_greek extends { a: string, b: string, c: string, s: number }
 * console.debug(now_i_know_my_greek) // { a: "1-alpha", b: "2-beta", c: "theta", s: 9 }
 * ```
*/
export const recordMap = <
	R,
	U extends { [K in keyof R]: any } = { [K in keyof R]: unknown },
	D extends any = unknown,
	F extends RecordMapper<R, U, D> = RecordMapper<R, U, D>
>(mapping_funcs: F, input_data: R): { [K in keyof R]: ReturnType<F[K]> } => {
	const out_data: { [key: PropertyKey]: any } = {}
	for (const k in (mapping_funcs as { [key in keyof R]: any })) out_data[k] = mapping_funcs[k](input_data[k])
	//for (const [k, fn] of Object.entries(mapping_funcs) as ([keyof R, F[keyof R]])[]) out_data[k] = fn(input_data[k] as any) as typeof out_data[keyof R]
	return out_data as { [K in keyof R]: ReturnType<F[K]> }
}

/** similar to {@link recordMap}, but made for variable number of function argument parameters. <br>
 * also see {@link RecordArgsMapper} to get an understanding of what `mapping_funcs` is supposed to look like, and how to type it. <br>
 * @example
 * ```ts
 * type Vec1 = [number]
 * type Vec2 = [number, number]
 * type Vec3 = [number, number, number]
 * const now_i_know_my = { a: [1] as Vec1, b: [2, 2] as Vec2, c: [3, 4, 5] as Vec3, s: ["nein" as string, "mein", "fuhrer"] as const }
 * const now_i_know_my_fuhrer = recordArgsMap({
 * 	a: (v0) => v0 ** 2,
 * 	b: (...vs) => vs[0] + vs[1] ** 2,
 * 	c: (v0, v1, v2) => v0 ** 0.5 + v1 + v2 ** 2,
 * 	s: (arg0, ...args) => [arg0 === "nein" ? 9 : arg0, ...args] as const
 * }, now_i_know_my)
 * // assert typeof now_i_know_my_fuhrer extends { a: number, b: number, c: number, s: readonly [string | 9, "mein", "fuhrer"] }
 * console.debug(now_i_know_my_fuhrer) // { a: 1, b: 6, c: 30.732050807568875, s: [9, "mein", "fuhrer"] }
*/
export const recordArgsMap = <
	R extends Record<any, readonly any[]>,
	U extends { [K in keyof R]: any } = { [K in keyof R]: unknown },
	D extends any = unknown,
	F extends RecordArgsMapper<R, U, D> = RecordArgsMapper<R, U, D>
>(mapping_funcs: F, input_args: R): { [K in keyof R]: ReturnType<F[K]> } => {
	const out_data: { [key: PropertyKey]: any } = {}
	for (const k in (mapping_funcs as { [key in keyof R]: any })) out_data[k] = mapping_funcs[k](...input_args[k])
	return out_data as { [K in keyof R]: ReturnType<F[K]> }
}

/** self explanatory analogue to {@link RecordMapper}, except for `Arrays`
 * @example
 * ```ts
 * const vec5 = [1, 2, "halla", 4, 5] as const
 * const vecc: SequenceMapper<typeof vec5, [unknown, unknown, string, unknown, unknown], number> = [
 * 	(v) => v + 4,
 * 	(v) => v + 3,
 * 	(s) => s === "halla" ? "hello" : "un-greetful",
 * 	(v) => v + 1,
 * 	(v) => v + 0,
 * ]
 * // assert typeof vax extends [(value: 1) => number, (value: 2) => number, (value: "halla") => string, (value: 4) => number, (value: 5) => number]
 * ```
*/
export type SequenceMapper<
	A extends readonly unknown[],
	U extends { [K in keyof A]?: any } = { [K in keyof A]: unknown },
	D extends any = unknown,
> = { [K in keyof A]: (value: A[K]) => unknown extends U[K] ? D : U[K] }

/** self explanatory analogue to {@link RecordArgsMapper}, except for `Arrays` */
export type SequenceArgsMapper<
	A extends readonly unknown[][],
	U extends { [K in keyof A]?: any } = { [K in keyof A]: unknown },
	D extends any = unknown,
> = { [K in keyof A]: (...args: A[K]) => [] extends U[K] ? D : U[K] }

/**
 * @example
 * ```ts
 * const vec3 = [1, 2, "halla"] as const
 * const vecc = sequenceMap<typeof vec3, [unknown, unknown, string], boolean>([
 * 	(v) => v + 4 > 0 ? true : false,
 * 	(v) => v + 3 > 100 ? true : false,
 * 	(s) => s === "halla" ? "hello" : "un-greetful"
 * ], vec3)
 * console.debug(vecc) // [true, false, "hello"]
 * ```
*/
export const sequenceMap = <
	A extends readonly unknown[],
	U extends { [K in keyof A]: any } = { [K in keyof A]: unknown },
	D extends any = unknown,
	F extends SequenceMapper<A, U, D> = SequenceMapper<A, U, D>
>(mapping_funcs: F, input_data: A): { [K in keyof A]: ReturnType<F[K]> } => {
	const out_data: Array<unknown> = []
	for (let i = 0; i < mapping_funcs.length; i++) out_data.push(mapping_funcs[i](input_data[i]))
	return out_data as { [K in keyof A]: ReturnType<F[K]> }
}

/** TODO */
export const sequenceArgsMap = <
	A extends readonly unknown[][],
	U extends { [K in keyof A]: any } = { [K in keyof A]: unknown },
	D extends any = unknown,
	F extends SequenceArgsMapper<A, U, D> = SequenceArgsMapper<A, U, D>
>(mapping_funcs: F, input_args: A): { [K in keyof A]: ReturnType<F[K]> } => {
	const out_data: Array<unknown> = []
	for (let i = 0; i < mapping_funcs.length; i++) out_data.push(mapping_funcs[i](...input_args[i]))
	return out_data as { [K in keyof A]: ReturnType<F[K]> }
}
