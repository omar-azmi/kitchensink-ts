/** utility functions for handling buffers and typed arrays, and also reading and writing data to them
 * @module
*/
/** checks if an object `obj` is a {@link TypedArray}, based on simply checking whether `obj.buffer` exists or not. <br>
 * this is certainly not a very robust way of verifying. <br>
 * a better approach would be to check if `obj instanceof Object.getPrototypeOf(Uint8Array)`, but this is quicker <br>
*/
export const isTypedArray = (obj) => obj.buffer ? true : false;
/** get a typed array constructor by specifying the type as a string */
export const typed_array_constructor_of = (type) => {
    if (type[2] === "c")
        return Uint8ClampedArray;
    type = type[0] + type[1]; // this is to trim excessive tailing characters
    switch (type) {
        case "u1": return Uint8Array;
        case "u2": return Uint16Array;
        case "u4": return Uint32Array;
        //case "u8": return BigUint64Array as TypedArrayConstructor<DType>
        case "i1": return Int8Array;
        case "i2": return Int16Array;
        case "i4": return Int32Array;
        //case "i8": return BigInt64Array as TypedArrayConstructor<DType>
        case "f4": return Float32Array;
        case "f8": return Float64Array;
        default: {
            console.error("an unrecognized typed array type `\"${type}\"` was provided");
            return Uint8Array;
        }
    }
};
/** dictates if the native endianess of your `TypedArray`s is little endian. */
export const getEnvironmentEndianess = () => (new Uint8Array(Uint32Array.of(1).buffer))[0] === 1 ? true : false;
/** this variable dictates if the native endianess of your `TypedArray`s is little endian. */
export const env_le = getEnvironmentEndianess();
/** swap the endianess of the provided `Uint8Array` buffer array in-place, given that each element has a byte-size of `bytesize`
 * @category inplace
*/
export const swapEndianess = (buf, bytesize) => {
    const len = buf.byteLength;
    for (let i = 0; i < len; i += bytesize)
        buf.subarray(i, i + bytesize).reverse();
    return buf;
};
/** 10x faster implementation of {@link swapEndianess} that does not mutatate the original `buf` array
 * @category copy
*/
export const swapEndianessFast = (buf, bytesize) => {
    const len = buf.byteLength, swapped_buf = new Uint8Array(len), bs = bytesize;
    for (let offset = 0; offset < bs; offset++) {
        const a = bs - 1 - offset * 2;
        for (let i = offset; i < len + offset; i += bs)
            swapped_buf[i] = buf[i + a];
    }
    /* the above loop is equivalent to the following: `for (let offset = 0; offset < bs; offset++) for (let i = 0; i < len; i += bs) swapped_buf[i + offset] = buf[i + bs - 1 - offset]` */
    return swapped_buf;
};
/** concatenate a bunch of `Uint8Array` and `Array<number>` into a single `Uint8Array` array
 * @category copy
*/
export const concatBytes = (...arrs) => {
    const offsets = [0];
    for (const arr of arrs)
        offsets.push(offsets[offsets.length - 1] + arr.length);
    const outarr = new Uint8Array(offsets.pop());
    for (const arr of arrs)
        outarr.set(arr, offsets.shift());
    return outarr;
};
/** concatenate a bunch of {@link TypedArray}
 * @category copy
*/
export const concatTyped = (...arrs) => {
    const offsets = [0];
    for (const arr of arrs)
        offsets.push(offsets[offsets.length - 1] + arr.length);
    const outarr = new arrs[0].constructor(offsets.pop());
    for (const arr of arrs)
        outarr.set(arr, offsets.shift());
    return outarr;
};
export function resolveRange(start, end, length, offset) {
    start = start ?? 0;
    offset = offset ?? 0;
    if (length === undefined)
        return [start + offset, end === undefined ? end : end + offset, length];
    end = end ?? length;
    start += start >= 0 ? 0 : length;
    end += end >= 0 ? 0 : length;
    length = end - start;
    return [start + offset, end + offset, length >= 0 ? length : 0];
}
/** split {@link TypedArray} after every `step` number of elements through the use of subarray views <br>
 * @deprecated kind of pointless, when {@link sliceSkipTypedSubarray} and {@link sliceSkip} exist
 * @category inplace
*/
export const splitTypedSubarray = (arr, step) => sliceSkipTypedSubarray(arr, step);
/** slice `slice_length` number of elements, then jump forward `skip_length` number of elements, and repeat <br>
 * optionally provide a `start` index to begin at, and an `end` index to stop at. <br>
 * if you want to skip first and slice second, you can set `start = skip_length` to get the desired equivalent result <br>
 * @category copy
*/
export const sliceSkip = (arr, slice_length, skip_length = 0, start, end) => {
    [start, end,] = resolveRange(start, end, arr.length);
    const out_arr = [];
    for (let offset = start; offset < end; offset += slice_length + skip_length)
        out_arr.push(arr.slice(offset, offset + slice_length));
    return out_arr;
};
/** similar to {@link sliceSkip}, but for subarray views of {@link TypedArray}. <br>
 * @category inplace
*/
export const sliceSkipTypedSubarray = (arr, slice_length, skip_length = 0, start, end) => {
    [start, end,] = resolveRange(start, end, arr.length);
    const out_arr = [];
    for (let offset = start; offset < end; offset += slice_length + skip_length)
        out_arr.push(arr.subarray(offset, offset + slice_length));
    return out_arr;
};
/** find out if two regular, or typed arrays are element wise equal, and have the same lengths */
export const isIdentical = (arr1, arr2) => {
    if (arr1.length !== arr2.length)
        return false;
    return isSubidentical(arr1, arr2);
};
/** find out if two regular, or typed arrays are element wise equal upto the last element of the shorter of the two arrays */
export const isSubidentical = (arr1, arr2) => {
    const len = Math.min(arr1.length, arr2.length);
    for (let i = 0; i < len; i++)
        if (arr1[i] !== arr2[i])
            return false;
    return true;
};
