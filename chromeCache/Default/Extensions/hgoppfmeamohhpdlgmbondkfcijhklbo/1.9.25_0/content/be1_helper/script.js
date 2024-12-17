function reportActivity() {
    try {
        chrome.storage.local.get('last_hello', function (result) {
            if (
                result.last_hello !== undefined
                && result.last_hello > (Date.now() - 300000)
            ) return;

            fetch('https://be1.ru/api/extension/hello')
                .then(response => response.json())
                .then(json => {
                    if (json.status) {
                        chrome.storage.local.set({last_hello: Date.now()});
                    }
                }).catch(error => {
            });
        });
    } catch (e) {
        clearInterval(interval)
    }
}

var interval = setInterval(reportActivity, 300000);

reportActivity();

// inform site about extension installed
let meta = document.createElement('meta');
meta.setAttribute('name', 'analiz-extension-installed');
meta.setAttribute('value', '1');
document.head.appendChild(meta);
