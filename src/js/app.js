import lightGallery from 'lightgallery.js'; // ATTENTION: this is actually used!
import * as axios from 'axios';
import {fadeOut, forEach} from 'ditoy-js-utils';

const List = require('list.js');
const Autogrow = require('textarea-autogrow');

// const Rellax = require('rellax');

// let MobileDetect = require('mobile-detect');
// let md = new MobileDetect(window.navigator.userAgent);


// global var
let projects = [];

/**
 * handle project analysis
 */

const project = {
    selectedProjects: [],
    competence: {
        concept: [],
        planning: [],
        implementation: []
    },
    activity: {
        concept: [],
        planning: [],
        implementation: [],
        all: []
    },
    byActivity: {
        'Shopdesign': [],
        'Bürodesign': [],
        'Rendering': [],
        'Ausstellungsgestaltung': [],
        'Schaufenstergestaltung': [],
        'Eventgestaltung': [],
        'Messegestaltung': [],
        'Signaletik': [],
        'Display': [],
        'Point-of-Sale': []
    },
    init: function(projects) {
        this.selectedProjects = projects;
        if (projects.length > 0) {
            const me = this;
            for (const item of projects) {
                if (item.concept) {
                    me.competence.concept.push(item);
                    me.activity.concept = union(me.activity.concept, item.activities.trim().split(' '));
                }
                if (item.planning) {
                    me.competence.planning.push(item);
                    me.activity.planning = union(me.activity.planning, item.activities.trim().split(' '));
                }
                if (item.implementation) {
                    me.competence.implementation.push(item);
                    me.activity.implementation = union(me.activity.implementation, item.activities.trim().split(' '));
                }
                me.activity.all = union(me.activity.all, item.activities.trim().split(' '));

                for (const element of item.activities.trim().split(' ')) {
                    if (element && me.byActivity[element]) {
                        me.byActivity[element] = union(me.byActivity[element], item);
                    }
                }
            }
            return this;
        }
    },
    getCompetenceByTag: function(tag) {
        if (tag.toLowerCase() === 'design') {
            return this.competence.concept;
        } else if (tag.toLowerCase() === 'Planung') {
            return this.competence.planning;
        } else if (tag.toLowerCase() === 'Produktion') {
            return this.competence.implementation;
        }
    },
    getActivityByTag: function(tag) {
        if (tag.toLowerCase() === 'Design') {
            return this.activity.concept;
        } else if (tag.toLowerCase() === 'Planung') {
            return this.activity.planning;
        } else if (tag.toLowerCase() === 'Produktion') {
            return this.activity.implementation;
        }
    },
    getAvailableActivies: function() {
        return this.activity.all;
    },
    getByActivity: function(activity) {
        return this.byActivity[activity];
    }
}

/**
 * add listener to activity dropdown
 */

function addActivityListener(id) {
    document.getElementById(id).addEventListener('change', function(event) {
        let myprojects = project.selectedProjects;
        myprojects = intersect(myprojects, project.getByActivity(event.target.value));
        listProjects('project-list', myprojects);
    });
}

/**
 * get projects json data and populate filters
 */

if (document.getElementById('projects-filterable')) {
    axios.get('/projects/index.json').then((r) => {
        projects = r.data;
    });
}


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

    // equalize div heights and toggler position on resize events
    checkResize();
    positionToggler();

    // init slide shows: random order within black slides and within white slides
    let slides = [];
    const blackSlides = shuffle([...document.querySelectorAll('#slides .slide.black')]);
    const whiteSlides = shuffle([...document.querySelectorAll('#slides .slide.white')]);

    // random whites slides first or black slides first
    if (Math.round(Math.random()) === 1) {
        document.body.classList.add('black');
        slides = [...blackSlides, ...whiteSlides];
    } else {
        document.body.classList.add('white');
        slides = [...whiteSlides, ...blackSlides];
    }

    if (slides.length > 0) {
        slides[0].classList.add('showing');
        prepareSlides(slides);
        attachSlider(slides);
    }

    // init stripes
    const stripes = document.querySelectorAll('.stripe');
    if (stripes.length > 0) {
        prepareStripes(stripes);
    }

    // init cards
    const cards = document.querySelectorAll('.featuredimage');
    if (cards.length > 0) {
        prepareCards(cards);
    }

    if (document.getElementById('projects-filterable')) {
        // prepare competence tag selector
        selectProjects('kompetenzen', competenceList);

        // analyze project data
        project.init(projects);
        populateSelect('aufgaben', project.getAvailableActivies());

        // initial project list without filtering
        listProjects('project-list', projects);

        addActivityListener('aufgaben');
    }

    if (document.getElementById('lightgallery')) {
        window.lightGallery(document.getElementById('lightgallery'), {
            cssEasing: 'cubic-bezier(0.15, 1.05, 0.9, 1)',
            speed: 800,
            backdropDuration: 400,
            download: false
        });
    }
};

