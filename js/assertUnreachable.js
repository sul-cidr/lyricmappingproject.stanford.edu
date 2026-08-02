/**
 * Called in the branch where a union has been exhausted.
 *
 * TypeScript checks that the call really is unreachable: add a member to the
 * union without handling it and `value` stops being `never`, so this stops
 * compiling. That is what lets the callers drop their casts — after an
 * if/else chain ending here, the remaining values are known, not merely assumed.
 *
 * At runtime it names the offending value and fails immediately, instead of
 * continuing and throwing something unrelated a few lines later. It reports to
 * the console rather than to a dialog: a reader of the map can do nothing about
 * a union we failed to handle, so the message is for us.
 *
 * @param {never} value
 * @param {string} message
 * @returns {never}
 */
export function assertUnreachable(value, message) {
  const description = `${message}: ${String(value)}`;
  console.error(description);
  throw new Error(description);
}
