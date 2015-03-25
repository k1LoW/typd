// type="password" だったinputのname属性
var typePasswordNames = [];

/*
 * gatherInputData
 * 表示されているinput select textareaから入力値を収集して
 * name属性と入力値のhash objectに変換
 * 
 */
function gatherInputData() {
    typePasswordNames = [];
    var obj = $('input:visible, select:visible, textarea:visible').each(function() {
        var $self = $(this);
        if ($self.attr('type') == 'password') {
            typePasswordNames.push($self.attr('name'));
        }
    }).serializeObject();
    $('input[type="checkbox"]:not(:checked):visible').each(function(){
        var $self = $(this);
        var name = $self.attr('name');
        if (name) {
            obj[name] = '';
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
        var type = $('input[name="' + name + '"]:visible').attr('type');
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
    var data = [];
    try {
        var decrypted = CryptoJS.AES.decrypt(_.first(_.values(encrypted)), passphrase);
        data = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch(e) {
        alert('typd: データ復号化に失敗しました。パスフレーズが間違っている可能性があります');
        return data;
    }    
    return data;
}

/*
 * generateKeyhash
 * ページのkeyhashを作成
 *
 */
function generateKeyhash(data) {
    return CryptoJS.SHA256(JSON.stringify(_.keys(data).sort())).toString();
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
    chrome.storage.local.get([tmpkey], function(previtems) {
        if(chrome.extension.lastError !== undefined) { // failure
            throw 'typd: chrome.extention.error';
        }

        var prevdatas = [];
        
        // 既存データを設置
        if (_.has(previtems, tmpkey)) {
            prevdatas = previtems[tmpkey];
        }
        prevdatas.unshift(tmpdata);
        var tmpitems ={};
        tmpitems[tmpkey] = _.uniq(prevdatas);
        
        chrome.storage.local.set(tmpitems, function() {
            if(chrome.extension.lastError !== undefined) { // failure
                throw 'typd: chrome.extention.error';
            }
            removeTmpdata();
        });
    });
}

function removeTmpdata() {
    chrome.storage.local.remove(['tmpkey', 'tmpdata'], function() {
        if(chrome.extension.lastError !== undefined) { // failure
            throw 'typd: chrome.extention.error';
        }
    });
}

function restoreOptions() {
    chrome.storage.local.get('options', function(items) {
        var options = items['options'];
        $('#passphrase').val(options['passphrase']);
        $('#include-password').prop('checked', options['include-password']);
    });
}

function saveOptions() {
    $('#options-message').hide();
    var options ={};
    options['passphrase'] = $('#passphrase').val();
    options['include-password'] = $('#include-password').prop('checked');
    var items = {};
    items['options'] = options;
    chrome.storage.local.set(items, function() {
        if(chrome.extension.lastError !== undefined) { // failure
            throw 'typd: chrome.extention.error';
        }
        // success
        $('#options-message').text('Save options').fadeIn();
    });
}

function clearAllData() {
    $('#options-message').hide();
    chrome.storage.local.get(['enabled', 'options'], function(items) {
        chrome.storage.local.clear(function() {
            if(chrome.extension.lastError !== undefined) { // failure
                throw 'typd: chrome.extention.error';
            }
            chrome.storage.local.set(items, function() {
                if(chrome.extension.lastError !== undefined) { // failure
                    throw 'typd: chrome.extention.error';
                }
                // success
                $('#options-message').text('Clear all dataa').fadeIn();
            });
        });
    });    
}
