var Synth, AudioSynth, AudioSynthInstrument;
!function(){
	var _encapsulated = false;
	var AudioSynthInstance = null;
	var pack = function(c,arg){return [String.fromCharCode(arg&255,(arg>>8)&255),String.fromCharCode(arg&255,(arg>>8)&255,(arg>>16)&255,(arg>>24)&255)][c];};
	var setPrivateVar = function(n,v,w,e){Object.defineProperty(this,n,{value:v,writable:!!w,enumerable:!!e});};
	var setPublicVar = function(n,v,w){setPrivateVar.call(this,n,v,w,true);};
	AudioSynthInstrument = function AudioSynthInstrument(){this.__init__.apply(this,arguments);};
	var setPriv = setPrivateVar.bind(AudioSynthInstrument.prototype);
	var setPub = setPublicVar.bind(AudioSynthInstrument.prototype);
	setPriv('__init__', function(a,b,c) {
		if(!_encapsulated) { throw new Error('AudioSynthInstrument can only be instantiated from the createInstrument method of the AudioSynth object.'); }
		setPrivateVar.call(this, '_parent', a);
		setPublicVar.call(this, 'name', b);
		setPrivateVar.call(this, '_soundID', c);
	});
	setPub('play', function(note, octave, duration) {
		return this._parent.play(this._soundID, note, octave, duration);
	});
	setPub('generate', function(note, octave, duration) {
		return this._parent.generate(this._soundID, note, octave, duration);
	});
	AudioSynth = function AudioSynth(){if(AudioSynthInstance instanceof AudioSynth){return AudioSynthInstance;}else{ this.__init__(); return this; }};
	setPriv = setPrivateVar.bind(AudioSynth.prototype);
	setPub = setPublicVar.bind(AudioSynth.prototype);
	setPriv('_debug',false,true);
	setPriv('_bitsPerSample',16);
	setPriv('_channels',1);
	setPriv('_sampleRate',44100,true);
	setPub('setSampleRate', function(v) {
		this._sampleRate = Math.max(Math.min(v|0,44100), 4000);
		this._clearCache();
		return this._sampleRate;
	});
	setPub('getSampleRate', function() { return this._sampleRate; });
	setPriv('_volume',32768,true);
	setPub('setVolume', function(v) {
		v = parseFloat(v); if(isNaN(v)) { v = 0; }
		v = Math.round(v*32768);
		this._volume = Math.max(Math.min(v|0,32768), 0);
		this._clearCache();
		return this._volume;
	});
	setPub('getVolume', function() { return Math.round(this._volume/32768*10000)/10000; });
	setPriv('_notes',{'C':261.63,'C#':277.18,'D':293.66,'D#':311.13,'E':329.63,'F':346.23,'F#':369.99,'G':392.00,'G#':415.30,'A':440.00,'A#':466.16,'B':493.88});
	setPriv('_fileCache',[],true);
	setPriv('_temp',{},true);
	setPriv('_sounds',[],true);
	setPriv('_mod',[function(i,s,f,x){return Math.sin((2 * Math.PI)*(i/s)*f+x);}]);
	setPriv('_resizeCache', function() {
		var f = this._fileCache;
		var l = this._sounds.length;
		while(f.length<l) {
			var octaveList = [];
			for(var i = 0; i < 8; i++) {
				var noteList = {};
				for(var k in this._notes) {
					noteList[k] = {};
				} 
				octaveList.push(noteList);
			}
			f.push(octaveList);
		}
	});
	setPriv('_clearCache', function() {
		this._fileCache = [];
		this._resizeCache();
	});
	setPub('generate', function(sound, note, octave, duration) {
		var thisSound = this._sounds[sound];
		if(!thisSound) {
			for(var i=0;i<this._sounds.length;i++) {
				if(this._sounds[i].name==sound) {
					thisSound = this._sounds[i];
					sound = i;
					break;
				}
			}
		}
		if(!thisSound) { throw new Error('Invalid sound or sound ID: ' + sound); }
		var t = (new Date).valueOf();
		this._temp = {};
		octave |= 0;
		octave = Math.min(8, Math.max(1, octave));
		var time = !duration?2:parseFloat(duration);
		if(typeof(this._notes[note])=='undefined') { throw new Error(note + ' is not a valid note.'); }
		if(typeof(this._fileCache[sound][octave-1][note][time])!='undefined') {
			if(this._debug) { console.log((new Date).valueOf() - t, 'ms to retrieve (cached)'); }
			return this._fileCache[sound][octave-1][note][time];
		} else {
			var frequency = this._notes[note] * Math.pow(2,octave-4);
			var data = [];
			var sampleRate = this._sampleRate;
			var volume = this._volume;
			var channels = this._channels;
			var bitsPerSample = this._bitsPerSample;
			var attack = thisSound.attack(sampleRate, frequency, volume);
			var dampen = thisSound.dampen(sampleRate, frequency, volume);
			var wave = thisSound.wave.bind({modulate: this._mod, vars: this._temp});
			var val = 0;
			var curVol = 0;

			for (var i = 0; i < (sampleRate * time); i++) {	
				if(i<=sampleRate*attack) {
					curVol = volume * (i/(sampleRate*attack));
				} else {
					curVol = volume * Math.pow((1-((i-(sampleRate*attack))/(sampleRate*(time-attack)))),dampen);
				}
		
				val = curVol * Math.min(Math.max(wave(i, sampleRate, frequency, volume), -1), 1);
				val = String.fromCharCode(val&255, (val>>>8)&255);
				data.push(val);
			}
	
			data = data.join('');

			// Format sub-chunk
			var chunk1 = [
				'fmt ', // Sub-chunk identifier
				pack(1, 16), // Chunk length
				pack(0, 1), // Audio format (1 is linear quantization)
				pack(0, channels),
				pack(1, sampleRate),
				pack(1, sampleRate * channels * bitsPerSample / 8), // Byte rate
				pack(0, channels * bitsPerSample / 8),
				pack(0, bitsPerSample)
			].join('');
			// Data sub-chunk (contains the sound)
			var chunk2 = [
				'data', // Sub-chunk identifier
				pack(1, data.length * channels * bitsPerSample / 8), // Chunk length
				data
			].join('');
			// Header
			var header = [
				'RIFF',
				pack(1, 4 + (8 + chunk1.length) + (8 + chunk2.length)), // Length
				'WAVE'
			].join('');
			var out = [header, chunk1, chunk2].join('');
			var dataURI = 'data:audio/wav;base64,' + escape(window.btoa(out)); 
			this._fileCache[sound][octave-1][note][time] = dataURI;
			if(this._debug) { console.log((new Date).valueOf() - t, 'ms to generate'); }
			return dataURI;
		}
	});
	setPub('play', function(note, octave, duration) {
		var src = this.generate(note, octave, duration);
		var audio = new Audio(src);
		audio.addEventListener('ended', function() { audio = null; });
		audio.autoplay = true;
		audio.setAttribute('type', 'audio/wav');
		return true;
	});
	setPub('debug', function() { this._debug = true; });
	setPub('createInstrument', function(sound) {
		var n = 0;
		var found = false;
		if(typeof(sound)=='string') {
			for(var i=0;i<this._sounds.length;i++) {
				if(this._sounds[i].name==sound) {
					found = true;
					n = i;
					break;
				}
			}
		} else {
			if(this._sounds[sound]) {
				n = sound;
				sound = this._sounds[n].name;
				found = true;
			}
		}
		if(!found) { throw new Error('Invalid sound or sound ID: ' + sound); }
		_encapsulated = true;
		var ins = new AudioSynthInstrument(this, sound, n);
		_encapsulated = false;
		return ins;
	});
	setPub('listSounds', function() {
		var r = [];
		for(var i=0;i<this._sounds.length;i++) {
			r.push(this._sounds[i].name);
		}
		return r;
	});
	setPriv('__init__', function(){
		this._resizeCache();
	});
	setPub('loadSoundProfile', function() {
		for(var i=0,len=arguments.length;i<len;i++) {
			o = arguments[i];
			if(!(o instanceof Object)) { throw new Error('Invalid sound profile.'); }
			this._sounds.push(o);
		}
		this._resizeCache();
		return true;
	});
	setPub('loadModulationFunction', function() {
		for(var i=0,len=arguments.length;i<len;i++) {
			f = arguments[i];
			if(typeof(f)!='function') { throw new Error('Invalid modulation function.'); }
			this._mod.push(f);
		}
		return true;
	});
	AudioSynthInstance = new AudioSynth();
	Synth = AudioSynthInstance;
}();

