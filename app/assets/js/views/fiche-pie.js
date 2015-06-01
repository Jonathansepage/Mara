// Use instance template for 'many of a kind' such as list items
// Will be instantiated and destroyed after use
module.exports = instance;

var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var _ = require('underscore');


var template = require('fiche-pie.hbs');

function instance(_data, _index) {
    var _this = this;
    var data = _data, content
    // Current state of module
    // Can also be 'loading', 'ready', 'on' and 'leaving'
    // 'off' = the module is inactive
    // 'loading' = the data is loading, nothing is shown
    // 'ready' = the content is ready, but still animating or preloading files
    // 'on' = all animated and preloaded
    // 'leaving' = exit has been called, animating out
    var state = 'off';
    var score = _data.categoryScore
    ,   $score
    ,   $center
    ,   $border
    ,   precent = 0
    ,   posClass = 'pos'+_index
    ,   introClass
    ,   α = 0
    ,   π = Math.PI
    ,   t = 30;

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
        $score = content.querySelector('.pie-score')
        $center = content.querySelector('.center')
        $border = content.querySelector('.border')
        //MR.utils.addClass(content, posClass)
        content.percent = 0;
        
        switch(posClass){
            case 'pos1': introClass='pos0'; break;
            case 'pos3': introClass='pos4'; break;
            case 'pos2': introClass= posClass; break;
        }
        if(introClass != posClass){
            //MR.utils.removeClass(content, posClass)
            MR.utils.addClass(content, introClass)
        } else {
            //MR.utils.addClass(content, posClass)
            //TweenLite.to(content, 0, {autoAlpha:0, scale: 0});
        }
        
        
        document.querySelector('.pies-comparator').appendChild(content);
        document.querySelector('.pies-comparator').insertBefore(content, document.querySelector('.pies-nav'))

        animateIn()
                
        // For resize:
        //     either force a global resize from common.js
        // pubsub.emit('global-resize');

        //     or just keep it local
        // resize(window.innerWidth, window.innerHeight);
    }

    function draw(tween) {
        percent = tween.target.percent

        α = percent/100 * 360
        var r = ( α * π / 180 )
            , x = Math.sin( r ) * 103
            , y = Math.cos( r ) * - 103
            , mid = ( α > 180 ) ? 1 : 0
            , anim = 'M 0 0 v -103 A 103 103 1 ' 
                    + mid + ' 1 ' 
                    +  x  + ' ' 
                    +  y  + ' z';

        $border.setAttribute( 'd', anim );
        if(percent == 0){
            $score.innerHTML ='';
        } else {
            $score.innerHTML = Math.round(percent) + '%';
        }

    }

    _this.open = function(){
        TweenLite.to(content, 2,{percent:score, delay: 1, ease: Power4.easeInOut, onUpdate:draw, onUpdateParams:["{self}"]})
    }

    _this.close = function(){
        TweenLite.to(content, .5,{percent:0, ease: Power4.easeInOut, onUpdate:draw, onUpdateParams:["{self}"]})
    }




    // 5. Final step, animate in page
    function animateIn() {
        switch(posClass){
            case 'pos1': 
            case 'pos3':MR.utils.addClass(content, posClass); MR.utils.removeClass(content, introClass);  break;
            case 'pos2': MR.utils.addClass(content, posClass); setTimeout(function(){_this.open()}, 500);break;/*TweenLite.to(content, .5, {autoAlpha:1, clearProps: 'all', onComplete:function(){_this.open()}}); break;*/
        }
        
        state = 'on';
        
    }

    _this.DOMelt = function(){
        return content;
    }

    // Triggered from router.js
    _this.exit = function (next){

        // If user requests to leave before content loaded
        if (state == 'off' || state == 'loading') {
            console.log('left before loaded', state);
            next();
            return;
        }
        if (state == 'ready') console.log('still animating on quit');

        state = 'leaving';
        
        animateOut( next)
        
        // Let next view start loading
        // next();
    };

    function animateOut(next) {
            setTimeout(function(){
                content.parentNode.removeChild(content);
                 // End of animation
                 state = 'off';

                 // Let next view start loading
                 if(typeof next !== 'undefined') next();
            }, 800)           
    }

    // Listen to global resizes
    pubsub.on('resize', resize);
    function resize(_width, _height) { 
        
    }

}

