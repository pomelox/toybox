import { RefAttributes, ForwardRefExoticComponent } from 'react';
import _ from '@underscore';
import urlParse from 'url-parse';
import querystring from 'query-string';
import * as wxlib from './wxlib';
import commonBridge from './common-bridge';
import { byteUtil } from './byteUtil';

export const delay = timeout => new Promise(resolve => setTimeout(() => resolve(), timeout));

export const genReqId = () => `${Date.now().toString()}-${Math.floor(Math.random() * 10000)}`;

export const getStrLen = (str) => {
  if (!str) str = '';

  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i); // 单字节加1
    if ((c >= 0x0001 && c <= 0x007e) || (c >= 0xff60 && c <= 0xff9f)) {
      len++;
    } else {
      len += 2;
    }
  }
  return len;
};

export const isSafeInteger = number => +number <= Math.pow(2, 53) - 1;

export const isNumber = value => /^[0-9]*$/.test(value);

export const appendParams = (url: string, data: any) => {
  const paramArr: string[] = [];
  _.forEach(data, (value, key) => {
    if (typeof value !== 'undefined') {
      if (_.isObject(value)) {
        value = JSON.stringify(value);
      }
      paramArr.push(`${key}=${encodeURIComponent(value)}`);
    }
  });

  if (!paramArr.length) return url;

  return (url.indexOf('?') > -1 ? `${url}&` : `${url}?`) + paramArr.join('&');
};

export const parseParams = (params: { [propName: string]: any; } = {}) => {
  const result = {};

  _.forEach(params, (value, key) => {
    if (typeof value === 'string') {
      try {
        value = decodeURIComponent(value);
      } catch (e) {
      }
    }
    try {
      const _value = JSON.parse(value);
      if (typeof _value === 'number') {
        if (isSafeInteger(_value)) {
          value = _value;
        }
      } else {
        value = _value;
      }
    } catch (err) {
    }
    result[key] = value;
  });

  return result;
};

export const rpx2px = (rpx) => {
  const { windowWidth } = wxlib.system.info;
  return (rpx / 2) * (windowWidth / 375);
};

export const px2rpx = (px) => {
  const { windowWidth } = wxlib.system.info;
  return (px * 2 * 375) / windowWidth;
};

export const normalizeBool = value => !(value === 0 || value === false);

