// Use static template for 'one of a kind' pages like home
// Is never destroted


var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var sfx = require('sfx');
var _ = require('underscore');

var Sidebar = require('sidebar-right');
var FicheActivities = require('fiche-activities');
var FicheFriends = require('fiche-friends');
var FicheMoreInfos = require('fiche-more-infos');

var template = require('fiche.hbs');
var dataUrl = 'assets/data/static.json';

var $body
,   $btLike
,   $btDislike
,   $btAdd
,   $btBooknow
,   idCity
,   sidebar

// Current state of module
// Can also be 'loading', 'ready', 'on' and 'leaving'
// 'off' = the module is inactive
// 'loading' = the data is loading, nothing is shown
// 'ready' = the content is ready, but still animating or preloading files
// 'on' = all animated and preloaded
// 'leaving' = exit has been called, animating out
var state = 'off';

var data, content;

// 1. triggered from router.js
exports.enter = function (ctx){
    /*if (content) {
        ready(ctx);
        return;
    }*/
    loadData(ctx);
};

// 2. Load data
function loadData(ctx){
    state = 'loading';
    if (data || ctx.state.item){
        compileTemplate(ctx); 
        return;
    }
    xhr({url: dataUrl, json: true}, function (err, resp, body) {
        data = body;
        pubsub.emit('city::loadFiche', ctx.params.item, function(_APIresult){
            var tempJson = {}
            tempJson.city = _APIresult
            _.extend(data, tempJson);
            // Cache data
            ctx.state.item = data;
            ctx.save();

            // if state changed while loading cancel
            if (state !== 'loading') return;
            compileTemplate(ctx);
        })
        
    });
}

// 3. Compile a DOM element from the template and data
function compileTemplate(ctx) {
    console.log('fiche compileTemplate', data)
    var html = template(data);
    content = parseHTML(html);
    ready(ctx);
}

// 4. Content is ready to be shown
function ready(ctx) {
    state = 'ready';
    // au cas où refresh //
    pubsub.emit('bookingform::open');
    //
    document.getElementById('main-content').appendChild(content);

    idCity = data.city.id;
    console.log(idCity, data)
    $body = document.querySelector('body')
    var $push = content.querySelector('.type-fiche')
    $btLike = $push.querySelector('.icon-heart')
    $btDislike = $push.querySelector('.icon-heart-broken')
    $btAdd = $push.querySelector('.icon-add')
    $btBooknow = $push.querySelector('.bt-book-now')


    var $tabContents = content.querySelector('.tab-contents')
    //$tabContents = $tabContents.querySelectorAll('.tab-content')
    ficheActivities = new FicheActivities(data, $tabContents)
    ficheFriends = new FicheFriends(data, $tabContents)
    ficheMoreInfos = new FicheMoreInfos(data, $tabContents)

    pubsub.emit('cities::getList', loadSideBar, data['home-list-view']);
    
    addListeners()

    animateIn();
    
    // For resize:
    //     either force a global resize from common.js
    // pubsub.emit('global-resize');

    //     or just keep it local
    // resize(window.innerWidth, window.innerHeight);
}

function loadSideBar(_datas){
    sidebar = new Sidebar(_datas)
}

function addListeners(){
    $body.addEventListener('click', clickTab)
    $btAdd.addEventListener('click', addToPlaylist)
    $btLike.addEventListener('click', likeCity)
    $btDislike.addEventListener('click', dislikeCity)
    $btBooknow.addEventListener('click', booknow)
}

function removeListeners(){
    $body.removeEventListener('click', clickTab)
    $btAdd.removeEventListener('click', addToPlaylist)
    $btLike.removeEventListener('click', likeCity)
    $btDislike.removeEventListener('click', dislikeCity)
    $btBooknow.removeEventListener('click', booknow)
}

function addToPlaylist(e){
    e.preventDefault();
    pubsub.emit('popin::playlist', idCity, data)
}

function likeCity(e){
    e.preventDefault();
    pubsub.emit('event::like', $btLike, $btDislike, idCity)
}

function dislikeCity(e){
    e.preventDefault();
    pubsub.emit('event::dislike', $btLike, $btDislike, idCity)        
}

function booknow(e){
    e.preventDefault();
    pubsub.emit('city::booknow', idCity)
}

function clickTab(e){
    
    if(e.target && MR.utils.hasClass(e.target, "tab")){
        e.preventDefault();
       var $tab = e.target
       ,   tabIndex = $tab.getAttribute('data-index')
       ,   $tabs = MR.utils.findAncestor($tab, 'tabs')
       ,   $tabContents = $tabs.parentNode.querySelector('.tab-contents')
       ,   $tabContent

       // update "active" state
       $tabs = $tabs.querySelectorAll('.tab')
       _.each($tabs, function(el){MR.utils.removeClass(el,'active')})
       MR.utils.addClass($tab,'active')

       if(typeof $tabContents !== 'undefined' && $tabContents !== null){
           $tabContents = $tabContents.querySelectorAll(':scope > .tab-content')
        
            // find relative content
            _.each($tabContents, function(el){
                 MR.utils.removeClass(el,'active')
                 if(el.getAttribute('data-index') == tabIndex) $tabContent = el
             })

            // display relative content
            if(typeof $tabContent !== 'undefined')   MR.utils.addClass($tabContent,'active')
       }  
    }
}

// 5. Final step, animate in page
function animateIn() {
    var $mainHeader = document.getElementById('main-header')
    ,   $sidebarLeft = document.querySelector('.sidebar.left')
    ;

    if(!MR.utils.hasClass($mainHeader, 'active'))
        MR.utils.addClass($mainHeader, 'active');
        // SALE :
        pubsub.emit('prehome-bg-displayed')
    
    TweenLite.to(content, 0.5, {
        autoAlpha: 1, 
        onComplete: function() {
            if(!MR.utils.hasClass($sidebarLeft, 'active'))
                MR.utils.addClass($sidebarLeft, 'active');
            // End of animation
            state = 'on';

        }
    });
}

// Triggered from router.js
exports.exit = function (ctx, next){

    // If user requests to leave before content loaded
    if (state == 'off' || state == 'loading') {
        console.log('left before loaded');
        next();
        return;
    }
    if (state == 'ready') console.log('still animating on quit');

    state = 'leaving';
    removeListeners()
    
    animateOut(next);

    // Let next view start loading
    // next();
};

function animateOut(next) {
    TweenLite.to(content, 0.5, {
        autoAlpha: 0, 
        onComplete: function() {
            content.parentNode.removeChild(content);

            // End of animation
            state = 'off';

            // Let next view start loading
            next();
        }
    });
}

// Listen to global resizes
pubsub.on('resize', resize);
function resize(_width, _height) { 
}

