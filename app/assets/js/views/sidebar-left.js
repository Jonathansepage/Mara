
var pubsub = require('pubsub');
var routeur = require('router');
var search = require('search');


module.exports = function(){
    var $sidebar = document.querySelector('.sidebar')
    ,   $userNav = $sidebar.querySelector('.user-nav')
    ,   $btHome = $userNav.querySelector('.icon-boussole')
    ,   $btList = $userNav.querySelector('.icon-favlist')
    ,   $entryHome = $btHome.parentNode
    ,   $entryList = $btList.parentNode
    ;

    // nav listeners
    $btHome.addEventListener('click', clickBt)
    $btList.addEventListener('click', clickBt)
    
    //init search module
    search();

    function clickBt(e){
        e.preventDefault();
        e.stopPropagation();
        var $bt = this
        ,   url = $bt.getAttribute('href')
        ;
        console.log(url)
        MR.utils.removeClass($entryHome, 'active')
        MR.utils.removeClass($entryList, 'active')
        MR.utils.addClass($bt.parentNode, 'active')
        routeur.page(url)
    }
} 
