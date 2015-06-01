// Use instance template for 'many of a kind' such as list items
// Will be instantiated and destroyed after use
module.exports = instance;

var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var _ = require('underscore');

var template = require('list-displayer.hbs');

function instance() {
    var _this = this
    ,   $leftSidebar = document.querySelector('.sidebar.left')
    ,   $searchWrapper = $leftSidebar.querySelector('.search-wrapper')
    ,   $searchCTA = $searchWrapper.querySelector('.search-cta')
    ,   $btClose = $searchWrapper.querySelector('.bt-close')
    ,   $searchInput = document.getElementById('searchinput')
    ,   $wrapperResults = $searchWrapper.querySelector('.wrapper-search-results')
    ,   searchIsOpened = false
    ,   resultItems
    ;

    $searchCTA.addEventListener('click', clickCTA)
    $btClose.addEventListener('click', closeSearchWrapper)
    $searchInput.addEventListener('keyup', searchRequest, false)

    function clickCTA(e){
        if(searchIsOpened) return;
        openSearchWrapper()
    }

    function openSearchWrapper(){
        pubsub.emit('body::noscroll')
        searchIsOpened = true;
        MR.utils.addClass($searchWrapper, 'opened')
        var mainDuration = .5
        TweenLite.to($searchWrapper, mainDuration, { width: window.innerWidth, height:'100%', ease:Expo.easeIn, onComplete:function(){
            resize(window.innerWidth, window.innerHeight);
            $searchInput.focus()
        }})
        setTimeout(function(){MR.utils.addClass($btClose, 'active')}, 300)
        
    }
    function closeSearchWrapper(){
        clearResults()
        pubsub.emit('body::scroll')
        searchIsOpened = false;
        MR.utils.removeClass($searchWrapper, 'opened')
        var mainDuration = .5
        TweenLite.to($searchWrapper, mainDuration, { width: 0, height:0, ease:Expo.easeIn, clearProps: 'all', onComplete:function(){
            $searchInput.value = ''
        }})
        setTimeout(function(){MR.utils.removeClass($btClose, 'active')}, 300)
    }

    function searchRequest(e){
        var inputValue = $searchInput.value.toLowerCase()
        // REQUEST HERE
        var data = {}
        data.id = 'randomid';
        data.name = inputValue;
        data.country = 'here come the country'
        data.subtitle = 'here come the description'
        data.picture = 'http://upload.wikimedia.org/wikipedia/commons/c/cd/SanFrancisco_from_TwinPeaks_dusk_MC.jpg';
        // then

        displaySearchResult(data)
    }

    function displaySearchResult(_datas){
        var div = document.createElement('div');
        div.setAttribute('data-id', _datas.id);
        MR.utils.addClass(div, 'push')
        MR.utils.addClass(div, 'type-search-result')
        var html = '<div class="visual" style="background-image: url(\''
            html += _datas.picture
            html += '\');"></div>'
            html += '<div class="infos">'
            html += '<span class="city">'
            html += _datas.name
            html += ', </span>'
            html += '<span class="country">'
            html += _datas.country
            html += '</span>'
            html += '<div class="grip">'
            html += _datas.subtitle
            html += '</div>'
            html += '</div>'
        div.innerHTML = html;
        TweenLite.to(div, 0, {autoAlpha:0})
        $wrapperResults.appendChild(div)
        TweenLite.to(div, .5, {autoAlpha:1})
        resultItems = $wrapperResults.querySelectorAll('.push')
    }

    function clearResults(){
        if(typeof resultItems !== 'undefined' && resultItems.length <= 0) return;
        _.each(resultItems, function(el, i){
            TweenLite.to(el, .2, {autoAlpha:0, delay: i*.1, onComplete:function(){
                $wrapperResults.removeChild(el)
            }})
        })
    }
    // Listen to global resizes
    pubsub.on('resize', resize);
    function resize(_width, _height) { 
        if(searchIsOpened){
            var wrapperH = window.outerHeight - $wrapperResults.offsetTop - 170;
            $wrapperResults.style.height = wrapperH +'px';
            $searchWrapper.style.width = _width +'px';
        }
    }


}

