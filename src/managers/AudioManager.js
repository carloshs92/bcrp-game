/**
 * AudioManager - Handles adaptive music and sound effects
 * Music changes based on economic state (calm/tension/crisis)
 */
export default class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.currentMusicState = 'calm';
        
        // We'll use Web Audio API to generate procedural music
        this.audioContext = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for volume control
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.audioContext.destination);
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.audioContext.destination);
            
            console.log('AudioContext created, state:', this.audioContext.state);
            
            // Try to resume audio context (browsers may suspend it)
            if (this.audioContext.state === 'suspended') {
                console.log('AudioContext suspended, will resume on user interaction');
            } else {
                // Start ambient music immediately if allowed
                this.startAmbientMusic();
            }
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }
    
    async resumeAudioContext() {
        if (!this.audioContext) {
            console.error('No audioContext available');
            return;
        }
        
        console.log('resumeAudioContext called, current state:', this.audioContext.state);
        
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('✅ AudioContext resumed successfully, state:', this.audioContext.state);
            } catch (e) {
                console.error('❌ Failed to resume AudioContext:', e);
                return;
            }
        }
        
        // Start music if not already playing
        if (!this.musicOscillators && this.musicEnabled) {
            console.log('Starting music after resume...');
            this.startAmbientMusic();
        }
    }
    
    startAmbientMusic() {
        if (!this.audioContext || !this.musicEnabled) {
            console.log('Cannot start music: audioContext or musicEnabled is false');
            return;
        }
        
        if (this.musicOscillators) {
            console.log('Music already playing');
            return;
        }
        
        console.log('Starting ambient music...');
        // Create a simple ambient drone using oscillators
        this.createAmbientDrone();
    }
    
    createAmbientDrone() {
        console.log('Creating ambient drone...');
        
        // Base drone (low frequency)
        const bass = this.audioContext.createOscillator();
        bass.type = 'sine';
        bass.frequency.value = 55; // A1
        
        const bassGain = this.audioContext.createGain();
        bassGain.gain.value = 0.15;
        bass.connect(bassGain);
        bassGain.connect(this.musicGain);
        
        // Mid drone
        const mid = this.audioContext.createOscillator();
        mid.type = 'triangle';
        mid.frequency.value = 110; // A2
        
        const midGain = this.audioContext.createGain();
        midGain.gain.value = 0.1;
        mid.connect(midGain);
        midGain.connect(this.musicGain);
        
        // High shimmer (modulated)
        const high = this.audioContext.createOscillator();
        high.type = 'sine';
        high.frequency.value = 440; // A4
        
        const highGain = this.audioContext.createGain();
        highGain.gain.value = 0.05;
        high.connect(highGain);
        highGain.connect(this.musicGain);
        
        // LFO for shimmer effect
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = 0.5;
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 20;
        lfo.connect(lfoGain);
        lfoGain.connect(high.frequency);
        
        // Start all oscillators
        bass.start();
        mid.start();
        high.start();
        lfo.start();
        
        console.log('Ambient drone started');
        
        // Store references for state changes
        this.musicOscillators = { bass, mid, high, lfo, bassGain, midGain, highGain };
    }
    
    updateMusicState(economicState) {
        if (!this.audioContext || !this.musicEnabled || !this.musicOscillators) return;
        
        const { inTarget, economicHealth, exchangeRateStable, inflation } = economicState;
        
        let newState = 'calm';
        
        // Determine music state based on inflation and economic health
        if (inflation > 8) {
            newState = 'hyperinflation'; // Superinflación
        } else if (inflation > 5) {
            newState = 'high-inflation'; // Inflación alta
        } else if (inflation < 0.5) {
            newState = 'deflation'; // Deflación
        } else if (economicHealth < 40) {
            newState = 'crisis'; // Crisis general
        } else if (economicHealth < 70 || !inTarget || !exchangeRateStable) {
            newState = 'tension'; // Tensión
        }
        
        // Always transition if state is different
        if (newState !== this.currentMusicState) {
            console.log(`Music state changing: ${this.currentMusicState} → ${newState}`);
            this.transitionMusic(newState);
            this.currentMusicState = newState;
        }
    }
    
    transitionMusic(newState) {
        if (!this.musicOscillators) return;
        
        const now = this.audioContext.currentTime;
        const { bassGain, midGain, highGain, mid, high, lfo } = this.musicOscillators;
        
        switch (newState) {
            case 'calm':
                // Soft, peaceful - economy is stable
                bassGain.gain.linearRampToValueAtTime(0.15, now + 2);
                midGain.gain.linearRampToValueAtTime(0.1, now + 2);
                highGain.gain.linearRampToValueAtTime(0.05, now + 2);
                mid.frequency.linearRampToValueAtTime(110, now + 2); // A2
                high.frequency.linearRampToValueAtTime(440, now + 2); // A4
                lfo.frequency.linearRampToValueAtTime(0.5, now + 2);
                break;
                
            case 'deflation':
                // Cold, slow - prices falling, economy slowing
                bassGain.gain.linearRampToValueAtTime(0.2, now + 1.5);
                midGain.gain.linearRampToValueAtTime(0.08, now + 1.5);
                highGain.gain.linearRampToValueAtTime(0.03, now + 1.5);
                mid.frequency.linearRampToValueAtTime(98, now + 1.5); // Lower, slower
                high.frequency.linearRampToValueAtTime(392, now + 1.5); // G4
                lfo.frequency.linearRampToValueAtTime(0.3, now + 1.5); // Slower shimmer
                break;
                
            case 'tension':
                // More intense, slightly dissonant - economy under pressure
                bassGain.gain.linearRampToValueAtTime(0.2, now + 1);
                midGain.gain.linearRampToValueAtTime(0.15, now + 1);
                highGain.gain.linearRampToValueAtTime(0.08, now + 1);
                mid.frequency.linearRampToValueAtTime(117, now + 1); // Slightly dissonant
                high.frequency.linearRampToValueAtTime(466, now + 1); // Bb4
                lfo.frequency.linearRampToValueAtTime(0.7, now + 1);
                break;
                
            case 'high-inflation':
                // Hot, rising - prices rising fast
                bassGain.gain.linearRampToValueAtTime(0.22, now + 0.8);
                midGain.gain.linearRampToValueAtTime(0.18, now + 0.8);
                highGain.gain.linearRampToValueAtTime(0.12, now + 0.8);
                mid.frequency.linearRampToValueAtTime(123, now + 0.8); // More dissonant
                high.frequency.linearRampToValueAtTime(493, now + 0.8); // B4
                lfo.frequency.linearRampToValueAtTime(1.2, now + 0.8); // Faster shimmer
                break;
                
            case 'hyperinflation':
                // Chaotic, extreme - economy out of control
                bassGain.gain.linearRampToValueAtTime(0.25, now + 0.5);
                midGain.gain.linearRampToValueAtTime(0.22, now + 0.5);
                highGain.gain.linearRampToValueAtTime(0.15, now + 0.5);
                mid.frequency.linearRampToValueAtTime(131, now + 0.5); // Very dissonant
                high.frequency.linearRampToValueAtTime(554, now + 0.5); // C#5
                lfo.frequency.linearRampToValueAtTime(2.0, now + 0.5); // Very fast shimmer
                break;
                
            case 'crisis':
                // Urgent, dramatic - general economic crisis
                bassGain.gain.linearRampToValueAtTime(0.25, now + 0.5);
                midGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
                highGain.gain.linearRampToValueAtTime(0.12, now + 0.5);
                mid.frequency.linearRampToValueAtTime(123, now + 0.5); // Dissonant
                high.frequency.linearRampToValueAtTime(466, now + 0.5); // Tritone
                lfo.frequency.linearRampToValueAtTime(1.5, now + 0.5);
                break;
        }
    }
    
    // Sound effects
    playSliderMove() {
        if (!this.audioContext || !this.sfxEnabled) return;
        
        // Resume audio context on first interaction
        this.resumeAudioContext();
        
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 800;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.1;
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        const now = this.audioContext.currentTime;
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }
    
    playIntervention(type) {
        if (!this.audioContext || !this.sfxEnabled) return;
        
        // Resume audio context on first interaction
        this.resumeAudioContext();
        
        const osc = this.audioContext.createOscillator();
        osc.type = 'square';
        osc.frequency.value = type === 'buy' ? 400 : 600;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.15;
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        const now = this.audioContext.currentTime;
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    playAlert() {
        if (!this.audioContext || !this.sfxEnabled) return;
        
        const osc = this.audioContext.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 880;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.2;
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        const now = this.audioContext.currentTime;
        
        // Siren effect
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.2);
        osc.frequency.linearRampToValueAtTime(880, now + 0.4);
        
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.4);
    }
    
    playSuccess() {
        if (!this.audioContext || !this.sfxEnabled) return;
        
        // Ascending arpeggio
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const gain = this.audioContext.createGain();
            gain.gain.value = 0.15;
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            const now = this.audioContext.currentTime;
            const startTime = now + i * 0.1;
            
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }
    
    toggleMusic() {
        console.log('toggleMusic called, current state:', this.musicEnabled);
        
        // Resume audio context first
        this.resumeAudioContext();
        
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicGain) {
            const targetVolume = this.musicEnabled ? 0.3 : 0;
            this.musicGain.gain.value = targetVolume;
            console.log('Music volume set to:', targetVolume);
        }
        
        // If enabling and no oscillators, start them
        if (this.musicEnabled && !this.musicOscillators) {
            console.log('Music enabled but no oscillators, starting...');
            this.startAmbientMusic();
        }
        
        return this.musicEnabled;
    }
    
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }
}
