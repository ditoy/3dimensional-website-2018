// import ScrollReveal from 'scrollreveal';

const Autogrow = require('textarea-autogrow');

/**
 * custom polyfills
 */

(function() {
    let lastTime = 0;
    const vendors = ['ms', 'moz', 'webkit', 'o'];
    for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
            || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            const currTime = new Date().getTime();
            const timeToCall = Math.max(0, 16 - (currTime - lastTime));
            const id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


/**
 * action after onload event
 */
window.onload = function() {
    checkResize();
    // testSellect("aufgaben");
};

/**
 * menu toggle
 */

const  menu = document.getElementById('collapsible'),
    toggler = document.getElementById('toggler'),
    togglericon = document.getElementById('togglericon')
;
if (toggler) {
    // toggle the navigation UI
    const rootElement = document.getElementById('root');
    const toggleNavigation = function() {
        if (menu.classList.contains('expanded')) {
            // close nav
            menu.classList.remove('expanded');
            togglericon.classList.remove('expanded');
            rootElement.style.overflow = 'auto';
        } else {
            // open nav
            menu.classList.add('expanded');
            togglericon.classList.add('expanded');
            rootElement.style.overflow = 'hidden'; // disable scroll on body when menu open
        }
    };
    toggler.addEventListener('click', function() {
        toggleNavigation();
    });
}


/**
 * equalize height of elements
 */
function equalize() {
    const equalizers = document.querySelectorAll('.equalize');

    for (let i = 0; i < equalizers.length; i++) {
        const equalizer = equalizers[i];
        const nodes = equalizer.parentNode.querySelectorAll('.equalize'),
            elems = [].slice.call(nodes),
            tallest = Math.max.apply(Math, elems.map(function(elem, index) {
                elem.style.minHeight = '';
                return elem.offsetHeight;
            }))
        ;

        for (let j = 0; j < elems.length; j++) {
            const elem = elems[j];
            elem.style.minHeight = (tallest + 1) + 'px'; // adjust tallest by 1px
        }
    }
}

/**
 * window resize event listener
 */

let resized = true,
    timeout = null
;
const checkResize = function() {
        if (resized) {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(equalize);
            }
        }
        clearTimeout(timeout);
        timeout = setTimeout(checkResize, 50);
        resized = false;
    }
;


/**
 * auto-resize textareas as user types in
 */

const autoresizes = document.querySelectorAll('.autoresize');
if (autoresizes) {
    for (let j = 0; j < autoresizes.length; j++) {
        new Autogrow(autoresizes[j]);
    }
}

// function testSellect(id) {
//     if (document.getElementById(id)) {
//         var mySellect = sellect("#" + id, {
//             originList: ["Gorilla","Taube","Fiesling"],
//             destinationList: ["Taube"]
//         });
//         mySellect.init();
//     }
// }
