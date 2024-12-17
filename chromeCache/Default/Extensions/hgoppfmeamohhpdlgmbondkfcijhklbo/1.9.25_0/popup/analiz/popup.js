var URL = null;
var DOMAIN = null;
var ANALYZE = null;

$(document).ready(function () {

    getCurrentUrl(function (url) {

        if (url) {
            URL = url;
            DOMAIN = getHost(url);
        }

        if (DOMAIN == null) {
            showBe1Links();
        } else {
            getConfig(function (config) {
                ANALYZE = config.analyze;
                loadSiteInfo();
            });
        }

    });

    $('body').on('click', '.top-menu .options', showOptionsPage);

});

function showBe1Links() {
    $('#preloader').addClass('hidden');

    $('#be1-links').removeClass('hidden');
}

function showCaptcha() {
    return
    $('#captcha-block')
        .removeClass('hidden')
        .append('<script src="https://www.google.com/recaptcha/api.js?onload=captchaOnLoadCallback&render=explicit"></script>');
}

function captchaOnLoadCallback() {
    return
    grecaptcha.render('captcha', {
        sitekey: '6LcOraUUAAAAAEt3WsH4HWQjDQeBmN-006LkJJ2o',
        callback: function (response) {
            function success(json) {
                if (json.passed) {
                    _loadSiteInfo();
                } else {
                    $('#captcha-block').html('<div style="color: red;">Случилась ошибка!</div>');
                }
            }

            function fail() {
                $('#captcha-block').html('<div style="color: red;">Случилась ошибка!</div>');
            }

            $.post('https://be1.ru/analiz-saita/recaptcha', { response }, success, 'json').fail(fail);
        },
    });
}

function showCaptcha() {
    return
    $('#captcha-block')
        .removeClass('hidden')
    grecaptcha.render('captcha', {
        sitekey: '6LcOraUUAAAAAEt3WsH4HWQjDQeBmN-006LkJJ2o',
        callback: function (response) {
            function success(json) {
                if (json.passed) {
                    _loadSiteInfo();
                } else {
                    $('#captcha-block').html('<div style="color: red;">Случилась ошибка!</div>');
                }
            }

            function fail() {
                $('#captcha-block').html('<div style="color: red;">Случилась ошибка!</div>');
            }

            $.post('https://be1.ru/analiz-saita/recaptcha', { response }, success, 'json').fail(fail);
        },
    });
}

function loadSiteInfo() {
    _loadSiteInfo();
}

function _loadSiteInfo() {
    function success(json) {
        $('#preloader').addClass('hidden');
        $('#captcha-block').addClass('hidden');
        console.log(json);
        //   if (json.captcha) return showCaptcha();

        $('#site-info').removeClass('hidden').html(pure(json.content));

        initCharts();

        showBookmarklets();

        // show settings button (to support old versions)
        $('button.options').attr('style', '');

        // wait for data
        let params = JSON.parse($('#params').text());
        $('#params').remove();
        getData(params, 1);
    }

    function fail(x) {
        console.log(x);
    }

    let url = 'https://be1.ru/stat/' + DOMAIN + '?extension=1';

    if (ANALYZE == 'page') {
        url = 'https://be1.ru/analiz-stranicy/show?url=' + encodeURIComponent(URL) + '&extension=1'
    }
    fetch(url).then((response) => {
        response.json().then(success);
    }).catch(fail);
    $.getJSON(url, success).fail(fail);
}

