var $ = require('jquery');
var lib = require('./inputlib');

$(function() {
  chrome.storage.local.getBytesInUse(null, function(byteInUse) {
    $('#used-storage-size').text((byteInUse / chrome.storage.local.QUOTA_BYTES * 100).toFixed(2) + '% ( ' + byteInUse.toLocaleString() + ' bytes )');
  });
  
  // Restore options
  lib.restoreOptions();

  // Save options
  $('#save-options').on('click', function () {
    lib.saveOptions();
  });

  $('#clear-data').on('click', function () {
    lib.clearAllData();
  });
  
  $('#options-message').on('click', function() {
    $(this).fadeOut();
  });
});