export const hashString = (str) => {
  let hash = 0;
  let i;
  let chr;
  let len;

  if (str.length === 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
};

export const getValueFromRange = (range) => {
  const value: number[] = [];
  range.forEach((item, index) => {
    if (item.active) {
      value.push(index);
    }
  });
  return value;
};

/**
 * 验证身份证号码是否正确
 * @param {*} cardNumber
 * @returns
 */
export const isValidMainlandIDCardNumber = (cardNumber) => {
  // 基本格式校验，18 位，最后一位可以为 X
  if (!/^\d{17}[\dxX]$/.test(cardNumber)) {
    return false;
  }

  // 校验码校验
  const wi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const ai = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sigma = 0;
  for (let i = 0; i < wi.length; i++) {
    sigma += wi[i] * (+cardNumber[i]);
  }
  const n = sigma % 11;
  return cardNumber.substr(-1) === ai[n];
};

/**
 * 检测是否是邮箱
 * @param mail
 * @return {Boolean} 是否是正确邮箱格式
 * @author lockewu
 */
export const isMail = mail => /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(String(mail).trim());

export const validateForm = (formConfig, formData: any = null) => {
  if (!formData) {
    formData = {};

    formConfig.forEach((item) => {
      if (item.enable) {
        if (item.type === 'selector' && item.multi) {
          formData[item.name] = getValueFromRange(item.range);
        } else {
          formData[item.name] = item.value;
        }
      }
    });
  }

  for (let fieldIndex = 0, l = formConfig.length; fieldIndex < l; fieldIndex++) {
    const row = formConfig[fieldIndex];

    if (row.enable && row.rules && row.rules.length) {
      const value = formData[row.name];

      for (let ruleIndex = 0, ruleLength = row.rules.length; ruleIndex < ruleLength; ruleIndex++) {
        const {
          validate,
          message,
          reg,
          regOpts,
          required,
          sameAs,
          checkType,
          namespace,
        } = row.rules[ruleIndex];

        let errorMsg = '';

        if (!validate && !reg && !required && !checkType && !namespace) {
          console.warn('无有效的校验规则，请检查配置');
        }

        if (validate) {
          if (_.isFunction(validate)) {
            if (!validate(value)) {
              if (_.isFunction(message)) {
                errorMsg = message(value);
              } else {
                errorMsg = message;
              }
            }
          } else if (_.isRegExp(validate)) {
            if (!validate.test(value)) {
              errorMsg = message;
            }
          }
        } else if (reg) {
          if (new RegExp(reg, regOpts).test(value)) {
            errorMsg = message;
          }
        } else if (required) {
          let isValid = true;
          switch (row.type) {
            case 'picker':
              if (row.mode === 'multiSelector') {
                isValid = value && value.length && value.every(index => index > -1);
              } else {
                isValid = value > -1;
              }
              break;
            case 'selector':
              if (row.multi) {
                isValid = row.range.some(item => item.active);
              } else {
                isValid = value > -1;
              }
              break;
            default:
              if (!String(value).trim().length) {
                isValid = false;
              }
              break;
          }

          if (!isValid) {
            errorMsg = message;
          }
        } else if (sameAs) {
          if (formData[sameAs] !== value) {
            errorMsg = message;
          }
        } else if (checkType) {
          switch (checkType) {
            case 'mail':
              if (!isMail(value)) {
                errorMsg = message;
              }
              break;
            case 'idcard':
              if (!isValidMainlandIDCardNumber(value)) {
                errorMsg = message;
              }
              break;
          }
        } else if (namespace) {
          const msg = commonBridge.get(namespace)(value);
          if (msg) {
            errorMsg = msg;
          }
        }

        if (errorMsg) {
          throw {
            msg: errorMsg,
            ruleIndex,
            fieldIndex,
          };
        }
      }
    }
  }
};

export const operatingReject = (error) => {
  if (error && error.errMsg && /cancel/.test(error.errMsg)) {
    return Promise.reject();
  }
  return Promise.reject(error);
};

/**
 * 获取标准化的Date实例
 *
 * 时间字符串有两个标准:
 * ISO 8601标准: YYYY-MM-DDThh:mm:ss
 * RFC2822标准: YYYY/MM/DD HH:MM:SS ± timezon(时区用4位数字表示)
 *
 * IOS new Date支持标准的ISO 8601与RFC2822时间字符串，但是如: 2017-08-25 19:13:00这种字符串直接new Date会返回null
 *
 * @param dateStr
 */
export function getStandardDate(dateStr) {
  let date = new Date(dateStr);

  // 先尝试直接new，如果不合法再继续走
  // @ts-ignore
  // eslint-disable-next-line no-restricted-globals
  if (!isNaN(date)) {
    return date;
  }

  try {
    let arr = dateStr.split(/[-+ :T.]/);
    arr = arr.map(row => row.replace(/\D/g, ''));

    date = new Date();

    date.setFullYear(arr[0]);
    date.setMonth(arr[1] - 1);
    date.setDate(arr[2]);
    date.setHours(arr[3] || 0);
    date.setMinutes(arr[4] || 0);
    date.setSeconds(arr[5] || 0);
    date.setMilliseconds(arr[6] || 0);

    return date;
  } catch (err) {
    console.error(err);
    return new Date(dateStr);
  }
}

// 返回一个可以遍历的指定长度的数组:  array(5).map((v, index) => console.log(index));
export function array(length) {
  return Array(...new Array(length));
}

export function getSuffix(filePath) {
  const tmpArr = filePath.split('.');

  if (tmpArr.length > 1) {
    return tmpArr[tmpArr.length - 1];
  }

  return '';
}

const oneKb = 1024;
const oneMb = 1024 * oneKb;
const oneGb = 1024 * oneMb;
const oneTb = 1024 * oneGb;

/**
 * 将byte换为可读单位
 * @param bytes
 * @param {String} [base] 基础单位，如bps, 传入ps, 如果不传，默认返回Byte, Mb, Kb, Gb等
 * @param {String} preferFormat 强制按照该单位格式化
 * @param {Boolean} isTraffic 是否按流量计算
 */
export function transBytes(bytes, base, preferFormat, isTraffic = false) {
  let value;
  let format;

  const _oneKb = isTraffic ? 1000 : oneKb;
  const _oneMb = isTraffic ? (_oneKb * 1000) : oneMb;
  const _oneGb = isTraffic ? (_oneMb * 1000) : oneGb;
  const _oneTb = isTraffic ? (_oneGb * 1000) : oneTb;

  if (bytes >= _oneTb || preferFormat === 'TB') {
    value = (bytes / _oneTb).toFixed(2);
    base = base ? `Tb${base}` : 'TB';
    format = 'TB';
  } else if (bytes >= _oneGb || preferFormat === 'GB') {
    value = (bytes / _oneGb).toFixed(2);
    base = base ? `Gb${base}` : 'GB';
    format = 'GB';
  } else if (bytes >= _oneMb || preferFormat === 'MB') {
    value = (bytes / _oneMb).toFixed(2);
    base = base ? `Mb${base}` : 'MB';
    format = 'MB';
  } else if (bytes >= _oneKb || preferFormat === 'KB') {
    value = (bytes / _oneKb).toFixed(2);
    base = base ? `Kb${base}` : 'KB';
    format = 'KB';
  } else {
    value = String(bytes || 0);
    base = base ? `b${base}` : 'B';
    format = 'B';
  }

  return {
    value,
    base,
    string: `${value}${base}`,
    format,
  };
}

export function getFileName(filePath) {
  const lastIndex = filePath.lastIndexOf('/');

  return filePath.slice(lastIndex + 1);
}


/*
腾讯云云api专用的一个参数转换方法
用于将 {a: [1, 2, 3]} 转成 { 'a.0': 1, 'a.1': 2, 'a.2': 3 }
 */
export function flattenArray(input, prefix = '') {
  const output = {};

  for (const key in input) {
    const value = input[key];
    if (typeof value === 'object') {
      Object.assign(output, flattenArray(value, `${prefix}${key}.`));
    } else {
      output[`${prefix}${key}`] = value;
    }
  }

  return output;
}

// @ts-ignore
export const noop = (a?: any): void => {};

export function defineMap2SelectorList(defineMap: { [propName: string]: string; }): SelectorOption[] {
  const result: { value: string, text: string }[] = [];

  for (const key in defineMap) {
    result.push({ value: key, text: defineMap[key] });
  }

  return result;
}

export function getSecondsFromHourMinute(time) {
  const [hour = '', minute = '', second = ''] = time.split(':');

  return Number(hour) * 3600 + Number(minute) * 60 + Number(second);
}

export function getHourMinuteFromTime(seconds) {
  const hour = Math.floor(seconds / 3600);
  const minute = Math.floor(seconds % 3600 / 60);
  const second = seconds % 3600 % 60;

  return { hour, minute, second };
}

export function getHourMinuteStr(seconds) {
  const { hour, minute } = getHourMinuteFromTime(seconds);
  const hourStr = hour > 0 ? `${hour}小时` : '';
  const minuteStr = minute > 0 || hour === 0 ? `${minute}分钟` : '';
  return `${hourStr}${minuteStr}`;
}

/**
 * 获取精度
 */
export function getPrecision(value) {
  if (typeof value !== 'number') {
    return 0;
  }
  const str = value.toString();
  if (/e-(.+)$/.test(str)) {
    return parseInt(RegExp.$1, 10);
  }
  if (str.indexOf('.') >= 0) {
    return str.length - str.indexOf('.') - 1;
  }
  return 0;
}

export async function fetchAllList<T>(
  fetchFn: (props: { offset: number, limit: number }) => Promise<ListResponse<T>>
): Promise<T[]> {
  const limit = 100;
  let offset = 0;
  let total = 100;
  let list: T[] = [];

  while (offset === 0 || list.length < total) {
    const resp = await fetchFn({ offset, limit });

    if (!resp.list.length) return list;

    total = resp.total;
    offset = offset + limit;
    list = list.concat(resp.list);
  }

  return list;
}

export function isNumeric(any) {
  return !_.isNaN(parseFloat(any)) && _.isFinite(any);
}

export function validateFormField({
  formData,
  value,
  fieldConfig,
}) {
  if (!fieldConfig.rules) return '';

  const defaultMsg = fieldConfig.message;

  for (let i = 0, l = fieldConfig.rules.length; i < l; i++) {
    const {
      validate,
      message,
      reg,
      regStr,
      regOpts,
      required,
      sameAs,
    } = fieldConfig.rules[i];

    let errorMsg = '';
    let hasError = false;

    if (validate) {
      if (_.isFunction(validate)) {
        if (!validate(value, formData)) {
          if (_.isFunction(message)) {
            errorMsg = message(value);
          } else {
            errorMsg = message;
          }

          hasError = true;
        }
      }
    } else if (reg) {
      if (!reg.test(value)) {
        errorMsg = message;
        hasError = true;
      }
    } else if (regStr) {
      if (!new RegExp(regStr, regOpts).test(value)) {
        errorMsg = message;
        hasError = true;
      }
    } else if (required) {
      let isValid = true;
      switch (fieldConfig.type) {
        case 'selector':
          if (typeof value !== 'undefined' && fieldConfig.options) {
            isValid = !!fieldConfig.options.find(item => item.value === value);
          } else {
            isValid = false;
          }
          break;
        default: {
          // 只要是个数，就可以认为有值了，更精确的规则请使用其他规则
          if (!isNumeric(value) && !String(value || '').trim().length) {
            isValid = false;
          }
          break;
        }
      }

      if (!isValid) {
        errorMsg = message;
        hasError = true;
      }
    } else if (sameAs) {
      if (formData[sameAs] !== value) {
        errorMsg = message;
        hasError = true;
      }
    }

    if (hasError) {
      return errorMsg || defaultMsg;
    }
  }
}

/**
 * 倒计时
 * @param finishTime 结束的时间戳
 * @param intervalCallback 倒计时中每个时刻执行的回调，传入剩余时间(ms)
 * @param finishCallback 倒计时结束的回调
 * @return {{stop: (function())}} 返回一个对象，保护一个stop方法，调用则停止倒计时
 */
export const countDown = (finishTime, intervalCallback, finishCallback = noop) => {
  let timer;

  if (isNumeric(finishTime)) {
    intervalCallback(finishTime - Date.now());

    timer = setInterval(() => {
      const timeLeft = finishTime - Date.now();

      if (timeLeft > 0) {
        intervalCallback(timeLeft);
      } else {
        clearInterval(timer);
        if (_.isFunction(finishCallback)) {
          finishCallback();
        }
      }
    }, 500);
  } else if (_.isFunction(finishCallback)) {
    finishCallback();
  }

  return {
    stop: () => clearInterval(timer),
  };
};

/**
 * 掩盖手机,使部分可见：手机头尾至少显示两位，中间最多隐藏4位
 * 如：15012346685 => 150****6685
 * @param  {String} phoneNumber
 * @return {String} phoneNumber 若未处理，则原样返回
 * @author  ericji
 */
export function maskPhoneNumber(phoneNumber) {
  phoneNumber = `${phoneNumber}`;

  if (/^\d{5,}$/.test(phoneNumber)) {
    const left = phoneNumber.slice(0, 2);
    let middle = phoneNumber.slice(2, -2);
    const right = phoneNumber.slice(-2);

    if (middle.length <= 4) {
      middle = '****'.slice(0, middle.length);
    } else {
      middle = `${middle.slice(0, Math.floor(middle.length / 2) - 2)}****${middle.slice(Math.floor(middle.length / 2) + 2)}`;
    }

    phoneNumber = left + middle + right;
  }

  return phoneNumber;
}

/**
 * 掩盖邮箱,使部分可见：隐藏`@`前4位,`@`前少于5位则用`*`号补全5位
 * 如：12345678@qq.com => 1234****@qq.com; 1234@qq.com => 1****@qq.com
 * @param  {String} mail
 * @return {String} mail 若未处理，则原样返回
 * @author  ericji
 */
export function maskMail(mail) {
  // 已经处理过了不再处理
  if (mail.indexOf('*') !== -1) {
    return mail;
  }

  const mailPair = mail.split('@');

  if (mailPair.length !== 2) {
    return mail;
  }

  let mailId = mailPair[0];
  const mailDomain = mailPair[1];

  if (mailId.length > 4) {
    mailId = `${mailId.slice(0, -4)}****`;
  } else {
    mailId = `${mailId.slice(0, 1)}****`;
  }

  return (`${mailId}@${mailDomain}`);
}

export function parseUrl(url) {
  const uri = urlParse(url);

  if (uri && uri.query) {
    uri.query = querystring.parse(uri.query);
  }

  return uri;
}

/**
 * 对传入的值中的长字段自动进行裁剪
 *
 *   - 传入字符串: 裁剪字符串长度
 *   - 传入数组: 裁剪数组长度，并递归裁剪数组的每个元素
 *   - 传入对象: 对对象每个字段进行递归裁剪
 *   - 其它: 原样返回
 *
 * @param {any} field
 * @param {number} maxStringLength 字符串允许的最大长度，默认为 4096
 * @param {number} maxArrayLength  数组允许的最大长度，默认为 10
 * @param {number} maxObjectKeys  对象最大字段限制，默认为 10
 */
export function cutoffLong(field, maxStringLength = 4096, maxArrayLength = 10, maxObjectKeys = 20) {
  /* eslint-disable */
  function cut(value, maxStringLength, maxArrayLength) {
    if (!value) return value;

    if (typeof value === 'string' && value.length > maxStringLength) {
      return value.substr(0, maxStringLength) + `... (${value.length - maxStringLength} characters truncated)`;
    }

    if (_.isArray(value)) {
      return value.length > maxArrayLength ? (value
          .slice(0, maxArrayLength)
          .map(x => cut(x, maxStringLength, maxArrayLength))
          .concat(`... (${value.length - maxArrayLength} items truncated)`)
      ) : value;
    }

    if (typeof value === 'object') {
      return Object.keys(value).reduce((newValue, key, index, keys) => {
        if (index < maxObjectKeys) {
          newValue[key] = cut(value[key], maxStringLength, maxArrayLength);
        } else if (index === maxObjectKeys) {
          newValue[`${keys.length - maxObjectKeys} keys truncated`] = 1;
        }

        return newValue;
      }, {});
    }
    return value;
  }

  return cut(field, maxStringLength, maxArrayLength);
}

export function arrayBufferToHexStringArray(buffer) {
  try {
    if (Object.prototype.toString.call(buffer) !== '[object ArrayBuffer]') {
      throw 'invalid array buffer';
    }
    const dataView = new DataView(buffer);

    const hexStrArr: string[] = [];

    for (let i = 0, l = dataView.byteLength; i < l; i++) {
      const str = dataView.getUint8(i);
      let hex = (str & 0xff).toString(16);
      hex = (hex.length === 1) ? `0${hex}` : hex;
      hexStrArr.push(hex.toUpperCase());
    }

    return hexStrArr;
  } catch (err) {
    console.error('arrayBufferToHexStringArray error', err);
    return [];
  }
}

export function byteArrayToStr(bytes) {
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


export function hexToArrayBuffer(hex) {
  return new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))).buffer;
}

