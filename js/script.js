// pubsub
var pubsub = Pubsub.create();

// @todo checkedでないcheckboxがデータとしてserializeされない

$(function() {
    // chrome.storage.local.getBytesInUse(null, function(byteInUse) {
    //     // 5,242,880 byte
    // });
    
    var keyhash = generateKeyhash(gatherInputData());
    chrome.storage.local.get(['enabled', 'options', 'tmpkey', 'tmpdata', keyhash], function(items) {
        if(chrome.extension.lastError !== undefined) { // failure
            throw 'typd: chrome.extention.error';
        }

        if (!_.has(items, 'enabled')) {
            return;
        }
        if (!items['enabled']) {
            return;
        }
        if (!_.has(items, 'options')) {
            alert('typd: 設定>拡張機能でパスフレーズをセットしてください');
            return;
        }
        if (!_.has(items['options'], 'passphrase')) {
            alert('typd: 設定>拡張機能でパスフレーズをセットしてください');
            return;
        }
        if (!items['options']['passphrase']) {
            alert('typd: 設定>拡張機能でパスフレーズをセットしてください');
            return;
        }

        var passphrase = items['options']['passphrase'];
        var includePassword = items['options']['include-password'];
        var dataLength = 0;
        var pos = 0;
        
        if (items['tmpkey'] && items['tmpdata']) {
            var tmpkey = items['tmpkey'];
            var tmpdata = items['tmpdata'];
            $('body').prepend('<div class="typd-box"><div class="typd-message"><p>入力データを保存しますか？</p><button class="typd-btn typd-btn-save">保存する</button><button class="typd-btn typd-btn-cancel">キャンセル</button></div></div>');
            $('.typd-box').animate({
                bottom:0
            }, function() {
                var $box = $(this);
                $('.typd-btn-save').on('click', function() {
                    setPrevdata(tmpkey, tmpdata);
                    removeTmpdata();
                    $box.animate({bottom:-50}, function() {
                        $box.remove();
                    });
                });
                $('.typd-btn-cancel').on('click', function() {
                    removeTmpdata();
                    $box.animate({bottom:-50}, function() {
                        $box.remove();
                    });
                });
            });
        }
        
        if (_.has(items, keyhash)) {
            dataLength = items[keyhash].length;
        }
        chrome.runtime.sendMessage({length:dataLength}, function(response) {});

        key('shift+r', function(event, handler){
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

        key('shift+c', function(event, handler){
            if (dataLength == 0) {
                return false;
            }
            try {
                if (confirm('typd: このフォームパターンのデータを全て削除しても良いですか？')) {
                    chrome.storage.local.remove(keyhash, function() {
                        if(chrome.extension.lastError !== undefined) { // failure
                            throw 'typd: chrome.extention.error';
                        }
                        chrome.runtime.sendMessage({length:0}, function(response) {});
                    });
                }
            } catch(e) {
                alert('typd: データ削除に失敗しました。');
            }
            return false;
        });

        $('form').on('submit', function() {
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
