var $ = require('jquery');
var lib = require('./inputlib');

$(function() {

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
