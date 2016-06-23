import _ from 'underscore';
import $ from 'jquery';
import CryptoJS from 'crypto-js';
import storage from './storage';

// type="password" だったinputのname属性
let typePasswordNames = [];

/*
 * gatherInputData
 * 表示されているinput select textareaから入力値を収集して
 * name属性と入力値のhash objectに変換
 * 
 */
function gatherInputData() {
  typePasswordNames = [];
  let obj = {};
  $('input:visible:not(:file),select:visible').each(function() {
    let $self = $(this);
    let name = $self.attr('name');
    if ('undefined' == typeof name) {
      return;
    }
    let value = null;
    if ($self.attr('type') == 'checkbox') {
      value =  $self.prop('checked');
    } else if ($self.attr('type') == 'radio') {
      if ($self.prop('checked')) {
        value = $self.val();
      } else {
        return;
      }
    } else {
      value = $self.val();
    }
    
    if (_.has(obj, name)) {
      if (_.isArray(obj[name])) {
        obj[name].push(value);
      } else {
        let tmp = obj[name];
        obj[name] = [tmp, value];
      }
    } else {
      obj[name] = value;
    }
    
    if ($self.attr('type') == 'password') {
      typePasswordNames.push($self.attr('name'));
    }
  });
  return obj;
}

/*
 * restoreInputData
 * hash objectから表示されているinput select textareaに入力値をセットする
 * 
 * 
 */
function restoreInputData(data) {
  _.each(data, function(values, name) {
    let type = $('input[name="' + name + '"]:visible').attr('type');
    if (!_.isArray(values)) {
      values = [values];
    }            
    
    switch (type) {
    case undefined:
      // select
      $('select[name="' + name + '"]:visible').each(function(i) {
        if (_.size(values) <= i) {
          return;
        }
        $(this).val(values[i]);
      });
      // textarea
      $('textarea[name="' + name + '"]:visible').each(function(i) {
        if (_.size(values) <= i) {
          return;
        }
        $(this).val(values[i]);
      });
      break;
      // checkbox
    case 'checkbox':
      $('input[type="checkbox"][name="' + name + '"]:visible').each(function(i) {
        if (_.size(values) <= i) {
          return;
        }                
        if (values[i]) {
          $(this).prop('checked', true);
        } else {
          $(this).prop('checked', false);
        }
      });
      break;
      // radio
    case 'radio':
      _.map(values, function(value) {
        $('input[type="radio"][name="' + name + '"][value="' + value  + '"]:visible').prop('checked', true);
      });
      break;
      // input
    case 'text':
    case 'integer':
    case 'email':
    case 'password':
    default:
      $('input[name="' + name + '"]:visible').each(function(i) {
        if (_.size(values) <= i) {
          return;
        }
        $(this).val(values[i]);
      });
      break;
    }
  });
}

/*
 * encryptInputData
 * 入力値のhash objectを暗号化
 *
 */
function encryptInputData(data, passphrase) {
  return '' + CryptoJS.AES.encrypt(JSON.stringify(data), passphrase);
}

/*
 * decryptInputData
 * 暗号化された入力値のhash objectを復号化
 *
 */
function decryptInputData(encrypted, passphrase) {
  let data = [];
  try {
    let decrypted = CryptoJS.AES.decrypt(_.first(_.values(encrypted)), passphrase);
    data = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  } catch(e) {
    alert(chrome.i18n.getMessage('decrypt_error'));
    return data;
  }    
  return data;
}

/*
 * generateKeyhash
 * ページのkeyhashを作成
 *
 */
function generateKeyhash() {
  let data = gatherInputData();
  let keys = _.keys(data).sort();
  let keyhash = CryptoJS.SHA256(JSON.stringify(keys)).toString();
  let keymap = {};
  storage.get(['keymap']).then((items) => {
    if (_.has(items, 'keymap')) {
      keymap = items['keymap'];
    }
    keymap[keyhash] = keys;
    items['keymap'] = keymap;
    return storage.set(items);
  }).then((res) => {
    
  }).catch((err) => {
    console.warn(err);
  });
  
  return keyhash;
}

