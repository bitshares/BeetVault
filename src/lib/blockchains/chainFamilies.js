export const BTS_FAMILY = ["BTS", "BTS_TEST"];
export const EOS_FAMILY = ["EOS", "BEOS", "TLOS", "TLOSTEST", "WAX", "WAXTEST", "EOSTEST", "FIO", "FIOTEST", "LIBRE", "LIBRETEST", "XPR", "XPRTEST"];
export const HIVE_FAMILY = ["HIVE"];

export const ALL_EOS_AND_HIVE = [...EOS_FAMILY, ...HIVE_FAMILY];

export function getChainFamily(chain) {
    if (BTS_FAMILY.includes(chain)) return "bts";
    if (EOS_FAMILY.includes(chain)) return "eos";
    if (HIVE_FAMILY.includes(chain)) return "hive";
    return null;
}

export function isBTSFamily(chain) {
    return BTS_FAMILY.includes(chain);
}

export function isEOSFamily(chain) {
    return EOS_FAMILY.includes(chain);
}

export function isHiveFamily(chain) {
    return HIVE_FAMILY.includes(chain);
}

export function isEOSFamilyOrHive(chain) {
    return ALL_EOS_AND_HIVE.includes(chain);
}
