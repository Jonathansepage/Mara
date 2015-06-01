var xhr = require('xhr');
var _ = require('underscore');

var pubsub = require('pubsub');
var routeur = require('router');

//views
var header = require('header');
var sidebarLeft = require('sidebar-left');
var home = require('home');
var bookingform = require('booking-form')
var ListDisplayer = require('list-displayer')
var popin_playlist = require('popin-playlist')

var $body = document.querySelector('body')
,	listDisplayer

// Only native resize listener on site
window.addEventListener('resize', resize, false);

// Can be forced from any
pubsub.on('global-resize', resize);

// Global resize
function resize() {
    pubsub.emit('resize', window.innerWidth, window.innerHeight);
}


sidebarLeft()



pubsub.on('body::noscroll', function(){
	MR.utils.addClass($body, 'noscroll')
})
pubsub.on('body::scroll', function(){
	MR.utils.removeClass($body, 'noscroll')
})

// FACEBOOK LOGIN
pubsub.on('facebook::connect', function(){
	console.log('facebook::connect')
	var _url = 'assets/data/user.json';

	xhr({url: _url, json: true}, function (err, resp, body) {
		//when user infos are collected
	    pubsub.emit('facebook::ok', body)
	});
	
	
});

pubsub.on('facebook::ok', function(data){
	console.log('facebook::ok')
	pubsub.emit('userData-recieved', data) // to header.js
})


// COMMON VIEWS
header.enter()


// HOME VIEWS
pubsub.on('user-logged', function(){ // from header.js
	routeur.page('/home')
});

// BOOKING FORM
pubsub.on('bookingform::open', function(){
 	bookingform.enter();
})
pubsub.on('bookingform::close', function(){
 	bookingform.exit();
})

// LIST DISPLAYER ON HOMEPAGE
pubsub.on('load-list-displayer', function(){
	listDisplayer = new ListDisplayer();
 	listDisplayer.enter();
})
pubsub.on('close-list-displayer', function(){
	listDisplayer.exit();
})


/////////////////////////////////////
// GESTION DES CLICKS LISTE VILLES //
/////////////////////////////////////

pubsub.on('event::like', function(_btLike, _btDislike, _idCity){
	if(MR.utils.hasClass(_btLike, 'active')){
	    MR.utils.removeClass(_btLike, 'active')
	    pubsub.emit('city::unlike', _idCity)
	} else {
	    MR.utils.addClass(_btLike, 'active')
	    MR.utils.removeClass(_btDislike, 'active')
	    pubsub.emit('city::like', _idCity)
	}  
})

pubsub.on('event::dislike', function(_btLike, _btDislike, _idCity){
	if(MR.utils.hasClass(_btDislike, 'active')){
        MR.utils.removeClass(_btDislike, 'active')
        pubsub.emit('city::unreject', _idCity)
    } else {
        MR.utils.addClass(_btDislike, 'active')
        MR.utils.removeClass(_btLike, 'active')
        pubsub.emit('city::reject', _idCity)
    } 
})

pubsub.on('cities::getList', function(_callback, _staticDatas){
	MR.apiRequest.getCitiesList(function(_dataAPI){
		if(typeof _staticDatas !=='undefined') _.extend(_dataAPI, _staticDatas);
		_callback(_dataAPI)
	})
})



// events related to city LIKE/UNLIKE/REJECT/UNREJECT..
pubsub.on('city::like', function(_idCity){
	MR.apiRequest.likeCity(_idCity, function(){console.log('city id '+_idCity+' liked by user ID ' + MR.userID)})
})
pubsub.on('city::unlike', function(_idCity){
	MR.apiRequest.unlikeCity(_idCity, function(){console.log('city id '+_idCity+' unliked by user ID ' + MR.userID)})
})
pubsub.on('city::reject', function(_idCity){
	MR.apiRequest.rejectCity(_idCity, function(){console.log('city id '+_idCity+' rejected by user ID ' + MR.userID)})
})
pubsub.on('city::unreject', function(_idCity){
	MR.apiRequest.unrejectCity(_idCity, function(){console.log('city id '+_idCity+' unrejected by user ID ' + MR.userID)})
})

pubsub.on('city::loadFiche', function(_idCity, _callback){
	MR.apiRequest.showCity(_idCity, function(_data){
		_callback(_data)
	})
})
pubsub.on('city::booknow', function(_idCity){
	console.log('booknow', _idCity)
})

// playlist

pubsub.on('playlist::getList', function(_callback){
	MR.apiRequest.list_playlists(_callback)
})
pubsub.on('playlist::getCities', function(_idPlaylist, _callback){
	MR.apiRequest.show_playlist(_idPlaylist, _callback)
})
pubsub.on('playlist::create', function(_title, _callback){
	MR.apiRequest.create_new_playlist(_title, _callback)
})
pubsub.on('playlist::addCity', function(_idCity, _idList, _callback){
	MR.apiRequest.add_city_to_playlist(_idCity, _idList, _callback)
})

// popin
pubsub.on('popin::playlist', function(_idCity, _data){
	var addedCityToPL;
	if( typeof _data.resultList !== 'undefined'){ // appel depuis la home
		addedCityToPL = _.find(_data.resultList, function(city){
		    return city.id == _idCity
		})
	} else { // appel depuis la fiche
		addedCityToPL = _data.city
	}
	pubsub.emit('playlist::getList', function(_PLdatas){
		var PLdatas = {}
		PLdatas.addedCity = addedCityToPL
		PLdatas.PL = _PLdatas
		_.extend(PLdatas, _data);
		var popinPlaylist = new popin_playlist(PLdatas)
	})
})
