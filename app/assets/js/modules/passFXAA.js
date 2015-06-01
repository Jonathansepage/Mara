var THREE = require('three');
var pubsub = require('pubsub');

module.exports = {
    init: init,
    resize: resize,
    update: update,
};

var assets;
pubsub.on('preload-scene', function(_assets) {
    assets = _assets;
});

var pass;

function init(_width, _height) {

    var uniforms = {
        tInput: {type: 't', value: null},
        vResolution: {type: 'v2', value: new THREE.Vector2(_width, _height)},
    };
    
    pass = new THREE.RawShaderMaterial({
        uniforms:       uniforms,
        vertexShader:   assets.shaders.postVert,
        fragmentShader: assets.shaders.fxaaFrag,
    });

    return pass;
}

function resize(_width, _height) {
    pass.uniforms.vResolution.value.set(_width, _height);
}

function update(delta, time) {
}
