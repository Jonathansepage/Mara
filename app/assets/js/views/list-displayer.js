// Use instance template for 'many of a kind' such as list items
// Will be instantiated and destroyed after use
module.exports = instance;

var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var _ = require('underscore');

var homeList = require('home-list')
var HomeMap = require('home-map')
,   homeMap

var template = require('list-displayer.hbs');

function instance() {
    var _this = this;

    var dataUrl = 'assets/data/static.json';
    var dataAPI, pendingAPIrequest = false;
    var currentList, prevList;

    // Current state of module
    // Can also be 'loading', 'ready', 'on' and 'leaving'
    // 'off' = the module is inactive
    // 'loading' = the data is loading, nothing is shown
    // 'ready' = the content is ready, but still animating or preloading files
    // 'on' = all animated and preloaded
    // 'leaving' = exit has been called, animating out
    var state = 'off';

    var data, content;

    var $filters
    ,   $sortings
    ,   $viewModes
    ,   selectedFilter
    ,   selectedSorting
    ,   selectedViewmode
    ,   listResults
    ,   mapResults
    ,   viewMode = 'list'
    ,   $listWrapper
    ,   $mapWrapper

    // 1. triggered from router.js
    _this.enter = function (){
        loadData();
    };

    // 2. Load data
    function loadData(){
        state = 'loading';
        xhr({url: dataUrl, json: true}, function (err, resp, body) {
            data = body;

            // if state changed while loading cancel
            if (state !== 'loading') return;
            compileTemplate();
        });
    }

    // 3. Compile a DOM element from the template and data
    function compileTemplate() {
        var html = template(data);
        content = parseHTML(html);
        ready();
    }

    // 4. Content is ready to be shown
    function ready() {
        state = 'ready';

        document.getElementById('home').appendChild(content);

       
        addListeners()
        animateIn();
        
        // For resize:
        //     either force a global resize from common.js
        // pubsub.emit('global-resize');

        //     or just keep it local
        // resize(window.innerWidth, window.innerHeight);
    }

    // 5. Final step, animate in page
    function animateIn() {
        $listWrapper = document.querySelector('.wrapper-list')
        $mapWrapper = document.querySelector('.wrapper-map')
        TweenLite.to($listWrapper, 0, {autoAlpha:1})
        TweenLite.to($mapWrapper, 0, {autoAlpha:0})
        TweenLite.to(content, 0.5, {
            autoAlpha: 1, 
            onComplete: function() {

                // End of animation
                state = 'on';
                // init map
                homeMap = new HomeMap()
            }
        });
    }

    function addListeners(){
        $filters = content.querySelectorAll('.filters a')
        $sortings = content.querySelectorAll('.sorting a')
        $viewModes = content.querySelectorAll('.view-mode a')

        _.each($filters, function(el){
            el.addEventListener('click', clickFilter)
        })

        _.each($sortings, function(el){
            el.addEventListener('click', clickSorting)
        })

        _.each($viewModes, function(el){
            el.addEventListener('click', clickViewMode)
        })

        // init
        MR.utils.fireEvent($sortings[0], 'click');
        setTimeout(function(){
            MR.utils.fireEvent($filters[0], 'click');
        }, 1500)
        
    }

    function clickFilter(e){
        if(pendingAPIrequest) return;
        e.preventDefault();
        var $this = e.target
        selectedFilter = $this.getAttribute("href")

        removeClassFromElts($filters, 'active')
        MR.utils.addClass($this, 'active')

        if(typeof currentList !== 'undefined'){
            prevList = currentList;
            prevList.exit(requestAPI);
        } else {
            requestAPI()
        }
    }

    function clickSorting(e){
        if(pendingAPIrequest) return;
        e.preventDefault();
        var $this = e.target
        selectedSorting = $this.getAttribute("href")

        removeClassFromElts($sortings, 'active')
        MR.utils.addClass($this, 'active')

        if(viewMode == 'map'){
            requestAPI()
        }
        if(typeof currentList !== 'undefined'){
            prevList = currentList;
            prevList.exit(displayNewList);
        }
    }

    function clickViewMode(e){
        e.preventDefault();
        if(pendingAPIrequest) return;
        removeClassFromElts($viewModes, 'active')
        MR.utils.addClass(this, 'active')
        if(MR.utils.hasClass(this, 'list-view')){
            viewMode = 'list';
            TweenLite.to($listWrapper, 1, {autoAlpha:1, overwrite:'all', delay:1})
            TweenLite.to($mapWrapper, 1, {autoAlpha:0, overwrite:'all'})
        } else {
            viewMode = 'map';
            TweenLite.to($mapWrapper, 1, {autoAlpha:1, overwrite:'all', delay:1})
            TweenLite.to($listWrapper, 1, {autoAlpha:0, overwrite:'all'})
        }
        if(typeof currentList !== 'undefined'){
            prevList = currentList;
            prevList.exit(requestAPI);
        } else {
            requestAPI()
        }
    }

    function removeClassFromElts(elts, className){
        _.each(elts, function(el){
           MR.utils.removeClass(el, className)
        })
    }

    function requestAPI(){
        pendingAPIrequest = true;
        //MR.apiRequest.getCitiesList(displayNewList, data)
        pubsub.emit('cities::getList', displayNewList, data['home-list-view'])

    }

    function displayNewList(_datas){
        if(typeof _datas !== 'undefined') dataAPI = _datas;
        pendingAPIrequest = false;
        sortData()
        switch(viewMode){
            default:
            case 'list': currentList = new homeList(dataAPI); break;
            case 'map': currentList = homeMap; homeMap.addMarkers(dataAPI, selectedSorting); break;
        }
    }

    function sortData(){
        switch(selectedSorting){
            default:
            case 'bestdeals': dataAPI.resultList = _.sortBy(dataAPI.resultList, function(obj){ return +obj.price_score }).reverse(); break;
            case 'popular': dataAPI.resultList = _.sortBy(dataAPI.resultList, function(obj){ return +obj.popularity_score }).reverse(); break;
            case 'relevant': dataAPI.resultList = _.sortBy(dataAPI.resultList, function(obj){ return +obj.relevance_score }).reverse(); break;
        }
    }

    // Triggered from router.js
    _this.exit = function (){
        // If user requests to leave before content loaded
        if (state == 'off' || state == 'loading') {
            console.log('left before loaded');
            return;
        }
        if (state == 'ready') console.log('still animating on quit');

        state = 'leaving';


        
        animateOut();
        currentList.exit()
        if(typeof homeMap !== 'undefined'){
            homeMap.destroy()
        }
        // Let next view start loading
        // next();
    };

    function animateOut() {
        TweenLite.to(content, 0.5, {
            autoAlpha: 0, 
            onComplete: function() {
                content.parentNode.removeChild(content);

                // End of animation
                state = 'off';
            }
        });
    }

    // Listen to global resizes
    pubsub.on('resize', resize);
    function resize(_width, _height) { 
        
    }
}

