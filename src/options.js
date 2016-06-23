import $ from 'jquery';
import lib from './inputlib';

$(() => {
  chrome.storage.local.getBytesInUse(null, (byteInUse) => {
    $('#used-storage-size').text((byteInUse / chrome.storage.local.QUOTA_BYTES * 100).toFixed(2) + '% ( ' + byteInUse.toLocaleString() + ' bytes )');
  });
  
  // Restore options
  lib.restoreOptions();

  // Save options
  $('#save-options').on('click', () => {
    lib.saveOptions();
  });

  $('#clear-data').on('click', () => {
    lib.clearAllData();
  });
  
  $('#options-message').on('click', () => {
    $(this).fadeOut();
  });
});
