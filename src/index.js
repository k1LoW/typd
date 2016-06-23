import _ from 'underscore';
import $ from 'jquery';
import key from 'keymaster';
import lib from './inputlib';
import storage from './storage';

$(() => {
  lib.getDataByKeyhash().then((items) => {
    let passphrase = items['options']['passphrase'];
    let allowHosts = items['options']['allow-hosts'];
    let denyHosts = items['options']['deny-hosts'];
    let includePassword = items['options']['include-password'];
    let pos = 0;
    
    if (items['tmpkey'] && items['tmpdata'] && items['tmphost']) {
      let tmpkey = items['tmpkey'];
      let tmpdata = items['tmpdata'];
      let tmphost = items['tmphost'];
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
      lib.removeTmpdata();

      if (lib.isAllowHost(allowHosts)) {
        lib.setPrevdata(tmpkey, tmpdata);
      } else {
        
        $('.typd-box').animate({
          bottom:0
        }, function(){
          let $box = $(this);
          $('.typd-btn-save').on('click', function(){
            lib.setPrevdata(tmpkey, tmpdata);
            $box.animate({bottom:-50}, function(){
              $box.remove();
            });
          });
          $('.typd-btn-cancel').on('click', function(){
            $box.animate({bottom:-50}, function(){
              $box.remove();
            });
          });
          $('.typd-btn-allow-host').on('click', function(){
            lib.allowHost(tmphost);
            $box.animate({bottom:-50}, function(){
              $box.remove();
            });
          });
          $('.typd-btn-deny-host').on('click', function(){
            lib.denyHost(tmphost);
            $box.animate({bottom:-50}, function(){
              $box.remove();
            });
          });
        });

      }
    }
    
    key.filter = (event) => {
      let tagName = (event.target || event.srcElement).tagName;
      if (event.srcElement.contentEditable == 'true') {
        // ex. Gmailの返信
        return false;
      }
      return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
    };

    key(items['options']['key-restore'], (event, handler) => {
      lib.getDataByKeyhash().then((items) => {
        let keyhash = items['keyhash'];
        let dataLength = 0;
        if (_.has(items, keyhash)) {
          dataLength = items[keyhash].length;
        }
        if (dataLength == 0) {
          pos = 0;
          return;
        }
        let data = lib.decryptInputData(items[keyhash][pos], passphrase);
        lib.restoreInputData(data);
        pos++;
        if (pos >= dataLength) {
          pos = 0;
        }
      }).catch((err) => {
        console.warn(err);
      });
      
      return false;
    });

    key(items['options']['key-clear'], (event, handler) => {
      lib.getDataByKeyhash().then((items) => {
        let keyhash = items['keyhash'];
        let dataLength = 0;
        if (_.has(items, keyhash)) {
          dataLength = items[keyhash].length;
        }
        if (dataLength == 0) {
          pos = 0;
          return;
        }
        lib.clearDataByKeyhash(keyhash);
      }).catch((err) => {
        console.warn(err);
      });
      return false;
    });

    $('form').on('submit', () => {
      lib.getDataByKeyhash().then((items) => {
        let keyhash = items['keyhash'];
        if (lib.isDenyHost(denyHosts)) {
          return Promise.resolve();
        }
        
        let data = lib.gatherInputData();
        
        if (JSON.stringify(data) == '{}') {
          return Promise.resolve();
        }
        if (_.uniq(_.values(data)).toString() == [""].toString()) {
          return Promise.resolve();
        }

        if (!includePassword) {
          _.map(lib.typePasswordNames, (name) => {
            data[name] = '';
          });
        }

        let dataArray = [];
        let encrypted = lib.encryptInputData(data, passphrase);
        let datahash = lib.generateDatahash(data);

        // 既存データを設置
        if (_.has(items, keyhash)) {
          dataArray = items[keyhash];
        }

        let hashitem = {};
        hashitem[datahash] = encrypted;

        let exists = _.filter(dataArray, (d) => {
          return (datahash == _.first(_.keys(d)));
        }).length;

        if (exists > 0) {
          // 既に存在する場合はソートをして保存
          let filterd = _.filter(dataArray, (d) => {
            return (datahash != _.first(_.keys(d)));
          });
          filterd.unshift(hashitem);

          items = {};
          items[keyhash] = _.uniq(filterd);
        } else {
          // 新規データ
          items = {};
          items['tmpkey'] = keyhash;
          items['tmpdata'] = hashitem;
          items['tmphost'] = window.location.host;
        }
        
        return storage.set(items);
      }).catch((err) => {
        console.warn(err);
      });
      
      return true;
    });
    
  }).catch((err) => {
    console.warn(err);
  });
});
