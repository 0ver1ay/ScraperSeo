import { getConfig, getCurrentUrl, getHost } from "./functions.js";

var CURRENT_DOMAIN = null;

function triggerChange(tab) {
    getConfig(function (config) {
        if (!config.iks_badge) return;

        getCurrentUrl(function (url) {

            if (url == tab.url) {
                let domain = getHost(tab.url);

                if (domain == null) {
                    CURRENT_DOMAIN = domain;
                    chrome.action.setBadgeText({ text: '' });
                } else if (domain != CURRENT_DOMAIN) {
                    CURRENT_DOMAIN = domain;
                    showIksBadge();
                }
            }
        });
    });
}

function showIksBadge() {
    let cacheKey = 'iks_' + CURRENT_DOMAIN;
    chrome.storage.local.get([cacheKey], function (result) {

        let cache = result[cacheKey];
        if (cache != undefined && cache.expired > Date.now()) {
            chrome.action.setBadgeText({ text: '' + formatIksValue(cache.iks) });
            return;
        }
        chrome.action.setBadgeText({ text: '' });
        fetch('https://be1.ru/api/extension/getIks?domain=' + CURRENT_DOMAIN).then((response) => {
            response.json().then(function (json) {
                let cache = {};

                if (json.status) {
                    chrome.action.setBadgeText({ text: '' + formatIksValue(json.iks) });

                    cache[cacheKey] = {
                        expired: Date.now() + 604800000, // cache for 7 days
                        iks: json.iks,
                    };

                    chrome.storage.local.set(cache);
                } else {
                    cache[cacheKey] = {
                        expired: Date.now() + 86400000, // cache for 24 hours
                        iks: 0,
                    };
                }
            })
        }).catch((error) => {
            console.log(error)
        });

    });
}

function formatIksValue(iks) {
    if (!iks) return '';

    let suffix = '';

    if (iks >= 1000000) {
        iks = iks / 1000000;
        suffix = 'M';
    } else if (iks >= 1000) {
        iks = iks / 1000;
        suffix = 'K';
    }

    if (iks < 10) {
        iks = iks.toFixed(1);
    } else {
        iks = iks.toFixed(0);
    }

    iks = iks.replace(/\.0$/, '');

    return iks + suffix;
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    triggerChange(tab);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.query({ active: true }, function (tabs) {
        triggerChange(tabs[0]);
    });
});
