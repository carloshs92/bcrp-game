/**
 * Música adaptativa procedural (Web Audio, sin archivos) con timbres andinos:
 * quena (soplo con vibrato), charango (cuerda pulsada doble), bombo legüero y cajón.
 *
 * Estados: 'title' | 'decision' | 'announce' | 'good' | 'bad' | 'surprise' | 'victory' | 'defeat'.
 * `setMood()` hace un fundido entre estados; los one-shots ('announce') vuelven solos al silencio.
 */

const KEY = 'bcrp-music-on';
// Pentatónica menor de La (típica del huayno) y mayor de Do, en Hz por grado.
const note = (midi) => 440 * 2 ** ((midi - 69) / 12);
const A_MINOR_PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81];
const C_MAJOR_PENTA = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];

// Patrones por estado: tempo, acordes de charango (grados MIDI), melodía de quena y percusión.
const MOODS = {
    title: {
        bpm: 76, scale: A_MINOR_PENTA,
        chords: [[57, 64, 69], [55, 62, 67], [60, 64, 67], [57, 64, 69]],
        melody: [5, null, 7, 6, 5, null, 3, null, 4, null, 5, 3, 2, null, null, null],
        bombo: [1, 0, 0, 0, 0, 0, 1, 0], cajon: [0, 0, 0, 0, 0, 0, 0, 0], strum: 2, gain: 0.5
    },
    decision: {
        bpm: 88, scale: A_MINOR_PENTA,
        chords: [[57, 64, 69], [57, 64, 69], [55, 62, 67], [52, 59, 64]],
        melody: [null, null, null, null, 5, null, 4, 3, null, null, null, null, 2, null, 3, null],
        bombo: [1, 0, 0, 1, 1, 0, 0, 0], cajon: [0, 0, 1, 0, 0, 0, 1, 0], strum: 4, gain: 0.42
    },
    good: {
        bpm: 104, scale: C_MAJOR_PENTA,
        chords: [[60, 64, 67], [55, 62, 67], [57, 60, 64], [55, 62, 67]],
        melody: [5, 6, 7, null, 6, 5, 3, null, 4, 5, 6, null, 5, null, null, null],
        bombo: [1, 0, 1, 0, 1, 0, 1, 0], cajon: [0, 1, 0, 1, 0, 1, 0, 1], strum: 8, gain: 0.5
    },
    bad: {
        bpm: 70, scale: A_MINOR_PENTA,
        chords: [[57, 60, 64], [53, 60, 65], [52, 59, 64], [52, 56, 64]],
        melody: [4, null, null, 3, 2, null, null, null, 1, null, 2, null, 0, null, null, null],
        bombo: [1, 0, 0, 0, 1, 0, 0, 0], cajon: [0, 0, 0, 0, 0, 0, 0, 0], strum: 1, gain: 0.45
    },
    surprise: {
        bpm: 138, scale: A_MINOR_PENTA,
        chords: [[57, 63, 69], [57, 63, 69], [56, 62, 68], [56, 62, 68]],
        melody: [8, null, 8, 7, null, 8, null, null, 6, null, 6, 5, null, 6, null, null],
        bombo: [1, 0, 1, 0, 1, 0, 1, 1], cajon: [1, 1, 0, 1, 1, 1, 0, 1], strum: 8, gain: 0.45
    },
    victory: {
        bpm: 116, scale: C_MAJOR_PENTA,
        chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]],
        melody: [5, 6, 7, 8, 7, 6, 5, null, 6, 7, 8, 9, 8, null, null, null],
        bombo: [1, 0, 1, 1, 1, 0, 1, 1], cajon: [0, 1, 0, 1, 0, 1, 1, 1], strum: 8, gain: 0.55
    },
    defeat: {
        bpm: 60, scale: A_MINOR_PENTA,
        chords: [[57, 60, 64], [53, 57, 60], [52, 55, 59], [45, 52, 57]],
        melody: [4, null, 3, null, 2, null, null, null, 1, null, null, null, 0, null, null, null],
        bombo: [1, 0, 0, 0, 0, 0, 0, 0], cajon: [0, 0, 0, 0, 0, 0, 0, 0], strum: 1, gain: 0.4
    }
};

class Music {
    constructor() {
        this.ctx = null;
        this.mood = null;
        this.pending = 'title';
        this.step = 0;
        this.timer = null;
        this.nextTime = 0;
        try { this.enabled = localStorage.getItem(KEY) !== '0'; } catch { this.enabled = true; }
    }

