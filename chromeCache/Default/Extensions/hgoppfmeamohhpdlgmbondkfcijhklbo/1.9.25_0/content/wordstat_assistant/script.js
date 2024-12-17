$(document).ready(function () {

    getConfig(function (config) {

        if (config.wordstat_assistant) {
            WA.init();
            WA.show();

            setInterval(function() {
                if (location.hash.substring(0, 10) == '#!/history') {
                    WA.hide();
                } else {
                    WA.show();
                }
            }, 1000);
        }

    });

});

var WA = {

    container: null,
    observer: null,

    pages: [],
    currentPage: 0,

    init: function () {
        this.hideCompetitors();
        this.initSession();
        this.initContainer();
        this.updatePagesList();

        this.settings.init();

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        this.observer = new MutationObserver(function () {
            WA.display();
            WA.initButtons();
        });
        this.observe();
    },

    initSession: function () {
        var update = false;

        // init pages
        var pages = localStorage.getItem('wa_pages');

        if (pages != null) {
            if (JSON.stringify(this.pages) != pages) {
                update = true;
            }

            this.pages = JSON.parse(pages);
        } else {
            if (!this.pages.length) {
                this.pages.push(this.getPageTemplate(1));
            }
        }

        // init current page
        var currentPage = parseInt(localStorage.getItem('wa_current_page'));

        if (currentPage < this.pages.length) {
            if (currentPage != this.currentPage) {
                update = true;
            }

            this.currentPage = currentPage;
        }

        // update state for each open tab
        setTimeout(function () {
            WA.initSession();
            if (update) WA.display();
        }, 1000);
    },

    initContainer: function () {
        $('body').append(
            '<div class="wa-container">' +
                '<div class="wa-alert"></div>' +
                '<form class="wa-popup wa-add-queries-popup">' +
                    '<div class="wa-popup-header">Добавление запросов:</div>' +
                    '<div class="wa-popup-body">' +
                        '<textarea name="queries" placeholder="Вставьте сюда запросы (каждый с новой строки)"></textarea>' +
                    '</div>' +
                    '<div class="wa-popup-footer">' +
                        '<button class="wa-btn-success">Добавить</button>' +
                        '<button data-popup="add-queries" type="button">Отмена</button>' +
                    '</div>' +
                '</form>' +
                '<form class="wa-popup wa-page-popup">' +
                    '<div class="wa-popup-header">Настройка страницы:</div>' +
                    '<div>' +
                        '<div class="wa-popup-form-line">' +
                            '<label for="wa-page-input-name">Название:</label>' +
                            '<input type="text" name="name" id="wa-page-input-name">' +
                        '</div>' +
                        '<div class="wa-popup-form-line">' +
                            '<label for="wa-page-input-url">URL:</label>' +
                            '<input type="text" name="url" id="wa-page-input-url">' +
                        '</div>' +
                    '</div>' +
                    '<div class="wa-popup-footer">' +
                        '<button class="wa-btn-success">Сохранить</button>' +
                        '<button data-popup="page" type="button">Отмена</button>' +
                    '</div>' +
                '</form>' +
                '<div class="wa-popup wa-settings-popup">' +
                    '<div class="wa-popup-header">Настройки:</div>' +
                    '<div>' +
                        '<div class="wa-popup-form-line">' +
                            '<label class="wa-checkbox">' +
                                '<input type="checkbox" name="remove_plus">' +
                                '<div class="wa-checkbox-helper"></div>' +
                                'Удалять "+" из фраз' +
                            '</label>' +
                        '</div>' +
                        '<div class="wa-popup-form-line">' +
                            '<label class="wa-checkbox">' +
                                '<input type="checkbox" name="copy_page_name">' +
                                '<div class="wa-checkbox-helper"></div>' +
                                'Копировать названия страниц' +
                            '</label>' +
                        '</div>' +
                        '<div class="wa-popup-form-line">' +
                            '<label class="wa-checkbox">' +
                                '<input type="checkbox" name="copy_one_column">' +
                                '<div class="wa-checkbox-helper"></div>' +
                                'Копировать в один столбец' +
                            '</label>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wa-popup-footer">' +
                        '<button data-popup="settings">Закрыть</button>' +
                    '</div>' +
                '</div>' +
                '<div class="wa-panel">' +
                    '<div class="wa-panel-header">' +
                        'Wordstat Assistant от <a href="https://be1.ru" target="_blank">Be1.ru</a>' +
                    '</div>' +
                    '<div class="wa-panel-buttons">' +
                        '<button class="wa-panel-button-add" title="Добавить запросы вручную" data-popup="add-queries"></button>' +
                        '<button class="wa-panel-button-copy" title="Копировать запросы"></button>' +
                        '<button class="wa-panel-button-copy-all" title="Копировать запросы и их частотность"></button>' +
                        '<button class="wa-panel-button-clear" title="Удалить все запросы"></button>' +
                        '<button class="wa-panel-button-settings" title="Настройки ассистента" data-popup="settings"></button>' +
                    '</div>' +
                    '<div class="wa-panel-pages">' +
                        '<select></select>' +
                        '<button data-popup="page" title="Редактировать страницу"></button>' +
                    '</div>' +
                    '<div class="wa-panel-page-queries"></div>' +
                    '<div class="wa-panel-page-info">' +
                        'Запросов: <span class="count">0</span> &nbsp;' +
                        'Частотность: <span class="volume">0</span>' +
                    '</div>' +
                    '<div class="wa-panel-footer">' +
                        '<a href="https://be1.ru" target="_blank"></a>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );

        this.container = $('body').find('.wa-container');

        this.initPanelButtons();
        this.initPagesNavigation();
        this.initPopups();
        this.initAddQueriesPopup();
        this.initPagePopup();
        this.initContainerFloating();
    },

    initPanelButtons: function () {
        this.container.find('.wa-panel-button-copy').click(function () {
            WA.copy();
        });

        this.container.find('.wa-panel-button-copy-all').click(function () {
            WA.copy(true);
        });

        this.container.find('.wa-panel-button-clear').click(function () {
            WA.clear();
        });
    },

    initPagesNavigation: function () {
        this.container.find('.wa-panel-pages select').change(function () {
            let val = parseInt($(this).val());

            if (!val) {
                WA.pages.push(WA.getPageTemplate());

                val = WA.pages.length;

                $(this).children('option').last().before('<option value="' + val + '">Страница ' + val + '</option>');

                $(this).val(val);

                setTimeout(function () {
                    WA.container.find('.wa-panel-pages [data-popup=page]').click();
                }, 100);
            }

            WA.activatePage(val);
        });
    },

    initPopups: function () {
        this.container.find('[data-popup]').click(function () {
            let popup = WA.container.find('.wa-' + $(this).attr('data-popup') + '-popup');

            if (!popup.is('.wa-popup-open')) {
                $('.wa-popup').removeClass('wa-popup-open');
            }

            popup.toggleClass('wa-popup-open');
        });
    },

    initAddQueriesPopup: function () {
        this.container.find('.wa-add-queries-popup').submit(function (e) {
            e.preventDefault();

            let text = $(this).find('textarea').val().trim();

            if (text.length) {
                WA.manualAdd(text);
                $(this).removeClass('wa-popup-open')
                $(this).find('textarea').val('');
            } else {
                WA.alert('error', 'Нечего добавлять!');
            }
        });
    },

    initPagePopup: function () {
        var pagePopup = this.container.find('.wa-page-popup');

        pagePopup.submit(function (e) {
            e.preventDefault();

            let nameInput = $(this).find('input[name=name]');
            let urlInput = $(this).find('input[name=url]');

            let page = WA.page();

            WA.pages[WA.currentPage].name = nameInput.val().trim();
            WA.pages[WA.currentPage].url = urlInput.val().trim();

            if (!page.name.length) {
                page.name = 'Без названия';
            }

            $(this).find('button[data-popup=page]').click();

            WA.saveDataToStorage();
            WA.updatePagesList();
        });

        this.container.find('.wa-panel [data-popup=page]').click(function () {
            let page = WA.page();

            pagePopup.find('input[name=name]').val(page.name);
            pagePopup.find('input[name=url]').val(page.url);
        });
    },

    initContainerFloating: function () {
        $(window).scroll(function() {
            var offset_base = 134;
            var offset_scroll = 30;

            if ($(window).scrollTop() > (offset_base - offset_scroll)) {
                WA.container.css({
                    top: offset_scroll + 'px',
                    position: 'fixed'
                });
            } else {
                WA.container.css({
                    top: offset_base + 'px',
                    position: 'absolute'
                });
            }
        }).scroll();
    },

    initButtons: function () {
        if ($('body').find('.wa-add').length) {
            $('body').find('.ywa-selected').removeClass('ywa-selected');
            return;
        }

        WA.observer.disconnect();

        var add_template = '<b class="wa-add" title="Добавить в список">+</b>';
        var remove_template = '<b class="wa-remove" title="Удалить из списка">‒</b>';

        $('.b-phrase-link').before(add_template + remove_template);

        $('.wa-add').click(function() {
            WA.add(
                $(this).parent().children('span').text(),
                parseInt($(this).parent().next().text().replace(/\s+/g, ''))
            );
        });

        $('.wa-remove').click(function() {
            WA.remove($(this).parent().children('span').text());
        });

        // add/remove all
        $('.b-word-statistics__table').before(
            '<div class="wa-add-all-wrap">' +
                '<b class="wa-add-all">Добавить все</b>' +
                '<b class="wa-remove-all">Удалить все</b>' +
            '</div>'
        );
        $('.wa-add-all').click(function() {WA.addAll($(this));});
        $('.wa-remove-all').click(function() {WA.removeAll($(this));});

        WA.observe();
    },

    show: function () {
        this.container.removeClass('hidden');
    },

    hide: function () {
        this.container.addClass('hidden');
    },

    page: function () {
        return this.pages[this.currentPage];
    },

    activatePage: function (i) {
        this.currentPage = i - 1;

        this.display();
    },

    getPageTemplate: function () {
        return {
            name: 'Страница ' + (this.pages.length + 1),
            url: '',
            queries: [],
        };
    },

    add: function (text, volume) {
        this.page().queries.push({text, volume});

        this.sort();

        //this.alert('success', 'Запрос добавлен!');

        this.display();
    },

    addAll: function (button) {
        var queries = button.closest('.b-word-statistics__table-wrapper').find('.b-phrase-link');

        $(queries.get().reverse()).each(function () {
            if ($(this).closest('tr').is('.wa-active')) return;

            WA.page().queries.push({
                text: $(this).text(),
                volume: parseInt($(this).parent().next().text().replace(/\s+/g, '')),
            });
        });

        this.sort();

        //this.alert('success', 'Все запросы добавлены!');

        this.display();
    },

    manualAdd: function (text) {
        let all = this.getAllQueries().map(q => q.text);

        let lines = text.split("\n");

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            if (!line.length) continue;

            let tmp = lines[i].split("\t");

            let text = tmp[0].toLowerCase();
            let volume = tmp.length > 1 ? parseInt(tmp[1]) : 0;

            if (all.indexOf(text) == -1) {
                this.pages[this.currentPage].queries.push({text, volume});
            }
        }

        this.display();
    },

    remove: function (text) {
        for (let i = 0; i < this.pages.length; i++) {
            this.pages[i].queries = this.pages[i].queries.filter(q => q.text != text);
        }

        //this.alert('success', 'Запрос удален!');

        this.display();
    },

    removeAll: function (button) {
        var queries = button.closest('.b-word-statistics__table-wrapper').find('.b-phrase-link');

        queries.each(function () {
            if ($(this).closest('tr').is('.wa-active')) {
                for (let i = 0; i < WA.pages.length; i++) {
                    WA.pages[i].queries = WA.pages[i].queries.filter(q => q.text != $(this).text());
                }
            }
        });

        this.sort();

        //this.alert('success', 'Все запросы удалены!');

        this.display();
    },

    clear: function () {
        if (confirm('Удалить все запросы?')) {
            this.pages = [];
            this.pages.push(this.getPageTemplate());
            this.currentPage = 0;

            this.display();
            this.updatePagesList();
        }
    },

    sort: function () {
        this.pages.forEach(function (page) {
            page.queries.sort(function (q1, q2) {
                return q2.volume - q1.volume;
            });
        });
    },

    display: function() {
        this.saveDataToStorage();
        this.updatePanel();
        this.updateWordstat();
    },

    saveDataToStorage: function () {
        localStorage.setItem('wa_current_page', this.currentPage);
        localStorage.setItem('wa_pages', JSON.stringify(this.pages));
    },

    updatePanel: function () {
        let queriesHtml = '';

        let page = this.pages[this.currentPage];

        let totalVolume = 0;

        let hasZeroVolume = false;

        for (let j = 0; j < page.queries.length; j++) {
            let query = page.queries[j];

            totalVolume += query.volume;

            if (!query.volume) hasZeroVolume = true;

            queriesHtml +=
                '<div class="wa-query" data-query="' + query.text + '">' +
                    this.formatQuery(query.text) +
                    '<div class="wa-query-volume">' + WA.formatVolume(query.volume) + '</div>' +
                    '<div class="wa-query-remove" title="Удалить запрос">‒</div>' +
                '</div>';
        }

        this.container.find('.wa-panel-page-queries').html(queriesHtml);

        this.container.find('.wa-panel-page-info .count').html(page.queries.length);
        this.container.find('.wa-panel-page-info .volume').html(totalVolume);

        this.container.find('.wa-query-remove').click(function () {
            WA.remove($(this).parent().data('query'));
        });

        if (hasZeroVolume) {
            if (!this.container.find('.wa-panel-zero-volume').length) {
                this.container.append(
                    '<div class="wa-panel-zero-volume">' +
                    'К некоторым запросам не указана частотность! ' +
                    'Проверить ее автоматически можно ' +
                    '<a href="https://be1.ru/wordstat/" target="_blank">здесь</a>.' +
                    '</div>'
                );
            }
        } else {
            this.container.find('.wa-panel-zero-volume').remove();
        }
    },

    updatePagesList: function () {
        let block = this.container.find('.wa-panel-pages select');

        let options = '';

        for (let i = 0; i < this.pages.length; i++) {
            let n = i + 1;
            let selected = i == this.currentPage ? 'selected' : '';
            let link = this.pages[i].url.length ? '🔗 ' : '';

            options += '<option value="' + n + '" ' + selected + '>' + link + this.pages[i].name + '</option>';
        }

        // "add new" link
        options += '<option value="0">+ добавить страницу</option>';

        block.html(options);
    },

    updateWordstat: function () {
        let queries = this.getAllQueries().map(q => q.text);

        $('body').find('.b-word-statistics__tr').each(function () {
            var q = $(this).find('a.b-link').text();

            if (queries.indexOf(q) != -1) {
                $(this).addClass('wa-active');
            } else {
                $(this).removeClass('wa-active');
            }
        });
    },

    getAllQueries: function () {
        let queries = [];

        for (let i = 0; i < this.pages.length; i++) {
            for (let j = 0; j < this.pages[i].queries.length; j++) {
                queries.push(this.pages[i].queries[j]);
            }
        }

        return queries;
    },

    formatQuery: function (query) {
        if (this.settings.get('remove_plus')) {
            query = query.replace(/\+/g, '');
        }

        return query.trim();
    },

    formatVolume: function (volume) {
        if (!volume) {
            volume = '?';
        }

        return volume;
    },

    copy: function(with_volume) {
        if (this.settings.get('copy_one_column')) {
            var text = this.copyOneColumn(with_volume);
        } else {
            var text = this.copyManyColumns(with_volume);
        }

        if (!text) {
            this.alert('error', 'Нечего копировать!');
        } else if (this._copy(text)) {
            this.alert('success', 'Список скопирован!');
        } else {
            this.alert('error', 'Не удалось скопировать!');
        }
    },

    copyOneColumn: function (with_volume) {
        var pagesText = [];

        this.pages.forEach(function (page) {
            if (!page.queries.length) return;

            let text = '';

            if (WA.settings.get('copy_page_name')) {
                text += page.name + "\n";
            }

            text += page.url + "\n";

            for (let i = 0; i < page.queries.length; i++) {
                let q = page.queries[i];
                text += WA.formatQuery(q.text) + (with_volume ? ('\t' + WA.formatVolume(q.volume)) : '') + "\n";
            }

            pagesText.push(text);
        });

        return pagesText.join("\n").trim();
    },

    copyManyColumns: function (with_volume) {
        var pagesText = [];

        this.pages.forEach(function (page) {
            if (!page.queries.length) return;

            let text = '';

            let first = true;

            for (let i = 0; i < page.queries.length; i++) {
                if (first) {
                    if (WA.settings.get('copy_page_name')) {
                        text += page.name;
                    }
                }

                if (WA.settings.get('copy_page_name')) {
                    text += "\t";
                }

                let q = page.queries[i];
                text += WA.formatQuery(q.text) + (with_volume ? ('\t' + WA.formatVolume(q.volume)) : '');

                if (first) {
                    text += "\t" + page.url;
                    first = false;
                }

                text += "\n";
            }

            pagesText.push(text);
        });

        return pagesText.join("\n").trim();
    },

    _copy: function (text) {
        var a = $('textarea.copy-helper');

        if (!a.length) {
            a = $('<textarea class="copy-helper"/>').prependTo('body');
        }

        a.val(text);
        a.select();

        var copied = document.execCommand('copy', false, null);

        a.remove();

        return copied;
    },

    at: null,
    alert: function (level, msg) {
        var a = this.container.children('.wa-alert');

        a.text(msg);
        a.removeClass('wa-alert-error wa-alert-success');
        a.addClass('wa-alert-open wa-alert-' + level);

        if (this.at == null) {
            clearTimeout(this.at);
        }

        this.at = setTimeout(function () {
            a.removeClass('wa-alert-open');
        }, 2000);
    },

    observe: function () {
        this.observer.observe($('.b-wordstat-content').get(0), {childList: true, subtree: true});
    },

    hideCompetitors: function () {
        $('body').append(
            '<style>' +
                '.ywa-body,.ywa-add,.ywa-remove,.ywa-addAllWrap,.ywa-introAdd,.ywa-introRemove {display: none !important;}' +
                '.ywa-desaturateSelectedWords .ywa-selected .b-word-statistics__td {color: black !important;}' +
                '.ywa-desaturateSelectedWords .ywa-selected .b-phrase-link__link {color: #1a3dc1 !important;}' +
                '.ywa-desaturateSelectedWords .ywa-selected.wa-active .b-word-statistics__td {color: rgb(195, 195, 195) !important;}' +
                '.ywa-desaturateSelectedWords .ywa-selected.wa-active .b-phrase-link__link {color: rgb(195, 195, 195) !important;}' +
            '</style>'
        );
    },

    /*
     * SETTINGS
     */
    settings: {

        popup: null,

        data: {
            remove_plus: true,
            copy_page_name: true,
            copy_one_column: false,
        },

        get: function (key) {
            return this.data[key];
        },

        set: function (key, value) {
            this.data[key] = value;

            localStorage.setItem('wa_settings', JSON.stringify(this.data));
        },

        init: function () {
            this.popup = WA.container.find('.wa-settings-popup');

            this.initData();
            this.initActions();
        },

        initData: function () {
            let settings = localStorage.getItem('wa_settings');

            if (settings != null) {
                this.data = JSON.parse(settings);
            }
        },

        initActions: function () {
            let checkboxes = this.popup.find('input[type=checkbox]');

            checkboxes.each(function () {
                $(this).prop('checked', WA.settings.get([$(this).attr('name')]));
            });

            checkboxes.change(function () {
                WA.settings.set($(this).attr('name'), $(this).is(':checked'));
                WA.display();
            });
        },

    },

};