Synth.loadModulationFunction(
	function(i, sampleRate, frequency, x) { return 1 * Math.sin(2 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 1 * Math.sin(4 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 1 * Math.sin(8 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 1 * Math.sin(0.5 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 1 * Math.sin(0.25 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(2 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(4 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(8 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(0.5 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(0.25 * Math.PI * ((i / sampleRate) * frequency) + x); }
);

Synth.loadSoundProfile({
	name: 'piano',
	attack: function() { return 0.002; },
	dampen: function(sampleRate, frequency, volume) {
		return Math.pow(0.5*Math.log((frequency*volume)/sampleRate),2);
	},
	wave: function(i, sampleRate, frequency, volume) {
		var base = this.modulate[0];
		return this.modulate[1](
			i,
			sampleRate,
			frequency,
			Math.pow(base(i, sampleRate, frequency, 0), 2) +
				(0.75 * base(i, sampleRate, frequency, 0.25)) +
				(0.1 * base(i, sampleRate, frequency, 0.5))
		);
	}
},
{
	name: 'organ',
	attack: function() { return 0.3 },
	dampen: function(sampleRate, frequency) { return 1+(frequency * 0.01); },
	wave: function(i, sampleRate, frequency) {
		var base = this.modulate[0];
		return this.modulate[1](
			i,
			sampleRate,
			frequency,
			base(i, sampleRate, frequency, 0) +
				0.5*base(i, sampleRate, frequency, 0.25) +
				0.25*base(i, sampleRate, frequency, 0.5)
		);
	}
},
{
	name: 'acoustic',
	attack:	function() { return 0.002; },
	dampen: function() { return 1; },
	wave: function(i, sampleRate, frequency) {

		var vars = this.vars;
		vars.valueTable = !vars.valueTable?[]:vars.valueTable;
		if(typeof(vars.playVal)=='undefined') { vars.playVal = 0; }
		if(typeof(vars.periodCount)=='undefined') { vars.periodCount = 0; }
	
		var valueTable = vars.valueTable;
		var playVal = vars.playVal;
		var periodCount = vars.periodCount;

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
						vars.periodCount++;	
					}
				} else {
					resetPlay = true;	
				}
			}
	
			var _return = valueTable[playVal];
			if(resetPlay) { vars.playVal = 0; } else { vars.playVal++; }
	
			return _return;
	
		}
	}
},
{
	name: 'edm',
	attack:	function() { return 0.002; },
	dampen: function() { return 1; },
	wave: function(i, sampleRate, frequency) {
		var base = this.modulate[0];
		var mod = this.modulate.slice(1);
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
});