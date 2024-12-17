
function getCurrentUrl(callback) {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    chrome.tabs.query(queryOptions).then(tabs => {
        if (!tabs.length) return callback(null);
        callback(tabs[0].url);
    });
}
function getHost(url) {
    if (!url)
        return null;
    try {
        var l = document.createElement("a");
        l.href = url;
    } catch (error) {
        if (!url.toLowerCase().startsWith("http")) {
            url = "http://" + url;
        }
        try {
            l = new URL(url);
        } catch (error) {
            return null;
        }
    }

    if (l.protocol != 'http:' && l.protocol != 'https:') return null;
    return l.hostname;
}

function getRandomString(length, sets) {
    if (!sets) sets = ['upper', 'lower', 'num'];

    let characters = '';

    if (sets.indexOf('upper') !== -1) characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (sets.indexOf('lower') !== -1) characters += 'abcdefghijklmnopqrstuvwxyz';
    if (sets.indexOf('num') !== -1) characters += '0123456789';

    let result = '';

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function showOptionsPage() {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options/options.html'));
    }
}

function getConfig(callback) {
    chrome.storage.local.get('config', function (result) {

        // 1. by default
        var config = {
            analyze: 'site',
            iks_badge: true,
            wordstat_assistant: true,
            share_statistic: true,
            bookmarklets: [
                'antiplagiat',
                'google_page_speed',
                'google_mobile_friendly',
                'robots_txt',
                'sitemap_xml',
                'poddomeni_saita',
                'vfacen',
                'yandex_site_search',
            ],
        };

        // 2. replace default values with our config (if was saved before)
        if (result.config != undefined) {
            for (let key in result.config) {
                config[key] = result.config[key];
            }
        }

        // 3. return current config
        callback(config);

    });
}

var BOOKMARKLETS = {
    antiplagiat: {
        name: 'Антиплагиат',
        script: function (l) { window.open('http://be1.ru/antiplagiat-online/?url=' + l.href) },
    },
    google_page_speed: {
        name: 'Google PageSpeed',
        script: function (l) { window.open('https://developers.google.com/speed/pagespeed/insights/?url=' + encodeURIComponent(l.href)) },
    },
    google_mobile_friendly: {
        name: 'Google Mobile-Friendly',
        script: function (l) { window.open('https://search.google.com/test/mobile-friendly?url=' + encodeURIComponent(l.href)) },
    },
    robots_txt: {
        name: 'robots.txt',
        script: function (l) { window.open(l.protocol + '//' + l.host + '/robots.txt') },
    },
    sitemap_xml: {
        name: 'sitemap.xml',
        script: function (l) { window.open(l.protocol + '//' + l.host + '/sitemap.xml') },
    },
    poddomeni_saita: {
        name: 'Поддомены сайта',
        script: function (l) { window.open('http://be1.ru/uznat-poddomeni-saita/?url=' + l.host) },
    },
    vfacen: {
        name: 'Оценка тошноты страницы',
        script: function (l) { window.open('http://be1.ru/vfacen/?url=' + l) },
    },
    yandex_site_search: {
        name: 'Поиск по сайту',
        script: function (l) { query = prompt('Поиск по сайту', ''); if (query != '') { window.open('https://yandex.ru/yandsearch?text=' + query + ' site:' + l.host + '&site=' + l.host) } },
    },
};

function showBookmarklets() {

    getConfig(function (config) {
        if (!config.bookmarklets.length) return;

        getCurrentUrl(function (url) {
            var html = '';

            for (let i = 0; i < config.bookmarklets.length; i++) {
                let b = config.bookmarklets[i];
                if (BOOKMARKLETS[b] == undefined) continue;
                html += '<a href="#" data-name="' + b + '">' + BOOKMARKLETS[b].name + '</a>';
            }

            $('body').find('#bookmarklets').html(html);

            $('body').on('click', '#bookmarklets a', function (e) {
                e.preventDefault();
                var l = document.createElement("a");
                l.href = url;
                BOOKMARKLETS[$(this).data('name')].script(l);
            });
        });
    });
}

export {
    showBookmarklets,
    BOOKMARKLETS,
    getConfig,
    showOptionsPage,
    getRandomNumber,
    getRandomString,
    getHost,
    getCurrentUrl
}