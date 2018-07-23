import lightGallery from 'lightgallery.js'; // ATTENTION: this is actually used!
import * as axios from 'axios';
import {fadeIn, fadeOut, forEach} from 'ditoy-js-utils';

const List = require('list.js');
const Autogrow = require('textarea-autogrow');


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
                    me.activity.concept = union(me.activity.concept, item.activities.split(' '));
                }
                if (item.planning) {
                    me.competence.planning.push(item);
                    me.activity.planning = union(me.activity.planning, item.activities.split(' '));
                }
                if (item.implementation) {
                    me.competence.implementation.push(item);
                    me.activity.implementation = union(me.activity.implementation, item.activities.split(' '));
                }
                me.activity.all = union(me.activity.all, item.activities.split(' '));

                for (const element of item.activities.split(' ')) {
                    me.byActivity[element] = union(me.byActivity[element], item);
                }
            }
            return this;
        }
    },
    getCompetenceByTag: function(tag) {
        if (tag == 'Idee') {
            return this.competence.concept;
        } else if (tag == 'Planung') {
            return this.competence.planning;
        } else if (tag == 'Ausführung') {
            return this.competence.implementation;
        }
    },
    getActivityByTag: function(tag) {
        if (tag == 'Idee') {
            return this.activity.concept;
        } else if (tag == 'Planung') {
            return this.activity.planning;
        } else if (tag == 'Ausführung') {
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
        // console.log(event.target.value);
        let myprojects = project.selectedProjects;
        myprojects = intersect(myprojects, project.getByActivity(event.target.value));
        listProjects('project-list', myprojects);
    });
}

/**
 * get projects json data and populate filters
 */

if (document.getElementById('projects-filterable')) {
    axios.get("/projects/index.json").then((r) => {
        projects = r.data;
        // console.log('JSON', projects);
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
    checkResize();

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

    window.lightGallery(document.getElementById('lightgallery'));


    // smooth page transitions
    const wrapper = document.querySelector('.wrapper');
    wrapper.style.opacity = 0;
    wrapper.style.paddingTop = 0;
    fadeIn(wrapper);
};


/**
 * action before unload event
 */
window.addEventListener("beforeunload", (e) => { fadeOut(document.querySelector('.wrapper')); });


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
        '</div><div class="icons"></div></div></a><div class="clear"></div></li>'
    };

    // console.log('LIST.JS', list);
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
    options.unshift('--- bitte auswählen ---');
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




