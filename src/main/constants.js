/**
 * List of trusted external domains that the application is allowed to
 * open in the user's default browser via `shell.openExternal()`.
 *
 * These are blockchain explorer and tooling websites associated with
 * supported Graphene-based chains. Any URL whose hostname is not in
 * this list will be rejected by the `openURL` IPC handler.
 *
 * @type {string[]}
 */
export const SAFE_DOMAINS = [
    // BitShares
    'blocksights.info',
    // BEOS
    'explore.beos.world',
    'beos.world',
    // Telos
    'telos.eosx.io',
    // Vaulta / WAX (shared explorer)
    'eosauthority.com',
    // Vaulta testnet
    'jungle4.cryptolions.io',
    // FIO
    'bloks.io',
    'fio.bloks.io',
    'fio-test.bloks.io',
    // Libre
    'libreblocks.io',
    'www.libreblocks.io',
    'tools.libre.org',
    'libre-explorer.edenia.cloud',
    // XPR Network
    'explorer.xprnetwork.org',
    'testnet.explorer.xprnetwork.org',
    // Hive
    'hiveblocks.com',
    // Project
    'github.com',
];
