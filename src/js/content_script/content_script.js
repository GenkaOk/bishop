//make this a global since we're going to be accessing it a lot
var rules, config, status;

//I hate polluting global scope but this is the easiest way to handle different functions needing to know what timeout
// we're at
var delay = 0;

//the meat of the content script
chrome.storage.sync.get(null, function (data) {
    rules = data.rules;
    config = data.config;
    status = data.status;

    if (data.status && typeof isCSEmbedded === "undefined") { // lets us define a variable so we can include this in options without running a sweep, but we still get the functions
        //we're enabled and not being used as a library; pull the trigger
        doScan(stripTrailingSlash(window.location.href), config.recursive);
    }
});

//recurse through the directories and perform the scans
function doScan (currentScanUrl, recursive) {
    var matchPattern = new RegExp(config.inclusionRegex);
    if (!matchPattern.test(currentScanUrl)) {
        return false;
    }

    chrome.storage.local.get('history', function (data) {
        if (typeof data.history === 'undefined') {
            data.history = [];
        }


        if (recursive) {
            //keep processing URLs, including the current one and all parents, until we can't anymore
            while (currentScanUrl != -1) {
                //scan the URL with all our rules
                siteNeedScan(currentScanUrl, data.history) && scanURL(currentScanUrl);

                //go to the next child url
                currentScanUrl = nextParent(currentScanUrl);
            }
        } else {
            //not recursing; just test the current location
            siteNeedScan(currentScanUrl, data.history) && scanURL(currentScanUrl);
        }
    });
}

//scan a given URL with all of our rules
function scanURL (url) {
    for (var i = 0; i < rules.length; i++) {
        delay += (config.xhrDelay * 1000);
        var rule = rules[i];
        if (rule.enabled) {
            /* use a lesser-known setTimeout syntax so we can pass the var vals as they are at the
             * time we create the timeout (otherwise they'll pass by reference and the values will
             * be all whacked out by the time last ones run).
             *
             *     setTimeout(function, delay, functionParam1, functionParam2, functionParam3, functionParam4, ...)
             */
            setTimeout(upAndMatch, delay, url, url + "/" + rule.url, rule.searchString, rule.name);
        }
    }
}

//add a site onto the sites list and alert the user
function addSiteAndAlert (url, rule) {
    var sites;
    //pull our site list out of storage
    chrome.storage.local.get(null, function (data) {
        sites = data.sites;

        //make sure we're not duplicating; get out if we are.
        for (var i = 0; i < sites.length; i++) {
            var site = sites[i];
            if (site.url == url && site.rule == rule) {
                return;
            }
        }

        //push the current URL onto the array
        sites.push({
            "uid": Math.floor(Math.random() * 99999999).toString(16),
            "url": url,
            "rule": rule
        });

        //send it to the great gig in the sky
        chrome.storage.local.set({
            'sites': sites
        });

        //handle audio alert
        if (config.soundFound) {
            var audio = new Audio(chrome.extension.getURL('/audio/alert.mp3'));
            audio.play();
        }

        //handle JS alert
        if (config.alertFound) {
            //the timeout is here due to some weird issue where, without a timeout, alert dismissal is required before
            // the audio plays I'm guessing it's some issue with async processes getting blocked but who knows. this
            // seems to fix it.
            setTimeout(function () {
                alert('&#9821; Bishop matched your rule "' + rule + '" at ' + url);
            }, 500);
        }

        //handle CSS alert
        if (config.alertCSSFound) {
            //install our CSS
            var style = document.createElement('link');
            style.rel = 'stylesheet';
            style.type = 'text/css';
            style.href = chrome.extension.getURL('alert.css');
            (document.head || document.documentElement).appendChild(style);

            //insert the alert itself
            document.body.insertAdjacentHTML('afterBegin', '<div id="note">&#9821; Bishop matched your rule "' + rule + '". (Refresh page to dismiss)</div>');
        }

        //set the page title
        document.title = "(VULNERABLE) | " + document.title;
    });
}

/* strip the trailing slash if there is one
 * returns the next parent URL, or -1 if there is none
 * e.g. nextParent("http://exmaple.com/dir/file.html") returns "http://exmaple.com/dir".
 * e.g. nextParent("http://exmaple.com/") returns -1.
 */
function nextParent (url) {
    //sanitize so that the last occurence of the slash isn't a terminating slash
    stripTrailingSlash(url);

    //grab from the beginning of the URL to the last occurence of the slash
    url = url.substr(0, url.lastIndexOf("/"));

    //the downside is that this trimming will mangle the URL if we're already at root
    //usually we're left with 'http:/' or 'https:/'; we'll assume we need at least 8 chars to be valid
    if (url.length < 9) {
        return -1;
    } else {
        return url;
    }
}

//returns true if the url responds 200 and the responsebody matches the regex
//use to just check for 200
function upAndMatch (originalUrl, url, regex, ruleName) {
    var req = new XMLHttpRequest();
    var pattern = new RegExp(regex);

    req.open('GET', url, true);

    req.onload = function () {
        if (req.readyState === 4) {
            if (req.status === 200) {
                if (pattern.test(req.responseText)) {
                    addSiteAndAlert(url, ruleName);
                }
            }
        } else {
            console.error(req.statusText);
        }

        saveSiteOnHistory(originalUrl);
    };

    req.send();
}

function stripTrailingSlash (url) {
    if (url.substr(-1) == '/') {
        return url.substr(0, url.length - 1);
    }

    return url;
}

function saveSiteOnHistory (url) {
    chrome.storage.sync.get(null, function (dataSync) {
        chrome.storage.local.get('history', function (data) {
            if (typeof data.history === 'undefined') {
                data.history = [];
            }

            if (!data.history.includes(url)) {
                if (typeof dataSync.config.maxHistoryUrls !== 'undefined' &&
                    dataSync.config.maxHistoryUrls &&
                    data.history.length >= dataSync.config.maxHistoryUrls
                ) {
                    data.history = [];
                }
                data.history.push(url);
                chrome.storage.local.set({history: data.history});
            }
        });
    });
}

function siteNeedScan (url, history) {
    return !history.includes(url);
}