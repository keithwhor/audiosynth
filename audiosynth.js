// pack() emulation (from the PHP version), for binary crunching
function pack(fmt) {
	var output = '';
	var argi = 1;

	for (var i = 0; i < fmt.length; i++) {
		var c = fmt.charAt(i);
		var arg = arguments[argi];
		argi++;
   
		switch (c) {
			case "a":
				output += arg[0] + "\0";
				break;

			case "A":
				output += arg[0] + " ";
				break;

			case "C":
			case "c":
				output += String.fromCharCode(arg);
				break;

			case "n":
				output += String.fromCharCode((arg >> 8) & 255, arg & 255);
				break;

			case "v":
				output += String.fromCharCode(arg & 255, (arg >> 8) & 255);
				break;

			case "N":
				output += String.fromCharCode((arg >> 24) & 255, (arg >> 16) & 255, (arg >> 8) & 255, arg & 255);
				break;

			case "V":
				output += String.fromCharCode(arg & 255, (arg >> 8) & 255, (arg >> 16) & 255, (arg >> 24) & 255);
				break;

			case "x":
				argi--;
				output += "\0";
				break;

			default:
				throw new Error("Unknown pack format character '"+c+"'");

		}

	}

	return output;

}

function AudioSynth() {

	var __currentSound = 0;
	
	var channels = 1;
	var sampleRate = 44100;
	var bitsPerSample = 16;
	var volume = 32768;

	// Frequency of our musical notes
	var notes = {
		'C'		:	261.63,
		'C#'	:	277.18,
		'D'		:	293.66,
		'D#'	:	311.13,
		'E'		:	329.63,
		'F'		:	346.23,
		'F#'	:	369.99,
		'G'		:	392.00,
		'G#'	:	415.30,
		'A'		:	440.00,
		'A#'	:	466.16,
		'B'		:	493.88
	};
	
	var base = function(i, sampleRate, frequency, shift) {
			return Math.sin((2 * Math.PI) * (i / sampleRate) * frequency + (shift * Math.PI));
		};
	
	var valueTable = [];
	var karplusStrong = function(i, sampleRate, frequency) { 
	
		var playVal = 0;
		var periodCount = 0;
	
		var period = sampleRate/frequency;
		var p_hundredth = Math.floor((period-Math.floor(period))*100);
	
		var resetPlay = false;
	
		if(valueTable.length<=Math.ceil(period)) {
		
			valueTable.push(Math.round(Math.random())*2-1);
		
			return valueTable[valueTable.length-1];
		
		} else {
		
			valueTable[playVal] = (valueTable[playVal>=(valueTable.length-1)?0:playVal+1] + valueTable[playVal]) * 0.5;
		
			if(playVal>=Math.floor(period)) {
				if(playVal<Math.ceil(period)) {
					if((periodCount%100)>=p_hundredth) {
						// Reset
						resetPlay = true;
						valueTable[playVal+1] = (valueTable[0] + valueTable[playVal+1]) * 0.5;	
					}
				} else {
					resetPlay = true;	
				}
			}
		
			var _return = valueTable[playVal];
			if(resetPlay) { playVal = 0; } else { playVal++; }
		
			return _return;
		
		}
	
	};
	
	var mod = [];
		
	// 0
	mod.push(function(i, sampleRate, frequency, x) { return 1 * Math.sin(2 * Math.PI * ((i / sampleRate) * frequency) + x); });
	// 1
	mod.push(function(i, sampleRate, frequency, x) { return 1 * Math.sin(4 * Math.PI * ((i / sampleRate) * frequency) + x); });
	// 2
	mod.push(function(i, sampleRate, frequency, x) { return 1 * Math.sin(8 * Math.PI * ((i / sampleRate) * frequency) + x); });
	// 3
	mod.push(function(i, sampleRate, frequency, x) { return 1 * Math.sin(0.5 * Math.PI * ((i / sampleRate) * frequency) + x); });
	// 4
	mod.push(function(i, sampleRate, frequency, x) { return 1 * Math.sin(0.25 * Math.PI * ((i / sampleRate) * frequency) + x); });
	// 5
	mod.push(function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(2 * Math.PI * ((i / sampleRate) * frequency) + x); });
	// 6
	mod.push(function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(4 * Math.PI * ((i / sampleRate) * frequency) + x); });
	// 7
	mod.push(function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(8 * Math.PI * ((i / sampleRate) * frequency) + x); });
	// 8
	mod.push(function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(0.5 * Math.PI * ((i / sampleRate) * frequency) + x); });
	// 9
	mod.push(function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(0.25 * Math.PI * ((i / sampleRate) * frequency) + x); });
	
	var sounds = [
		{	// Piano
			name: 'piano',
			attack: 	0.002,
			dampen: 	
				function(i, sampleRate, frequency) {
					return Math.pow(0.5*Math.log((frequency*volume)/sampleRate),2);
				},
			wave:
				function(i, sampleRate, frequency) {
					return mod[0](
						i,
						sampleRate,
						frequency,
						Math.pow(base(i, sampleRate, frequency, 0), 2) +
							(0.75 * base(i, sampleRate, frequency, 0.25)) +
							(0.1 * base(i, sampleRate, frequency, 0.5))
					);
				}
		},
		{	// Organ
			name: 'organ',
			attack:		0.3,
			dampen:		
				function(i, sampleRate, frequency) {
					return 1+(frequency * 0.01);
				},
			wave:	
				function(i, sampleRate, frequency) {
					return mod[0](
						i,
						sampleRate,
						frequency,
						base(i, sampleRate, frequency, 0) +
							0.5*base(i, sampleRate, frequency, 0.25) +
							0.25*base(i, sampleRate, frequency, 0.5)
					);
				}
		},
		{	// Guitar
			name: 'acoustic',
			attack:		0.002,
			dampen: 	
				function(i, sampleRate, frequency) {
					return 1;
				},
			wave:		karplusStrong
		},
		{	// EDM, bro!
			name: 'edm',
			attack:		0.002,
			dampen:
				function(i, sampleRate, frequency) {
					return 1;
				},
			wave:		
				function(i, sampleRate, frequency) {
					return mod[0](
						i,
						sampleRate,
						frequency,
						mod[9](
							i,
							sampleRate,
							frequency,
							mod[2](
								i,
								sampleRate,
								frequency,
								Math.pow(base(i, sampleRate, frequency, 0), 3) +
									Math.pow(base(i, sampleRate, frequency, 0.5), 5) +
									Math.pow(base(i, sampleRate, frequency, 1), 7)
							)
						) +
							mod[8](
								i,
								sampleRate,
								frequency,
								base(i, sampleRate, frequency, 1.75)
							)
					);
				}
		}
	];
	
	var fileCache = [];
	var fnResizeCache = function() {
		while(fileCache.length<sounds.length) {
			var octaveList = [];
			for(var i = 0; i < 8; i++) {
				var noteList = {};
				for(var k in notes) {
					noteList[k] = {};
				} 
				octaveList.push(noteList);
			}
			fileCache.push(octaveList);
		}
	};
	
	fnResizeCache();
	
	// Remove audio elements that have finished playing
	
		// Note generation loop.
	// Modified from
	//		http://www.sk89q.com/playground/jswav/
	// Courtesy of sk89q

	var fnGenerateNote = function(note, octave, duration) {
	
		octave |= 0;
		octave = Math.min(8, Math.max(1, octave));
		
		duration = !duration?2:parseFloat(duration);
		
		if(typeof(notes[note])=='undefined') { throw new Error(note + ' is not a valid note.'); }
		
		if(typeof(fileCache[__currentSound][octave-1][note][time])!='undefined') {
			
			return fileCache[__currentSound][octave-1][note][time];
			
		} else {

			var t = (new Date).valueOf();

			var frequency = notes[note];
			frequency *= Math.pow(2,octave-4);
			var seconds = duration;
			var data = [];
	
			var thisSound = sounds[__currentSound];
			var attack = thisSound.attack;
			var dampen = thisSound.dampen;
			var wave = thisSound.wave;
			var val = 0;

			for (var i = 0; i < (sampleRate * seconds); i++) {			
				if(i<=sampleRate*attack) {
					// Linear build-up, fast.
					curVol = volume * (i/(sampleRate*attack));
				} else {
					// Decay. Logarithmic, slow, faster at higher frequencies.
					curVol = volume * Math.pow((1-((i-(sampleRate*attack))/(sampleRate*(seconds-attack)))),dampen(i, sampleRate, frequency));
				}
		
				val = curVol * Math.min(Math.max(wave(i, sampleRate, frequency), -1), 1);
				val = String.fromCharCode(val&255, (val>>>8)&255);
				data.push(val);
			}
	
			data = data.join('');

			// Format sub-chunk
			var chunk1 = [
				"fmt ", // Sub-chunk identifier
				pack("V", 16), // Chunk length
				pack("v", 1), // Audio format (1 is linear quantization)
				pack("v", channels),
				pack("V", sampleRate),
				pack("V", sampleRate * channels * bitsPerSample / 8), // Byte rate
				pack("v", channels * bitsPerSample / 8),
				pack("v", bitsPerSample)
			].join('');
			// Data sub-chunk (contains the sound)
			var chunk2 = [
				"data", // Sub-chunk identifier
				pack("V", data.length * channels * bitsPerSample / 8), // Chunk length
				data
			].join('');
			// Header
			var header = [
				"RIFF",
				pack("V", 4 + (8 + chunk1.length) + (8 + chunk2.length)), // Length
				"WAVE"
			].join('');
	
			var out = [header, chunk1, chunk2].join('');
			var dataURI = "data:audio/wav;base64," + escape(window.btoa(out));  
			// Append player for this note
			
			fileCache[__currentSound][octave-1][note][time] = dataURI;
	
			console.log((new Date).valueOf() - t, 'ms to generate');
		
			return dataURI;
			
		}

	};
	
	var fnPlayNote = function(note, octave, time) {
		src = fnGenerateNote(note, octave, time);
		audio = new Audio(src);
		audio.addEventListener('ended', function() { audio = null; });
		audio.autoplay = true;
		audio.setAttribute('type', 'audio/wav');
		return true;
	};
	
	Object.defineProperty(this, 'generate', {
		value: fnGenerateNote	
	});
	
	Object.defineProperty(this, 'play', {
		value: fnPlayNote
	});
	
	Object.defineProperty(this, 'notes', {
		get: function() {
			var o = {};
			for(var k in notes) {
				o[k] = notes[k];
			}
			return o;
		}	
	});
	
	Object.defineProperty(this, 'sounds', {
		get: function() {
			var s = [];
			for(var i=0,len=sounds.length;i<len;i++) {
				s.push(sounds[i].name);
			}
			return s;
		}
	});
	
	Object.defineProperty(this, 'sound', {
		get: function() {
			return sounds[__currentSound];
		},
		set: function(v) {
			for(var i=0,len=sounds.length;i<len;i++) {
				if(sounds[i].name==v) {
					__currentSound = i;
					return;
				}
			}
			throw new Error('Sound ' +  v + ' not valid.');
		}
	});

}