/*
 * generateDatahash
 *
 */
function generateDatahash(data) {
  return CryptoJS.SHA256(JSON.stringify(_.sortBy(data, function(val, key) {
    return key;
  }))).toString();
}

function setPrevdata(tmpkey, tmpdata) {
  storage.get([tmpkey]).then((previtems) => {
    let prevdatas = [];
    
    // 既存データを設置
    if (_.has(previtems, tmpkey)) {
      prevdatas = previtems[tmpkey];
    }
    prevdatas.unshift(tmpdata);
    let tmpitems ={};
    tmpitems[tmpkey] = _.uniq(prevdatas);

    return storage.set(tmpitems);
  }).then((res) => {
    removeTmpdata();
  }).catch((err) => {
    console.warn(err);
  });
}

function removeTmpdata() {
  storage.remove(['tmpkey', 'tmpdata']).then((res) => {
  }).catch((err) => {
    console.warn(err);
  });
}

function denyHost(host) {
  storage.get('options').then((items) => {
    let options = items['options'];
    if (!_.has(items, 'options') || !_.has(items['options'], 'key-clear')) {
      options = setDefaultOptions();
    }
    let denyHosts = options['deny-hosts'];
    if (denyHosts) {
      denyHosts += "\n" + host;
    } else {
      denyHosts = host;
    }
    options['deny-hosts'] = denyHosts;
    let setItems = {};
    setItems['options'] = options;
    return storage.set(setItems);
  }).then((res) => {}).catch((err) => {
    console.warn(err);
  });
}

function allowHost(host) {
  storage.get('options').then((items) => {
    let options = items['options'];
    if (!_.has(items, 'options') || !_.has(items['options'], 'key-clear')) {
      options = setDefaultOptions();
    }
    let allowHosts = options['allow-hosts'];
    if (allowHosts) {
      allowHosts += "\n" + host;
    } else {
      allowHosts = host;
    }
    options['allow-hosts'] = allowHosts;
    let setItems = {};
    setItems['options'] = options;
    return storage.set(setItems);    
  }).then((res) => {}).catch((err) => {
    console.warn(err);
  });
}

function isAllowHost(allowHosts) {
  let host = window.location.host;
  if (!allowHosts) {
    return false;
  }
  let allows = allowHosts.split(/\r\n|\r|\n|,/);
  if (_.indexOf(allows, host) < 0) {
    return false;
  }
  return true;
}

function isDenyHost(denyHosts) {
  let host = window.location.host;
  if (!denyHosts) {
    return false;
  }
  let denys = denyHosts.split(/\r\n|\r|\n|,/);
  if (_.indexOf(denys, host) < 0) {
    return false;
  }
  return true;
}

/*
 * options
 * 
 */
function setDefaultOptions() {
  let options ={};
  options['passphrase'] = '';
  options['include-password'] = false;
  options['key-restore'] = 'shift+r';
  options['key-clear'] = 'shift+c';
  let items = {};
  items['options'] = options;
  storage.set(items).then((res) => {}).catch((err) => {
    console.warn(err);
  });
  
  return options;
}

function restoreOptions() {
  storage.get('options').then((items) => {
    let options = items['options'];
    if (!_.has(items, 'options') || !_.has(items['options'], 'key-clear')) {
      options = setDefaultOptions();
    }
    $('#passphrase').val(options['passphrase']);
    $('#include-password').prop('checked', options['include-password']);
    $('#key-restore').val(options['key-restore']);
    $('#key-clear').val(options['key-clear']);
    $('#deny-hosts').val(options['deny-hosts']);
    $('#allow-hosts').val(options['allow-hosts']);
  }).catch((err) => {
    console.warn(err);
  });
}

