// Use static template for 'one of a kind' pages like home
// Is never destroted


var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var sfx = require('sfx');

var template = require('prehome.hbs');
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

var grip, txt1, txt2, txt3, login

// 1. triggered from router.js
exports.enter = function (ctx){
    if (content) {
        ready(ctx);
        return;
    }
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

        // Cache data
        ctx.state.item = data;
        ctx.save();

        // if state changed while loading cancel
        if (state !== 'loading') return;
        compileTemplate(ctx);
    });
}

// 3. Compile a DOM element from the template and data
function compileTemplate(ctx) {
    var html = template(data);
    content = parseHTML(html);
    ready(ctx);
}

// 4. Content is ready to be shown
function ready(ctx) {
    state = 'ready';

    document.getElementById('main-content').appendChild(content);
    facebookConnection()
    animateIn();
    
    // For resize:
    //     either force a global resize from common.js
    // pubsub.emit('global-resize');

    //     or just keep it local
    // resize(window.innerWidth, window.innerHeight);
}

function facebookConnection(){
    var FBlogin = document.querySelector('.fb-login')
    FBlogin.addEventListener('click', function(e){
        e.preventDefault()
        pubsub.emit('facebook::connect')
    })
}

// 5. Final step, animate in page
function animateIn() {
    var $mainHeader = document.getElementById('main-header')
    ,   $sidebarLeft = document.querySelector('.sidebar.left')
    ;
    if(MR.utils.hasClass($mainHeader, 'active'))
        MR.utils.removeClass($mainHeader, 'active');
    if(MR.utils.hasClass($sidebarLeft, 'active'))
        MR.utils.removeClass($sidebarLeft, 'active');
    pubsub.emit('bookingform::close')
    
    grip = document.querySelector('.grip')
    var pTags = grip.getElementsByTagName('p')
    txt1 = pTags[0]
    txt2 = pTags[1]
    txt3 = pTags[2]
    login = document.querySelector('.login')
    var offsetY = 10;
    TweenLite.to(content, 0, {autoAlpha: 0});
    TweenLite.to(txt1, 0, {autoAlpha: 0, y: offsetY});
    TweenLite.to(txt2, 0, {autoAlpha: 0, y: offsetY});
    TweenLite.to(txt3, 0, {autoAlpha: 0, y: offsetY});
    TweenLite.to(login, 0, {autoAlpha: 0/*, y: offsetY*/});

    TweenLite.to(content, 2, {
        autoAlpha: 1, 
        onComplete: function() {
            pubsub.emit('prehome-bg-displayed')
            TweenLite.to(txt1, .5, {autoAlpha: 1, y: 0, delay: 1});
            TweenLite.to(txt2, .5, {autoAlpha: 1, y: 0, delay: 1.2});
            TweenLite.to(txt3, .5, {autoAlpha: 1, y: 0, delay: 1.4});
            TweenLite.to(login, .8, {autoAlpha: 1, y: 0, delay: 2});

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
    
    animateOut(next);

    // Let next view start loading
    // next();
};

function animateOut(next) {
    TweenLite.to(txt1, .3, {autoAlpha: 0, y: -15, delay: 0});
    TweenLite.to(txt2, .3, {autoAlpha: 0, y: -15, delay: .2});
    TweenLite.to(txt3, .3, {autoAlpha: 0, y: -15, delay: .3});
    TweenLite.to(login, .5, {autoAlpha: 0, y: -15, delay: .4});
    TweenLite.to(content, 0.5, {
        autoAlpha: 0,
        delay: .5, 
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



