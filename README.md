audiosynth
==========

JS Dynamic Audio Synth

==========

Welcome! Short ReadMe for now.

Included in this package currently is audiosynth.js, which contains the AudioSynth
constructor. Very simple to use.

Assuming audiosynth.js is in your current directory, import package using:

	<script src="audiosynth.js"></script>

Instantiate the synthesizer using:

	var mySynthesizer = new AudioSynth();
	
==========
		
Release Notes

==========

Monday, August 19th, 2013
	
	First release. Not pretty. Acoustic sound profile (Karplus-Strong string synthesis)
	broken. Will fix ASAP.
	
	Note that we're currently console.log-ing note generation times. Just a debug feature
	left in so you can see performance on first note generation. (They're cached after
	that.)


==========
		
Usage

==========
	
Currently, the synthesizer supports the following...

PROPERTIES
==========

	AudioSynth.notes
		
		- Object containing all notes of the fourth octave and their associated
			frequencies
		- Read-only

	AudioSynth.sounds
		
		- An array of available sound profiles to use
		- Read-only
		
	AudioSynth.sound
	
		- Current sound profile
		- Can be set to any of the available sounds
		
METHODS
=======

	AudioSynth.generate(note, octave, duration)
	
		- Generates a Waveform Audio File (.wav) for the specified note, octave, and
			duration (using the current sound profile) as a dataURI
		
	AudioSynth.play(note, octave, duration)
	
		- Plays the sound specified by note, octave, and duration (using the current
			sound profile)