function saveOptions() {
  $('#options-message').hide();
  let options ={};
  options['passphrase'] = $('#passphrase').val();
  options['include-password'] = $('#include-password').prop('checked');
  options['key-restore'] = $('#key-restore').val();
  options['key-clear'] = $('#key-clear').val();
  options['deny-hosts'] = $('#deny-hosts').val();
  options['allow-hosts'] = $('#allow-hosts').val();
  let items = {};
  items['options'] = options;
  storage.set(items).then((res) => {
    $('#options-message').text(chrome.i18n.getMessage('save_options_complete')).fadeIn();
  }).catch((err) => {
    console.warn(err);
  });
}

function clearDataByKeyhash(keyhash) {
  if (confirm(chrome.i18n.getMessage('confirm_clear_form_data'))) {
    storage.remove(keyhash).then((res) => {
      chrome.runtime.sendMessage({length:0}, function(response) {});
    }).catch((err) => {
      console.warn(err);
    });
    storage.get(['keymap']).then((items) => {
      let keymap = {};
      if (_.has(items, 'keymap')) {
        keymap = items['keymap'];
      }
      if (!_.has(keymap, keyhash)) {
        return new Promise.reject('no keyhash');
      }
      delete keymap[keyhash];
      items['keymap'] = keymap;
      return storage.set(items);
    }).catch((err) => {
      console.warn(err);
    });
  }  
}

function clearAllData() {
  $('#options-message').hide();
  storage.get(['disabled', 'options']).then((items) => {
    return Promise.all([
      new Promise((resolve, reject) => {
        resolve(items);
      }),
      storage.clear()
    ]);
  }).then((res) => {
    let items = res[0];
    return storage.set(items);
  }).then((res) => {
    $('#options-message').text(chrome.i18n.getMessage('clear_all_data_complete')).fadeIn();
  }).catch((err) => {
    console.warn(err);
  });  
}

function getDataByKeyhash() {
  let keyhash = generateKeyhash();
  return new Promise((resolve, reject) => {
    storage.get([
      'disabled',
      'options',
      'tmpkey',
      'tmpdata',
      'tmphost',
      keyhash
    ]).then((items) => {
      if (!_.has(items, 'disabled')) {
        reject('disabled');
      }
      if (items['disabled']) {
        reject('disabled');
      }
      if (!_.has(items, 'options')) {
        setDefaultOptions();
        alert(chrome.i18n.getMessage('no_passphrase'));
        reject(chrome.i18n.getMessage('no_passphrase'));
      }
      if (!_.has(items['options'], 'passphrase')) {
        alert(chrome.i18n.getMessage('no_passphrase'));
        reject(chrome.i18n.getMessage('no_passphrase'));
      }
      if (!items['options']['passphrase']) {
        alert(chrome.i18n.getMessage('no_passphrase'));
        reject(chrome.i18n.getMessage('no_passphrase'));
      }
      items['keyhash'] = keyhash;

      let dataLength = 0;
      if (_.has(items, keyhash)) {
        dataLength = items[keyhash].length;
      }
      chrome.runtime.sendMessage({length:dataLength}, function(response) {});
      
      resolve(items);
    }).catch((err) => {
      reject(err);
    });
  });  
}

module.exports = {
  typePasswordNames: typePasswordNames,
  gatherInputData: gatherInputData,
  restoreInputData: restoreInputData,
  encryptInputData: encryptInputData,
  decryptInputData: decryptInputData,
  generateKeyhash: generateKeyhash,
  generateDatahash: generateDatahash,
  setPrevdata: setPrevdata,
  removeTmpdata: removeTmpdata,
  denyHost: denyHost,
  allowHost: allowHost,
  isAllowHost: isAllowHost,
  isDenyHost: isDenyHost,
  setDefaultOptions: setDefaultOptions,
  restoreOptions: restoreOptions,
  saveOptions: saveOptions,
  clearDataByKeyhash: clearDataByKeyhash,
  clearAllData: clearAllData,
  getDataByKeyhash: getDataByKeyhash
};
