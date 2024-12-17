
/*
 * Show current configurations
 */
getConfig(function (config) {

    var form = $('#config-form');

    form.find('input[name=analyze][value=' + config.analyze + ']').prop('checked', true);
    form.find('input[name=iks_badge]').prop('checked', config.iks_badge);
    form.find('input[name=wordstat_assistant]').prop('checked', config.wordstat_assistant);
    form.find('input[name=share_statistic]').prop('checked', config.share_statistic);

    form.find('input[name^=bookmarklets]').each(function () {
        let checked = config.bookmarklets.indexOf($(this).val()) != -1;
        $(this).prop('checked', checked);
        $('.container').attr('style', '');
    });

});


/*
 * Save configurations
 */
$('#config-form input').change(saveConfig);

function saveConfig() {
    var form = $('#config-form');

    var config = {
        analyze: form.find('input[name=analyze]:checked').val(),
        iks_badge: form.find('input[name=iks_badge]').is(':checked'),
        wordstat_assistant: form.find('input[name=wordstat_assistant]').is(':checked'),
        share_statistic: form.find('input[name=share_statistic]').is(':checked'),
        bookmarklets: [],
    };

    form.find('input[name^=bookmarklets]').each(function () {

        if ($(this).is(':checked')) {
            config.bookmarklets.push($(this).val());
        }

    });

    chrome.storage.local.set({ config: config });
}


var timeout = null;

function showInfo(block, html) {
    if (timeout != null) clearTimeout(timeout);
    block.html(html);
    timeout = setTimeout(function () { block.html('') }, 5000)
}


/*
 *Feedback
 */
$('#feedback-form').submit(function (e) {

    e.preventDefault();

    var form = $(this);
    var button = form.find('button');
    var resultBlock = form.find('.result');

    button.prop('disabled', true);

    function success(json) {
        if (json.result == 'ok') {
            form.find('textarea').val('');
            showInfo(resultBlock, '<span class="green">Спасибо за ваш отзыв!</span>');
        } else {
            showInfo(resultBlock, '<span class="red">' + json.result + '</span>');
        }

        button.prop('disabled', false);
    }

    function fail() {
        button.prop('disabled', false);

        resultBlock.html('<span class="red">Случилась ошибка!</span>');

        setTimeout(function () {
            resultBlock.text('');
        }, 4000);
    }

    var email = form.find('input').val().trim();

    if (!email.length) {
        email = 'extension@be1.ru';
    }

    var data = {
        text: form.find('textarea').val().trim(),
        page: 'extension',
        type: 0,
        email: email,
    };

    $.ajax({
        method: 'POST',
        url: 'https://be1.ru/problem-message',
        data: data,
        dataType: 'json',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        success: success,
        fail: fail,
    });

});