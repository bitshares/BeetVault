const lookupPrecision = {
    "A": 4,
    "TLOS": 4,
    "BEOS": 4,
    "WAX": 8,
    "FIO": 9,
    "LIBRE": 8,
    "XPR": 4,
    "BTS": 5,
    "BTS_TEST": 5,
    "HIVE": 3,
    "HBD": 3,
    "VESTS": 6
};

export function humanReadableFloat(satoshis, precision) {
    return satoshis / Math.pow(10, precision)
}

export function formatAsset(satoshis, symbol, precision = null, addSymbol = true) {
    if (precision == null) {
        precision = lookupPrecision[symbol];
    }
    if (!addSymbol) {
        symbol = "";
    } else {
        symbol = " " + symbol;
    }
    if (!precision) {
        return satoshis + "sat of" + symbol;
    } else {
        return humanReadableFloat(satoshis, precision).toFixed(precision) + symbol;
    }
}
