import { showOptionsPage } from "./functions.js";
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == 'install') {
        showOptionsPage();
    }
});

chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        if (details.type != 'xmlhttprequest') return;

        if (details.initiator === undefined) return; // Firefox

        if (details.initiator != 'chrome-extension://' + chrome.runtime.id) return;

        let indexes = [];

        let names = ['Origin'];

        let headers = details.requestHeaders;

        for (let i = 0; i < headers.length; i++) {
            if (names.indexOf(headers[i].name) != -1) {
                indexes.push(i);
            }
        }

        if (!indexes.length) return;

        for (let i = 0; i < indexes.length; i++) {
            headers.splice(indexes[i], 1);
        }

        return { requestHeaders: headers };
    },
    { urls: ['<all_urls>'] },
    ['requestHeaders']
);

chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
        if (details.initiator === undefined) return; // Firefox

        if (details.type !== 'sub_frame') return;

        for (let i = 0; i < details.responseHeaders.length; ++i) {
            if (details.responseHeaders[i].name.toLowerCase() == 'x-frame-options') {
                details.responseHeaders.splice(i, 1);
                return {
                    responseHeaders: details.responseHeaders
                };
            }
        }
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
);