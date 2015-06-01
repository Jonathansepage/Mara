// Use instance template for 'many of a kind' such as list items
// Will be instantiated and destroyed after use
module.exports = instance;

var xhr = require('xhr');
var gsap = require('gsap');
var parseHTML = require('parseHTML');
var pubsub = require('pubsub');
var preload = require('preload');
var _ = require('underscore');


var template = require('home-map.hbs');

function instance() {
    var _this = this;

    var data = {}
    ,   content
    ,   items
    ,   nbItems
    ,   addedCityToPL = {}
    ,   map
    ,   markerLayer
    ,   currentMarkers = []
    ,   prevMarkers = []
    ,   bt_add
    ,   bt_like
    ,   bt_dislike
    ,   bt_booknow
    ,   idCity

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
        document.querySelector('.wrapper-map').appendChild(content);
        // init
        L.mapbox.accessToken = 'pk.eyJ1IjoidWx0cmEtamV5IiwiYSI6InhoS2hzZkkifQ.80V4Jy03lxEoFUl9x-tmwQ';
        map = L.mapbox.map('map', 'mapbox.streets')
        
        map.on('popupopen', function(e){
            console.log('popup opened')

            // centering the map
            var px = map.project(e.popup._latlng) ; // find the pixel location on the map where the popup anchor is
            px.x += 150
            px.y -= e.popup._container.clientHeight/2 + 150// find the height of the popup container, divide by 2, subtract from the Y axis of marker location
            map.panTo(map.unproject(px),{animate: true}); // pan to new center
            
            addListeners()
        })

        map.on('popupclose', function(e){
            console.log('popup closed')
             removeListeners()
        })
    }

    _this.addMarkers = function(_data, _sorting){
        data = _data;
        removeMarkers()
        markerLayer = L.featureGroup().addTo(map);

        
        _.each(_data.resultList, function(el){
            // var marker = {}
            // marker.latlng = [el.pos.lat, el.pos.lon]
            var txt, html;
            html = '<div class="marker-content '+_sorting +'"">'
            if(_sorting == 'bestdeals'){
                txt = '<div class="from">from</div>';
                txt += '<div class="price">'
                txt += el.price + " &euro;";
                txt += '</div>'
            } else if(_sorting == 'popular'){
                txt ='<div class="score icon-heart2">'
                txt += el.like_count
                txt +='</div>';
            } else if(_sorting == 'relevant'){
                txt = el.relevance_score
            }
            
            html += txt
            html +='</div>'
            var infoWindowContent = '<div class="infowindow">'
                    infoWindowContent +='<ul class="pictos-list">'
                        infoWindowContent +='<li><span class="icon-add" data-id="'+el.id+'"></span></li>'
                        infoWindowContent +='<li><span class="icon-heart" data-id="'+el.id+'"></span></li>'
                        infoWindowContent +='<li><span class="icon-heart-broken" data-id="'+el.id+'"></span></li>'
                    infoWindowContent +='</ul>'
                    infoWindowContent +='<div class="infos">'
                        infoWindowContent +='<a href="fiche/'
                        infoWindowContent += el.id
                        infoWindowContent += '">'
                            infoWindowContent +='<div class="city">'
                            infoWindowContent += el.name
                            infoWindowContent +=',</div>'
                            infoWindowContent +='<div class="country">'
                            infoWindowContent += el.country
                            infoWindowContent +='</div>'
                        infoWindowContent +='</a>'
                        infoWindowContent +='<div class="grip">'
                        infoWindowContent += el.subtitle
                        infoWindowContent +='</div>'
                        infoWindowContent +='<div class="likes icon-heart2">'
                        infoWindowContent += el.like_count
                        infoWindowContent +='</div>'
                        
                        infoWindowContent +='<div class="matches-wrapper">'
                            infoWindowContent +='<div class="match personnal">'
                                infoWindowContent +='<div class="title-match icon-people">'
                                infoWindowContent += _data['perso-title']
                                infoWindowContent +='</div>'
                                infoWindowContent +='<div class="bar">'
                                    infoWindowContent +='<div class="score gradient" style="width:'
                                    infoWindowContent += el.interest_matching
                                    infoWindowContent += '%;"></div>'
                                infoWindowContent +='</div>'
                            infoWindowContent +='</div>'
                            infoWindowContent +='<div class="match social">'
                                infoWindowContent +='<div class="title-match icon-people2">'
                                infoWindowContent += _data['social-title']
                                infoWindowContent +='</div>'
                                infoWindowContent +='<div class="bar">'
                                    infoWindowContent +='<div class="score gradient-red" style="width:'
                                    infoWindowContent += el.social_matching
                                    infoWindowContent += '%;"></div>'
                                infoWindowContent +='</div>'
                            infoWindowContent +='</div>'
                        infoWindowContent +='</div>'

                    infoWindowContent +='</div>'
                    infoWindowContent +='<div class="booking-infos">'
                        infoWindowContent +='<div class="price-wrapper">'
                            infoWindowContent +='<div class="price">'
                                infoWindowContent +='<div class="from">'
                                infoWindowContent += _data.from
                                infoWindowContent +='</div>'
                                infoWindowContent += el.price + '&euro;'
                            infoWindowContent +='</div>'
                        infoWindowContent +='</div>'
                        infoWindowContent +='<a href="" class="bt-book-now"><span class="icon-plane">'
                        infoWindowContent +=_data['book-now']
                        infoWindowContent +='</span></a>'
        
                    infoWindowContent +='</div>'

                infoWindowContent +='</div>'
            var mapMarker = L.marker([el.pos.lat, el.pos.lon], {
                icon: L.divIcon({
                    // specify a class name that we can refer to in styles, as we
                    // do above.
                    className: 'marker',
                    // html here defines what goes in the div created for each marker
                    html: html,
                    // and the marker width and height
                    iconSize: [65, 82],
                    iconAnchor: [16, 82],
                    //popupAnchor: [145, -38],
                    popupAnchor: [159, -24],
                }),
                riseOnHover: true,
                name: el.name
            })
                .bindPopup(infoWindowContent)
                .addTo(markerLayer)

            TweenLite.to(mapMarker, 0,{y:-200})
            TweenLite.to(mapMarker, 10,{y:0, delay:5})



            currentMarkers.push(mapMarker)
          
        })
        markerLayer.on('click', function(e) {
            //map.panTo(e.layer.getLatLng());
            //map.panTo(e.layer.getLatLng());
            e.layer.openPopup();
        });
        map.fitBounds(markerLayer.getBounds());
        /*markerLayer.eachLayer(function(layer) {
            var p = layer.feature;
        })*/
       /* setTimeout(function(){
            var z = Math.round(map.getZoom());
            map.setZoom(z-1);

        }, 500)*/
                

    }


    function removeMarkers(){
        if(typeof markerLayer!=='undefined'){
            removeListeners()
            markerLayer.off('click');
            markerLayer.clearLayers();
            map.removeLayer(markerLayer)
        } 
    }

    function addListeners(){
        bt_add = content.querySelector('.icon-add')
        bt_like = content.querySelector('.icon-heart')
        bt_dislike = content.querySelector('.icon-heart-broken')
        bt_booknow = content.querySelector('.bt-book-now')
        idCity = bt_add.getAttribute('data-id');
        ;
       
        bt_add.addEventListener('click', addToPlaylist)
        bt_like.addEventListener('click', likeCity)
        bt_dislike.addEventListener('click', dislikeCity)
        bt_booknow.addEventListener('click', booknow)
    }

    function removeListeners(){
        if(typeof bt_add == null || typeof bt_add == 'undefined') return;
        bt_add.removeEventListener('click', addToPlaylist)
        bt_like.removeEventListener('click', likeCity)
        bt_dislike.removeEventListener('click', dislikeCity)
        bt_booknow.removeEventListener('click', booknow)
    }

    function addToPlaylist(e){
        e.preventDefault();
        pubsub.emit('popin::playlist', idCity, data)
    }

    function likeCity(e){
        e.preventDefault();
        pubsub.emit('event::like', bt_like, bt_dislike, idCity)
    }
    function dislikeCity(e){
        e.preventDefault();
        pubsub.emit('event::dislike', bt_like, bt_dislike, idCity)
    }
    
    function booknow(e){
        e.preventDefault();
        pubsub.emit('city::booknow', idCity)
    }

    // 5. Final step, animate in page
    function animateIn(el, index) {
      /*  TweenLite.to(el, 0, {autoAlpha:0, y:200})
        TweenLite.to(el, .5, {autoAlpha:1, y:0, ease: Cubic.easeout, delay: index*.1})
        if(index == nbItems){
             state = 'on';
        }*/
    }

    // Triggered from router.js
    _this.exit = function (next){
        console.log('map exit')
        // If user requests to leave before content loaded
        if (state == 'off' || state == 'loading') {
            console.log('left before loaded');
            next();
            return;
        }
        if (state == 'ready') console.log('still animating on quit');

        state = 'leaving';
        removeMarkers()
        

        // Let next view start loading
        //next();
    };

    _this.destroy = function(){
        map.remove()
        animateOut()
        //map = null;
       /* var $map = document.getElementById('map')
        $map.parentNode.remove($map)*/
    }

    function animateOut() {

            TweenLite.to(content, .3, {autoAlpha:0, overwrite: 'all', onComplete:function(){
               
                    content.parentNode.removeChild(content);
                     // End of animation
                     state = 'off';
                }
            })
            
    }

    // Listen to global resizes
    pubsub.on('resize', resize);
    function resize(_width, _height) { 
        
    }

}

