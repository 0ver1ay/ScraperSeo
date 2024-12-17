if (location.href === 'https://www.similarweb.com/error/notfound') {
    chrome.runtime.sendMessage({be1_worker_command: 'task_6_result', result: false}, function (res) {});
} else {
    let html = document.body.innerHTML;

    let startIndex = html.indexOf('Sw.preloadedData = {');
    let endIndex = html.indexOf('Sw.period = {');

    let jsonStr = html.substring(startIndex + 19, endIndex).trim().replace(/;$/, '');

    let result = JSON.parse(jsonStr).overview;

    chrome.runtime.sendMessage({be1_worker_command: 'task_6_result', result}, function (res) {});
}
