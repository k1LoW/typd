$(function() {
    // chrome.storage.local.getBytesInUse(null, function(byteInUse) {
    //     // 5,242,880 byte
    // });

    var typePasswordNames = [];
    function gatherData() {
        typePasswordNames = [];
        return $('input:visible, select:visible, textarea:visible').each(function() {
            var $self = $(this);
            if ($self.attr('type') == 'password') {
                typePasswordNames.push($self.attr('name'));
            }
        }).serializeObject();
    }

    function restoreData(data) {
        _.each(data, function(value, name) {
            if (_.isArray(value)) {
                value = value[0]; // @todo each set
            }            
            var type = $('input[name="' + name + '"]:visible').attr('type');
            switch (type) {
            case undefined:
                $('select[name="' + name + '"]:visible').val(value);
                $('textarea[name="' + name + '"]:visible').val(value);
                break;
            case 'checkbox':
                if (value) {
                    $('input[type="checkbox"][name="' + name + '"]:visible').prop('checked', true);
                } else {
                    $('input[type="checkbox"][name="' + name + '"]:visible').prop('checked', false);
                }
                break;
            case 'radio':
                $('input[type="radio"][name="' + name + '"][value="' + value  + '"]:visible').prop('checked', true);
                break;
            case 'text':
            case 'integer':
            case 'email':
            case 'password':
            default:
                $('input[name="' + name + '"]:visible').val(value);
                break;
            }
        });
    }

    var hashkey = CryptoJS.SHA256(JSON.stringify(_.keys(gatherData()).sort())).toString();

    chrome.storage.local.get(['enabled', 'options', hashkey], function(items) {
        if(chrome.extension.lastError !== undefined) { // failure
            return;
        }

        if (!_.has(items, 'enabled')) {
            return;
        }
        if (!items['enabled']) {
            return;
        }
        if (!_.has(items, 'options')) {
            alert('typestac: 設定>拡張機能でパスフレーズをセットしてください');
            return;
        }
        if (!_.has(items['options'], 'passphrase')) {
            alert('typestac: 設定>拡張機能でパスフレーズをセットしてください');
            return;
        }
        if (!items['options']['passphrase']) {
            alert('typestac: 設定>拡張機能でパスフレーズをセットしてください');
            return;
        }

        var passphrase = items['options']['passphrase'];
        var includePassword = items['options']['include-password'];

        var dataLength = 0;
        var pos = 0;
        if (_.has(items, hashkey)) {
            dataLength = items[hashkey].length;
        }
        chrome.runtime.sendMessage({length:dataLength}, function(response) {});

        key('ctrl+shift+i', function(event, handler){
            if (dataLength == 0) {
                return;
            }
            try {
                var decrypted = CryptoJS.AES.decrypt(_.first(_.values(items[hashkey][pos])), passphrase);
                var data = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
                console.info(data);
            } catch(e) {
                alert('typestac: データ復号化に失敗しました。パスフレーズが間違っている可能性があります');
                return;
            }
            restoreData(data);
            pos++;
            if (pos >= dataLength) {
                pos = 0;
            }
        });

        key('ctrl+shift+c', function(event, handler){
            if (dataLength == 0) {
                return;
            }
            try {
                if (confirm('typestac: このフォームパターンのデータを全て削除しても良いですか？')) {
                    chrome.storage.local.remove(hashkey, function() {
                        if(chrome.extension.lastError !== undefined) { // failure
                            console.error('typestac: chrome.extention.error');
                            return;
                        }
                        chrome.runtime.sendMessage({length:0}, function(response) {});
                    });
                }
            } catch(e) {
                return;
            }
        });

        $('form').on('submit', function() {
            var data = gatherData();

            if (JSON.stringify(data) == '{}') {
                console.info('typestac: data == {}');
                return true;
            }
            if (_.uniq(_.values(data)).toString() == [""].toString()) {
                console.info('typestac: data == [""]');
                return true;
            }

            if (!includePassword) {
                _.map(typePasswordNames, function(name) {
                    data[name] = '';
                });
            }
            
            chrome.storage.local.get([hashkey], function(items) {
                if(chrome.extension.lastError !== undefined) { // failure
                    return;
                }

                var datas = [];
                var encrypted = '' + CryptoJS.AES.encrypt(JSON.stringify(data), passphrase);
                var hashdata = CryptoJS.SHA256(JSON.stringify(_.sortBy(data, function(val, key) {
                    return key;
                }))).toString();

                if (_.has(items, hashkey)) {
                    datas = items[hashkey];
                }
                var hashitem = {};
                hashitem[hashdata] = encrypted;
                var filterd = _.filter(datas, function(d) {
                    return (hashdata != _.first(_.keys(d)));
                });
                filterd.unshift(hashitem);
                items ={};
                items[hashkey] = _.uniq(filterd);
                chrome.storage.local.set(items, function() {
                    if(chrome.extension.lastError !== undefined) { // failure
                        console.error('typestac: chrome.extention.error');
                        return;
                    }
                    console.info('typestac: Set data');
                });
            });

            return true;
        });

    });

});
