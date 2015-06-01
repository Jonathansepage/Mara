// Use instance template for 'many of a kind' such as list items
// Will be instantiated and destroyed after use
module.exports = instance;

var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var _ = require('underscore');


var template = require('sidebar-right.hbs');

function instance(_APIresult) {
    var _this = this;

    var data = _APIresult
    ,   content
    // for resize
    ,   $bookingFormWrapper = document.querySelector('.booking-form-wrapper')
    ,   $vWrapper
    ,   $btList
    ,   $btUp
    ,   $btDown
    ,   btDownH
    ,   $vList
    ,   vListH
    ,   minY
    ,   vListY = 0
    ,   indexV = 0
    ,   $v

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
        $vWrapper = content.querySelector('.v-wrapper')
        $btList = content.querySelector('.icon-list')
        $btUp = content.querySelector('.up')
        $btDown = content.querySelector('.down')
        $vList = $vWrapper.querySelector('.v-list')
        $v = $vList.querySelectorAll('.push')

        
        document.getElementById('fiche').appendChild(content);

        btDownH = parseInt($btDown.offsetHeight)
        vListH = parseInt($vList.offsetHeight)
        resize()
        setTimeout(animateIn, 500)
    }

    

    function addListeners(){
        $btUp.addEventListener('click', slidedown)
        $btDown.addEventListener('click', slideup)
    }

    function removeListeners(){
       $btUp.removeEventListener('click', slidedown)
       $btDown.removeEventListener('click', slideup)
    }


    // 5. Final step, animate in page
    function animateIn() {
        MR.utils.addClass(content, 'active')
        state = 'on';
        addListeners()
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
        removeListeners()
        animateOut();

    };

  

    function animateOut() {
         MR.utils.removeClass(content, 'active')
         state = 'off';
    }

    // Listen to global resizes
    pubsub.on('resize', resize);
    function resize(_width, _height) {
        if($bookingFormWrapper == null) return;
        var $bookingFormY = $bookingFormWrapper.offsetTop
        ,   $bookingFormH = $bookingFormWrapper.offsetHeight
        ,   winH = _height || window.innerHeight
        ,   y = $bookingFormY + $bookingFormH
        ,   h = winH - y
        ;
        var vWrapperH = h - btDownH*3;
        minY = vWrapperH - vListH;
        content.style.top = y+'px';
        content.style.height = h+'px';
        $vWrapper.style.height = vWrapperH + 'px';

        vListY = indexV = 0;
        $vList.style.top = vListY + 'px';

    }

    function slideup(){
        if(vListY > minY){
            vListY -= $v[indexV].offsetHeight;
            if(vListY <= minY) vListY = minY
            $vList.style.top = vListY + 'px';
            indexV++;
        }
    }

    function slidedown(){
        if(vListY < 0){
            vListY += $v[indexV].offsetHeight;
            if(vListY >= 0) vListY = 0
            $vList.style.top = vListY + 'px';
            indexV--;
        }
    }

}

