//just to make sure we're all initialized on first run
chrome.storage.sync.get(null, function (data) {
    if (typeof data.config === "undefined" || typeof data.sites === "undefined" || typeof data.rules === "undefined" || typeof data.status === "undefined") {
        //default config
        config = {
            recursive: true,
            soundFound: true,
            alertFound: false,
            alertCSSFound: true,
            xhrDelay: 5,
            inclusionRegex: "examplesitename",
            maxHistoryUrls: 100,
            searchMode: false
        };

        //only create a new sites if we don't have it yet; don't want to overwrite people's on update
        chrome.storage.local.set({
            sites: [],
            seenSites: 0
        });

        //only create a new rules if we don't have it yet; don't want to overwrite people's on update
        if (typeof data.rules === "undefined") {
            chrome.storage.sync.set({
                "rules": [],
            });
        }

        //store the defaults
        chrome.storage.sync.set({
            "config": config,
            "status": 1,
        });
    }
});

//handle our extension badge
setInterval(function () {
    var newCount;
    chrome.storage.local.get(null, function (data) {
        //compare the number of sites we saw last time we checked vs now. if greater; show a badge.
        newCount = data.sites.length - data.seenSites;
        if (newCount > 0) {
            chrome.browserAction.setBadgeText({
                text: newCount.toString()
            });
        } else {
            //have no badge if there's nothing new
            chrome.browserAction.setBadgeText({
                text: ""
            });
        }
    });
}, 2000);

function openAllLinksOnPage () {

}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (typeof request.cmd !== 'undefined') {
            if (request.cmd === 'closeAfterDone') {
                if (!sender.tab.active) {
                    chrome.tabs.remove(sender.tab.id);
                }
            } else if (request.cmd === 'openExternalLinks') {

            }
        }

        sendResponse({});
    }
);