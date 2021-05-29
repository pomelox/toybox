// import {version} from '../../package.json';

const version = '0.0.1';

function log(msg, type, needToWrite) {
  return;

  if (needToWrite === false) {
    return;
  }

  type = type.toUpperCase() || 'DBUG';

  const s = new Error().stack;

  const loc = getLocationFromStack(s);

  const v = `[${version}]`;

  try {
    if (typeof msg === 'object') {
      msg = JSON.stringify(msg);
      msg = `[${type}]${v}${loc}${msg}`;
      console.log(msg);
      // NativeModules.LogModule.writeMessageToFile(msg);
    } else if (typeof msg === 'string') {
      msg = `[${type}]${v}${loc}${msg}`;
      // NativeModules.LogModule.writeMessageToFile(msg);
      console.log(msg);
    }
  } catch (e) {
    console.log('log error...');
    console.log(e);
  }
}

function getLocationFromStack(stack) {
  const lines = stack.split('\n');

  let res = '[';
  try {
    let loc = lines[4];// 注意这里为什么是4
    if (loc) {
      if (loc.indexOf(')') > -1) {
        loc = loc.split(')')[0];
      }
      const arr = loc.split(':');
      const col = arr.pop();
      const line = arr.pop();
      res += line;
      res += ',';
      res += col;
    }
  } catch (e) {
    console.log('exact stack error...');
    console.log(e);
  }


  res += ']';
  return res;
}

const logger = {};

Object.keys(console).forEach((k) => {
  logger[k] = console[k];
});

logger.info = function (msg) {
  console.log(...arguments);
  [].forEach.call(arguments, (el) => {
    log(el, 'info');
  });
};
logger.debug = function (msg) {
  console.log(...arguments);
  [].forEach.call(arguments, (el) => {
    log(el, 'dbug');
  });
};
logger.warn = function (msg) {
  console.log(...arguments);
  [].forEach.call(arguments, (el) => {
    log(el, 'warn');
  });
};
logger.error = function (msg) {
  console.log(...arguments);
  [].forEach.call(arguments, (el) => {
    log(el, 'erro');
  });
};
logger.log = function (msg) {
  console.log(...arguments);
  [].forEach.call(arguments, (el) => {
    log(el, 'dbug');
  });
};


export default logger;
