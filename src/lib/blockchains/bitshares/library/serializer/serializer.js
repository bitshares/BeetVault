import ByteBuffer from "./ByteBuffer.js";

import EC from "./error_with_cause.js";

// Debug-only flag (mirrors bitsharesjs: an npm config switch, normally
// unset/falsy). Defined here so the `if (HEX_DUMP)` checks in this file and
// types.js don't throw ReferenceError when serialization runs.
const HEX_DUMP =
  typeof process !== "undefined" &&
  process.env &&
  process.env.npm_config__graphene_serializer_hex_dump;


class Serializer {
  constructor(operation_name, types) {
    this.operation_name = operation_name;
    this.types = types;
    if (this.types) this.keys = Object.keys(this.types);

    Serializer.printDebug = true;
  }

  fromByteBuffer(b) {
    const object = {};
    let field = null;
    try {
      const iterable = this.keys;
      for (let i = 0; i < iterable.length; i++) {
        field = iterable[i];
        const type = this.types[field];
        try {
          /*
          if (HEX_DUMP) {
            if (type.operation_name) {
              console.error(type.operation_name);
            } else {
              const o1 = b.offset;
              type.fromByteBuffer(b);
              const o2 = b.offset;
              b.offset = o1;
              const _b = b.copy(o1, o2);
              console.error(`${this.operation_name}.${field}\t`, _b.toHex());
            }
          }
          */
          object[field] = type.fromByteBuffer(b);
        } catch (e) {
          if (Serializer.printDebug) {
            console.error(`Error reading ${this.operation_name}.${field} in data:`);
            b.printDebug();
          }
          throw e;
        }
      }
    } catch (error) {
      EC.throw(this.operation_name + "." + field, error);
    }

    return object;
  }

  appendByteBuffer(b, object) {
    let field = null;
    try {
      const iterable = this.keys;
      for (let i = 0; i < iterable.length; i++) {
        field = iterable[i];
        const type = this.types[field];
        type.appendByteBuffer(b, object[field]);
      }
    } catch (error) {
      try {
        EC.throw(this.operation_name + "." + field + " = " + JSON.stringify(object[field]), error);
      } catch (e) {
        // circular ref
        EC.throw(this.operation_name + "." + field + " = " + object[field], error);
      }
    }
    return;
  }

  fromObject(serialized_object) {
    const result = {};
    let field = null;
    try {
      const iterable = this.keys;
      for (let i = 0; i < iterable.length; i++) {
        field = iterable[i];
        const type = this.types[field];
        const value = serialized_object[field];
        const object = type.fromObject(value);
        result[field] = object;
      }
    } catch (error) {
      EC.throw(this.operation_name + "." + field, error);
    }

    return result;
  }

  /**
        @arg {boolean} [debug.use_default = false] - more template friendly
        @arg {boolean} [debug.annotate = false] - add user-friendly information
    */
  toObject(serialized_object = {}, debug = { use_default: false, annotate: false }) {
    const result = {};
    let field = null;
    try {
      if (!this.types) return result;

      const iterable = this.keys;
      for (let i = 0; i < iterable.length; i++) {
        field = iterable[i];
        const type = this.types[field];
        const object = type.toObject(
          typeof serialized_object !== "undefined" && serialized_object !== null
            ? serialized_object[field]
            : undefined,
          debug
        );
        result[field] = object;
        if (HEX_DUMP) {
          let b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
          type.appendByteBuffer(
            b,
            typeof serialized_object !== "undefined" && serialized_object !== null
              ? serialized_object[field]
              : undefined
          );
          b = b.copy(0, b.offset);
          console.error(this.operation_name + "." + field, b.toHex());
        }
      }
    } catch (error) {
      EC.throw(this.operation_name + "." + field, error);
    }

    return result;
  }

  /** Sort by the first element in a operation */
  compare(a, b) {
    let first_key = this.keys[0];
    let first_type = this.types[first_key];

    let valA = a[first_key];
    let valB = b[first_key];

    if (first_type.compare) return first_type.compare(valA, valB);

    if (typeof valA === "number" && typeof valB === "number") return valA - valB;

    let encoding;
    if (Buffer.isBuffer(valA) && Buffer.isBuffer(valB)) {
      // A binary string compare does not work.  If localeCompare is well supported that could replace HEX.  Performanance is very good so comparing HEX works.
      encoding = "hex";
    }

    let strA = valA.toString(encoding);
    let strB = valB.toString(encoding);
    return strA > strB ? 1 : strA < strB ? -1 : 0;
  }

  // <helper_functions>

  fromHex(hex) {
    const b = ByteBuffer.fromHex(hex, ByteBuffer.LITTLE_ENDIAN);
    return this.fromByteBuffer(b);
  }

  fromBuffer(buffer) {
    const b = ByteBuffer.fromBinary(buffer.toString("binary"), ByteBuffer.LITTLE_ENDIAN);
    return this.fromByteBuffer(b);
  }

  toHex(object) {
    const b = this.toByteBuffer(object);
    return b.toHex();
  }

  toByteBuffer(object) {
    const b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    this.appendByteBuffer(b, object);
    return b.copy(0, b.offset);
  }

  toBuffer(object) {
    return Buffer.from(this.toByteBuffer(object).toBinary(), "binary");
  }
}

export default Serializer;
