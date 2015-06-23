// pubsub
var pubsub = Pubsub.create();

$(function() {
    // chrome.storage.local.getBytesInUse(null, function(byteInUse) {
    //     // 5,242,880 byte
    // });

    var keyhash = generateKeyhash(gatherInputData());
    chrome.storage.local.get([
        'disabled',
        'options',
        'tmpkey',
        'tmpdata',
        'tmphost',
        keyhash
    ], function(items) {
        if(chrome.extension.lastError !== undefined) { // failure
            throw 'typd: chrome.extention.error';
        }

        if (!_.has(items, 'disabled')) {
            return;
        }
        if (items['disabled']) {
            return;
        }
        if (!_.has(items, 'options')) {
            setDefaultOptions();
            alert(chrome.i18n.getMessage('no_passphrase'));
            return;
        }
        if (!_.has(items['options'], 'passphrase')) {
            alert(chrome.i18n.getMessage('no_passphrase'));
            return;
        }
        if (!items['options']['passphrase']) {
            alert(chrome.i18n.getMessage('no_passphrase'));
            return;
        }

        var passphrase = items['options']['passphrase'];
        var allowHosts = items['options']['allow-hosts'];
        var denyHosts = items['options']['deny-hosts'];
        var includePassword = items['options']['include-password'];
        var dataLength = 0;
        var pos = 0;

        if (items['tmpkey'] && items['tmpdata'] && items['tmphost']) {
            var tmpkey = items['tmpkey'];
            var tmpdata = items['tmpdata'];
            var tmphost = items['tmphost'];
            $('body').prepend('<div class="typd-box"><div class="typd-message"><p>'
                              + 'typd: ' 
                              + chrome.i18n.getMessage('confirm_save_this_form_data')
                              + '</p><button class="typd-btn typd-btn-save">'
                              + chrome.i18n.getMessage('save_form_data')
                              + '</button><button class="typd-btn typd-btn-cancel">'
                              + chrome.i18n.getMessage('dont_save_form_data')
                              + '</button><button class="typd-btn typd-btn-allow-host">'
                              + chrome.i18n.getMessage('save_form_data_on_host', tmphost)
                              + '</button><button class="typd-btn typd-btn-deny-host">'
                              + chrome.i18n.getMessage('dont_save_form_data_on_host', tmphost)
                              + '</button></div></div>');
            removeTmpdata();

            if (isAllowHost(allowHosts)) {
                setPrevdata(tmpkey, tmpdata);
            } else {
                
                $('.typd-box').animate({
                    bottom:0
                }, function() {
                    var $box = $(this);
                    $('.typd-btn-save').on('click', function() {
                        setPrevdata(tmpkey, tmpdata);
                        $box.animate({bottom:-50}, function() {
                            $box.remove();
                        });
                    });
                    $('.typd-btn-cancel').on('click', function() {
                        $box.animate({bottom:-50}, function() {
                            $box.remove();
                        });
                    });
                    $('.typd-btn-allow-host').on('click', function() {
                        allowHost(tmphost);
                        $box.animate({bottom:-50}, function() {
                            $box.remove();
                        });
                    });
                    $('.typd-btn-deny-host').on('click', function() {
                        denyHost(tmphost);
                        $box.animate({bottom:-50}, function() {
                            $box.remove();
                        });
                    });
                });

            }
        }
        
        if (_.has(items, keyhash)) {
            dataLength = items[keyhash].length;
        }
        chrome.runtime.sendMessage({length:dataLength}, function(response) {});

        key(items['options']['key-restore'], function(event, handler){
            if (dataLength == 0) {
                return false;
            }
            var data = decryptInputData(items[keyhash][pos], passphrase);
            restoreInputData(data);
            pos++;
            if (pos >= dataLength) {
                pos = 0;
            }
            return false;
        });

        key(items['options']['key-clear'], function(event, handler){
            if (dataLength == 0) {
                return false;
            }
            try {
                if (confirm(chrome.i18n.getMessage('confirm_clear_form_data'))) {
                    chrome.storage.local.remove(keyhash, function() {
                        if(chrome.extension.lastError !== undefined) { // failure
                            throw 'typd: chrome.extention.error';
                        }
                        chrome.runtime.sendMessage({length:0}, function(response) {});
                    });
                }
            } catch(e) {
                alert(chrome.i18n.getMessage('data_delete_error'));
            }
            return false;
        });

        $('form').on('submit', function() {
            if (isDenyHost(denyHosts)) {
                return true;
            }
            
            var data = gatherInputData();

            if (JSON.stringify(data) == '{}') {
                return true;
            }
            if (_.uniq(_.values(data)).toString() == [""].toString()) {
                return true;
            }

            if (!includePassword) {
                _.map(typePasswordNames, function(name) {
                    data[name] = '';
                });
            }

            chrome.storage.local.get([keyhash], function(items) {
                if(chrome.extension.lastError !== undefined) { // failure
                    throw 'typd: chrome.extention.error';
                }

                var datas = [];
                var encrypted = encryptInputData(data, passphrase);
                var datahash = generateDatahash(data);

                // 既存データを設置
                if (_.has(items, keyhash)) {
                    datas = items[keyhash];
                }

                var hashitem = {};
                hashitem[datahash] = encrypted;

                var exists = _.filter(datas, function(d) {
                    return (datahash == _.first(_.keys(d)));
                }).length;

                if (exists > 0) {
                    // 既に存在する場合はソートをして保存
                    var filterd = _.filter(datas, function(d) {
                        return (datahash != _.first(_.keys(d)));
                    });
                    filterd.unshift(hashitem);

                    items ={};
                    items[keyhash] = _.uniq(filterd);
                    chrome.storage.local.set(items, function() {
                        if(chrome.extension.lastError !== undefined) { // failure
                            throw 'typd: chrome.extention.error';
                        }
                    });
                } else {
                    // 新規データ
                    items ={};
                    items['tmpkey'] = keyhash;
                    items['tmpdata'] = hashitem;
                    items['tmphost'] = window.location.host;
                    chrome.storage.local.set(items, function() {
                        if(chrome.extension.lastError !== undefined) { // failure
                            throw 'typd: chrome.extention.error';
                        }
                    });
                }
            });
            return true;
        });

    });

});
