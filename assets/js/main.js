require('./iiif-image-viewer');

import { audioplayer } from './audioplayer';

function addRotate(nodes) {
    nodes.forEach(function(node) {
        node.addEventListener('mouseenter', function() {
            this.classList.add('rotate');
        });
        node.addEventListener('mouseleave', function() {
            this.classList.remove('rotate');
        });
    });
}

function addClick(node) {
    node.addEventListener('click', function(event) {

        /* Reset already opened books */
        document.querySelectorAll('.book-li.open').forEach(el => el.classList.remove('open'));
        document.querySelectorAll('.page').forEach(el => el.classList.remove('open'));

        /* Disable mouseover animation */
        const bookWrap = this.closest('.book-wrap');
        bookWrap.removeEventListener('mouseenter', bookWrap._mouseenter);
        bookWrap.removeEventListener('mouseleave', bookWrap._mouseleave);
        bookWrap.classList.remove('rotate');

        const bookLi = this.closest('.book-li');
        bookLi.style.justifyContent = 'flex-end';
        bookLi.classList.add('open');

        const link = this.closest('a');

        const previewImg = link.querySelector('.book.preview img');
        const pageHeight = previewImg ? previewImg.offsetHeight : 0;
        link.querySelectorAll('.page').forEach(function(page) {
            page.style.height = pageHeight + 'px';
        });

        link.closest('.book-wrap').classList.remove('rotate');

        link.removeEventListener('mouseenter', link._mouseenter);
        link.removeEventListener('mouseleave', link._mouseleave);

        const transitionEvents = 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd'.split(' ');
        link.querySelectorAll('.page').forEach(function(page) {
            transitionEvents.forEach(event => page.removeEventListener(event, page._transitionEnd));
            page.classList.add('open');
        });

        link.setAttribute('href', link.dataset.href);
        event.preventDefault();
        node.removeEventListener('click', arguments.callee);
    });
}

document.addEventListener('DOMContentLoaded', function() {

    addRotate(Array.from(document.querySelectorAll('.book-link')).map(el => el.parentElement));

    document.querySelectorAll('.close-book').forEach(function(closeBtn) {
        closeBtn.addEventListener('click', function(event) {
            event.preventDefault();

            const link = this.closest('.book-link');
            link.setAttribute('href', '#');

            const transitionEvents = 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd'.split(' ');

            link.querySelectorAll('.page').forEach(function(page) {
                page.classList.remove('open');

                function onPageTransitionEnd() {
                    transitionEvents.forEach(ev => page.removeEventListener(ev, onPageTransitionEnd));

                    const openBookLi = link.closest('.book-li.open');
                    if (openBookLi) {
                        openBookLi.style.justifyContent = 'unset';
                        openBookLi.classList.remove('open');
                    }
                }

                transitionEvents.forEach(ev => page.addEventListener(ev, onPageTransitionEnd));
            });

            addRotate([link.parentElement]);
            addClick(link.querySelector('.book.preview'));
        });
    });

    document.querySelectorAll('.book-link').forEach(function(bookLink) {
        addClick(bookLink.querySelector('.book.preview'));
    });

});
