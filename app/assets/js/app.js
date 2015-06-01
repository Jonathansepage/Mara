(function(doc, proto) {
  try { // check if browser supports :scope natively
    doc.querySelector(':scope body');
  } catch (err) { // polyfill native methods if it doesn't
    ['querySelector', 'querySelectorAll'].forEach(function(method) {
      var nativ = proto[method];
      proto[method] = function(selectors) {
        if (/(^|,)\s*:scope/.test(selectors)) { // only if selectors contains :scope
          var id = this.id; // remember current element id
          this.id = 'ID_' + Date.now(); // assign new unique id
          selectors = selectors.replace(/((^|,)\s*):scope/g, '$1#' + this.id); // replace :scope with #ID
          var result = doc[method](selectors);
          this.id = id; // restore previous id
          return result;
        } else {
          return nativ.call(this, selectors); // use native code for other selectors
        }
      }
    });
  }
})(window.document, Element.prototype);



var router = require('router');
var common = require('common');

var xhr = require('xhr');
var _ = require('underscore');
var pubsub = require('pubsub');

// Store the root of your application, used for routing
window._ROOT = '/www.sepage.com'; 

// Start router
router.init(_ROOT);

// Global stuff (not module-dependant, preloading, etc)

MR = {}

// API REQUESTS

MR.apiRequest = {
	// user ID available in var MR.userID
	getCitiesList: function(callback){
		// GET     /api/cities 
		var _url = 'assets/data/cities.json';
		
		xhr({url: _url, json: true}, function (err, resp, body) {
		    var dataAPI = {}
		    dataAPI.resultList = body		    
		    callback(dataAPI)
		});
	},

	likeCity: function(id, callback){
		//POST    /api/cities/:id/like

		// after request result:
		var dataAPI = {'liked':981, 'disliked':665}
		console.log(dataAPI)
		pubsub.emit('updateHeaderCounters', dataAPI) // header update, see header.js
		callback()
	},

	unlikeCity: function(id, callback){
		//DELETE  /api/cities/:id/like

		// after request result:
		var dataAPI = {'liked':981, 'disliked':665}
		pubsub.emit('updateHeaderCounters', dataAPI) // header update, see header.js
		callback()
	},

	rejectCity: function(id, callback){
		//POST    /api/cities/:id/dislike

		// after request result: 
		var dataAPI = {'liked':979, 'disliked':667}
		pubsub.emit('updateHeaderCounters', dataAPI) // header update, see header.js
		callback()
	},

	unrejectCity: function(id, callback){
		//DELETE  /api/cities/:id/dislike

		// after request result: 
		var dataAPI = {'liked':979, 'disliked':667}
		pubsub.emit('updateHeaderCounters', dataAPI) // header update, see header.js
		callback()
	},

	showCity: function(idCity, callback){
		// GET     /api/cities/:id
		var _url = 'assets/data/city.json';

		xhr({url: _url, json: true}, function (err, resp, body) {
		    /////////
		    //this manipulation should be into the API result
		    body.country = 'country is missing from datas'
		    /////////
		    callback(body)
		});
	},

	list_playlists: function(callback){
		//GET     /api/playlists

		var _url = 'assets/data/playlists.json';

		xhr({url: _url, json: true}, function (err, resp, body) {
		    /*var dataAPI = {}
		    dataAPI.resultList = body*/
		    
		    callback(body)
		});
	},

	show_playlist: function(idPlaylist, callback){
		//GET     /api/playlists/:id
		var _url = 'assets/data/playlist.json';

		xhr({url: _url, json: true}, function (err, resp, body) {
		    /*var dataAPI = {}
		    dataAPI.resultList = body*/
		    
		    callback(body)
		});
	},

	add_city_to_playlist: function(idCity, idPlaylist, callback){
		//POST    /api/playlists/:id/cities
		callback()
	},

	create_new_playlist: function(title, callback){
		//POST    /api/playlists
		var _url = 'assets/data/playlist.json';

		xhr({url: _url, json: true}, function (err, resp, body) {
		    /////////
		    //this manipulation should be into the API result
		    body.id= Math.round(Math.random()*100);
		    body.title = title;
		    body.picture = 'https://www.google.fr/images/srpr/logo11w.png'
		    /////////
		    callback(body)
		});
	}

}



// UTILS
MR.utils = {
	removeClass: function(el, className){
		if (el.classList)
		  el.classList.remove(className);
		else
		  el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
	},
	addClass: function(el, className){
		if (el.classList)
		  el.classList.add(className);
		else
		  el.className += ' ' + className;
	},
	toggleClass: function(el, className){
		if (el.classList) {
		  	el.classList.toggle(className);
		  	return;
		}
		var classes = el[0].className.split(' ');
		var existingIndex = classes.indexOf(className);

		if (existingIndex >= 0)
			classes.splice(existingIndex, 1);
		else
		    classes.push(className);

		el.className = classes.join(' ');
	},
	hasClass: function(el, className){
		if (el.classList)
		  return el.classList.contains(className);
		else
		  return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
	},
	fireEvent: function(node, eventName) {
	    // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
	    var doc;
	    if (node.ownerDocument) {
	        doc = node.ownerDocument;
	    } else if (node.nodeType == 9){
	        // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
	        doc = node;
	    } else {
	        throw new Error("Invalid node passed to fireEvent: " + node.id);
	    }

	     if (node.dispatchEvent) {
	        // Gecko-style approach (now the standard) takes more work
	        var eventClass = "";

	        // Different events have different event classes.
	        // If this switch statement can't map an eventName to an eventClass,
	        // the event firing is going to fail.
	        switch (eventName) {
	            case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
	            case "mousedown":
	            case "mouseup":
	                eventClass = "MouseEvents";
	                break;

	            case "focus":
	            case "change":
	            case "blur":
	            case "select":
	                eventClass = "HTMLEvents";
	                break;

	            default:
	                throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
	                break;
	        }
	        var event = doc.createEvent(eventClass);

	        var bubbles = eventName == "change" ? false : true;
	        event.initEvent(eventName, bubbles, true); // All events created as bubbling and cancelable.

	        event.synthetic = true; // allow detection of synthetic events
	        // The second parameter says go ahead with the default action
	        node.dispatchEvent(event, true);
	    } else  if (node.fireEvent) {
	        // IE-old school style
	        var event = doc.createEventObject();
	        event.synthetic = true; // allow detection of synthetic events
	        node.fireEvent("on" + eventName, event);
	    }
	},
	findAncestor: function(el, cls){
		while ((el = el.parentElement) && !el.classList.contains(cls));
		return el;
	}

}

