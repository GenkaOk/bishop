function init_main () {
    //get the current enabled state and rule list
    chrome.storage.sync.get(null, function (data) {
        chrome.storage.local.get(null, function (dataLocal) {
            //make the switch reflect our current state
            if (data.status) {
                $("#status").html('<span class="bg-success">Enabled<br>' + (dataLocal.history.length || 0) + ' urls scanned</span>');
            } else if (data.config.enableQueue) {
                $("#status").html('<span class="bg-warning">Queueing</span>');
            } else {
                $("#status").html('<span class="bg-danger">Disabled</span>');
            }

            //build options link
            $("#optLink").attr("href", chrome.extension.getURL("options.html"));

            //show the menu
            $('html').hide().fadeIn('slow');
        });
    });
}

//bind events to dom elements
document.addEventListener('DOMContentLoaded', init_main);