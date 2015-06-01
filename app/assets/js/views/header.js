// Use static template for 'one of a kind' pages like home
// Is never destroted


var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var sfx = require('sfx');

var template = require('header.hbs');
var dataUrl = 'assets/data/static.json';

// Current state of module
// Can also be 'loading', 'ready', 'on' and 'leaving'
// 'off' = the module is inactive
// 'loading' = the data is loading, nothing is shown
// 'ready' = the content is ready, but still animating or preloading files
// 'on' = all animated and preloaded
// 'leaving' = exit has been called, animating out
var state = 'off';

var data, content;

var $nbLikes, $nbDislikes

// 1. triggered from router.js
exports.enter = function (){
   
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
    //TweenLite.to(content, 0, {autoAlpha: 0});

    document.body.insertBefore(content, document.getElementById('main-content'))

    pubsub.on('prehome-bg-displayed', animateIn)
    pubsub.on('userData-recieved', setupUserInfos, data)
    pubsub.on('updateHeaderCounters', updateHeaderCounters, data)

}

// 5. Final step, animate in page
function animateIn() {

    state = 'on';
}

//
function setupUserInfos(data){
    var $userWrapper = content.querySelector('.user-wrapper')
    ,   $userPicture = $userWrapper.querySelector('.user-picture')
    ,   $userName = $userWrapper.querySelector('.user-name')
    ,   $btInspire = $userWrapper.querySelector('.icon-sync')
    ;
    $nbLikes = $userWrapper.querySelector('.nb-likes')
    $nbDislikes = $userWrapper.querySelector('.nb-dislikes')
    
    MR.userID = data.id;
    $userWrapper.setAttribute("data-id", data.id) // maybe not necessary
    $userName.innerHTML += (' ' + data.name);
    $nbLikes.innerHTML = data.liked;
    $nbDislikes.innerHTML = data.disliked;
    $userPicture.style.backgroundImage = data.avatar;

    pubsub.emit('user-logged');
}

function updateHeaderCounters(data){
    $nbLikes.innerHTML = data.liked;
    $nbDislikes.innerHTML = data.disliked;
}

// Listen to global resizes
pubsub.on('resize', resize);
function resize(_width, _height) { 
}