export function str2hexStr(str) {
  return byteUtil.byteArrayToHex(byteUtil.stringToByteArray(str));
}

export function hex2str(hex) {
  let hexArr;
  if (typeof hex === 'string') {
    hexArr = hex.match(/[\da-f]{2}/gi);
  } else {
    hexArr = hex;
  }
  return byteArrayToStr(new Int8Array(hexArr.map(a => parseInt(a, 16))));
}


export const pify = (api, context = wx) => (params, ...others) => new Promise((resolve, reject) => {
  api.call(context, { ...params, success: resolve, fail: reject }, ...others);
});

export function configListFilter(list) {
  if (!list || !list.length) {
    return list;
  }
  return list.filter(item => item.Status === 1)
    .sort((a, b) => a.Order - b.Order);
}

export type Handle<T> = T extends ForwardRefExoticComponent<RefAttributes<infer T2>> ? T2 : never;

export interface PromiseObj<T> {
  promise: Promise<T>;
  resolve: (T) => any;
  reject: (any?: any) => any;
}

export function genPromise<T>(): PromiseObj<T> {
  let resolve;
  let reject;

  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return { promise, resolve, reject };
}

export function mergeConnectDeviceConfig(defaultConfig, config) {
  const mergedConfig = {};
  Object.keys(defaultConfig).forEach((section) => {
    mergedConfig[section] = { ...defaultConfig[section] };
    if (!config[section]) {
      return;
    }
    Object.keys(defaultConfig[section]).forEach((key) => {
      if (config[section][key]) {
        mergedConfig[section][key] = config[section][key];
      }
    })
  });
  return mergedConfig;
}
