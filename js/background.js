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
    var length = request['length'].toString();
    if (length == '0') {
        length = '-';
    }
    chrome.browserAction.setBadgeText({text: length, tabId:sender.tab.id});
    sendResponse({});
});

chrome.storage.local.get(['disabled'], function(items) {
    if(chrome.extension.lastError !== undefined) {
        // failure
        throw 'typd: chrome.extention.error';
    } else {
        // success
        if (_.has(items, 'disabled')) {
            toggleIcon(items['disabled']);
        } else {
            toggleIcon(false);
        }        
    }
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.storage.local.get(['disabled'], function(items) {
        if(chrome.extension.lastError !== undefined) {
            // failure
            throw 'typd: chrome.extention.error';
        } else {
            // success
            var toggle = false;
            if (_.has(items, 'disabled')) {
                toggle = items['disabled'];
            }
            toggle = !toggle;
            var updates = {};
            updates['disabled'] = toggle;
            chrome.storage.local.set(updates, function() {
                if(chrome.extension.lastError !== undefined) {
                    // failure
                    throw 'typd: chrome.extention.error';
                }
                else {
                    // success
                }
            });
            toggleIcon(toggle);
        }
    });
});
