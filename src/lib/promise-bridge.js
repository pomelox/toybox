/**
 * 用于跨页面来注册、销毁Promise
 */
const storage = {};

export default {
  register(namespace) {
    if (storage[namespace] && storage[namespace].promise) {
      return storage[namespace].promise;
    }

    storage[namespace] = {};

    storage[namespace].promise = new Promise((resolve, reject) => {
      storage[namespace].resolve = resolve;
      storage[namespace].reject = reject;
    }).then((resp) => {
      this.clearPromise(namespace);
      return resp;
    }).catch((err) => {
      this.clearPromise(namespace);
      return Promise.reject(err);
    });

    return storage[namespace].promise;
  },
  triggerResolve(namespace, data) {
    if (storage[namespace] && typeof storage[namespace].resolve === 'function') {
      storage[namespace].resolve(data);
    } else {
      this.clearPromise(namespace);
    }
  },
  triggerReject(namespace, error) {
    if (storage[namespace] && typeof storage[namespace].reject === 'function') {
      storage[namespace].reject(error);
    } else {
      this.clearPromise(namespace);
    }
  },
  clearPromise(namespace) {
    storage[namespace] = null;
  },
  getAll() {
    return storage;
  },
};
