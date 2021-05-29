/**
 * 用于跨页面来传递数据
 */
const storage = {};

export default {
  register(namespace, args) {
    storage[namespace] = args;
  },
  get(namespace) {
    return storage[namespace];
  },
  remove(namespace) {
    delete storage[namespace];
  },
};
