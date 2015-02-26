$(function() {

    // Restore options
    chrome.storage.local.get('options', function(items) {
        var options = items['options'];
        $('#passphrase').val(options['passphrase']);
        $('#include-password').prop('checked', options['include-password']);
    });

    // Save options
    $('#save-options').on('click', function () {
        $('#options-message').hide();
        var options ={};
        options['passphrase'] = $('#passphrase').val();
        options['include-password'] = $('#include-password').prop('checked');
        var items = {};
        items['options'] = options;
        chrome.storage.local.set(items, function() {
            if(chrome.extension.lastError !== undefined) {
                // failure
                console.error('chrome.extention.error');
                return;
            }
            // success
            $('#options-message').text('Save options').fadeIn();
        });
    });

    $('#clear-data').on('click', function () {
        $('#options-message').hide();
        chrome.storage.local.get(['enabled', 'options'], function(items) {
            chrome.storage.local.clear(function() {
                if(chrome.extension.lastError !== undefined) {
                    // failure
                    console.error('chrome.extention.error');
                    return;
                }
                chrome.storage.local.set(items, function() {
                    if(chrome.extension.lastError !== undefined) {
                        // failure
                        console.error('chrome.extention.error');
                        return;
                    }
                    // success
                    $('#options-message').text('Clear all dataa').fadeIn();
                });
            });
        });    
    });
    
    $('#options-message').on('click', function() {
        $(this).fadeOut();
    });
});
