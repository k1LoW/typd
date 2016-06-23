import _ from 'underscore';
import $ from 'jquery';
import lib from './inputlib';
import storage from './storage';

$(() => {
  chrome.storage.local.getBytesInUse(null, (byteInUse) => {
    $('#used-storage-size').text((byteInUse / chrome.storage.local.QUOTA_BYTES * 100).toFixed(2) + '% ( ' + byteInUse.toLocaleString() + ' bytes )');
  });
});

storage.get(['keymap']).then((items) => {
  let keymap = {};
  if (_.has(items, 'keymap')) {
    keymap = items['keymap'];
  }
  let $tbody = $('#table-keymap tbody');
  _.each(keymap, (v, keyhash) => {
    let tr = '<tr><td>'
          + '<button class="clear-data" data-keyhash="' + keyhash +'">'
          + '<span class="text-clear-data"></span>'
          + '</button>'
          + '</td><td>'
          + '<span class="input-name">'
          + v.toString().replace(/,/g, '</span><span class="input-name">')
          + '</span>'
          + '</td></tr>';
    $tbody.append(tr);
  });
  $('.clear-data').on('click', () => {
    let $self = $(this);
    let keyhash = $self.data('keyhash');
    lib.clearDataByKeyhash(keyhash);
    location.reload();
  });                      
}).catch((err) => {
  console.warn(err);
});
