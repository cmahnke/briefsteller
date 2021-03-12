window.$ = window.jQuery = require('jquery');

$(document).ready(function() {

    $('#shelf').find('.book').each(function() {
        $(this).on('click', function() {
            var id = $(this).data('content-id');
            var content = $('#' + id).html();

            console.log('click:' + id);

            $('#shelf').find('.book').find('.active').removeClass('active').css({'display': ''});

            if (!$('#' + id).hasClass('active')) {
                $('#' + id).slideToggle(500, function() {
                    $('#' + id).addClass('active');
                });
            }
        })
    });

});
