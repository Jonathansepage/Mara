/*
 *
 * Requires audioPatch for polyfill, gsap and pubsub
 *
 * Use:
 *     Firstly load the audio file using the preload module as either buffer or stream.
 *     Buffer is completely loaded and decoded, stream is loaded as an html media 
 *     element - only canplay event guaranteed.
 *
 *     Then create a convenience method for the audio near the end of this module:
 *         exports.customMethodName = createSound(name, stream);
 *         name (string): name of loaded asset
 *         stream (boolean): true if stream
 *     Example:
 *         exports.buzz = createSound('buzz', true);
 *
 *     In external module, require sfx module. 
 *     sfx returns an object containing the convenience methods and global volume.
 *
 *     Example to adjust global volume:
 *         sfx.volume.value = 0.5;
 *
 *     To play audio, call:
 *         sfx.customMethodName(gain, loop, lowPass, loopStart, loopEnd);
 *         gain (number): gain level (0.0 - 1.0)
 *         loop (boolean): true if audio to loop
 *         lowPass (boolean): true if lowPass wanted - returned
 *         loopStart (number): time in audio of loop start
 *         loopEnd (number): time in audio of loop end
 *
 *     The function returns an object. This object contains:
 *         stop (function): function used to fade out and stop audio.
 *         gain (number): the audio's individual gain, which can be updated
 *         lowPassFilter (object): returns the createBiquadFilter, which can be updated
 *
 *     Example:
 *         var song = sfx.song(0.8, true, true);
 *         song.frequency.value = 300;
 *         setTimeout(song.stop, 2000);
 *
 *
 */

var audioPatch = require('audioPatch');
var pubsub = require('pubsub');
var gsap = require('gsap');

// Import sound files
var assets;
pubsub.on('preload-scene', function(_assets) {
    assets = _assets;
    console.log(assets);
});

var isWebAudio = 'webkitAudioContext' in window || 'AudioContext' in window;

module.exports = {};

// CREATE CONVENIENCE METHODS FOR USE
// To use this in other module, require sfx, then call sfx.buzz(1);
module.exports.buzz = createSound('buzz', true);

// Don't try to create context if no webaudio
if (!isWebAudio) return;
    
var context = new AudioContext();
var volume = context.createGain();
volume.gain.value = 1;
volume.connect(context.destination);
module.exports.volume = volume.gain;

function createSound(buffer, streaming) {

    return function(gain, loop, lowPass, loopStart, loopEnd) {
        var source;
        var stream;

        // Return noop so that it won't break code
        if (!isWebAudio) return function() {};

        // Return if not loaded
        if (typeof assets !== 'object') return;

        var out = {};

        if (streaming) {
            // Clone stream element source before connecting
            stream = assets.streams[buffer].cloneNode(true);
            source = context.createMediaElementSource(stream);
            if (loop) {
                stream.addEventListener('ended', function() {
                    stream.play();
                });
            }
        } else {
            source = context.createBufferSource();
            source.buffer = assets.buffers[buffer];
            source.loop = loop;

            if( typeof loopStart === 'number' && typeof loopEnd === 'number' ){
                source.loopStart = loopStart;
                source.loopEnd = loopEnd;
            }
        }

        var envelope = context.createGain();
        envelope.gain.value = typeof gain === 'number' ? gain : 1;

        if (lowPass) {
            var lowPassFilter = context.createBiquadFilter();

            lowPassFilter.type = 0; 
            lowPassFilter.frequency.value = 22000;
            
            source.connect(lowPassFilter);
            lowPassFilter.connect(envelope);

            out.lowPassFilter = lowPassFilter;
        } else {
            source.connect(envelope);
        }

        envelope.connect(volume);
        
        if (streaming) {
            stream.play();
        } else {
            source.start(0);
        }

        out.stop = function() {
            TweenLite.to(envelope.gain, 0.8, {value: 0, onComplete: function() {
                if (streaming) {
                    stream.pause();
                } else {
                    source.stop(0);
                }
                source.disconnect(0);
            }});
        };

        out.gain = envelope.gain;
        out.currentTime = context.currentTime;
        if(!streaming) out.playbackRate = source.playbackRate;

        return out;
    };
}

