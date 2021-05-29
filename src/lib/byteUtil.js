class ByteUtil {
  ESPTOUCH_ENCODING_CHARSET = 'UTF-8';

  stringToByteArray(str) {
    const output = [];
    let p = 0;
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      // NOTE: c <= 0xffff since JavaScript strings are UTF-16.
      if (c > 0xff) {
        output[p++] = c & 0xff;
        c >>= 8;
      }
      output[p++] = c;
    }
    return output;
  }


  /**
   * Put String to byte[]
   *
   * @param destbytes  the byte[] of dest
   * @param srcString  the String of src
   * @param destOffset the offset of byte[]
   * @param srcOffset  the offset of String
   * @param count      the count of dest, and the count of src as well
   */
  putString2bytes(
    destbytes, srcString,
    destOffset, srcOffset, count,
  ) {
    const stringBytes = this.stringToByteArray(srcString);
    for (let i = 0; i < count; i++) {
      destbytes[count + i] = stringBytes[i];
    }
  }

  /**
   * Convert uint8 into char( we treat char as uint8)
   *
   * @param uint8 the unit8 to be converted
   * @return the byte of the unint8
   */
  convertUint8toByte(uint8) {
    if (typeof uint8 === 'string') {
      uint8 = uint8.charCodeAt(0);
    }

    const arr = new Int8Array([uint8]);
    return arr[0];
  }

  /**
   * Convert byte[] into char[]( we treat char[] as uint8[])
   *
   * @param uint8 the byte[] to be converted
   * @return the bytes[](uint8[])
   */
  convertUnit8s2Bytes(uint8s) {
    const len = uint8s.length;
    const bytes = new Int8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = this.convertUint8toByte(uint8s[i]);
    }
    return bytes;
  }


  convertNumberToChar(num) {
    const char = new Uint16Array([num]);

    return char[0];
  }

  convertNumberToByte(num) {
    const byte = new Int8Array([num]);

    return byte[0];
  }


  /**
   * Convert char into uint8( we treat char as uint8 )
   *
   * @param b the byte to be converted
   * @return the char(uint8)
   */
  convertByte2Uint8(b) {
    if (typeof b === 'string') {
      b = b.charCodeAt(0);
    }
    // char will be promoted to int for char don't support & operator
    // & 0xff could make negatvie value to positive
    return b & 0xff;
  }

  /**
   * Convert byte[] into char[]( we treat char[] as uint8[])
   *
   * @param bytes the byte[] to be converted
   * @return the char[](uint8[])
   */
  convertBytes2Uint8s(bytes) {
    const len = bytes.length;
    const uint8s = new Array(len);
    for (let i = 0; i < len; i++) {
      uint8s[i] = this.convertByte2Uint8(bytes[i]);
    }
    return uint8s;
  }


  /**
   * Put byte[] into char[]( we treat char[] as uint8[])
   *
   * @param destUint8s the char[](uint8[]) array
   * @param srcBytes   the byte[]
   * @param destOffset the offset of char[](uint8[])
   * @param srcOffset  the offset of byte[]
   * @param count      the count of dest, and the count of src as well
   */
  putbytes2Uint8s(
    destUint8s, srcBytes,
    destOffset, srcOffset, count,
  ) {
    for (let i = 0; i < count; i++) {
      destUint8s[destOffset + i] = this.convertByte2Uint8(srcBytes[srcOffset
        + i]);
    }
  }


  byteToHex(byte) {
    const hexByte = (byte & 0xff).toString(16);
    return hexByte.length > 1 ? hexByte : `0${hexByte}`;
  }

  byteArrayToString(bytes) {
    const CHUNK_SIZE = 8192;

    // Special-case the simple case for speed's sake.
    if (bytes.length <= CHUNK_SIZE) {
      return String.fromCharCode.apply(null, bytes.map(byte => byte & 0xff));
    }

    // The remaining logic splits conversion by chunks since
    // Function#apply() has a maximum parameter count.
    // See discussion: http://goo.gl/LrWmZ9

    let str = '';
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      str += String.fromCharCode.apply(null, chunk);
    }
    return str;
  }

  /**
   * Turns an array of numbers into the hex string given by the concatenation of
   * the hex values to which the numbers correspond.
   * @param {Uint8Array|Array<number>} array Array of numbers representing
   *     characters.
   * @param {string=} optSeparator Optional separator between values
   * @return {string} Hex string.
   */
  byteArrayToHex(array, optSeparator) {
    const retArr = [];
    array
      .map((numByte) => {
        retArr.push(this.byteToHex(numByte & 0xff));
      });
    return retArr.join(optSeparator || '');
  }


  /**
   * Convert byte to Hex String
   *
   * @param b the byte to be converted
   * @return the Hex String
   */
  convertByte2HexString(b) {
    const u8 = this.convertByte2Uint8(b);
    return this.byteToHex(u8);
  }

  /**
   * Convert char(uint8) to Hex String
   *
   * @param u8 the char(uint8) to be converted
   * @return the Hex String
   */
  convertU8ToHexString(u8) {
    return this.byteToHex(u8);
  }

  /**
   * Split uint8 to 2 bytes of high byte and low byte. e.g. 20 = 0x14 should
   * be split to [0x01,0x04] 0x01 is high byte and 0x04 is low byte
   *
   * @param uint8 the char(uint8)
   * @return the high and low bytes be split, byte[0] is high and byte[1] is
   * low
   */
  splitUint8To2bytes(uint8) {
    if (uint8 < 0 || uint8 > 0xff) {
      throw 'Out of Boundary';
    }
    const hexString = this.convertByte2HexString(uint8);
    let low;
    let high;
    if (hexString.length > 1) {
      high = parseInt(hexString.substring(0, 1), 16);
      low = parseInt(hexString.substring(1, 2), 16);
    } else {
      high = 0;
      low = parseInt(hexString.substring(0, 1), 16);
    }
    // eslint-disable-next-line no-array-constructor
    const result = new Array(high, low);
    return result;
  }

  /**
   * Combine 2 bytes (high byte and low byte) to one whole byte
   *
   * @param high the high byte
   * @param low  the low byte
   * @return the whole byte
   */
  combine2bytesToOne(high, low) {
    if (high < 0 || high > 0xf || low < 0 || low > 0xf) {
      throw 'Out of Boundary';
    }
    // eslint-disable-next-line no-mixed-operators
    return high << 4 | low;
  }


  /**
   * Combine 2 bytes (high byte and low byte) to
   *
   * @param high the high byte
   * @param low  the low byte
   * @return the char(u8)
   */
  combine2bytesToU16(high, low) {
    const highU8 = this.convertByte2Uint8(high);
    const lowU8 = this.convertByte2Uint8(low);
    // eslint-disable-next-line no-mixed-operators
    return highU8 << 8 | lowU8;
  }


  getSpecBytesFromChar(len) {
    const data = new Int8Array(len);
    for (let i = 0; i < len; i++) {
      data[i] = this.convertUint8toByte('1');
    }
    return data;
  }


  /**
   * Generate the specific byte to be sent
   *
   * @param len the len presented by byte
   * @return the byte[]
   */
  genSpecBytes(len) {
    const u8 = this.convertByte2Uint8(len);
    return this.getSpecBytesFromChar(u8);
  }

  parseBssid(bssidBytes) {
    const bytes = new Int8Array([...bssidBytes]);
    return this.getParsedBssid(bytes);
  }

  /**
   * parse "24,-2,52,-102,-93,-60" to "18,fe,34,9a,a3,c4"
   * parse the bssid from hex to String
   *
   * @param bssidBytes the hex bytes bssid, e.g. {24,-2,52,-102,-93,-60}
   * @return the String of bssid, e.g. 18fe349aa3c4
   */
  getParsedBssid(bssidBytes) {
    let sb = '';
    let k;
    let hexK;
    for (let i = 0; i < bssidBytes.length; i++) {
      const bssidByte = bssidBytes[i];
      k = 0xff & bssidByte;
      hexK = this.byteToHex(k);
      sb += hexK;
    }
    return sb;
  }

  /**
   * parse bssid
   *
   * @param bssid the bssid like aa:bb:cc:dd:ee:ff
   * @return byte converted from bssid
   */
  parseBssid2bytes(bssid) {
    const bssidSplits = bssid.split(':');
    const result = new Int8Array(bssidSplits.length);
    for (let i = 0; i < bssidSplits.length; i++) {
      result[i] = parseInt(bssidSplits[i], 16);
    }
    return result;
  }

  getStringBytesLength(str) {
    let totalLength = 0;
    let charCode;
    for (let i = 0; i < str.length; i++) {
      charCode = str.charCodeAt(i);
      if (charCode < 0x007f) {
        totalLength++;
      } else if ((charCode >= 0x0080) && (charCode <= 0x07ff)) {
        totalLength += 2;
      } else if ((charCode >= 0x0800) && (charCode <= 0xffff)) {
        totalLength += 3;
      } else {
        totalLength += 4;
      }
    }
    return totalLength;
  }

  stringToUtf8ByteArray(str) {
    // TODO(user): Use native implementations if/when available
    const out = new Int8Array(this.getStringBytesLength(str));
    let p = 0;
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 128) {
        out[p++] = c;
      } else if (c < 2048) {
        out[p++] = (c >> 6) | 192;
        out[p++] = (c & 63) | 128;
      } else if (
        ((c & 0xFC00) === 0xD800) && (i + 1) < str.length
        && ((str.charCodeAt(i + 1) & 0xFC00) === 0xDC00)) {
        // Surrogate Pair
        c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
        out[p++] = (c >> 18) | 240;
        out[p++] = ((c >> 12) & 63) | 128;
        out[p++] = ((c >> 6) & 63) | 128;
        out[p++] = (c & 63) | 128;
      } else {
        out[p++] = (c >> 12) | 224;
        out[p++] = ((c >> 6) & 63) | 128;
        out[p++] = (c & 63) | 128;
      }
    }
    return out;
  }

  utf8ByteArrayToString(bytes) {
    // TODO(user): Use native implementations if/when available
    const out = [];
    let pos = 0;
    let c = 0;
    while (pos < bytes.length) {
      const c1 = bytes[pos++];
      if (c1 < 128) {
        out[c++] = String.fromCharCode(c1);
      } else if (c1 > 191 && c1 < 224) {
        const c2 = bytes[pos++];
        out[c++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else if (c1 > 239 && c1 < 365) {
        // Surrogate Pair
        const c2 = bytes[pos++];
        const c3 = bytes[pos++];
        const c4 = bytes[pos++];
        const u = ((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)
          - 0x10000;
        out[c++] = String.fromCharCode(0xD800 + (u >> 10));
        out[c++] = String.fromCharCode(0xDC00 + (u & 1023));
      } else {
        const c2 = bytes[pos++];
        const c3 = bytes[pos++];
        out[c++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
    }
    return out.join('');
  }


  /**
   * @param string the string to be used
   * @return the byte[] of String according to {@link #ESPTOUCH_ENCODING_CHARSET}
   */
  getBytesByString(string) {
    try {
      switch (this.ESPTOUCH_ENCODING_CHARSET) {
        case 'UTF-8':
          return this.stringToUtf8ByteArray(string);
      }
    } catch (e) {
      throw 'the charset is invalid';
    }
  }

  hexStringToByteArray(s) {
    const len = s.length;
    const data = ((s) => { const a = []; while (s-- > 0) a.push(0); return a; })((len / 2 | 0));
    for (let i = 0; i < len; i += 2) {
      data[((i / 2 | 0))] = this.convertNumberToByte(((parseInt(s.charAt(i), 16) << 4) + parseInt(s.charAt(i + 1), 16)) | 0);
    }
    return data;
  }

  hexString2hexArray(hexString = '') {
    return hexString.match(/[\da-f]{2}/gi);
  }

  hexArray2Float32(hexArray, fixedLength) {
    if (hexArray.length !== 4) {
      throw 'hex length is wrong';
    }

    const buf = new Uint32Array([parseInt(hexArray.join(''), 16)]);
    const view = new DataView(buf.buffer);

    return fixedLength === undefined ? view.getFloat32() : view.getFloat32().toFixed(fixedLength);
  }

  float32ToHexArray(float) {
    const buf = new Float32Array([float]);
    const dataView = new DataView(buf.buffer);
    const hex = dataView.getUint32(0).toString(16);
    return this.hexString2hexArray(`${`0000000000`.slice(0, 8 - hex.length)}${hex}`);
  }

  hex2Int32(s) {
    if (typeof s === 'string') {
      s = this.hexString2hexArray(s);
    }

    if (s.length !== 4) {
      throw 'int32 must be 4 bytes';
    }

    const num = parseInt(s.join(''), 16);
    const int32 = new Int32Array([num]);
    return int32[0];
  }

  int32ToHex(int32) {
    const uint32Hex = new Uint32Array([int32])[0].toString(16);
    return `${'00000000'.slice(0, 8 - uint32Hex.length)}${uint32Hex}`;
  }


  arrayCopy(srcPts, srcOff, dstPts, dstOff, size) {
    if (srcPts !== dstPts || dstOff >= srcOff + size) {
      while (--size >= 0) dstPts[dstOff++] = srcPts[srcOff++];
    } else {
      const tmp = srcPts.slice(srcOff, srcOff + size);
      for (let i = 0; i < size; i++) { dstPts[dstOff++] = tmp[i]; }
    }
  }

  crc8Byte(c) {
    let crc = 0;
    let b = (c & 0xff);
    for (let i = 0; i < 8; ++i) {
      if (((crc ^ b) & 0x01) !== 0) {
        crc ^= 0x18;
        crc >>= 1;
        crc |= 0x80;
      } else {
        crc >>= 1;
      }
      b >>= 1;
    }
    return this.convertNumberToByte((crc & 0xff));
  }

  crc8Bytes(bs, len) {
    let crc = 0;
    for (let i = 0; i < len; ++i) {
      crc = this.crc8Byte((crc ^ bs[i]));
    }
    return crc;
  }

  base64Encode(string) {
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
      string = String(string);
    var bitmap, a, b, c,
      result = "",
      i = 0,
      rest = string.length % 3; // To determine the final padding

    for (; i < string.length;) {
      if ((a = string.charCodeAt(i++)) > 255 ||
        (b = string.charCodeAt(i++)) > 255 ||
        (c = string.charCodeAt(i++)) > 255)
        throw new TypeError("Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.");

      bitmap = (a << 16) | (b << 8) | c;
      result += b64.charAt(bitmap >> 18 & 63) + b64.charAt(bitmap >> 12 & 63) +
        b64.charAt(bitmap >> 6 & 63) + b64.charAt(bitmap & 63);
    }

    // If there's need of padding, replace the last 'A's with equal signs
    return rest ? result.slice(0, rest - 3) + "===".substring(rest) : result;
  }

  testSplitUint8To2bytes() {
    // 20 = 0x14
    const result = this.splitUint8To2bytes(20);
    if (result[0] === 1 && result[1] === 4) {
      console.log('test_splitUint8To2bytes(): pass');
    } else {
      console.log('test_splitUint8To2bytes(): fail');
    }
  }

  testCombine2bytesToOne() {
    const high = 0x01;
    const low = 0x04;
    if (this.combine2bytesToOne(high, low) === 20) {
      console.log('test_combine2bytesToOne(): pass');
    } else {
      console.log('test_combine2bytesToOne(): fail');
    }
  }

  testConvertChar2Uint8() {
    const b1 = 'a';
    // -128: 1000 0000 should be 128 in unsigned char
    // -1: 1111 1111 should be 255 in unsigned char
    const b2 = -128;
    const b3 = -1;
    if (this.convertByte2Uint8(b1) === 97 && this.convertByte2Uint8(b2) === 128
      && this.convertByte2Uint8(b3) === 255) {
      console.log('test_convertChar2Uint8(): pass');
    } else {
      console.log('test_convertChar2Uint8(): fail');
    }
  }

  testConvertUint8toByte() {
    const c1 = 'a';
    // 128: 1000 0000 should be -128 in byte
    // 255: 1111 1111 should be -1 in byte
    const c2 = 128;
    const c3 = 255;
    if (this.convertUint8toByte(c1) === 97 && this.convertUint8toByte(c2) === -128
      && this.convertUint8toByte(c3) === -1) {
      console.log('test_convertUint8toByte(): pass');
    } else {
      console.log('test_convertUint8toByte(): fail');
    }
  }

  testParseBssid() {
    const b = [15, -2, 52, -102, -93, -60];
    console.log(this.parseBssid(b));
    if (this.parseBssid(b) === '0ffe349aa3c4') {
      console.log('test_parseBssid(): pass');
    } else {
      console.log('test_parseBssid(): fail');
    }
  }

  testMain() {
    this.testConvertUint8toByte();
    this.testConvertChar2Uint8();
    this.testSplitUint8To2bytes();
    this.testCombine2bytesToOne();
    this.testParseBssid();
  }
}

export const byteUtil = new ByteUtil();
