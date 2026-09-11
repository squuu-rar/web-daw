/**
 * Web DAW - Audio Engine
 */

const CONFIG = {
    STEPS: 16,
    TRACKS: [
        { id: 'kick', name: 'Kick', color: '#ff0055' },
        { id: 'snare', name: 'Snare', color: '#ffaa00' },
        { id: 'hihat', name: 'Hi-Hat', color: '#00ffaa' },
        { id: 'lead', name: 'Lead', color: '#00aaff' }
    ],
    KEYS: [
        { note: 'C3', freq: 130.81, type: 'white' },
        { note: 'C#3', freq: 138.59, type: 'black' },
        { note: 'D3', freq: 146.83, type: 'white' },
        { note: 'D#3', freq: 155.56, type: 'black' },
        { note: 'E3', freq: 164.81, type: 'white' },
        { note: 'F3', freq: 174.61, type: 'white' },
        { note: 'F#3', freq: 185.00, type: 'black' },
        { note: 'G3', freq: 196.00, type: 'white' },
        { note: 'G#3', freq: 207.65, type: 'black' },
        { note: 'A3', freq: 220.00, type: 'white' },
        { note: 'A#3', freq: 233.08, type: 'black' },
        { note: 'B3', freq: 246.94, type: 'white' },
        { note: 'C4', freq: 261.63, type: 'white' },
        { note: 'C#4', freq: 277.18, type: 'black' },
        { note: 'D4', freq: 293.66, type: 'white' },
        { note: 'D#4', freq: 311.13, type: 'black' },
        { note: 'E4', freq: 329.63, type: 'white' },
        { note: 'F4', freq: 349.23, type: 'white' },
        { note: 'F#4', freq: 369.99, type: 'black' },
        { note: 'G4', freq: 392.00, type: 'white' },
        { note: 'G#4', freq: 415.30, type: 'black' },
        { note: 'A4', freq: 440.00, type: 'white' },
        { note: 'A#4', freq: 466.16, type: 'black' },
        { note: 'B4', freq: 493.88, type: 'white' },
        { note: 'C5', freq: 523.25, type: 'white' }
    ],
    MAP: {
        'a': 0, 'w': 1, 's': 2, 'e': 3, 'd': 4, 'f': 5, 't': 6, 'g': 7, 'y': 8, 'h': 9, 'u': 10, 'j': 11, 'k': 12, 'o': 13, 'l': 14, 'p': 15
    }
};

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.filter = null;
        this.analyser = null;
        this.initialized = false;
        this.noiseBuffer = null; // will be created after ctx is available
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.filter = this.ctx.createBiquadFilter();
        this.analyser = this.ctx.createAnalyser();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 2000;
        this.filter.Q.value = 1;
        this.masterGain.connect(this.filter);
        this.filter.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.7;
        this.analyser.fftSize = 2048;
        this.noiseBuffer = this.createNoiseBuffer();
        this.initialized = true;
        console.log("Audio Engine Initialized");
    }

    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // Synth functions
    playKick(time, duration = 0.3) {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
        env.gain.setValueAtTime(1, time);
        env.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.connect(env);
        env.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + duration);
    }

    playSnare(time, duration = 0.2) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        const env = this.ctx.createGain();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 1;
        env.gain.setValueAtTime(0.5, time);
        env.gain.exponentialRampToValueAtTime(0.01, time + duration);
        noise.connect(filter);
        filter.connect(env);
        env.connect(this.masterGain);
        noise.start(time);
        noise.stop(time + duration);
    }

    playHiHat(time, duration = 0.05) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        const env = this.ctx.createGain();
        filter.type = 'highpass';
        filter.frequency.value = 7000;
        env.gain.setValueAtTime(0.3, time);
        env.gain.exponentialRampToValueAtTime(0.01, time + duration);
        noise.connect(filter);
        filter.connect(env);
        env.connect(this.masterGain);
        noise.start(time);
        noise.stop(time + duration);
    }

    playSynth(freq, time, duration = 0.4) {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        env.gain.setValueAtTime(0.3, time);
        env.gain.exponentialRampToValueAtTime(0.01, time + duration);
        const lpf = this.ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.value = this.filter.frequency.value;
        osc.connect(lpf);
        lpf.connect(env);
        env.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + duration);
    }
}

class Sequencer {
    constructor(audioEngine, onStep) {
        this.audio = audioEngine;
        this.onStep = onStep;
        this.isPlaying = false;
        this.bpm = 120;
        this.currentStep = 0;
        this.lookahead = 25.0;
        this.scheduleAheadTime = 0.1;
        this.nextNoteTime = 0;
        this.timerID = null;
        this.patterns = JSON.parse(localStorage.getItem('daw_patterns')) || Array(4).fill(0).map(() => Array(16).fill(false));
    }

