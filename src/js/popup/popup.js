function init_main () {
    //get the current enabled state and rule list
    chrome.storage.sync.get(null, function (data) {
        chrome.storage.local.get(null, function (dataLocal) {
            if (typeof dataLocal.history === 'undefined') {
                dataLocal.history = [];
            }
            //make the switch reflect our current state
            if (data.status) {
                $("#status").html('<span class="bg-success">Enabled</span>');
            } else if (data.config.enableQueue) {
                $("#status").html('<span class="bg-warning">Queueing</span>');
            } else {
                $("#status").html('<span class="bg-danger">Disabled</span>');
            }

            if (dataLocal.history) {
                $('#historyCount').html(dataLocal.history.length + ' urls scanned');
            }

            $('#enableSearchMode')
                .prop('checked', data.config.searchMode)
                .change(function () {
                    data.config.searchMode = $(this).prop('checked');
                    chrome.storage.sync.set({
                        config: data.config
                    }, init_main);
                });

            //build options link
            $("#optLink").attr("href", chrome.extension.getURL("options.html"));

            $('#openExternalLinks').click(function () {
                chrome.runtime.sendMessage({cmd: 'openExternalLinks'});
            });

            //show the menu
            $('html').hide().fadeIn('slow');
        });
    });
}

//bind events to dom elements
document.addEventListener('DOMContentLoaded', init_main);