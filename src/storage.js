var storage = {
  get: (keys) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (items) => {
        if(chrome.extension.lastError !== undefined) { // failure
          reject(chrome.extension.lastError);
        }
        resolve(items);
      });
    });
  },
  set: (items) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if(chrome.extension.lastError !== undefined) { // failure
          reject(chrome.extension.lastError);
        }
        resolve(true);
      });
    });
  },
  remove: (items) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(items, () => {
        if(chrome.extension.lastError !== undefined) { // failure
          reject(chrome.extension.lastError);
        }
        resolve(true);
      });
    });
  },
  clear: () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if(chrome.extension.lastError !== undefined) { // failure
          reject(chrome.extension.lastError);
        }
        resolve(true);
      });
    });
  }
};

module.exports = storage;