    start() {
        if (!this.audio.initialized) this.audio.init();
        this.audio.ctx.state === 'suspended' && this.audio.ctx.resume();
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.audio.ctx.currentTime;
        this.scheduleNextNote();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
    }

    setBPM(bpm) {
        this.bpm = bpm;
    }

    scheduleNextNote() {
        while (this.nextNoteTime < this.audio.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.currentStep, this.nextNoteTime);
            this.advanceStep();
        }
        this.timerID = setTimeout(() => this.scheduleNextNote(), this.lookahead);
    }

    advanceStep() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += 0.25 * secondsPerBeat;
        this.currentStep = (this.currentStep + 1) % 16;
        this.onStep(this.currentStep);
    }

    scheduleStep(step, time) {
        this.patterns.forEach((track, trackIdx) => {
            if (track[step]) {
                switch (trackIdx) {
                    case 0: this.audio.playKick(time); break;
                    case 1: this.audio.playSnare(time); break;
                    case 2: this.audio.playHiHat(time); break;
                    case 3: // Lead
                        // simple trigger handled below
                        break;
                }
            }
        });
        const leadTrack = this.patterns[3];
        if (leadTrack[step]) {
            const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
            const freq = melody[step % melody.length];
            this.audio.playSynth(freq, time, 0.2);
        }
    }

    savePatterns() {
        localStorage.setItem('daw_patterns', JSON.stringify(this.patterns));
    }

    toggleStep(trackIdx, step) {
        this.patterns[trackIdx][step] = !this.patterns[trackIdx][step];
        this.savePatterns();
    }
}

class UI {
    constructor(sequencer, audioEngine) {
        this.seq = sequencer;
        this.audio = audioEngine;
        this.initUI();
        this.drawOscilloscope();
        this.setupEventListeners();
    }

    initUI() {
        const container = document.getElementById('sequencer-grid');
        container.innerHTML = '';
        CONFIG.TRACKS.forEach((track, tIdx) => {
            const row = document.createElement('div');
            row.className = 'track-row';
            const label = document.createElement('div');
            label.className = 'track-label';
            label.textContent = track.name;
            label.style.color = track.color;
            row.appendChild(label);
            for (let s = 0; s < CONFIG.STEPS; s++) {
                const step = document.createElement('div');
                step.className = 'step';
                step.dataset.track = tIdx;
                step.dataset.step = s;
                if (this.seq.patterns[tIdx][s]) step.classList.add('active');
                step.onclick = () => {
                    step.classList.toggle('active');
                    this.seq.toggleStep(tIdx, s);
                };
                row.appendChild(step);
            }
            container.appendChild(row);
        });
        const kb = document.getElementById('keyboard');
        kb.innerHTML = '';
        CONFIG.KEYS.forEach(key => {
            const div = document.createElement('div');
            div.className = `key ${key.type}`;
            div.dataset.note = key.note;
            div.dataset.freq = key.freq;
            kb.appendChild(div);
        });
    }

