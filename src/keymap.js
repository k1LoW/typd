var _ = require('underscore');
var $ = require('jquery');
var lib = require('./inputlib');

$(function() {
  chrome.storage.local.getBytesInUse(null, function(byteInUse) {
    $('#used-storage-size').text((byteInUse / chrome.storage.local.QUOTA_BYTES * 100).toFixed(2) + '% ( ' + byteInUse.toLocaleString() + ' bytes )');
  });
});

var keymap = {};
chrome.storage.local.get([
  'keymap',
], function(items) {
  if (_.has(items, 'keymap')) {
    keymap = items['keymap'];
  }
  var $tbody = $('#table-keymap tbody');
  _.each(keymap, function(v, hash) {
    var tr = '<tr><td>'
          + '<button class="clear-data" data-keyhash="' + hash +'">'
          + '<span class="text-clear-data"></span>'
          + '</button>'
          + '</td><td>' + v.toString() + '</td></tr>';
    $tbody.append(tr);
  });
  $('.clear-data').on('click', function() {
    var $self = $(this);
    var keyhash = $self.data('keyhash');
    lib.clearDataByKeyhash(keyhash);
    location.reload();
  });                      
});
