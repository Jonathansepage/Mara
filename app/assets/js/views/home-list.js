// Use instance template for 'many of a kind' such as list items
// Will be instantiated and destroyed after use
module.exports = instance;

var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var _ = require('underscore');


var template = require('home-list.hbs');

function instance(_APIresult) {
    var _this = this;

    var data = _APIresult, content, items, nbItems, addedCityToPL = {}

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
        items = content.querySelectorAll('.push.type-home')
        nbItems = items.length -1
        document.querySelector('.wrapper-list').appendChild(content);

        _.each(items, function(el, index){
            var $visual =  el.querySelector('.visual')
            ,   imgsrc = data.resultList[index].picture
            ;
            var $localLoader = el.querySelector('.local-loader')
            el.idCity = el.getAttribute('data-id')
            preload({
                id:el.idCity,
                update: true,
                images:{
                    visual: imgsrc
                }
            })
            pubsub.on('preload-'+el.idCity, function(assets) {
                //console.log(assets.images.visual);
            });
            pubsub.on('preload-update-'+el.idCity, function(progress) {
                 //console.log(Math.round(progress * 100), 'percent loaded');
                 if(Math.round(progress * 100) == 100){
                    $visual.style.backgroundImage = "url('"+ imgsrc +"')"
                    TweenLite.to($localLoader, .5, {autoAlpha:0})
                 }
            });
            addListeners(el)
            animateIn(el, index)
        })
                
        // For resize:
        //     either force a global resize from common.js
        // pubsub.emit('global-resize');

        //     or just keep it local
        // resize(window.innerWidth, window.innerHeight);
    }

    function addListeners(el){
        var bt_add = el.querySelector('.icon-add')
        ,   bt_like = el.querySelector('.icon-heart')
        ,   bt_dislike = el.querySelector('.icon-heart-broken')
        ,   bt_booknow = el.querySelector('.bt-book-now')
        ,   idCity = el.idCity;
        ;

        bt_add.idCity = bt_like.idCity = bt_dislike.idCity = bt_booknow.idCity = idCity;
       
        bt_add.addEventListener('click', addToPlaylist)
        bt_like.addEventListener('click', likeCity)
        bt_dislike.addEventListener('click', dislikeCity)
        bt_booknow.addEventListener('click', booknow)
    }

    function removeListeners(el){
        var bt_add = el.querySelector('.icon-add')
        ,   bt_like = el.querySelector('.icon-heart')
        ,   bt_dislike = el.querySelector('.icon-heart-broken')
        ,   bt_booknow = el.querySelector('.bt-book-now')
        ;

        bt_add.removeEventListener('click', addToPlaylist)
        bt_like.removeEventListener('click', likeCity)
        bt_dislike.removeEventListener('click', dislikeCity)
        bt_booknow.removeEventListener('click', booknow)
    }

    function addToPlaylist(e){
        e.preventDefault();
        var idCity = parseInt(this.idCity)
        pubsub.emit('popin::playlist', idCity, data)
    }

    function likeCity(e){
        e.preventDefault();
        var bt_like = this
        ,   bt_dislike = bt_like.parentNode.parentNode.querySelector('.icon-heart-broken')
        ,   idCity = bt_like.idCity
        ;
        pubsub.emit('event::like', bt_like, bt_dislike, idCity)
    }
    
    function dislikeCity(e){
        e.preventDefault();
        var bt_dislike = this
        ,   bt_like = bt_dislike.parentNode.parentNode.querySelector('.icon-heart')
        ,   idCity = bt_dislike.idCity
        ;
        pubsub.emit('event::dislike', bt_like, bt_dislike, idCity)        
    }
    
    function booknow(e){
        e.preventDefault();
        var idCity = this.idCity
        pubsub.emit('city::booknow', idCity)
    }

    // 5. Final step, animate in page
    function animateIn(el, index) {
        TweenLite.to(el, 0, {autoAlpha:0, y:200})
        TweenLite.to(el, .5, {autoAlpha:1, y:0, ease: Cubic.easeout, delay: index*.1})
        if(index == nbItems){
             state = 'on';
        }
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
        
        _.each(items, function(el, index){
            removeListeners(el)
            animateOut(el, index, next)
        })

        // Let next view start loading
        // next();
    };

    function animateOut(el, index, next) {

            TweenLite.to(el, .3, {autoAlpha:0, y:0, overwrite: 'all', delay: index*.1, onComplete:function(){
                if(index == nbItems){
                    content.parentNode.removeChild(content);
                     // End of animation
                     state = 'off';

                     // Let next view start loading
                     if(typeof next !== 'undefined') next();
                }
            }})
            
    }

    // Listen to global resizes
    pubsub.on('resize', resize);
    function resize(_width, _height) { 
        
    }

}

