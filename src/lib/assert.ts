/**
 * Throw if a programming invariant is violated. Use for "this should never
 * happen" conditions — not for expected runtime errors like bad user input,
 * which should be validated and handled. See CONTRIBUTING.md.
 */
export function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(`Assertion failed: ${message}`);
	}
}