function getData(params, attempt) {
    if (!params.length) {
        return;
    }

    if (attempt > 40) {
        params.forEach(function (param) {
            if (typeof CALLBACKS.no_data[param] != 'undefined') {
                $('#set_' + param).html(pure(CALLBACKS.no_data[param]()));
            } else {
                $('#set_' + param).text('n/a');
            }
        });

        return;
    }

    function success(json) {

        var nullableParams = [];

        for (var param in json.data) {
            if (json.data[param] == null) {
                nullableParams.push(param); // wait again
            } else {
                if (typeof CALLBACKS.received[param] != 'undefined') {
                    $('#set_' + param).html(pure(CALLBACKS.received[param](json.data[param])));
                } else {
                    $('#set_' + param).html(pure(json.data[param]));
                }
            }
        }

        initCharts();

        setTimeout(function () {
            getData(nullableParams, attempt + 1);
        }, 1000);
    }

    function fail(x) {
        setTimeout(function () {
            getData(params, attempt + 1);
        }, 1000);
    }

    let data = {
        domain: DOMAIN,
        params: params,
        extension: 1,
    };

    let url = 'https://be1.ru/analiz-saita/get_data';

    if (ANALYZE == 'page') {
        url = 'https://be1.ru/analiz-stranicy/get_data';
        data.url = URL;
    }

    $.post(url, data, success, 'json').fail(fail);
}

// PARAMS CALLBACKS
var CALLBACKS = {

    // WHEN DATA RECEIVED
    received: {
        iks: function (data) {
            if (Array.isArray(data)) return 0;

            IksHistory = data;

            var values = Object.values(data);

            if (!values.length) return 0;

            if (values.length > 1) {
                $('#set_iks').before('<span class="clickable" style="margin-right: 10px; color: #FF7C52;" data-toggle="tooltip" title="История изменения ИКС" onclick="$(\'#ticHistoryModal\').modal(\'show\'); showTicHistory()"><i class="fa fa-line-chart"></i></span>');
                $('#set_iks').prev().tooltip();
            }

            return values[values.length - 1];
        },
        title: function (data) {
            $('#set_title').html(pure(data));
            $('#title_lenght').text('(' + data.length + ')');
        },
        description: function (data) {
            $('#set_description').html(pure(data));
            $('#description_lenght').text('(' + data.length + ')');
        },
        regions: function (data) {
            var firstBlock = '<div class="block-tag block-tag-info">Региональность сайта в Яндекс (<a href="https://be1.ru/regionalnost-sayta/?url=' + DOMAIN + '">подробнее</a>):</div>';

            if (!Array.isArray(data)) return data;
            if (!data.length) return '<div class="block-tags">' + firstBlock + '<span class="text-danger">Нет информации...</span></div>';

            return '' +
                '<div class="block-tags">' +
                firstBlock +
                data.map(function (r) { return '<div class="block-tag">' + r.name + '</div>'; }).join('') +
                '</div>';
        },
    },

    // WHEN TIME OUT
    no_data: {
        counters: function () { return '<div class="col-md-12 text-center">n/a</div>' },
        similarweb: function () { return '<div class="block">Нет данных</div>' },
        backlinks_total: function () { return '<div class="block dataempty" style="border-top: none;">Нет данных</div>' },
        backlinks_changes: function () { return '<div class="dataempty">Нет данных</div>' },
        competitors: function () { return '<div class="block">n/a</div>' },
        regions: function () { return '<div class="block-tags"><div class="block-tag block-tag-info">Региональность сайта в Яндекс (<a href="https://be1.ru/regionalnost-sayta/?url=' + DOMAIN + '">подробнее</a>):</div><span class="text-danger">Нет информации...</span></div>' },
        lost_request: function () { return '<span class="download-as-pdf">Нет данных</span>' },
        google_mobile_friendly: function () { return '<div class="black2 font16"><i class="fa fa-bell-o fa-lg g_yel"></i> <a href="https://search.google.com/search-console/mobile-friendly?url=' + DOMAIN + '" target="_blank"> Проверьте вручную</a></div>' },
        visrep_site_counters_yandex: function () { return '<div class="dataempty">Нет данных</div>' },
        visrep_yandex: function () { return '<div class="dataempty">Нет данных</div>' },
        visrep_google: function () { return '<div class="dataempty">Нет данных</div>' },
    }

};

function pure(html) {
    return DOMPurify.sanitize(html, { SAFE_FOR_JQUERY: true })
}



