/** utility functions for creating higher order functions.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import { type BindableFunction } from "./binder.js";
import { HybridTree, type SimpleMap, StrongTree } from "./collections.js";
export declare const THROTTLE_REJECT: unique symbol;
export declare const TIMEOUT: unique symbol;
/** creates a debounced version of the provided function that returns a new promise. <br>
 * the debounced function delays the execution of the provided function `fn` until the debouncing interval `wait_time_ms` amount of time has passed without any subsequent calls. <br>
 * if a `rejection_value` is provided, then any subsequent calls to the debounced function that are made within the debouncing interval, will reject the previous promises.
 * thus you will have to `catch` them in that case. (otherwise it will result in an error) <br>
 * you may worry that too many calls to a non-rejectable debounced function (i.e. when `rejection_value === undefined`)
 * will create too many promise objects, possibly resulting in memory leaks.
 * however, luckily, modern javascript engines are not afflicted by too many pending promise objects.
 * in fact, choosing to reject promises (i.e. by setting `rejection_value`), might be more expensive down the line, as error catching is typically expensive. <br>
 * also check out {@link debounceAndShare}, which avoids this "lots of promise objects" issue by sharing the same promise across all quick callers of the debounce.
 * but it will require careful usage, as all promised callers will eventually get resolved, which may create an unintended avalaunch of subsequent `then` calls if not used carefully.
 *
 * @param wait_time_ms the time interval in milliseconds for debouncing
 * @param fn the function to be debounced
 * @param rejection_value if a rejection value is provided, then old unresolved pending promises will be rejected with the given value,
 * 	 when a new call to the debounced function is made (within the debouncing waiting period)
 * @returns a function (that takes arguments intended for `fn`) that returns a promise, which is resolved once `wait_time_ms` amount of time has passed with no further calls
 *
 * @example
 * ```ts
 * // assume that `sleep(time_ms: number)` is a function that synchronously creates a delay for `time_ms` number of milliseconds
 * const fn = (v: number) => {
 * 	console.log(v)
 * 	return v + 100
 * }
 * const debounced_fn = debounce(1000, fn, "SEPPUKU!")
 * // `a` is a promise that should resolve after 1000ms
 * const a = debounced_fn(24).catch((reason) => { console.log("they want me to ", reason) })
 * sleep(500)
 * // `debounced_fn(42)` rejects `a`'s promise and then returns a new promise (`b`) that will resolve in 1000ms
 * // when `debounced_fn(42)` is called this quickly, promise `a` is first rejected, which results in immediate logging of `"they want me to SEPPUKU!"` in the console
 * const b debounced_fn(42)
 * // then, 1000ms later, you should see "42" in your console (due to promise `b`)
 * sleep(2000)
 * c = debounced_fn(99) // Returns a new promise that resolves after 1000ms
 * // 1000ms later, you should see "99" in your console
 * ```
*/
export declare const debounce: <T extends unknown, ARGS extends any[], REJ>(wait_time_ms: number, fn: (...args: ARGS) => T, rejection_value?: REJ | undefined) => (...args: ARGS) => Promise<T>;
/** creates a debounced version of the provided function that returns a shared promise. <br>
 * unlike conventional {@link debounce}, this function reuses and returns the same promise object for all calls that are made within the debouncing interval. <br>
 * this means that all callers within this interval will receive the same promise, which will be resolved once `wait_time_ms` amount of time has passed with no further calls. <br>
 * if subsequent calls are made within the debouncing interval, the debounced function will return the same promise as before, further delaying its resolution. <br>
 * however, once the debouncing interval has elapsed and the promise is resolved, any new calls to the debounced function will create and return a new promise.
 *
 * @param wait_time_ms the time interval in milliseconds for debouncing
 * @param fn the function to be debounced
 * @returns a function (that takes arguments intended for `fn`) that returns a promise, which is resolved once `wait_time_ms` amount of time has passed with no further calls
 *
 * @example
 * ```ts
 * // assume that `sleep(time_ms: number)` is a function that synchronously creates a delay for `time_ms` number of milliseconds
 * const fn = (v: number) => {
 * 	console.log(v)
 * 	return v + 100
 * }
 * const debounced_fn = debounceAndShare(1000, fn)
 * const a = debounced_fn(24) // returns a promise that resolves after 1000ms
 * sleep(500)
 * const b debounced_fn(42) // returns the same promise as before, but its resolution is delayed by another 1000ms
 * // 1000ms later, you should see "42" in your console
 * sleep(2000)
 * c = debounced_fn(99) // Returns a new promise that resolves after 1000ms
 * // 1000ms later, you should see "99" in your console
 * // notice that the promises made within the debounce interval are the same pomise objects (ie `a === b`)
 * // however, once out of that interval, an entirely new promise is generated (ie `b !== c`)
 * ```
*/
export declare const debounceAndShare: <T extends unknown, ARGS extends any[]>(wait_time_ms: number, fn: (...args: ARGS) => T) => (...args: ARGS) => Promise<T>;
/** blocks the execution of `fn`, if less than `delta_time_ms` amount of time has passed since the previous non-rejected call. <br>
 * @param delta_time_ms the time interval in milliseconds for throttling
 * @param fn the function to be throttled
 * @returns a function (that takes arguments intended for `fn`) that returns the value of `fn` if it was not throttled, otherwise a {@link THROTTLE_REJECT} symbol is returned.
*/
export declare const throttle: <T extends unknown, ARGS extends any[]>(delta_time_ms: number, fn: (...args: ARGS) => T) => (...args: ARGS) => typeof THROTTLE_REJECT | T;
/** a throttle function, similar to {@link throttle}, that also insures that the __final__ call (aka trailing call) made to the throttled function __always__ resolves eventually. <br>
 * this is useful in cases where it is of utmost importance that the throttled function is called one last time with before a prolonged delay. <br>
 * the following visual illustration shows the difference between the regular {@link throttle}, and {@link throttleAndTrail} functions: <br>
 * - `throttleAndTrail`: `fn` throttled with `trailing_time_ms = 1500`, and `delta_time_ms = 1000`.
 *   as you can see below, the trailing calls to the throttled function do get resolved eventually
 * ```text
 * │time    │         ╭╶╶╮ 1.2            2.7   3.3            4.8 5.2
 * ├────────│       ╭╶┤  │ ┌───(delayed)──┐     ┌───(delayed)──┐   (rejected)
 * │        │    ╭╶╶┤ │  │ │              ▼   ╭╶┤              ▼   ╭╶╶╶╶╶╶╶╮
 * │resolved│  o ▼  ▼ ▼  o │              o o ▼ │              o o ▼       o
 * │rejected│  │ x  x x  │ │                │ x │                │ x       │
 * │calls───┼──┴─┴──┴─┴──┴─┴────────────────┴─┴─┴────────────────┴─┴───────┴──►
 * │time    │  0         1         2         3         4         5         6
 * ```
 *
 * - `throttle`: `fn` throttled with `delta_time_ms = 1000`.
 *   as you can see below, the final call to the throttled function gets rejected, because it was called too quickly
 * ```text
 * │resolved│  o         o                  o
 * │rejected│  │ x  x x  │ x                │ x x
 * │calls───├──┴─┴──┴─┴──┴─┴────────────────┴─┴─┴─────────────────►
 * │time    │  0         1         2         3         4         5
 * ```
 *
 * @param trailing_time_ms the time in milliseconds after which a trailing (pending) call to the function gets resolved if no other calls are made during that time interval.
 *   you would definitely want this to be some value greater than {@link delta_time_ms}, otherwise it will be weird because if this value is smaller, then `trailing_time_ms`
 *   will become the "effective" throttling time interval, but also one that always resolved later rather than immediately.
 * @param delta_time_ms the time interval in milliseconds for throttling
 * @param fn the function to be throttled
 * @param rejection_value if a rejection value is provided, then old unresolved pending promises will be rejected with the given value,
 * 	 when a new call to the throttled function is made within the {@link trailing_time_ms} waiting period
 * @returns a function (that takes arguments intended for `fn`) that returns a `Promise` to the value of `fn` if it is resolved (i.e. not throttled or when trailing),
 *   otherwise if throttled, then that promise will either be never be resolved, or rejected based on if a {@link rejection_value} was provided.
*/
export declare const throttleAndTrail: <T extends unknown, ARGS extends any[], REJ>(trailing_time_ms: number, delta_time_ms: number, fn: (...args: ARGS) => T, rejection_value?: REJ | undefined) => (...args: ARGS) => Promise<T>;
/** a promise that resolves (or rejects if `should_reject = true`) after a certain number of milliseconds. <br>
 * this is a useful shorthand for creating delays, and then following them up with a `.then` call. <br>
 * you may also use this as a sleep/wait function in an async context where `wait` is available
*/
export declare const promiseTimeout: (wait_time_ms: number, should_reject?: boolean) => Promise<typeof TIMEOUT>;
export interface MemorizeCoreControls<V, K> {
    fn: (arg: K) => V;
    memory: SimpleMap<K, V>;
}
export declare const memorizeCore: <V, K>(fn: (arg: K) => V, weak_ref?: boolean) => MemorizeCoreControls<V, K>;
/** memorize the return value of a single parameter function. further calls with memorized arguments will return the value much quicker. */
export declare const memorize: <V, K>(fn: (arg: K) => V) => (arg: K) => V;
/** similar to {@link memorize}, but halts its memorization after `n`-unique unmemorized calls are made to the function. */
export declare const memorizeAtmostN: <V, K>(n: number, fn: (arg: K) => V) => (arg: K) => V;
/** memorize the function's return value up-until `n`-calls.
 * after this, unmemorized call arguments will either return the optional `default_value` (if it was provided),
 * or it will return value of the `n`th call (final call that got memorized).
*/
export declare const memorizeAfterN: <K, V>(n: number, fn: (arg: K) => V, default_value?: V | undefined) => (arg: K) => V;
/** memorize function and limit the caching memory used for it, through the use of LRU-scheme */
export declare const memorizeLRU: <K, V>(min_capacity: number, max_capacity: number, fn: (arg: K) => V) => (arg: K) => V;
/** memorize the result of a function only once. after that, further calls to the function will not invoke `fn` anymore,
 * and instead simply return the memorized value.
*/
export declare const memorizeOnce: <K, V>(fn: (arg: K) => V) => (arg: K) => V;
export interface memorizeMultiCore_Signature {
    <V, ARGS extends any[]>(fn: (...args: ARGS) => V, weak_ref?: false): {
        fn: (typeof fn);
        memory: typeof StrongTree<ARGS[number], V>;
    };
    <V, ARGS extends any[]>(fn: (...args: ARGS) => V, weak_ref: true): {
        fn: (typeof fn);
        memory: typeof HybridTree<ARGS[number], V>;
    };
}
export declare const memorizeMultiCore: memorizeMultiCore_Signature;
/** memorize the results of a multi-parameter function. <br>
 * since references to object type arguments are held strongly in the memorized function's cache, you will probably
 * want to manage clearing entries manually, using either {@link Map} methods, or {@link StrongTree} methods.
*/
export declare const memorizeMulti: <V, ARGS extends any[]>(fn: (...args: ARGS) => V) => (...args: ARGS) => V;
/** memorize the results of a multi-parameter function. <br>
 * the used arguments are cached _weakly_, meaning that if an non-primitive object `obj` was used as an argument,
 * then `obj` is __not__ strongly bound to the memorized function's cache, meaning that if `obj` becomes inaccessible in all scopes,
 * then `obj` will become garbage collectible, which then will also clear the cache's reference to `obj` (and its memorized result).
*/
export declare const memorizeMultiWeak: <V, ARGS extends any[]>(fn: (...args: ARGS) => V) => (...args: ARGS) => V;
/** this is the return type of {@link curry}, made for the sole purpose of type recursion. */
export type CurrySignature<FN extends (...args: any) => any, R extends ReturnType<FN> = ReturnType<FN>, ARGS extends Parameters<FN> = Parameters<FN>> = ARGS extends [infer ARG0, ...infer REST] ? (arg: ARG0) => CurrySignature<(...rest_args: REST) => R> : R;
/** this is the return type of {@link CurryMultiSignature}, made for the sole purpose of type recursion. */
export type CurryMultiSignature<FN extends BindableFunction<THIS, any, any, any>, R extends (FN extends BindableFunction<THIS, any, any, infer P> ? P : void) = ReturnType<FN>, THIS extends any = any> = <A extends (FN extends BindableFunction<THIS, infer P, any, R> ? P : never), B extends (FN extends BindableFunction<THIS, A, infer P, R> ? P : never), FN_B extends (B extends never[] ? never : (...args_b: B) => R)>(...args_a: A) => B extends never[] ? R : CurryMultiSignature<FN_B, ReturnType<FN_B> & R, THIS>;
/** curry a function `fn`, with optional `thisArg` option for binding as the `this`-object. <br>
 * what is currying? it allows a multi-parameter function to be transformed into a higher order function that always takes one argument,
 * and spits out another function which also take only one argument, and so on... until all parameters have been filled,
 * upon which the final function finally evaluates into the return value (type parameter {@link R} in this case). <br>
 *
 * note that this function relies on `fn.length` property to identify the number of __required__ arguments taken by `fn`.
 * this means that default valued arguments (such as `c` in `fn: (a: number, b: number, c = 5) => number`), or rest/spread
 * arguments (such as `args` in `fn: (a: number, b: number, ...args: number[]) => number`), are not considered as required,
 * and thus do not increment the count of `fn.length`.
 *
 * currying is usually implemented terribly through the use of closure. example: `((arg0) => (arg1) => (arg2) => fn(arg1, arg2, arg3))()` <br>
 * this is bad because when you evaluate a curry with N-parameters, you also have to make N-calls (albeit it being tail-calls), instead of just one call should
 * you have had all the parameters from the beginning. not to mention that all javascript engines famously do not perform tail-call optimizations. <br>
 * but here, I've implemented currying using the `bind` method, which means that once all parameters are filled, the function goes through only one call (no overheads). <br>
 * the same example from before would translate into: `fn.bind(thisArg, arg0).bind(thisArg, arg1).bind(thisArg, arg2)()` when binding is used <br>
 *
 * @param fn the function to curry
 * @param thisArg provide an optional argument to use as the `this` object inside of `fn`
 * @returns a series of single argument partial functions that does not evaluate until all parameters have been provided
 *
 * @example
 * ```ts
 * const abcd = (a: number, b: string, c: boolean, d: symbol): string => (String(a) + b + String(c) + String(d))
 * const abcd_curry = curry(abcd) // type: (arg: number) => (arg: string) => (arg: boolean) => (arg: symbol) => string
 * console.log(
 * 	abcd_curry(42)            // type: (arg: string) => (arg: boolean) => (arg: symbol) => string
 * 	(" hello to za warudo! ") // type: (arg: boolean) => (arg: symbol) => string
 * 	(true)                    // type: (arg: symbol) => string
 * 	(Symbol.iterator)         // return type: string
 * ) // logs `"42 hello to za warudo! true Symbol(Symbol.iterator)"`
 * ```
*/
export declare const curry: <FN extends (...args: any) => any, R extends ReturnType<FN> = ReturnType<FN>, ARGS extends Parameters<FN> = Parameters<FN>>(fn: FN, thisArg?: ThisParameterType<FN> | undefined) => CurrySignature<FN, R, ARGS>;
/** come here, come all! greet the __Types' Olympics Champion__ of winter 2024.
 * it took a while to correctly apply a multitude of gymnastics to get it functioning, but the dedication has paid off!
 * please give `curryMulti` a round of applause! and don't forget that currying a diverse variety of types all at once brings strength! <br>
 * (said a nation right before its downfall) <br>
 * now that introductions are over: {@link curryMulti} behaves very much like {@link curry}, the only difference being that you can bind an
 * arbitrary number of arguments to the curried `fn` function, instead of just one (like in the case of {@link curry})
 *
 * @param fn the function to multi-curry
 * @param thisArg provide an optional argument to use as the `this` object inside of `fn`
 * @param remaining_args number of arguments remaining until all parameters (required kind, ideally) are filled. intended for internal use onkly
 * @returns a curried function that consumes variable number of arguments, until all required parameters are available, after which a return value is spat out
 *
 * @example
 * ```ts
 * const abcd = (a: number, b: string, c: boolean, d: symbol): string => (String(a) + b + String(c) + String(d))
 * const abcd_diversity_curry = curryMulti(abcd) // type: CurryMultiSignature<(a: number, b: string, c: boolean, d: symbol) => string, string, any>
 * console.log(
 *	abcd_diversity_curry(
 *		42, " hello to za warudo! "
 *	)                 // type: CurryMultiSignature<(c: boolean, d: symbol) => string, string, any>
 *	(true)            // type: CurryMultiSignature<(d: symbol) => string, string, any>
 *	(Symbol.iterator) // return type: string
 * ) // logs `"42 hello to za warudo! true Symbol(Symbol.iterator)"`
 * ```
*/
export declare const curryMulti: <FN extends BindableFunction<THIS, any, any, any>, R extends FN extends BindableFunction<THIS, any, any, infer P> ? P : void = ReturnType<FN>, THIS extends unknown = any>(fn: FN, thisArg?: THIS | undefined, remaining_args?: number) => CurryMultiSignature<FN, R, THIS>;
//# sourceMappingURL=lambda.d.ts.map