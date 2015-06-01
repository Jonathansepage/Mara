var pubsub = require('pubsub');
var _ = require('underscore');
var pie = require('fiche-pie');

module.exports = function (_data) {
    var _this = this;
    var data = _data
    ,   $piesComparator = document.querySelector('.pies-comparator')
    ,   $nav = $piesComparator.querySelector('.pies-nav')
    ,   $btPrev = $nav.querySelector('.left')
    ,   $btNext = $nav.querySelector('.right')
    ,   $btPrevWording = $btPrev.querySelector('.city')
    ,   $btNextWording = $btNext.querySelector('.city')
    ;
    var idCity = data.city.id
    ,   indexCurCity
    ,   dataCurCity
    ,   dataPrevCity
    ,   dataNextCity
    ,   _curCity
    ,   _prevCity
    ,   _nextCity
    ;
    // temp
    var dataComparator = {}
    init()

    function init(){
        dataComparator.cities = []
        for(var i =0; i<=7; i++){
            var city = {}
            city.name = data.city.name + ' ' + i;
            city.id = i
            city.category = 0
            city.categoryName = data.city.categories[0].name
            city.categoryScore = data.city.categories[0].score
            city.ranking = data.fiche.activities.ranking
            dataComparator.cities.push(city)
            if(city.id == idCity){
                indexCurCity = i;
            } else {
                city.categoryScore = Math.round(Math.random()*100)
            }
        }
        //
        updateDatas()

        _curCity = new pie(dataCurCity, 2)
        if(indexCurCity > 0){
            _prevCity = new pie(dataPrevCity, 1)
            $btPrevWording.innerHTML = dataPrevCity.name;
        } 
        if(indexCurCity < dataComparator.cities.length -1){
            _nextCity = new pie(dataNextCity, 3)
            $btNextWording.innerHTML = dataNextCity.name;
        } 

        checkBts()
    }
   

    function updateDatas(){
        dataCurCity = dataComparator.cities[indexCurCity]
        dataPrevCity = dataComparator.cities[indexCurCity-1]
        dataNextCity = dataComparator.cities[indexCurCity+1]
    }

    function checkBts(){
        if(typeof dataPrevCity !== 'undefined') $btPrevWording.innerHTML = dataPrevCity.name;
        if(typeof dataNextCity !== 'undefined') $btNextWording.innerHTML = dataNextCity.name;
        if(indexCurCity <= 0){
            TweenMax.to($btPrev, .2,{autoAlpha:0})
        } else if(indexCurCity >= dataComparator.cities.length -1){
            TweenMax.to($btNext, .2,{autoAlpha:0})
        } else {
            TweenMax.to($btPrev, .2,{autoAlpha:1})
            TweenMax.to($btNext, .2,{autoAlpha:1})
        }
    }

    $btPrev.addEventListener('click', prevCity)
    $btNext.addEventListener('click', nextCity)

    function prevCity(){
        TweenMax.to($btPrev, .1,{autoAlpha:0})
        _curCity.close()
        indexCurCity --;

        if(indexCurCity < 0){
            indexCurCity = 0;
            return;
        } 

        if(typeof _nextCity !== 'undefined'){
            MR.utils.removeClass(_nextCity.DOMelt(), 'pos3')
            MR.utils.addClass(_nextCity.DOMelt(), 'pos4')
            _nextCity.exit()
        }

        MR.utils.removeClass(_prevCity.DOMelt(), 'pos1')
        MR.utils.addClass(_prevCity.DOMelt(), 'pos2')
        MR.utils.removeClass(_curCity.DOMelt(), 'pos2')
        MR.utils.addClass(_curCity.DOMelt(), 'pos3')

        updateDatas()
        _nextCity = _curCity
        _curCity = _prevCity
        _prevCity = (typeof dataPrevCity !== 'undefined')? new pie(dataPrevCity, 1) : undefined
        _curCity.open()

        setTimeout(checkBts, 800)
    }

    function nextCity(){
        TweenMax.to($btNext, .1,{autoAlpha:0})
        _curCity.close()
        indexCurCity ++;

        if(indexCurCity >= dataComparator.cities.length){
            indexCurCity ==dataComparator.cities.length;
            return;
        } 

        if(typeof _prevCity !== 'undefined'){
            MR.utils.removeClass(_prevCity.DOMelt(), 'pos1')
            MR.utils.addClass(_prevCity.DOMelt(), 'pos0')
            _prevCity.exit()
        }
        MR.utils.removeClass(_curCity.DOMelt(), 'pos2')
        MR.utils.addClass(_curCity.DOMelt(), 'pos1')
        MR.utils.removeClass(_nextCity.DOMelt(), 'pos3')
        MR.utils.addClass(_nextCity.DOMelt(), 'pos2')

        updateDatas()
        _prevCity = _curCity
        _curCity = _nextCity
        _nextCity = (typeof dataNextCity !== 'undefined') ? new pie(dataNextCity, 3) : undefined
        _curCity.open()
        setTimeout(checkBts, 800)
    }

    // REINIT FROM ANOTHER SELECTED FILTER
    pubsub.on('fiche:filter::change', function(value){
        console.log('UPDATE PIES WITH ID', value)
        updateComparator()
    });

    function updateComparator(){
        var duration = 1
        var $pies = $piesComparator.querySelectorAll('.pie-wrapper')
        _.each($pies, function(pie){
            TweenMax.to(pie, duration, {scale:0, autoAlpha:0, ease:Back.easeIn, onComplete:function(e){
                $piesComparator.removeChild(this.target);
            }})
        })
        setTimeout(init, duration*1000 + 1000);
    }

}