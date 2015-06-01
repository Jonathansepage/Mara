/*
 *
 * Turns an HTML string into a DOM element (only first element returned)
 * A bit like jQuery $('<div>');
 *
 * Use:
 *
 * var parseHTML = require('parseHTML');
 *
 * var el = parseHTML('<div>Example</div>');
 * document.body.appendChild(el);
 *
 */

module.exports = function(html) {
        
    // Create temporary element
    var d = document.createElement('div');
    d.innerHTML = html;

    // Take first child to return
    var el = d.children[0];

    // Clear reference (maybe not necessary)
    d = null;
    return el;
};