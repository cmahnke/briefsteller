window.$ = window.jQuery = require('jquery');

require('./iiif-image-viewer');

function addRotate(nodes) {
    nodes.mouseenter(function(){
      $(this).parent('.book-wrap').addClass('rotate');
    }).mouseleave(function(){
      $(this).parent('.book-wrap').removeClass('rotate');
    });
}

function addClick(node) {
    console.log('adding ');
    node.click(function (event) {

        /* Get width of container and devide by with of item, to get items per row. Multiply width of item by two  */
        var containerWidth = $('.shelf').width();
        var itemWidth = $('.shelf .tilt').outerWidth();
        var rowItems = Math.round(containerWidth / itemWidth);
        console.log('Width of container ' + containerWidth + ' item width ' + itemWidth + ' items per row ' + rowItems);

        $('.book-li.open').removeClass('open')
        $(this).closest('.book-li').addClass('open');
        $(this).closest('.context').addClass('open');
        var link = $(this).parent('a');
        link.parent('.book-wrap').removeClass('rotate');
        link.unbind('mouseenter').unbind('mouseleave');
        link.children('.page').each(function () {
            $(this).show().addClass('open');
        });
        link.find('.close-book').show().css('opacity', 1);

        link.attr('href', link.data('href'));
        event.preventDefault();
        $(this).off();
    });
}


$(document).ready(function() {

    addRotate($('.book-link'));

    $('.close-book').each(function () {
        $(this).click(function (event) {
            event.preventDefault();
            $(this).hide().css('opacity', 0);
            var link = $(this).closest('.book-link');
            link.attr('href', '#');
            link.closest('.book-li.open').removeClass('open');
            link.closest('.context.open').removeClass('open');
            link.children('.page').each(function () {
                $(this).hide().removeClass('open');
            });
            addRotate(link);
            addClick(link.find('.book.preview'));

        });
    });

    $('.book.preview').each(function () {
        addClick($(this));
    });

});
