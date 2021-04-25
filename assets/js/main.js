window.$ = window.jQuery = require('jquery');
require('velocity-animate');

require('./iiif-image-viewer');

function addRotate(nodes) {
    /* nodes should be '.book-wrap' */
    nodes.hover(function(){
      $(this).addClass('rotate');
  },function(){
      $(this).removeClass('rotate');
    });
}


function addClick(node) {
    node.click(function (event) {

        /* Get width of container and devide by with of item, to get items per row. Multiply width of item by two  */
        var containerWidth = $('.shelf').width();
        var itemWidth = $('.shelf .tilt').outerWidth();
        var rowItems = Math.round(containerWidth / itemWidth);
        console.log('Width of container ' + containerWidth + ' item width ' + itemWidth + ' items per row ' + rowItems);




        /* Reset already opened books - TODO: add transition */
        $('.book-li.open').removeClass('open')

        $('.page').removeClass('open');
        /* Disable mouseover animation */
        $(this).closest('.book-wrap').unbind('mouseenter mouseleave').removeClass('rotate');
        $(this).closest('.book-li').css('justify-content', 'flex-end').addClass('open');

        var link = $(this).parent('a');

        var pageHeight = link.find('.book.preview img').height();
        link.find('.page').each(function (){
            $(this).height(pageHeight);
        });

        link.parent('.book-wrap').removeClass('rotate');
        link.unbind('mouseenter').unbind('mouseleave');
        link.children('.page').each(function () {
            $(this).unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
            /* $(this).show().addClass('open'); */
            $(this).addClass('open');
        });
        link.find('.close-book').show().css('opacity', 1);

        link.attr('href', link.data('href'));
        event.preventDefault();
        $(this).off();
    });
}


$(document).ready(function() {

    addRotate($('.book-link').parent());

    $('.close-book').each(function () {
        $(this).click(function (event) {
            event.preventDefault();
            var btn = $(this);

            var link = $(this).closest('.book-link');
            link.attr('href', '#');

            link.children('.page').each(function () {
                $(this).removeClass('open').bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
                    btn.hide().css('opacity', 0);
                    link.closest('.book-li.open').css('justify-content', 'unset').removeClass('open').bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){


                    });

                 });
            });

            addRotate(link.parent());
            addClick(link.find('.book.preview'));

        });
    });

    $('.book-link').each(function () {
/*
        var pageHeight = $(this).find('.book.preview img').height();
        $(this).find('.page').each(function (){
            $(this).height(pageHeight);
        });
        */
        addClick($(this).find('.book.preview'));
    });

});
