/** utility functions for manipulating, generating, or parsing `string`s.
 *
 * @module
*/
import "./_dnt.polyfills.js";
import { array_from, math_min, number_parseInt, string_toLowerCase, string_toUpperCase } from "./alias.js";
import { bind_string_charCodeAt } from "./binder.js";
import { sliceContinuous } from "./typedbuffer.js";
const default_HexStringReprConfig = {
    sep: ", ",
    prefix: "0x",
    postfix: "",
    trailingSep: false,
    bra: "[",
    ket: "]",
    toUpperCase: true,
    radix: 16,
};
/** convert an array of integer numbers to hex-string, for the sake of easing representation, or for visual purposes.
 *
 * to customize the apearance of the hex-string, or to use a different radix, use the {@link HexStringReprConfig} interface to change the default `options`.
 *
 * you must make sure that every element of your array `arr` is non-negative, in addition to being less than `options.radix ** 2`.
 * since the default `options.radix === 16`, each of your number must be smaller than `256` on the default config.
 *
 * to invert the operation of this function (i.e. parse an array of integers from a string), use the {@link hexStringToArray} function with the same config `options`.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * const
 * 	my_binary_code = [1, 2, 3, 125, 126, 127, 192, 225, 255],
 * 	my_custom_config: Partial<HexStringReprConfig> = {
 * 		sep: ",",
 * 		trailingSep: true,
 * 		bra: "<",
 * 		ket: ">",
 * 	}
 *
 * const my_binary_code_repr = hexStringOfArray(my_binary_code, my_custom_config)
 *
 * assertEq(my_binary_code_repr, "<0x01,0x02,0x03,0x7D,0x7E,0x7F,0xC0,0xE1,0xFF,>")
 * ```
*/
export const hexStringOfArray = (arr, options) => {
    const { sep, prefix, postfix, trailingSep, bra, ket, toUpperCase, radix, } = { ...default_HexStringReprConfig, ...options }, num_arr = arr.buffer ? array_from(arr) : arr, str = num_arr.map(v => {
        let s = (v | 0).toString(radix);
        s = s.length === 2 ? s : "0" + s;
        return toUpperCase ? string_toUpperCase(s) : s;
    }).reduce((str, s) => str + prefix + s + postfix + sep, "");
    return bra + str.slice(0, trailingSep ? undefined : -sep.length) + ket;
};
/** convert hex-string back to an array of integers,
 * provided that you know the exact {@link HexStringReprConfig} config of your particular hex-string.
 *
 * this function performs the inverse operation of {@link hexStringOfArray}, given that you use the same `options`.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * const
 * 	my_binary_code_repr = "<0x01,0x02,0x03,0x7D,0x7E,0x7F,0xC0,0xE1,0xFF,>",
 * 	my_custom_config: Partial<HexStringReprConfig> = {
 * 		sep: ",",
 * 		trailingSep: true,
 * 		bra: "<",
 * 		ket: ">",
 * 	}
 *
 * const my_binary_code: number[] = hexStringToArray(my_binary_code_repr, my_custom_config)
 *
 * assertEq(my_binary_code, [1, 2, 3, 125, 126, 127, 192, 225, 255])
 * ```
*/
export const hexStringToArray = (hex_str, options) => {
    const { sep, prefix, postfix, bra, ket, radix, } = { ...default_HexStringReprConfig, ...options }, [sep_len, prefix_len, postfix_len, bra_len, ket_len] = [sep, prefix, postfix, bra, ket].map(s => s.length), hex_str2 = hex_str.slice(bra_len, ket_len > 0 ? -ket_len : undefined), // there are no brackets remaining
    elem_len = prefix_len + 2 + postfix_len + sep_len, int_arr = [];
    for (let i = prefix_len; i < hex_str2.length; i += elem_len) {
        int_arr.push(number_parseInt(hex_str2[i] + hex_str2[i + 1], // these are the two characters representing the current number in hex-string format
        radix));
    }
    return int_arr;
};
/** a shorthand function for either getting the upper or lower case of a string `str`, based on the numeric `option`.
 *
 * options:
 * - `option > 0` => input string is turned to uppercase
 * - `option < 0` => input string is turned to lowercase
 * - `option = 0` => input string is unmodified
*/
export const toUpperOrLowerCase = (str, option) => {
    return option > 0
        ? string_toUpperCase(str)
        : option < 0
            ? string_toLowerCase(str)
            : str;
};
/** finds the index of next uppercase character, starting from index `start` and optionally ending at exclusive-index `end`.
 * if an uppercase character is not found, then `undefined` is returned.
*/
export const findNextUpperCase = (str, start = 0, end = undefined) => {
    end = (end < str.length ? end : str.length) - 1;
    const str_charCodeAt = bind_string_charCodeAt(str);
    let c;
    while (c = str_charCodeAt(start++)) {
        if (c > 64 && c < 91) {
            return start - 1;
        }
    }
    return undefined;
};
/** finds the index of next lowercase character, starting from index `start` and optionally ending at exclusive-index `end`.
 * if a lowercase character is not found, then `undefined` is returned.
*/
export const findNextLowerCase = (str, start = 0, end = undefined) => {
    end = (end < str.length ? end : str.length) - 1;
    const str_charCodeAt = bind_string_charCodeAt(str);
    let c;
    while (c = str_charCodeAt(start++)) {
        if (c > 96 && c < 123) {
            return start - 1;
        }
    }
    return undefined;
};
/** find either the next upper or next lower case character index in string `str`, based on the numeric `option`,
 * starting from index `start` and optionally ending at exclusive-index `end`.
 * if your selected uppercase/lowercase option is not found, or if your `option === 0`, then `undefined` is returned.
 *
 * this function is just a composition of the functions {@link findNextUpperCase} and {@link findNextLowerCase}.
*/
export const findNextUpperOrLowerCase = (str, option, start = 0, end = undefined) => {
    if (option > 0) {
        return findNextUpperCase(str, start, end);
    }
    else if (option < 0) {
        return findNextLowerCase(str, start, end);
    }
    else {
        return undefined;
    }
};
/** convert an array of `words` to a single token, based on the configuration provided in `casetype`.
 *
 * to reverse the operation of this function, use the {@link tokenToWords} function with the same `casetype` config that you use here.
 *
 * @example
 * ```ts
 * import { assertEquals as eq } from "jsr:@std/assert"
 *
 * const words = ["convert", "windows", "path", "to", "unix"]
 *
 * const
 * 	snakeCase: NamingCaseTuple = [-1, -1, -1, "_"],
 * 	kebabCase: NamingCaseTuple = [-1, -1, -1, "-"],
 * 	camelCase: NamingCaseTuple = [-1, 1, -1, ""],
 * 	pascalCase: NamingCaseTuple = [1, 1, -1, ""],
 * 	screamingSnakeCase: NamingCaseTuple = [1, 1, 1, "_"],
 * 	screamingKebabCase: NamingCaseTuple = [1, 1, 1, "-"]
 *
 * eq(wordsToToken(snakeCase, words),          "convert_windows_path_to_unix")
 * eq(wordsToToken(kebabCase, words),          "convert-windows-path-to-unix")
 * eq(wordsToToken(camelCase, words),          "convertWindowsPathToUnix")
 * eq(wordsToToken(pascalCase, words),         "ConvertWindowsPathToUnix")
 * eq(wordsToToken(screamingSnakeCase, words), "CONVERT_WINDOWS_PATH_TO_UNIX")
 * eq(wordsToToken(screamingKebabCase, words), "CONVERT-WINDOWS-PATH-TO-UNIX")
 * ```
*/
export const wordsToToken = (casetype, words) => {
    const [first_letter_upper, word_first_letter_upper, rest_word_letters_upper, delimiter = "", prefix = "", suffix = ""] = casetype, last_i = words.length - 1, token = words.map((w, i) => {
        const w_0 = toUpperOrLowerCase(w[0], i > 0 ? word_first_letter_upper : first_letter_upper), w_rest = toUpperOrLowerCase(w.slice(1), rest_word_letters_upper), sep = i < last_i ? delimiter : "";
        return w_0 + w_rest + sep;
    }).reduce((str, word) => str + word, prefix) + suffix;
    return token;
};
/** breakdown a single `token` into its constituent words, based on the configuration provided in `casetype`.
 *
 * this function performs the inverse operation of {@link wordsToToken}, provided that you use the same `casetype` config.
 *
 * @example
 * ```ts
 * import { assertEquals as eq } from "jsr:@std/assert"
 *
 * const
 * 	snakeCase: NamingCaseTuple = [-1, -1, -1, "_"],
 * 	kebabCase: NamingCaseTuple = [-1, -1, -1, "-"],
 * 	camelCase: NamingCaseTuple = [-1, 1, -1, ""],
 * 	pascalCase: NamingCaseTuple = [1, 1, -1, ""],
 * 	screamingSnakeCase: NamingCaseTuple = [1, 1, 1, "_"],
 * 	screamingKebabCase: NamingCaseTuple = [1, 1, 1, "-"]
 *
 * // the expected list of words that our tokens should breakdown into
 * const words = ["convert", "windows", "path", "to", "unix"]
 *
 * eq(tokenToWords(snakeCase,          "convert_windows_path_to_unix"), words)
 * eq(tokenToWords(kebabCase,          "convert-windows-path-to-unix"), words)
 * eq(tokenToWords(camelCase,          "convertWindowsPathToUnix"),     words)
 * eq(tokenToWords(pascalCase,         "ConvertWindowsPathToUnix"),     words)
 * eq(tokenToWords(screamingSnakeCase, "CONVERT_WINDOWS_PATH_TO_UNIX"), words)
 * eq(tokenToWords(screamingKebabCase, "CONVERT-WINDOWS-PATH-TO-UNIX"), words)
 * ```
*/
export const tokenToWords = (casetype, token) => {
    const [, word_first_letter_upper, , delimiter = "", prefix = "", suffix = ""] = casetype;
    token = token.slice(prefix.length, -suffix.length || undefined);
    let words;
    if (delimiter === "") {
        // we must now rely on change-in-character-capitlaization to identify indexes of where to split
        const idxs = [0];
        let i = 0;
        while (i !== undefined) {
            i = findNextUpperOrLowerCase(token, word_first_letter_upper, i + 1);
            idxs.push(i);
        }
        words = sliceContinuous(token, idxs);
    }
    else
        words = token.split(delimiter);
    return words.map(word => string_toLowerCase(word));
};
/** converts a string token from one case type to another,
 * by performing a composition operation of {@link tokenToWords} and {@link wordsToToken}.
 *
 * @example
 * ```ts
 * import { assertEquals as eq } from "jsr:@std/assert"
 *
 * const
 * 	snakeCase: NamingCaseTuple = [-1, -1, -1, "_"],
 * 	kebabCase: NamingCaseTuple = [-1, -1, -1, "-"],
 * 	camelCase: NamingCaseTuple = [-1, 1, -1, ""],
 * 	pascalCase: NamingCaseTuple = [1, 1, -1, ""],
 * 	screamingSnakeCase: NamingCaseTuple = [1, 1, 1, "_"],
 * 	screamingKebabCase: NamingCaseTuple = [1, 1, 1, "-"]
 *
 * eq(convertCase(
 * 	snakeCase, screamingSnakeCase,
 * 	"convert_windows_path_to_unix",
 * ), "CONVERT_WINDOWS_PATH_TO_UNIX")
 *
 * eq(convertCase(
 * 	kebabCase, camelCase,
 * 	"convert-windows-path-to-unix",
 * ), "convertWindowsPathToUnix")
 *
 * eq(convertCase(
 * 	camelCase, kebabCase,
 * 	"convertWindowsPathToUnix",
 * ), "convert-windows-path-to-unix")
 *
 * eq(convertCase(
 * 	kebabCase, kebabCase,
 * 	"convert-windows-path-to-unix",
 * ), "convert-windows-path-to-unix")
 *
 * eq(convertCase(
 * 	screamingKebabCase, pascalCase,
 * 	"CONVERT-WINDOWS-PATH-TO-UNIX",
 * ), "ConvertWindowsPathToUnix")
 * ```
*/
export const convertCase = (from_casetype, to_casetype, token) => (wordsToToken(to_casetype, tokenToWords(from_casetype, token)));
/** generate a specific case converter. convenient for continued use.
 *
 * see {@link kebabToCamel} and {@link camelToKebab} as examples that are generated via this function.
*/
export const convertCase_Factory = (from_casetype, to_casetype) => {
    const bound_words_to_token = wordsToToken.bind(undefined, to_casetype), bound_token_to_words = tokenToWords.bind(undefined, from_casetype);
    return (token) => bound_words_to_token(bound_token_to_words(token));
};
/** the token name casing configuration for a "snake_case". */
export const snakeCase = [-1, -1, -1, "_"];
/** the token name casing configuration for a "kebab-case". */
export const kebabCase = [-1, -1, -1, "-"];
/** the token name casing configuration for a "camelCase". */
export const camelCase = [-1, 1, -1, ""];
/** the token name casing configuration for a "PascalCase". */
export const pascalCase = [1, 1, -1, ""];
/** the token name casing configuration for a "SCREAMING_SNAKE_CASE". */
export const screamingSnakeCase = [1, 1, 1, "_"];
/** the token name casing configuration for a "SCREAMING-SNAKE-CASE". */
export const screamingKebabCase = [1, 1, 1, "-"];
/** a function to convert snake case token to a kebab case token. */
export const snakeToKebab = /*@__PURE__*/ convertCase_Factory(snakeCase, kebabCase);
/** a function to convert snake case token to a camel case token. */
export const snakeToCamel = /*@__PURE__*/ convertCase_Factory(snakeCase, camelCase);
/** a function to convert snake case token to a pascal case token. */
export const snakeToPascal = /*@__PURE__*/ convertCase_Factory(snakeCase, pascalCase);
/** a function to convert kebab case token to a snake case token. */
export const kebabToSnake = /*@__PURE__*/ convertCase_Factory(kebabCase, snakeCase);
/** a function to convert kebab case token to a camel case token. */
export const kebabToCamel = /*@__PURE__*/ convertCase_Factory(kebabCase, camelCase);
/** a function to convert kebab case token to a pascal case token. */
export const kebabToPascal = /*@__PURE__*/ convertCase_Factory(kebabCase, pascalCase);
/** a function to convert camel case token to a snake case token. */
export const camelToSnake = /*@__PURE__*/ convertCase_Factory(camelCase, snakeCase);
/** a function to convert camel case token to a kebab case token. */
export const camelToKebab = /*@__PURE__*/ convertCase_Factory(camelCase, kebabCase);
/** a function to convert camel case token to a pascal case token. */
export const camelToPascal = /*@__PURE__*/ convertCase_Factory(camelCase, pascalCase);
/** a function to convert pascal case token to a snake case token. */
export const PascalToSnake = /*@__PURE__*/ convertCase_Factory(pascalCase, snakeCase);
/** a function to convert pascal case token to a kebab case token. */
export const PascalToKebab = /*@__PURE__*/ convertCase_Factory(pascalCase, kebabCase);
/** a function to convert pascal case token to a camel case token. */
export const PascalTocamel = /*@__PURE__*/ convertCase_Factory(pascalCase, camelCase);
/** surround a string with double quotation.
 *
 * someone should nominate this function for 2025 mathematics nobel prize.
*/
export const quote = (str) => ("\"" + str + "\"");
/** reversing a string is not natively supported by javascript, and performing it is not so trivial when considering that
 * you can have composite UTF-16 characters (such as emojis and characters with accents).
 *
 * see this excellent solution in stackoverflow for reversing a string: [stackoverflow.com/a/60056845](https://stackoverflow.com/a/60056845). <br>
 * we use the slightly less reliable technique provided by the answer, as it has a better browser support.
*/
export const reverseString = (input) => {
    return [...input.normalize("NFC")].toReversed().join("");
};
/** find the longest common prefix among a list of `inputs`.
 *
 * for efficiency, this function starts off by using the shortest string among `inputs`, then performs a binary search.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * assertEq(commonPrefix([
 * 	"C:/Hello/World/This/Is/An/Example/Bla.cs",
 * 	"C:/Hello/World/This/Is/Not/An/Example/",
 * 	"C:/Hello/Earth/Bla/Bla/Bla",
 * ]), "C:/Hello/")
 *
 * assertEq(commonPrefix([
 * 	"C:/Hello/World/This/Is/An/Example/Bla.cs",
 * 	"C:/Hello/World/This/is/an/example/bla.cs",
 * 	"C:/Hello/World/This/Is/Not/An/Example/",
 * ]), "C:/Hello/World/This/")
 *
 * assertEq(commonPrefix([
 * 	"C:/Hello/World/Users/This/Is/An/Example/Bla.cs",
 * 	"C:/Hello/World Users/This/Is/An/example/bla.cs",
 * 	"C:/Hello/World-Users/This/Is/Not/An/Example/",
 * ]), "C:/Hello/World")
 * ```
*/
export const commonPrefix = (inputs) => {
    const len = inputs.length;
    if (len < 1)
        return "";
    const inputs_lengths = inputs.map((str) => (str.length)), shortest_input_length = math_min(...inputs_lengths), shortest_input = inputs[inputs_lengths.indexOf(shortest_input_length)];
    let left = 0, right = shortest_input_length;
    while (left <= right) {
        const center = ((left + right) / 2) | 0, prefix = shortest_input.substring(0, center);
        if (inputs.every((input) => (input.startsWith(prefix)))) {
            left = center + 1;
        }
        else {
            right = center - 1;
        }
    }
    return shortest_input.substring(0, ((left + right) / 2) | 0);
};
/** find the longest common suffix among a list of `inputs`.
 *
 * for efficiency, this function simply reverses the character ordering of each input, and then uses {@link commonPrefix}.
 *
 * @example
 * ```ts
 * import { assertEquals as assertEq } from "jsr:@std/assert"
 *
 * assertEq(commonSuffix([
 * 	"file:///C:/Hello/World/This/Is/An/Example/Bla.cs",
 * 	"file:///C:/Hello/Users/This/Is-An/Example/Bla.cs",
 * 	"file:///C:/Hello/Users/This/Is/YetAnother-An/Example/Bla.cs",
 * 	"file:///C:/Hello/Earth/This/Is/Not/An/Example/Bla.cs",
 * ]), "An/Example/Bla.cs")
 * ```
*/
export const commonSuffix = (inputs) => {
    return reverseString(commonPrefix(inputs.map(reverseString)));
};