    /** Debe llamarse desde un gesto del usuario (clic o tecla). */
    unlock() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.enabled ? 0.6 : 0;
        // Reverb corta (eco de quebrada) con un retardo realimentado.
        this.delay = this.ctx.createDelay();
        this.delay.delayTime.value = 0.23;
        const fb = this.ctx.createGain();
        fb.gain.value = 0.28;
        const wet = this.ctx.createGain();
        wet.gain.value = 0.25;
        this.delay.connect(fb).connect(this.delay);
        this.delay.connect(wet).connect(this.master);
        this.bus = this.ctx.createGain();
        this.bus.connect(this.master);
        this.bus.connect(this.delay);
        this.master.connect(this.ctx.destination);
        this.noise = this.makeNoise();
        this.setMood(this.pending);
    }

    toggle() {
        this.enabled = !this.enabled;
        try { localStorage.setItem(KEY, this.enabled ? '1' : '0'); } catch { /* sin almacenamiento */ }
        if (this.master) this.master.gain.setTargetAtTime(this.enabled ? 0.6 : 0, this.ctx.currentTime, 0.2);
        return this.enabled;
    }

    setMood(mood) {
        this.pending = mood;
        if (!this.ctx || mood === this.mood) return;
        this.mood = mood;
        clearInterval(this.timer);
        // Fundido: baja el bus, reinicia el patrón y vuelve a subir.
        const t = this.ctx.currentTime;
        this.bus.gain.cancelScheduledValues(t);
        this.bus.gain.setTargetAtTime(0.0001, t, 0.08);
        this.bus.gain.setTargetAtTime(MOODS[mood]?.gain ?? 0.5, t + 0.3, 0.2);
        if (mood === 'announce') return this.playAnnounce(t + 0.05);
        this.step = 0;
        this.nextTime = t + 0.35;
        this.timer = setInterval(() => this.schedule(), 60);
    }

    schedule() {
        const m = MOODS[this.mood];
        if (!m) return;
        const sixteenth = 60 / m.bpm / 4;
        while (this.nextTime < this.ctx.currentTime + 0.25) {
            const s = this.step % 64;
            const beat8 = (s / 2) % 8;
            const bar = Math.floor(s / 16) % m.chords.length;
            if (s % 2 === 0) {
                if (m.bombo[beat8]) this.bombo(this.nextTime);
                if (m.cajon[beat8]) this.cajon(this.nextTime);
            }
            // Rasgueo de charango: más rasgueos por compás = más energía.
            if (s % (16 / m.strum) === 0) this.charango(m.chords[bar], this.nextTime, s % 4 === 0 ? 1 : 0.6);
            const deg = m.melody[s % 16];
            if (deg != null && Math.floor(s / 16) % 2 === 1) this.quena(note(m.scale[deg] + 12), this.nextTime, sixteenth * 3);
            this.nextTime += sixteenth;
            this.step++;
        }
    }

    // Redoble creciente de bombo + acorde final: la tensión del anuncio.
    playAnnounce(t0) {
        let t = t0;
        for (let i = 0; i < 14; i++) {
            const gap = 0.22 * Math.pow(0.86, i);
            this.bombo(t, 0.35 + i * 0.05);
            if (i > 6) this.cajon(t, 0.5);
            t += gap;
        }
        [57, 64, 69, 72].forEach(n => this.quena(note(n + 12), t, 1.2, 0.18));
        this.charango([57, 64, 69], t, 1);
    }

    /** Golpe de "última hora": acorde disonante corto. */
    sting() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + 0.02;
        [57, 63, 70].forEach(n => this.quena(note(n + 12), t, 0.5, 0.2));
        this.bombo(t, 1);
        this.bombo(t + 0.12, 0.8);
    }

    click() {
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        o.connect(g).connect(this.master);
        o.start(t);
        o.stop(t + 0.07);
    }

    // ---------- Instrumentos ----------
    quena(freq, t, dur, vol = 0.12) {
        const c = this.ctx;
        const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        lfo.frequency.value = 5.5;
        lg.gain.value = freq * 0.012;
        lfo.connect(lg).connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.07);
        g.gain.setValueAtTime(vol * 0.85, t + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(this.bus);
        // Soplo: un poco de ruido filtrado al inicio.
        const n = c.createBufferSource(), nf = c.createBiquadFilter(), ng = c.createGain();
        n.buffer = this.noise;
        nf.type = 'bandpass';
        nf.frequency.value = freq * 2;
        ng.gain.setValueAtTime(vol * 0.25, t);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        n.connect(nf).connect(ng).connect(this.bus);
        [o, lfo].forEach(x => { x.start(t); x.stop(t + dur + 0.05); });
        n.start(t);
        n.stop(t + 0.15);
    }

    charango(chord, t, vol = 1) {
        const c = this.ctx;
        chord.forEach((m, i) => {
            // Cuerdas dobles: dos osciladores levemente desafinados, ataque seco.
            [0, 4].forEach(det => {
                const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
                o.type = 'sawtooth';
                o.frequency.value = note(m + 12);
                o.detune.value = det;
                f.type = 'lowpass';
                f.frequency.setValueAtTime(3200, t + i * 0.012);
                f.frequency.exponentialRampToValueAtTime(700, t + i * 0.012 + 0.25);
                const st = t + i * 0.012;
                g.gain.setValueAtTime(0.0001, st);
                g.gain.linearRampToValueAtTime(0.03 * vol, st + 0.004);
                g.gain.exponentialRampToValueAtTime(0.0001, st + 0.5);
                o.connect(f).connect(g).connect(this.bus);
                o.start(st);
                o.stop(st + 0.55);
            });
        });
    }

    bombo(t, vol = 1) {
        const c = this.ctx;
        const o = c.createOscillator(), g = c.createGain();
        o.frequency.setValueAtTime(110, t);
        o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
        g.gain.setValueAtTime(0.5 * vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g).connect(this.bus);
        o.start(t);
        o.stop(t + 0.4);
    }

    cajon(t, vol = 1) {
        const c = this.ctx;
        const n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        n.buffer = this.noise;
        f.type = 'bandpass';
        f.frequency.value = 1800;
        f.Q.value = 0.8;
        g.gain.setValueAtTime(0.22 * vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        n.connect(f).connect(g).connect(this.bus);
        n.start(t);
        n.stop(t + 0.1);
    }

    makeNoise() {
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return buf;
    }
}

export const music = new Music();

// El audio del navegador solo arranca tras un gesto del usuario.
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => music.unlock(), { capture: true }));

/** Botón de música para la barra superior. */
export function musicButton() {
    return `<button class="btn btn-ghost" data-music aria-pressed="${music.enabled}">${music.enabled ? 'Música: sí' : 'Música: no'}</button>`;
}

export function bindMusicButton(root) {
    root.querySelector('[data-music]')?.addEventListener('click', e => {
        const on = music.toggle();
        e.currentTarget.textContent = on ? 'Música: sí' : 'Música: no';
        e.currentTarget.setAttribute('aria-pressed', on);
    });
}