/* CHARTS */
function initCharts() {
    $('#site-info').find('.chart-data').each(function () {

        var data = JSON.parse($(this).text());
        console.log("chart-data", $(this).text())

        window['_chart_' + data.name](data.data);

        $(this).remove();
    });
}

function _chart_backlinks_changes(data) {
    let char_x = []
    let char_req = []
    let max1 = 0;
    if (data.length > 1) {
        char_req.push('data1');
        let label1 = data[0][1]


        for (let i = 1; i < data.length; i++) {
            char_x.push(data[i][0]);
            if (max1 < data[i][1])
                max1 = data[i][1]
            char_req.push(data[i][1]);
        }
        max1 += 200;
        let r = 10
        let div = 10
        var res = 0
        do {
            div *= 10
            r = Math.ceil(max1 / div)
        } while (r > 5);
        max1 = r * div

        var chart = c3.generate({
            bindto: '#chart_div_links',
            data: {
                columns: [
                    char_req,
                ],
                names: {
                    data1: label1,
                }
            }, axis: {
                x: {
                    type: 'category',
                    categories: char_x,
                    tick: {
                        centered: true,

                    },
                },
                y: {
                    padding: { top: 50, bottom: 20 },
                    tick: {
                        format: d3.format('~s'),
                        count: 5
                    },
                },
            }, legend: {
                position: 'inset',
                inset: {
                    anchor: 'top-left',
                    x: 10,
                    y: 5,
                }
            }, color: {
                pattern: ['#FF7C52']
            }, grid: {
                y: {
                    show: true
                }
            }
        });

    }
}

function _chart_outlinks_changes(data) {
    if (data.length > 1) {
        let char_x = []
        let char_req = []
        let max1 = 0;
        char_req.push('data1');
        let label1 = data[0][1]


        for (let i = 1; i < data.length; i++) {
            char_x.push(data[i][0]);
            if (max1 < data[i][1])
                max1 = data[i][1]
            char_req.push(data[i][1]);
        }

        let r = 10
        let div = 10
        var res = 0
        do {
            div *= 10
            r = Math.ceil(max1 / div)
        } while (r > 5);
        max1 = r * div
        var chart = c3.generate({
            bindto: '#chart_div_outlinks',
            data: {
                columns: [char_req
                ],

                names: {
                    data1: label1,
                },
            }, axis: {
                x: {
                    type: 'category',
                    categories: char_x,
                    tick: {
                        centered: true,
                    },
                },
                y: {
                    padding: { top: 50, bottom: 20 },
                    tick: {
                        format: d3.format('~s'),
                        count: 5
                    },
                },
            }, legend: {
                position: 'inset',
                inset: {
                    anchor: 'top-left',
                    x: 10,
                    y: 5,
                }
            }, color: {
                pattern: ['#FF7C52',]
            }, grid: {
                y: {
                    show: true
                }
            }
        });

    }
    return
}

function _chart_similarweb_attendance(data) {
    if (data.length > 1) {
        let char_x = ['x']
        let char_req = []
        let max1 = 0;
        char_req.push("data1");
        let label1 = data[0][1]

        for (let i = 1; i < data.length; i++) {
            char_x.push(data[i][0]);
            if (max1 < data[i][1])
                max1 = data[i][1]
            char_req.push(data[i][1]);
        }
        let min = max1;
        for (let i = 1; i < data.length; i++) {
            if (min > data[i][1])
                min = data[i][1]
        }

        let r = 10
        let div = 10
        var res = 0
        do {
            div *= 10
            r = Math.ceil(max1 / div)
        } while (r > 5);
        max1 = r * div
        let month = ["янв", "февр", "мар", "апр", "май", "июн", "июл", "авг", "сен.", "окт", "ноя", "дек"]
        var chart = c3.generate({
            bindto: '#similar_attendance',
            data: {
                x: 'x',
                columns: [
                    char_x,
                    char_req
                ],
                names: {
                    data1: label1,
                }
            }, axis: {
                x: {
                    type: 'timeseries',
                    localtime: true,
                    tick: {
                        format: function (b) {
                            return month[b.getMonth() - 1];
                        },
                        centered: true,
                    },
                },
                y: {
                    padding: { top: 50, bottom: 20 },
                    tick: {
                        format: d3.format('~s')
                    },
                },
            }, legend: {
                position: 'inset',
                inset: {
                    anchor: 'top-left',
                    x: 10,
                    y: 5,
                }
            }, color: {
                pattern: ['#00AAB1',]
            }, grid: {
                y: {
                    show: true
                }
            }
        });

    }
}

