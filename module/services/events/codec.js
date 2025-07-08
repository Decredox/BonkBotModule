
class Base64Utils {
  static uint8ToBase64(bytes) {
    return Buffer.from(bytes).toString("base64");
  }

  static base64ToUint8(base64) {
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }
}

class MAPCODEC {
  static encodeMap(mapObj) {
    const json = JSON.stringify(mapObj);
    const utf8Bytes = new TextEncoder().encode(json);
    return Base64Utils.uint8ToBase64(utf8Bytes);
  }

  static decodeMap(base64Str) {
    try {
      const bytes = Base64Utils.base64ToUint8(base64Str);
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json);
    } catch (err) {
      console.error("[MAPCODEC ERROR]", err.message);
      return null;
    }
  }
}

class SKINCODEC {
  static hexToBytes(hex) {
    return Uint8Array.from(hex.match(/../g).map((b) => parseInt(b, 16)));
  }

  static concatBytes(b1, b2) {
    return Uint8Array.from([...b1, ...b2]);
  }

  static numToByte(x) {
    return Uint8Array.of(x & 255);
  }

  static floatToBytes(x) {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setFloat32(0, x, false);
    return new Uint8Array(buffer);
  }

  static appendColorBytes(b, x) {
    return SKINCODEC.concatBytes(b, SKINCODEC.hexToBytes("00" + x.toString(16).padStart(6, "0")));
  }

  static toBase64(b) {
    return Base64Utils.uint8ToBase64(b);
  }

  static encodeSkin(d) {
    let b = SKINCODEC.hexToBytes("0a070361000209");
    b = SKINCODEC.concatBytes(b, SKINCODEC.numToByte(d.layers.length * 2 + 1));
    b = SKINCODEC.concatBytes(b, SKINCODEC.hexToBytes("010a0705616c000100"));

    for (let l of d.layers) {
      b = SKINCODEC.concatBytes(b, SKINCODEC.numToByte(l.id));
      b = SKINCODEC.concatBytes(b, SKINCODEC.floatToBytes(l.scale));
      b = SKINCODEC.concatBytes(b, SKINCODEC.floatToBytes(l.angle));
      b = SKINCODEC.concatBytes(b, SKINCODEC.floatToBytes(l.x));
      b = SKINCODEC.concatBytes(b, SKINCODEC.floatToBytes(l.y));
      b = SKINCODEC.concatBytes(b, SKINCODEC.numToByte(+l.flipX));
      b = SKINCODEC.concatBytes(b, SKINCODEC.numToByte(+l.flipY));
      b = SKINCODEC.appendColorBytes(b, l.color);
      if (l !== d.layers.at(-1)) b = SKINCODEC.concatBytes(b, SKINCODEC.hexToBytes("0a05000100"));
    }
    return SKINCODEC.toBase64(SKINCODEC.appendColorBytes(b, d.bc || d.baseColor || 0));
  }

  static decodeSkin(s) {
    const b = Base64Utils.base64ToUint8(s);
    const v = new DataView(b.buffer);
    let o = 9,
      r = [],
      c = (x) => (x[0] << 16) | (x[1] << 8) | x[2];
    o += 1 + 11; // skip count + header
    let n = (b[9] - 1) / 2;
    for (let i = 0; i < n; i++) {
      let id = b[o++],
        scale = v.getFloat32(o, false);
      o += 4;
      let angle = v.getFloat32(o, false);
      o += 4;
      let x = v.getFloat32(o, false);
      o += 4;
      let y = v.getFloat32(o, false);
      o += 4;
      let flipX = !!b[o++],
        flipY = !!b[o++],
        col = c(b.slice(o + 1, o + 4));
      o += 4;
      r.push({ id, scale, angle, x, y, flipX, flipY, color: col });
      if (i < n - 1) o += 5;
    }
    let baseColor = c(b.slice(o + 1, o + 4));
    return { layers: r, baseColor };
  }
}

module.exports = {
  MapCodec: MAPCODEC,
  SkinCodec: SKINCODEC,
};
