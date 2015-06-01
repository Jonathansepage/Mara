// Use static template for 'one of a kind' pages like home
// Is never destroted


var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var sfx = require('sfx');

var template = require('booking-form.hbs');
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

var _this = this;

// 1. triggered from router.js
exports.enter = function (){
   if(content) return;
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
    document.getElementById('main-content').insertBefore(content, document.getElementById('home'))
    animateIn();
    
    // For resize:
    //     either force a global resize from common.js
    // pubsub.emit('global-resize');

    //     or just keep it local
    // resize(window.innerWidth, window.innerHeight);
}

// 5. Final step, animate in page
function animateIn() {
    MR.utils.addClass(content,'active')
    state = 'on';
}

_this.exit = function(){
    state = 'leaving';
    animateOut()
}

function animateOut() {
    if(content){
        MR.utils.removeClass(content,'active')
        state = 'off';
    } 
}


// Listen to global resizes
pubsub.on('resize', resize);
function resize(_width, _height) { 
}



