audiosynth
==========

Dynamic waveform audio synthesizer, written in Javascript.

Generate musical notes dynamically
and play them in your browser using the HTML5 Audio Element.

No static files required. (Besides the source, of course!)

Demo
----

To see a demo of audiosynth in action, visit http://keithwhor.com/music/


Installation
------------

Assuming audiosynth.js is in your current directory, import package using:

```html
<script src="audiosynth.js"></script>
```


Usage
-----

audiosynth implements a singleton class, ```AudioSynth```. By default, the global (window) variable ```Synth```
is the instance of the class.

Any attempt to instantiate new ```AudioSynth``` object will only create references to
the original object.

```javascript
Synth instanceof AudioSynth; // true

var testInstance = new AudioSynth;
testInstance instanceof AudioSynth; // true

testInstance === Synth; // true
```

To use ```AudioSynth``` to generate .WAV files...

```javascript
Synth.generate(sound, note, octave, duration);
/*
	Will generate a base64-encoded dataURI wavefile (.WAV) containing your data.

	sound
		a numeric index or string referring to a sound profile (by id or name, respectively)
	
	note
		the note you wish to play (A,B,C,D,E,F,G). Supports sharps (i.e. C#) but not flats.
		(Use the respective sharp!)
	
	octave
		the octave # of the note you wish to play
		
	duration
		the duration (in seconds) of the note
*/
```

You can play notes instantly using...

```javascript
/*
	Same arguments as Synth.generate,
	only this creates an HTML Audio element, plays it, and unloads it upon completion.
*/
Synth.play(sound, note, octave, duration);
```

You may also create individual instruments (objects that reference .generate and .play, bound to specific
sounds).

```javascript
var piano = Synth.createInstrument('piano');
piano.play('C', 4, 2); // plays C4 for 2s using the 'piano' sound profile
```


Sound Profiles
--------------

```AudioSynth``` comes with four default sound profiles.

__piano__ (id 0)

__organ__ (id 1)

__acoustic__ (id 2)

__edm__ (id 3)

```javascript
var acoustic = Synth.createInstrument('acoustic'); // play with your acoustic guitar!
```


Changing Settings
-----------------

Poor performance? The default sampling rate for AudioSynth is 44100Hz (CD quality). This can be taxing on your browser.


To change the sampling rate, use ```Synth.setSampleRate(n)```
Please note that lower sampling rates will equate to poorer sound quality, especially for higher notes.

```javascript
// Can only set values between 4000Hz and 44100Hz.
Synth.setSampleRate(20000); // sets sample rate to 20000Hz

Synth.getSampleRate(); // returns 20000
```

Volume a bit much? Adust the volume of the sample similarly.

```javascript
Synth.setVolume(1.00); // set volume to 100%
Synth.setVolume(0.40); // no, wait, 40%.
Synth.setVolume(0.1337); // even better.

Synth.getVolume(); // returns 0.1337
```


Advanced Usage
--------------

Additional sound profiles can be loaded using ```Synth.loadSoundProfile()```

```javascript
// Load a sound profile from an object...
Synth.loadSoundProfile({
	// name it
	name: 'my_sound',
	// WIP: return the length of time, in seconds, the attack lasts
	attack: function(sampleRate, frequency, volume) { ... },
	// WIP: return a number representing the rate of signal decay.
	// larger = faster decay
	dampen: function(sampleRate, frequency, volume) { ... },
	// wave function: calculate the amplitude of your sine wave based on i (index)
	wave: function(i, sampleRate, frequency, volume) {
		/*
		Here we have access to...
		this.modulate : an array of loaded frequency
		this.vars : any temporary variables you wish to keep track of
		*/
	}
	
});
```

A rough guide to waveform generation can be found at http://keithwhor.com/music/


Debugging
---------

If you're hanging on note generation (for default or custom sound profiles), use ```Synth.debug()```
to enable debugging.


This will log note generation times in your console.


Credits and Acknowledgements
----------------------------

Special thanks to Albert Pham (http://www.sk89q.com/) for Dynamic .WAV file generation,
the work off of which this is based (http://www.sk89q.com/playground/jswav/)
and Hasen el Judy (http://dev.hasenj.org/post/4517734448) for information regarding Karplus-Strong
String Synthesis.


Further Reading
---------------

__.WAV Audio Files__

http://en.wikipedia.org/wiki/.WAV_file


__Sound Synthesis__

http://www.acoustics.salford.ac.uk/acoustics_info/sound_synthesis/


__"acoustic" sound profile__ generated using __Karplus-Strong String Synthesis__:

http://en.wikipedia.org/wiki/Karplus%E2%80%93Strong_string_synthesis
http://music.columbia.edu/cmc/musicandcomputers/chapter4/04_09.php


Contact
-------

Feel free to e-mail me at keithwhor at gmail dot com

or follow me on Twitter, @keithwhor

If you like, feel free to share! :) Always appreciated.