/**
 * action after viewport was resized
 */
window.onresize = function() {
    resized = true;
};

/**
 * action before unload event (does not work on Safari)
 */
const ua = navigator.userAgent.toLowerCase();
const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
if (!isSafari) {
    window.addEventListener('beforeunload', (e) => { fadeOut(document.querySelector('.wrapper')); });
}

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
            menu.setAttribute('aria-hidden', 'true');
            toggler.setAttribute('aria-expanded', 'false');
            togglericon.classList.remove('expanded');
            rootElement.style.overflow = 'auto';
        } else {
            // open nav
            menu.classList.add('expanded');
            menu.setAttribute('aria-hidden', 'false');
            toggler.setAttribute('aria-expanded', 'true');
            togglericon.classList.add('expanded');
            rootElement.style.overflow = 'hidden'; // disable scroll on body when menu open
        }
    };
    toggler.addEventListener('click', function() {
        toggleNavigation();
    });
    menu.addEventListener('click', function() {
        toggleNavigation();
    });
}


/**
 * equalize height of elements
 */

function equalize() {
    const equalizers = document.querySelectorAll('.equalize');
    const parents = new Set();
    for (const item of equalizers) {
        parents.add(item.parentNode);
    }

    for (const parent of parents) {
        const children = parent.querySelectorAll('.equalize');
        const tallest = Math.max.apply(Math, Array.from(children).map(function(elem) {
            elem.style.minHeight = '';
            return elem.offsetHeight;
        }));

        for (const child of children) {
            child.style.minHeight = (tallest + 1) + 'px';
        }
    }
}

/**
 * position toggler within container
 */
function positionToggler() {
    const containerMaxWidth = 1100;
    const toggler = document.getElementById('toggler');
    const container = document.querySelector('.container');
    const body = document.querySelector('body');
    if (body.offsetWidth > containerMaxWidth) {
        toggler.style.right = ((body.offsetWidth - container.offsetWidth) / 2 + 30) + 'px';
    } else {
        toggler.style.right = '1rem';
    }
}
positionToggler();

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
            positionToggler();
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

/**
 * return intersection of two arrays
 */

function intersect(array1, array2) {
    if (array2 && array2.length > 0) {
        return array1.filter((x) => (array2.includes(x)));
    }

    return array1;
}

/**
 * return union of two arrays with no duplicates
 */

function union(array1, array2) {
    return [ ...new Set((array1.concat(array2)))];
}

/**
 * handle filter tags in references
 */

function selectProjects(id, originList) {
    if (document.getElementById(id)) {
        const mySellect = sellect('#' + id, {
            originList: originList,
            onInsert: function() {
                const selected = mySellect.getSelected();
                let myprojects = projects;
                let competence = [];
                for (const element of selected) {
                    competence = project.getCompetenceByTag(element);
                    myprojects = intersect(myprojects, competence);
                }
                project.init(myprojects);
                let myactivities = [];
                let activity = [];
                for (const element of selected) {
                    activity = project.getActivityByTag(element);
                    myactivities = union(myactivities, activity);
                }

                populateSelect('aufgaben', myactivities);

                listProjects('project-list', myprojects);

            },
            onRemove: function() {
                const selected = mySellect.getSelected();
                if (selected.length == 0) {
                    project.init(projects);
                    populateSelect('aufgaben', project.getAvailableActivies());
                }
            }
        });
        mySellect.init();
    }
}

/**
 * generate project cards from json import
 */

function listProjects(id, list) {
    const options = {
        valueNames: [
            'title',
            'teaser_truncated',
            'icons',
            {name: 'permalink', attr: 'href'},
            {name: 'competence', attr: 'data-competence'},
            {name: 'activity', attr: 'data-activity'},
            {name: 'featuredimage', attr: 'style'},
            {name: 'label', attr: 'aria-label'}
        ],
        item: '<li class="card equalize"><a class="permalink link" href=""><div class="card-inner"> <div class="featuredimageWrapper">' +
        '<div class="featuredimage label" style="" aria-label=""></div></div>' +
        '<h3 class="competence title" data-competence=""></h3><div class="teaser activity" data-activity=""><p class="teaser_truncated"></p>' +
        '</div><ul class="icons"></ul></div></a><div class="clear"></div></li>'
    };

    if (list.length > 0) {
        let mylist = new List(id, options);
        mylist.clear();
        mylist.add(
            list
        );
        equalize();
    }

}

