$(function() {

    // Restore options
    restoreOptions();

    // Save options
    $('#save-options').on('click', function () {
        saveOptions();
    });

    $('#clear-data').on('click', function () {
        clearAllData();
    });
    
    $('#options-message').on('click', function() {
        $(this).fadeOut();
    });
});
