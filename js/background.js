function toggleIcon(toggle) {
    if (toggle) {
        chrome.browserAction.setIcon({path: "on.png"});
        chrome.browserAction.setBadgeText({text:"-"});
        chrome.browserAction.setBadgeBackgroundColor({color:[0, 127, 177, 255]});
    } else {
        chrome.browserAction.setIcon({path: "off.png"});
        chrome.browserAction.setBadgeText({text:""});
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

chrome.storage.local.get(['enabled'], function(items) {
    if(chrome.extension.lastError !== undefined) {
        // failure
        throw 'typd: chrome.extention.error';
    } else {
        // success
        if (_.has(items, 'enabled')) {
            toggleIcon(items['enabled']);
        } else {
            toggleIcon(false);
        }        
    }
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.storage.local.get(['enabled'], function(items) {
        if(chrome.extension.lastError !== undefined) {
            // failure
            throw 'typd: chrome.extention.error';
        } else {
            // success
            var toggle = false;
            if (_.has(items, 'enabled')) {
                toggle = items['enabled'];
            }
            toggle = !toggle;
            var updates = {};
            updates['enabled'] = toggle;
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
