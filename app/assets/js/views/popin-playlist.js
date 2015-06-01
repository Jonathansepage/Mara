// Use instance template for 'many of a kind' such as list items
// Will be instantiated and destroyed after use
module.exports = instance;

var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var _ = require('underscore');


var template = require('popin-playlist.hbs');

function instance(_APIresult) {

    var _this = this;
    var data = _APIresult
    ,   content
    ,   btClose
    ,   btCreate
    ,   listWrapper
    ,   items
    ,   searchInput
    ,   createInput
    ,   idCity = data.addedCity.id

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
        /*items = content.querySelectorAll('.push.type-home')
        nbItems = items.length -1*/
        TweenLite.to(content, 0, {autoAlpha: 0});
        document.getElementById('main-content').appendChild(content);

        btClose = content.querySelector('.bt-close')
        btCreate = content.querySelector('.bt-new-pl')
        createInput = btCreate.querySelector('input')
        listWrapper = content.querySelector('.list-wrapper')
        items = listWrapper.querySelectorAll('.item-playlist')
        searchInput = content.querySelector('input')

        addListeners();
        animateIn()
        
        // For resize:
        //     either force a global resize from common.js
        // pubsub.emit('global-resize');

        //     or just keep it local
        pubsub.emit('body::noscroll')
        resize(window.innerWidth, window.innerHeight);
    }

    function addListeners(){
        _.each(items, function(el){
            el.addEventListener('click', chooseTravelList)
        })

        btClose.addEventListener('click', animateOut)

        searchInput.addEventListener('keyup', filterList, false)

        btCreate.addEventListener('click', openCreateField)
        createInput.onblur = function(){closeCreateField()}
    }

    function removeListeners(){
        _.each(items, function(el){
            el.removeEventListener('click', chooseTravelList)
        })

        btClose.removeEventListener('click', animateOut)

        searchInput.removeEventListener('keyup', filterList, false)
    }

    function openCreateField(){
        createInput.value="";
        MR.utils.addClass(btCreate, 'opened');
        createInput.focus()
        createInput.addEventListener('keyup', createNewList, false)
    }

     function closeCreateField(){
        MR.utils.removeClass(btCreate, 'opened');
        createInput.value="+";
        createInput.removeEventListener('keyup', createNewList)
    }

    function createNewList(e){
        if(e.keyCode == 13){ // ENTER pressed
            pubsub.emit('playlist::create', createInput.value, addNewList)
            createInput.blur()
        }
    }

    function addNewList(_datas){
        var div = document.createElement('div');
        div.setAttribute('data-id',_datas.id);
        MR.utils.addClass(div, 'item-playlist')
        var html = '<div class="visual" style="background-image: url(\''
            html += _datas.picture
            html += '\');"></div>'
            html += _datas.title
            html += '<div class="bt-add">+</div>'
        
        div.innerHTML = html;
        listWrapper.insertBefore(div, items[0])
        //
        removeListeners()
        items = listWrapper.querySelectorAll('.item-playlist')
        addListeners();
    }

    function chooseTravelList(){
        var chosenList = this
        ;
        if(MR.utils.hasClass(chosenList, 'selected')){
            var idList = chosenList.getAttribute('data-id');
            pubsub.emit('playlist::addCity', idCity, idList, _this.exit)
            MR.utils.removeClass(chosenList, 'selected')
        } else {
            _.each(items, function(el){
                MR.utils.removeClass(el, 'selected');
            })
            MR.utils.addClass(chosenList, 'selected')
        }
       
    }

    function filterList(e){
        var inputValue = searchInput.value.toLowerCase()
        _.each(items, function(el, i){
            el.style.display = 'block';
            var title = data.PL[i].title.toLowerCase()
            if(title.substr(0, inputValue.length) != inputValue){
                el.style.display = 'none';
            }
        })        
    }

    

    // 5. Final step, animate in page
    function animateIn() {
        TweenLite.to(content, .5, {autoAlpha:1,})
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
        
       removeListeners()
       animateOut(next);

        // Let next view start loading
        // next();
    };

    function animateOut(next) {
            pubsub.emit('body::scroll')
            TweenLite.to(content, .3, {autoAlpha:0, overwrite: 'all', onComplete:function(){
                    content.parentNode.removeChild(content);
                     // End of animation
                     state = 'off';

                     // Let next view start loading
                     //if(typeof next !== 'undefined') next();
                
            }})
            
    }

    // Listen to global resizes
    pubsub.on('resize', resize);

    function resize(_width, _height) { 
        var listH = btCreate.offsetTop - listWrapper.offsetTop -10// -10 for margin
        if(listH < 0) listH = 0;
        listWrapper.style.height = listH+'px';
    }

}

