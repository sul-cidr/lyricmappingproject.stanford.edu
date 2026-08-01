/**
 * Called in the branch where a union has been exhausted.
 *
 * TypeScript checks that the call really is unreachable: add a member to the
 * union without handling it and `value` stops being `never`, so this stops
 * compiling. That is what lets the callers drop their casts — after an
 * if/else chain ending here, the remaining values are known, not merely assumed.
 *
 * At runtime it does what this codebase has always done with an unexpected
 * state — alert, then fail — except that it fails immediately and names the
 * offending value, instead of continuing and throwing something unrelated a
 * few lines later.
 *
 * @param {never} value
 * @param {string} message
 * @returns {never}
 */
export function assertUnreachable(value, message) {
  const description = `${message}: ${String(value)}`;
  alert(description);
  throw new Error(description);
}
