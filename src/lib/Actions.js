/**
 * Request methods accepted from third-party applications.
 *
 * `injectedCall` is the only method the wallet will process. The transaction
 * it carries may contain any number of chain operations, each checked
 * individually against the user's configured permission scope — see
 * `parseDeeplink` in `src/main/blockchainHandler.js`.
 *
 * Adding an export here widens the allowlist that gate checks against, so
 * only add a method that the wallet can genuinely handle end to end.
 */
export const INJECTED_CALL = 'injectedCall';