/**
 * populate  dropdown menu with array of option labels
 */

function populateSelect(id, options) {
    const select = document.getElementById(id);
    while (select.firstChild) {
        select.removeChild(select.firstChild);
    }
    options.unshift('alle');
    options = [ ...new Set(options)];
    for (const element of options) {
        if (element) {
            const option = document.createElement('option');
            option.innerHTML = element;
            select.appendChild(option);
        }
    }

}


/**
 * hide letters in customer list where no customers available for that letter
 */

const customersList = document.querySelector('.customers');
if (!!customersList) {
    const letterLists = customersList.querySelectorAll('ul');
    if (!!letterLists) {
        forEach(letterLists, (list) => {
            const items = list.querySelectorAll('li');
            if (!items.length || items.length === 1) {
                list.style.display = 'none';
            }
        });
    }
}


/**
 * Home Slideshow
 */
const prepareSlides = (slides) => {
    forEach(slides, (slide) => {
        const imageUrl = slide.dataset.src ? slide.dataset.src : false;
        if (imageUrl) {
            let width = 1024;
            if (isPhone()) {
                width = 700;
            } else if (isDesktop()) {
                width = 1600;
            }
            const height = Math.round(width / (16 / 9));
            const imageOptions = "-/scale_crop/" + width + "x" + height + "/center/";

            slide.style.backgroundImage = "url('" + imageUrl + imageOptions + "')";
            prefillImage(slide, imageUrl);
        }
    });
};

const attachSlider = (slides) => {
    let currentSlide = 0;
    const nextSlide = () => {
        slides[currentSlide].classList.remove('showing');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('showing');

        const currentSlideElem = document.querySelector('.slide.showing');
        const claim = currentSlideElem.querySelector('.claim');

        if (claim.classList.contains('black')) {
            if (document.body.classList.contains('white')) {
                document.body.classList.remove('white');
            }
            document.body.classList.add('black');
        } else {
            if (document.body.classList.contains('black')) {
                document.body.classList.remove('black');
            }
            document.body.classList.add('white');
        }
    };
    setInterval(nextSlide, 8000);
};


/**
 * Home Stripes
 */
const prepareStripes = (stripes) => {
    forEach(stripes, (stripe) => {
        const imageUrl = stripe.dataset.src ? stripe.dataset.src : false;
        if (imageUrl) {
            let width = 1024;
            if (isPhone()) {
                width = 800;
            } else if (isDesktop()) {
                width = 1600;
            }
            let height = Math.round(width / (16 / 3));
            let imageOptions = "-/scale_crop/" + width + "x" + height + "/center/";

            stripe.style.backgroundImage = "url('" + imageUrl + imageOptions + "')";
            prefillImage(stripe, imageUrl);
        }
    });
};

/**
 * Cards / Teaser boxes post-loading
 */
const prepareCards = (cards) => {
    forEach(cards, (card) => {
        const imageUrl = card.dataset.src ? card.dataset.src : false;
        if (imageUrl) {
            let width = 400;
            if (isPhone()) {
                width = 300;
            } else if (isDesktop()) {
                width = 500;
            }
            const height = Math.round(width / (4 / 3));
            const imageOptions = "-/scale_crop/" + width + "x" + height + "/center/";

            card.style.backgroundImage = "url('" + imageUrl + imageOptions + "')";
            prefillImage(card, imageUrl);
        }
    });
};

const prefillImage = (elem, imageUrl) => {
    axios.get(imageUrl + '-/preview/-/main_colors/2/').then((r) => {
        elem.style.backgroundColor = 'rgba(' + r.data.main_colors[0].join(',') + ', 0.8)';
    });
}


/**
 * Home parallax scrolling with rellax.js
 */
// const attachRellax = () => {
//     if (document.querySelectorAll('.rellax').length > 0) {
//         new Rellax('.rellax');
//     }
// };
// attachRellax();


/**
 * slide down and slide up job descriptions on jobs page
 */
const attachJobSliders = () => {
    const togglers = document.querySelectorAll('.jobs .more, .jobs .less');
    if (togglers.length > 0) {
        forEach(togglers, (toggler) => {
            toggler.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(toggler.dataset.target);
                if (target.classList.contains('expanded')) {
                    target.classList.remove('expanded');
                } else {
                    target.classList.add('expanded');
                }
                target.scrollIntoView();
            });
        });
    }
};
attachJobSliders();


/**
 * Helpers
 */

const isPhone = () => {
    return window.screen.width < 800 ? true : false;
}

const isDesktop = () => {
    return window.screen.width > 1400 ? true : false;
}

// shuffle array (random order in array)
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