function _chart_similarweb_source(data) {
    if (data.length > 1) {
        data.shift()
        for (let i = 0; i < data.length; i++) {
            data[i][1] = Math.round(data[i][1] * 1000) / 1000;
        }
        var chart = c3.generate({
            bindto: '#similar_source',
            data: {
                columns: data,
                type: 'pie',
            },
            legend: {
                position: 'right',
                inset: {
                    anchor: 'top-left',
                    x: 10,
                    y: 5,
                }
            }, color: {
                pattern: ['#0FB886', '#015DBC', '#F05671', '#F5866A', '#FFC834', '#03B0D8']
            },

        });

    }
    return

}

function _chart_similarweb_map(data) {
    return
    let chartData = [];

    for (let i = 0; i < data.length; i++) {
        chartData.push(data[i]);
    }

    var dataTable = google.visualization.arrayToDataTable(chartData);

    var options = {
        //colorAxis: {colors: ['#B8D5E3', '#3794BB']},
        colorAxis: { colors: ['#F05671', '#0FB886'] },
        backgroundColor: {
            fill: '#F5F7F7',
        },
        //width: '50%',
        height: 270,
        //legend: {numberFormat:'#,###%'},

    };

    var chart = new google.visualization.GeoChart(document.getElementById('similar_map'));
    chart.draw(dataTable, options);
}

function _chart_visrep(data) {
    if (data.d.length > 1) {
        let char_x = []
        let char_req = []
        let char_req_eff = []
        let max1 = 0;
        let max2 = 0;

        char_req.push('data2');
        char_req_eff.push('data1');
        let label1 = data.d[0][1]
        let label2 = data.d[0][2]


        for (let i = 1; i < data.d.length; i++) {
            char_x.push(data.d[i][0]);
            if (max1 < data.d[i][1])
                max1 = data.d[i][1]
            char_req.push(data.d[i][1]);
            if (max2 < data.d[i][2])
                max2 = data.d[i][2]
            char_req_eff.push(data.d[i][2]);
        }

        let r1 = 10
        let div = 20
        do {
            div *= 10
            r1 = Math.ceil(max1 / div)
        } while (r1 > 5);
        max1 = r1 * div
        let r2 = 10
        div = 50
        do {
            div *= 10
            r2 = Math.ceil(max2 / div)
        } while (r2 > 5);
        max2 = r2 * div



        var chart = c3.generate({
            bindto: '#chart_div',
            data: {
                columns: [
                    char_req_eff, char_req
                ],
                names: {
                    data1: label1,
                    data2: label2,
                },
                axes: {
                    data2: 'y2',
                },
            }, axis: {
                x: {
                    type: 'category',
                    categories: char_x,
                    tick: {
                        centered: true,

                    },
                },
                y: {
                    padding: { top: 50, bottom: 20 },
                    max: max2,
                    min: 0,
                    tick: {
                        format: d3.format('~s'),
                        count: 5
                    },
                },
                y2: {
                    padding: { top: 50, bottom: 20 },
                    max: max1,
                    min: 0,
                    tick: {
                        format: d3.format('~s'),
                        count: 5
                    },
                    show: true // ADD
                }
            }, legend: {
                hide: true
            }, color: {
                pattern: ['#00AAB1', '#FF7C52',]
            },
        });

    }
}
