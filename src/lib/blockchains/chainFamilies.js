export const BTS_FAMILY = ["BTS", "BTS_TEST"];
export const VAULTA_FAMILY = ["VAULTA", "BEOS", "TLOS", "TLOSTEST", "WAX", "WAXTEST", "VAULTATEST", "FIO", "FIOTEST", "LIBRE", "LIBRETEST", "XPR", "XPRTEST"];
export const HIVE_FAMILY = ["HIVE"];

export const ALL_VAULTA_AND_HIVE = [...VAULTA_FAMILY, ...HIVE_FAMILY];

export function getChainFamily(chain) {
    if (BTS_FAMILY.includes(chain)) return "bts";
    if (VAULTA_FAMILY.includes(chain)) return "antelope";
    if (HIVE_FAMILY.includes(chain)) return "hive";
    return null;
}

export function isBTSFamily(chain) {
    return BTS_FAMILY.includes(chain);
}

export function isVaultaFamily(chain) {
    return VAULTA_FAMILY.includes(chain);
}

export function isHiveFamily(chain) {
    return HIVE_FAMILY.includes(chain);
}

export function isVaultaFamilyOrHive(chain) {
    return ALL_VAULTA_AND_HIVE.includes(chain);
}
