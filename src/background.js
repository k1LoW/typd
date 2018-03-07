import _ from 'lodash';
import storage from './storage';

function toggleIcon(disabled) {
  if (disabled) {
    // true
    chrome.browserAction.setIcon({path: "off.png"});
    chrome.browserAction.setBadgeText({text:""});        
  } else {
    // false
    chrome.browserAction.setIcon({path: "on.png"});
    chrome.browserAction.setBadgeText({text:"-"});
    chrome.browserAction.setBadgeBackgroundColor({color:[0, 127, 177, 255]});
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  let length = request['length'].toString();
  if (length == '0') {
    length = '-';
  }
  chrome.browserAction.setBadgeText({text: length, tabId:sender.tab.id});
  sendResponse({});
});

storage.get(['disabled']).then((items) => {  
  if (_.has(items, 'disabled')) {
    toggleIcon(items['disabled']);
  } else {
    toggleIcon(false);
  }        
}).catch((err) => {
  console.warn(err);
});

chrome.browserAction.onClicked.addListener(function(tab) {
  storage.get(['disabled']).then((items) => {
    let toggle = false;
    if (_.has(items, 'disabled')) {
      toggle = items['disabled'];
    }
    toggle = !toggle;
    let updates = {};
    updates['disabled'] = toggle;
    return Promise.all([
      new Promise((resolve, reject) => {
        resolve(toggle);
      }),
      storage.set(updates)
    ]);
  }).then((res) => {
    let toggle = res[0];
    toggleIcon(toggle);
  }).catch((err) => {
    console.warn(err);
  });
});
