// Use instance template for 'many of a kind' such as list items
// Will be instantiated and destroyed after use
module.exports = instance;

var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var _ = require('underscore');

var PiesComparator = require('pie-comparator');

var template = require('fiche-activities.hbs');

function instance(_APIresult, _wrapper) {
    var _this = this;

    var data = _APIresult
    ,   container = _wrapper
    ,   content
    ,   map
    ,   $tabs
    ,   $piesComparator

    // Current state of module
    // Can also be 'loading', 'ready', 'on' and 'leaving'
    // 'off' = the module is inactive
    // 'loading' = the data is loading, nothing is shown
    // 'ready' = the content is ready, but still animating or preloading files
    // 'on' = all animated and preloaded
    // 'leaving' = exit has been called, animating out
    var state = 'off';

    compileTemplate()
   

    // 3. Compile a DOM element from the template and data
    function compileTemplate() {
        var html = template(data);
        content = parseHTML(html);
        ready();
    }

    // 4. Content is ready to be shown
    function ready() {
        state = 'ready';
        //container.setAttribute('id', "fiche-activities")
        container.appendChild(content);
        
        //
        initMap();
        //
        initFilters();
        //
        ///////// PIES COMPARATOR
        piesComparator = new PiesComparator(data)
      

        animateIn();
    }

    /////// MAP

    function initMap(){
        // MAP
        L.mapbox.accessToken = 'pk.eyJ1IjoidWx0cmEtamV5IiwiYSI6InhoS2hzZkkifQ.80V4Jy03lxEoFUl9x-tmwQ';
        map = L.mapbox.map('map', 'mapbox.streets').setView([data.city.pos.lat, data.city.pos.lon], 13);
        
        var markerLayer
        pubsub.on('fiche:filter::change', function(value){
            console.log('UPDATE MARKERS WITH ID', value)
        });
    }


    /////// FILTERS

    function initFilters(){
        // tabs
        $tabs = content.querySelector('.inner-nav')
        $tabs = $tabs.querySelectorAll('a')
        _.each($tabs, function(el){
            el.addEventListener('click', clickInnerTab)
        })
    }

    function clickInnerTab(e){
        e.preventDefault()
        var $tab = this
        ,   value = $tab.getAttribute('href')
        ;
        console.log(value)
        pubsub.emit('fiche:filter::change', value);
    }


    
    // 5. Final step, animate in page
    function animateIn() {
        TweenLite.to(content, .5, {autoAlpha:1})
    }

    // Triggered from router.js
    _this.exit = function (next){

        // If user requests to leave before content loaded
        if (state == 'off' || state == 'loading') {
            console.log('left before loaded');
            next();
            return;
        }
        if (state == 'ready') console.log('still animating on quit');

        state = 'leaving';
        
        animateOut(next);

        // Let next view start loading
        // next();
    };

    function animateOut( next) {

            TweenLite.to(content, .3, {autoAlpha:0, onComplete:function(){
                
            // Let next view start loading
                if(typeof next !== 'undefined') next();
            }})
            
    }

    // Listen to global resizes
    pubsub.on('resize', resize);
    function resize(_width, _height) { 
        
    }

}

