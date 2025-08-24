

const PSON = require("pson");
const ByteBuffer = require("bytebuffer");
const LZString = require("lz-string");

class GameCodec {
  constructor() {
    this.isDecoder = new PSON.StaticPair([
      "physics", "shapes", "fixtures", "bodies", "bro", "joints", "ppm",
      "lights", "spawns", "lasers", "capZones",
      "type", "w", "h", "c", "a", "v", "l", "s", "sh", "fr", "re", "de", "sn", "fc", "fm",
      "f", "d", "n", "bg", "lv", "av", "ld", "ad", "fr", "bu", "cf", "rv", "p", "d",
      "bf", "ba", "bb", "aa", "ab", "axa", "dr", "em", "mmt", "mms", "ms", "ut", "lt",
      "New body", "Box Shape", "Circle Shape", "Polygon Shape", "EdgeChain Shape",
      "priority", "Light", "Laser", "Cap Zone", "BG Shape", "Background Layer",
      "Rotate Joint", "Slider Joint", "Rod Joint", "Gear Joint",
      65535, 16777215
    ]);
  }

  // ===== Byte reader =====
  static ByteReader = class {
    constructor() {
      this.index = 0;
      this.buffer = null;
      this.view = null;
    }
    readByte() { const v = this.view.getUint8(this.index); this.index += 1; return v; }
    readInt() { const v = this.view.getInt32(this.index); this.index += 4; return v; }
    readShort() { const v = this.view.getInt16(this.index); this.index += 2; return v; }
    readUint() { const v = this.view.getUint32(this.index); this.index += 4; return v; }
    readBoolean() { return this.readByte() === 1; }
    readDouble() { const v = this.view.getFloat64(this.index); this.index += 8; return v; }
    readFloat() { const v = this.view.getFloat32(this.index); this.index += 4; return v; }
    readUTF() {
      const length = this.readShort();
      let utfString = "";
      for (let i = 0; i < length; i++) utfString += String.fromCharCode(this.readByte());
      return utfString;
    }
    fromBase64(base64) {
      const binaryString = Buffer.from(base64, "base64").toString("binary");
      const length = binaryString.length;
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) bytes[i] = binaryString.charCodeAt(i);
      this.buffer = bytes.buffer;
      this.view = new DataView(this.buffer);
      this.index = 0;
    }
  };

  // ===== Map: decodeMap (COMPLETO) =====
  decodeMap(map) {
    const b64mapdata = LZString.decompressFromEncodedURIComponent(map);
    const binaryReader = new GameCodec.ByteReader();
    binaryReader.fromBase64(b64mapdata);

    const decodedMap = {
      v: 1,
      s: { re: false, nc: false, pq: 1, gd: 25, fl: false },
      physics: { shapes: [], fixtures: [], bodies: [], bro: [], joints: [], ppm: 12 },
      spawns: [],
      capZones: [],
      m: {
        a: "noauthor", n: "noname", dbv: 2, dbid: -1, authid: -1, date: "",
        rxid: 0, rxn: "", rxa: "", rxdb: 1, cr: [], pub: false, mo: ""
      }
    };

    try {
      decodedMap.v = binaryReader.readShort();
      if (decodedMap.v > 15) throw new Error("Future map version, please refresh page");
      decodedMap.s.re = binaryReader.readBoolean();
      decodedMap.s.nc = binaryReader.readBoolean();
      if (decodedMap.v >= 3) decodedMap.s.pq = binaryReader.readShort();
      if (decodedMap.v >= 4 && decodedMap.v <= 12) decodedMap.s.gd = binaryReader.readShort();
      else if (decodedMap.v >= 13) decodedMap.s.gd = binaryReader.readFloat();
      if (decodedMap.v >= 9) decodedMap.s.fl = binaryReader.readBoolean();

      decodedMap.m.rxn = binaryReader.readUTF();
      decodedMap.m.rxa = binaryReader.readUTF();
      decodedMap.m.rxid = binaryReader.readUint();
      decodedMap.m.rxdb = binaryReader.readShort();
      decodedMap.m.n = binaryReader.readUTF();
      decodedMap.m.a = binaryReader.readUTF();
      if (decodedMap.v >= 10) {
        decodedMap.m.vu = binaryReader.readUint();
        decodedMap.m.vd = binaryReader.readUint();
      }
      if (decodedMap.v >= 4) {
        const crLength = binaryReader.readShort();
        for (let i = 0; i < crLength; i++) decodedMap.m.cr.push(binaryReader.readUTF());
      }
      if (decodedMap.v >= 5) {
        decodedMap.m.mo = binaryReader.readUTF();
        decodedMap.m.dbid = binaryReader.readInt();
      }
      if (decodedMap.v >= 7) decodedMap.m.pub = binaryReader.readBoolean();
      if (decodedMap.v >= 8) decodedMap.m.dbv = binaryReader.readInt();

      decodedMap.physics.ppm = binaryReader.readShort();

      const broLength = binaryReader.readShort();
      for (let i = 0; i < broLength; i++) decodedMap.physics.bro[i] = binaryReader.readShort();

      const shapesLength = binaryReader.readShort();
      for (let i = 0; i < shapesLength; i++) {
        const shapeType = binaryReader.readShort();
        if (shapeType === 1) {
          const shape = { type: "bx", w: 10, h: 40, c: [0, 0], a: 0.0, sk: false };
          shape.w = binaryReader.readDouble();
          shape.h = binaryReader.readDouble();
          shape.c = [binaryReader.readDouble(), binaryReader.readDouble()];
          shape.a = binaryReader.readDouble();
          shape.sk = binaryReader.readBoolean();
          decodedMap.physics.shapes.push(shape);
        } else if (shapeType === 2) {
          const shape = { type: "ci", r: 25, c: [0, 0], sk: false };
          shape.r = binaryReader.readDouble();
          shape.c = [binaryReader.readDouble(), binaryReader.readDouble()];
          shape.sk = binaryReader.readBoolean();
          decodedMap.physics.shapes.push(shape);
        } else if (shapeType === 3) {
          const shape = { type: "po", v: [], s: 1, a: 0, c: [0, 0] };
          shape.s = binaryReader.readDouble();
          shape.a = binaryReader.readDouble();
          shape.c = [binaryReader.readDouble(), binaryReader.readDouble()];
          const verticesLength = binaryReader.readShort();
          for (let j = 0; j < verticesLength; j++) {
            shape.v.push([binaryReader.readDouble(), binaryReader.readDouble()]);
          }
          decodedMap.physics.shapes.push(shape);
        }
      }

      const fixturesLength = binaryReader.readShort();
      for (let i = 0; i < fixturesLength; i++) {
        const fixture = {
          sh: 0, n: "Def Fix", fr: 0.3, fp: null, re: 0.8, de: 0.3,
          f: 0x4f7cac, d: false, np: false, ng: false
        };
        fixture.sh = binaryReader.readShort();
        fixture.n = binaryReader.readUTF();
        fixture.fr = binaryReader.readDouble();
        if (fixture.fr === Number.MAX_VALUE) fixture.fr = null;
        const fpType = binaryReader.readShort();
        if (fpType === 0) fixture.fp = null;
        else if (fpType === 1) fixture.fp = false;
        else if (fpType === 2) fixture.fp = true;
        fixture.re = binaryReader.readDouble();
        if (fixture.re === Number.MAX_VALUE) fixture.re = null;
        fixture.de = binaryReader.readDouble();
        if (fixture.de === Number.MAX_VALUE) fixture.de = null;
        fixture.f = binaryReader.readUint();
        fixture.d = binaryReader.readBoolean();
        fixture.np = binaryReader.readBoolean();
        if (decodedMap.v >= 11) fixture.ng = binaryReader.readBoolean();
        if (decodedMap.v >= 12) fixture.ig = binaryReader.readBoolean();
        decodedMap.physics.fixtures.push(fixture);
      }

      const bodiesLength = binaryReader.readShort();
      for (let i = 0; i < bodiesLength; i++) {
        const body = {
          type: "s", n: "Unnamed", p: [0, 0], a: 0, fric: 0.3, fricp: false,
          re: 0.8, de: 0.3, lv: [0, 0], av: 0, ld: 0, ad: 0,
          fr: false, bu: false, cf: { x: 0, y: 0, w: true, ct: 0 },
          fx: [], f_c: 1, f_p: true, f_1: true, f_2: true, f_3: true, f_4: true,
          fz: { on: false, x: 0, y: 0, d: true, p: true, a: true, t: 0, cf: 0 }
        };
        body.type = binaryReader.readUTF();
        body.n = binaryReader.readUTF();
        body.p = [binaryReader.readDouble(), binaryReader.readDouble()];
        body.a = binaryReader.readDouble();
        body.fric = binaryReader.readDouble();
        body.fricp = binaryReader.readBoolean();
        body.re = binaryReader.readDouble();
        body.de = binaryReader.readDouble();
        body.lv = [binaryReader.readDouble(), binaryReader.readDouble()];
        body.av = binaryReader.readDouble();
        body.ld = binaryReader.readDouble();
        body.ad = binaryReader.readDouble();
        body.fr = binaryReader.readBoolean();
        body.bu = binaryReader.readBoolean();
        body.cf.x = binaryReader.readDouble();
        body.cf.y = binaryReader.readDouble();
        body.cf.ct = binaryReader.readDouble();
        body.cf.w = binaryReader.readBoolean();
        body.f_c = binaryReader.readShort();
        body.f_1 = binaryReader.readBoolean();
        body.f_2 = binaryReader.readBoolean();
        body.f_3 = binaryReader.readBoolean();
        body.f_4 = binaryReader.readBoolean();
        if (decodedMap.v >= 2) body.f_p = binaryReader.readBoolean();
        if (decodedMap.v >= 14) {
          body.fz.on = binaryReader.readBoolean();
          if (body.fz.on) {
            body.fz.x = binaryReader.readDouble();
            body.fz.y = binaryReader.readDouble();
            body.fz.d = binaryReader.readBoolean();
            body.fz.p = binaryReader.readBoolean();
            body.fz.a = binaryReader.readBoolean();
            if (decodedMap.v >= 15) {
              body.fz.t = binaryReader.readShort();
              body.fz.cf = binaryReader.readDouble();
            }
          }
        }
        const fxLength = binaryReader.readShort();
        for (let j = 0; j < fxLength; j++) body.fx.push(binaryReader.readShort());
        decodedMap.physics.bodies.push(body);
      }

      const spawnsLength = binaryReader.readShort();
      for (let i = 0; i < spawnsLength; i++) {
        const spawn = {
          x: 400, y: 300, xv: 0, yv: 0, priority: 5, r: true, f: true, b: true,
          gr: false, ye: false, n: "Spawn"
        };
        spawn.x = binaryReader.readDouble();
        spawn.y = binaryReader.readDouble();
        spawn.xv = binaryReader.readDouble();
        spawn.yv = binaryReader.readDouble();
        spawn.priority = binaryReader.readShort();
        spawn.r = binaryReader.readBoolean();
        spawn.f = binaryReader.readBoolean();
        spawn.b = binaryReader.readBoolean();
        spawn.gr = binaryReader.readBoolean();
        spawn.ye = binaryReader.readBoolean();
        spawn.n = binaryReader.readUTF();
        decodedMap.spawns.push(spawn);
      }

      const capZonesLength = binaryReader.readShort();
      for (let i = 0; i < capZonesLength; i++) {
        const capZone = { n: "Cap Zone", ty: 1, l: 10, i: -1 };
        capZone.n = binaryReader.readUTF();
        capZone.l = binaryReader.readDouble();
        capZone.i = binaryReader.readShort();
        if (decodedMap.v >= 6) capZone.ty = binaryReader.readShort();
        decodedMap.capZones.push(capZone);
      }

      const jointsLength = binaryReader.readShort();
      for (let i = 0; i < jointsLength; i++) {
        const jointType = binaryReader.readShort();
        let joint;
        if (jointType === 1) {
          joint = { type: "rv", d: { la: 0, ua: 0, mmt: 0, ms: 0, el: false, em: false, cc: false, bf: 0, dl: true }, aa: [0, 0] };
          joint.d.la = binaryReader.readDouble();
          joint.d.ua = binaryReader.readDouble();
          joint.d.mmt = binaryReader.readDouble();
          joint.d.ms = binaryReader.readDouble();
          joint.d.el = binaryReader.readBoolean();
          joint.d.em = binaryReader.readBoolean();
          joint.aa = [binaryReader.readDouble(), binaryReader.readDouble()];
        } else if (jointType === 2) {
          joint = { type: "d", d: { fh: 0, dr: 0, cc: false, bf: 0, dl: true }, aa: [0, 0], ab: [0, 0] };
          joint.d.fh = binaryReader.readDouble();
          joint.d.dr = binaryReader.readDouble();
          joint.aa = [binaryReader.readDouble(), binaryReader.readDouble()];
          joint.ab = [binaryReader.readDouble(), binaryReader.readDouble()];
        } else if (jointType === 3) {
          joint = { type: "lpj", d: { cc: false, bf: 0, dl: true }, pax: 0, pay: 0, pa: 0, pf: 0, pl: 0, pu: 0, plen: 0, pms: 0 };
          joint.pax = binaryReader.readDouble();
          joint.pay = binaryReader.readDouble();
          joint.pa = binaryReader.readDouble();
          joint.pf = binaryReader.readDouble();
          joint.pl = binaryReader.readDouble();
          joint.pu = binaryReader.readDouble();
          joint.plen = binaryReader.readDouble();
          joint.pms = binaryReader.readDouble();
        } else if (jointType === 4) {
          joint = { type: "lsj", d: { cc: false, bf: 0, dl: true }, sax: 0, say: 0, sf: 0, slen: 0 };
          joint.sax = binaryReader.readDouble();
          joint.say = binaryReader.readDouble();
          joint.sf = binaryReader.readDouble();
          joint.slen = binaryReader.readDouble();
        } else if (jointType === 5) {
          joint = { type: "g", n: "", ja: -1, jb: -1, r: 1 };
          joint.n = binaryReader.readUTF();
          joint.ja = binaryReader.readShort();
          joint.jb = binaryReader.readShort();
          joint.r = binaryReader.readDouble();
        }
        if (jointType !== 5) {
          joint.ba = binaryReader.readShort();
          joint.bb = binaryReader.readShort();
          joint.d.cc = binaryReader.readBoolean();
          joint.d.bf = binaryReader.readDouble();
          joint.d.dl = binaryReader.readBoolean();
        }
        decodedMap.physics.joints.push(joint);
      }
    } catch (error) {
      console.error("Failed to decode map data:", error);
      throw error;
    }

    return decodedMap;
  }

   encodeMap(map) {
  const buffer = [];
  
  buffer.push(map.objects.length & 0xFF);
  buffer.push((map.objects.length >> 8) & 0xFF);

  for (const obj of map.objects) {
    
    buffer.push(obj.id & 0xFF);
    buffer.push((obj.id >> 8) & 0xFF);

    const scaleBuf = new DataView(new ArrayBuffer(4));
    scaleBuf.setFloat32(0, obj.scale, true);
    for (let i = 0; i < 4; i++) buffer.push(scaleBuf.getUint8(i));

    const angleBuf = new DataView(new ArrayBuffer(4));
    angleBuf.setFloat32(0, obj.angle, true);
    for (let i = 0; i < 4; i++) buffer.push(angleBuf.getUint8(i));

    buffer.push(obj.x & 0xFF);
    buffer.push((obj.x >> 8) & 0xFF);

    buffer.push(obj.y & 0xFF);
    buffer.push((obj.y >> 8) & 0xFF);

    let flips = 0;
    if (obj.flipX) flips |= 0b01;
    if (obj.flipY) flips |= 0b10;
    buffer.push(flips);

    buffer.push(obj.color.r);
    buffer.push(obj.color.g);
    buffer.push(obj.color.b);
    buffer.push(obj.color.a);
  }

  return new Uint8Array(buffer);
}

 encodeMapBase64(map) {
  const bytes = encodeMap(map);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}


  // ===== Initial State =====
  decodeInitialState(raw) {
    let flipped = "";
    for (let i = 0; i < raw.length; i++) {
      const c = raw.charAt(i);
      flipped += (i <= 100)
        ? (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())
        : c;
    }
    const decompressed = LZString.decompressFromEncodedURIComponent(flipped);
    const buffer = ByteBuffer.fromBase64(decompressed);
    return this.isDecoder.decode(buffer.toBuffer());
  }

  encodeInitialState(obj) {
    const data = this.isDecoder.encode(obj);
    const b64 = data.toBase64();
    const compressed = LZString.compressToEncodedURIComponent(b64);
    let caseflipped = "";
    for (let i = 0; i < compressed.length; i++) {
      const ch = compressed.charAt(i);
      caseflipped += (i <= 100) ? (ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase()) : ch;
    }
    return caseflipped;
  }

  // ===== Helpers (scale/position) =====
  static _scale(val, ppm) {
    return Array.isArray(val) ? val.map(v => v / ppm) : val / ppm;
  }

  static convertPosition(raw_p, ppm, base_ppm = 8, base_offset = [45.625, 31.2]) {
    const scale = base_ppm / ppm;
    const offset = [base_offset[0] * scale, base_offset[1] * scale];
    return [ raw_p[0] / ppm + offset[0], raw_p[1] / ppm + offset[1] ];
  }

  // ===== Inputs =====
  static FLAG = {
    LEFT:   1 << 0,
    RIGHT:  1 << 1,
    JUMP:   1 << 2,
    DASH:   1 << 3,
    GRAPPLE:1 << 4,
    SHOOT:  1 << 5,
  };

  static parseFlags(b) {
    return {
      left:    !!(b & GameCodec.FLAG.LEFT),
      right:   !!(b & GameCodec.FLAG.RIGHT),
      jump:    !!(b & GameCodec.FLAG.JUMP),
      dash:    !!(b & GameCodec.FLAG.DASH),
      grapple: !!(b & GameCodec.FLAG.GRAPPLE),
      shoot:   !!(b & GameCodec.FLAG.SHOOT),
    };
  }

  /**
   * Decode replay inputs -> ticks[playerIndex] with {flags, aim?}
   * @param {string} b64 base64 from replay.inputs
   * @param {number} players replay.playerArray.length
   */
  decodeInputs(b64, players) {
    const buf = ByteBuffer.fromBase64(b64).toBuffer();
    const len = buf.length;

    const CANDIDATE_PP_STRIDES = [1, 5];
    let stridePerPlayer = null;
    let ticks = null;

    for (const pp of CANDIDATE_PP_STRIDES) {
      const tickStride = pp * players;
      if (len % tickStride === 0) {
        stridePerPlayer = pp;
        ticks = len / tickStride;
        break;
      }
    }
    if (!stridePerPlayer) {
      stridePerPlayer = 1;
      ticks = Math.floor(len / (players * stridePerPlayer));
    }

    const out = [];
    let o = 0;
    for (let t = 0; t < ticks; t++) {
      const frame = [];
      for (let p = 0; p < players; p++) {
        const flagsByte = buf[o];
        o += 1;
        let rec = { ...GameCodec.parseFlags(flagsByte) };
        if (stridePerPlayer === 5) {
          const x = buf[o] | (buf[o + 1] << 8);
          const y = buf[o + 2] | (buf[o + 3] << 8);
          const sx = (x & 0x8000) ? x - 0x10000 : x;
          const sy = (y & 0x8000) ? y - 0x10000 : y;
          rec.aim = { x: sx, y: sy };
          o += 4;
        }
        frame.push(rec);
      }
      out.push(frame);
    }
    return out;
  }

  // ===== Map -> InitialState conversion =====
  convertMapDataToInitialState(mapData) {
    const ppm = mapData.physics.ppm;
    return {
      discs: [
        {
          x: 36.25, y: 2.5, xv: 0, yv: 0, sx: 36.25, sy: 2.5, sxv: 0, syv: 0,
          a: 0, av: 0, a1a: 500, team: 1, a1: false, lhid: -1, lht: 0, ds: 0, da: 270, vt: 0
        }
      ],
      discDeaths: [],
      physics: {
        shapes: mapData.physics.shapes.map(shape => ({
          ...shape,
          w: shape.w !== undefined ? GameCodec._scale(shape.w, ppm) : shape.w,
          h: shape.h !== undefined ? GameCodec._scale(shape.h, ppm) : shape.h,
          c: shape.c ? GameCodec._scale(shape.c, ppm) : shape.c
        })),
        fixtures: mapData.physics.fixtures,
        bodies: mapData.physics.bodies.map(body => ({
          p: GameCodec.convertPosition(body.p, ppm),
          a: body.a,
          lv: body.lv,
          av: body.av,
          cf: body.cf,
          fx: body.fx,
          fz: body.fz,
          s: {
            type: body.type, n: body.n, fric: body.fric, fricp: body.fricp,
            re: body.re, de: body.de, ld: body.ld, ad: body.ad,
            fr: body.fr, bu: body.bu, f_c: body.f_c, f_p: body.f_p,
            f_1: body.f_1, f_2: body.f_2, f_3: body.f_3, f_4: body.f_4
          }
        })),
        bro: mapData.physics.bro,
        joints: mapData.physics.joints,
        ppm: mapData.physics.ppm
      },
      capZones: mapData.capZones ?? [],
      seed: 58,
      fte: -1,
      ftu: 60,
      players: [{ id: 0, team: 1 }],
      scores: [0],
      lscr: -1,
      ms: mapData.s ?? { re: false, nc: true, pq: 1, gd: 25, fl: false },
      mm: {
        ...mapData.m,
        dbv: mapData.m.dbv ?? 2,
        dbid: mapData.m.dbid ?? -1,
        authid: mapData.m.authid ?? -1,
        rxdb: mapData.m.rxdb ?? 1,
        pub: mapData.m.pub ?? false,
        mo: mapData.m.mo ?? ""
      },
      rl: 0,
      projectiles: [],
      rc: 0
    };
  }

  // ===== Skin codec (static helpers) =====
  static SkinCodec = class {
    static hexToBytes(hex) { return Uint8Array.from(hex.match(/../g).map(b => parseInt(b, 16))); }
    static concatBytes(b1, b2) { return Uint8Array.from([...b1, ...b2]); }
    static numToByte(x) { return Uint8Array.of(x & 255); }
    static floatToBytes(x) { const buffer = new ArrayBuffer(4); new DataView(buffer).setFloat32(0, x, false); return new Uint8Array(buffer); }
    static appendColorBytes(b, x) { return this.concatBytes(b, this.hexToBytes("00" + x.toString(16).padStart(6, "0"))); }
    static toBase64(b) { return Buffer.from(b).toString("base64"); }
    static fromBase64(s) { return new Uint8Array(Buffer.from(s, "base64")); }

    static encodeSkin(d) {
      let b = this.hexToBytes("0a070361000209");
      b = this.concatBytes(b, this.numToByte(d.layers.length * 2 + 1));
      b = this.concatBytes(b, this.hexToBytes("010a0705616c000100"));
      for (let l of d.layers) {
        b = this.concatBytes(b, this.numToByte(l.id));
        b = this.concatBytes(b, this.floatToBytes(l.scale));
        b = this.concatBytes(b, this.floatToBytes(l.angle));
        b = this.concatBytes(b, this.floatToBytes(l.x));
        b = this.concatBytes(b, this.floatToBytes(l.y));
        b = this.concatBytes(b, this.numToByte(+l.flipX));
        b = this.concatBytes(b, this.numToByte(+l.flipY));
        b = this.appendColorBytes(b, l.color);
        if (l !== d.layers.at(-1)) b = this.concatBytes(b, this.hexToBytes("0a05000100"));
      }
      return this.toBase64(this.appendColorBytes(b, d.bc || d.baseColor || 0));
    }

    static decodeSkin(s) {
      const b = this.fromBase64(s);
      const v = new DataView(b.buffer);
      let o = 9, r = [], c = (x) => (x[0] << 16) | (x[1] << 8) | x[2];
      o += 1 + 11;
      let n = (b[9] - 1) / 2;
      for (let i = 0; i < n; i++) {
        let id = b[o++], scale = v.getFloat32(o, false); o += 4;
        let angle = v.getFloat32(o, false); o += 4;
        let x = v.getFloat32(o, false); o += 4;
        let y = v.getFloat32(o, false); o += 4;
        let flipX = !!b[o++], flipY = !!b[o++], col = c(b.slice(o + 1, o + 4)); o += 4;
        r.push({ id, scale, angle, x, y, flipX, flipY, color: col });
        if (i < n - 1) o += 5;
      }
      let baseColor = c(b.slice(o + 1, o + 4));
      return { layers: r, baseColor };
    }
  };
}
const declaration = new GameCodec();
module.exports = declaration;
