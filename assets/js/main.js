window.$ = window.jQuery = require('jquery');

require('./iiif-image-viewer');

function addRotate(nodes) {
    nodes.hover(function(){
      $(this).addClass('rotate');
  },function(){
      $(this).removeClass('rotate');
    });
}


function addClick(node) {
    node.click(function (event) {

        /* Reset already opened books */
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
            $(this).addClass('open');
        });

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

            var link = $(this).closest('.book-link');
            link.attr('href', '#');
            link.children('.page').each(function () {
                $(this).removeClass('open').bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
                    link.closest('.book-li.open').css('justify-content', 'unset').removeClass('open').bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){

                    });
                 });
            });

            addRotate(link.parent());
            addClick(link.find('.book.preview'));
        });
    });

    $('.book-link').each(function () {

        addClick($(this).find('.book.preview'));
    });

});