    setupEventListeners() {
        document.getElementById('play-stop-btn').onclick = e => {
            if (this.seq.isPlaying) {
                this.seq.stop();
                e.target.textContent = 'Play';
                e.target.classList.replace('btn-secondary', 'btn-primary');
            } else {
                this.seq.start();
                e.target.textContent = 'Stop';
                e.target.classList.replace('btn-primary', 'btn-secondary');
                document.getElementById('engine-status').textContent = 'On';
                document.getElementById('engine-status').classList.add('on');
            }
        };
        document.getElementById('bpm-range').oninput = e => {
            this.seq.setBPM(e.target.value);
            document.getElementById('bpm-val').textContent = e.target.value;
        };
        document.getElementById('volume-range').oninput = e => {
            if (this.audio.masterGain) this.audio.masterGain.gain.value = e.target.value;
        };
        document.getElementById('cutoff-range').oninput = e => {
            if (this.audio.filter) this.audio.filter.frequency.setValueAtTime(e.target.value, this.audio.ctx.currentTime);
        };
        window.addEventListener('keydown', e => this.handleKeyDown(e));
        window.addEventListener('keyup', e => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        const code = e.code.toLowerCase();
        const keyId = code.replace('key', '');
        const idx = CONFIG.MAP[keyId];
        if (idx !== undefined) {
            const keyData = CONFIG.KEYS[idx];
            const pianoKey = document.querySelector(`.key[data-note="${keyData.note}"]`);
            if (pianoKey) pianoKey.classList.add('active');
            if (this.audio.masterGain) this.audio.playSynth(parseFloat(keyData.freq), this.audio.ctx.currentTime, 0.5);
        }
    }

    handleKeyUp(e) {
        const code = e.code.toLowerCase();
        const keyId = code.replace('key', '');
        const idx = CONFIG.MAP[keyId];
        if (idx !== undefined) {
            const keyData = CONFIG.KEYS[idx];
            const pianoKey = document.querySelector(`.key[data-note="${keyData.note}"]`);
            if (pianoKey) pianoKey.classList.remove('active');
        }
    }

    drawOscilloscope() {
        const canvas = document.getElementById('oscilloscope');
        const ctx = canvas.getContext('2d');
        const bufferLength = this.audio.analyser ? this.audio.analyser.frequencyBinCount : 0;
        const dataArray = new Uint8Array(bufferLength);
        const draw = () => {
            requestAnimationFrame(draw);
            if (!this.audio.initialized || !this.audio.analyser) return;
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            this.audio.analyser.getByteTimeDomainData(dataArray);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00f2ff';
            ctx.beginPath();
            const sliceWidth = canvas.width / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };
        draw();
    }

    async exportToWav(durationSec = 8) {
        if (!this.audio.initialized) this.audio.init();
        const offlineCtx = new OfflineAudioContext(2, this.audio.ctx.sampleRate * durationSec, this.audio.ctx.sampleRate);
        const offlineEngine = new AudioEngine();
        offlineEngine.ctx = offlineCtx;
        offlineEngine.masterGain = offlineCtx.createGain();
        offlineEngine.filter = offlineCtx.createBiquadFilter();
        offlineEngine.analyser = offlineCtx.createAnalyser();
        offlineEngine.filter.type = 'lowpass';
        offlineEngine.filter.frequency.value = this.audio.filter.frequency.value;
        offlineEngine.filter.Q.value = this.audio.filter.Q.value;
        offlineEngine.masterGain.connect(offlineEngine.filter);
        offlineEngine.filter.connect(offlineEngine.analyser);
        offlineEngine.analyser.connect(offlineCtx.destination);
        offlineEngine.masterGain.gain.value = this.audio.masterGain.gain.value;
        offlineEngine.noiseBuffer = offlineEngine.createNoiseBuffer();
        const seq = new Sequencer(offlineEngine, () => {});
        seq.patterns = JSON.parse(localStorage.getItem('daw_patterns')) || Array(4).fill(0).map(() => Array(16).fill(false));
        const secondsPerBeat = 60.0 / this.seq.bpm;
        for (let bar = 0; bar < Math.ceil(durationSec / (secondsPerBeat * 4)); bar++) {
            for (let step = 0; step < CONFIG.STEPS; step++) {
                const time = bar * CONFIG.STEPS * (secondsPerBeat / 4) + step * (secondsPerBeat / 4);
                seq.scheduleStep(step, time);
            }
        }
        const renderedBuffer = await offlineCtx.startRendering();
        const wavBlob = this.bufferToWav(renderedBuffer);
        const url = URL.createObjectURL(wavBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'daw_recording.wav';
        link.click();
        URL.revokeObjectURL(url);
    }

    bufferToWav(audioBuffer) {
        const numOfChan = audioBuffer.numberOfChannels;
        const length = audioBuffer.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        let offset = 0;
        const writeString = s => {
            for (let i = 0; i < s.length; i++) {
                view.setUint8(offset++, s.charCodeAt(i));
            }
        };
        writeString('RIFF');
        view.setUint32(offset, 36 + audioBuffer.length * numOfChan * 2, true); offset += 4;
        writeString('WAVE');
        writeString('fmt ');
        view.setUint32(offset, 16, true); offset += 4;
        view.setUint16(offset, 1, true); offset += 2;
        view.setUint16(offset, numOfChan, true); offset += 2;
        view.setUint32(offset, audioBuffer.sampleRate, true); offset += 4;
        view.setUint32(offset, audioBuffer.sampleRate * numOfChan * 2, true); offset += 4;
        view.setUint16(offset, numOfChan * 2, true); offset += 2;
        view.setUint16(offset, 16, true); offset += 2;
        writeString('data');
        view.setUint32(offset, audioBuffer.length * numOfChan * 2, true); offset += 4;
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.getChannelData(1);
        const interleaved = new Float32Array(audioBuffer.length * numOfChan);
        if (numOfChan === 2) {
            for (let i = 0; i < audioBuffer.length; i++) {
                interleaved[i * 2] = left[i];
                interleaved[i * 2 + 1] = right[i];
            }
        } else {
            interleaved = left;
        }
        for (let i = 0; i < interleaved.length; i++) {
            let s = Math.max(-1, Math.min(1, interleaved[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); offset += 2;
        }
        return new Blob([buffer], { type: 'audio/wav' });
    }
}

window.onload = () => {
    const audio = new AudioEngine();
    const sequencer = new Sequencer(audio, stepIdx => {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('playing'));
        document.querySelectorAll(`.step[data-step="${stepIdx}"]`).forEach(s => s.classList.add('playing'));
    });
    const ui = new UI(sequencer, audio);
    document.getElementById('export-btn').onclick = async () => {
        if (!sequencer.isPlaying) alert('Start the sequencer before exporting.');
        await ui.exportToWav();
    };
};