export class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: { [key: string]: AudioBuffer | null } = {};

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
      this.initSounds();
    }
  }

  private initSounds() {
    // create simple beep sounds using Web Audio API
  }

  private createTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine'
  ): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      data[i] = Math.sin(2 * Math.PI * frequency * (i / sampleRate));
      // Apply envelope to avoid clicks
      const envelope = i < numSamples * 0.1 
        ? i / (numSamples * 0.1) 
        : i > numSamples * 0.9 
        ? (numSamples - i) / (numSamples * 0.1) 
        : 1;
      data[i] *= envelope * 0.3;
    }

    return buffer;
  }

  private playSound(buffer: AudioBuffer | null, volume: number = 0.5) {
    if (!this.audioContext || !buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start(0);
  }

  playHit() {
    const buffer = this.createTone(400, 0.05, 'square');
    this.playSound(buffer, 0.2);
  }

  playBrickBreak() {
    // Two-tone sound for brick breaking
    const buffer1 = this.createTone(300, 0.1, 'square');
    const buffer2 = this.createTone(200, 0.15, 'sine');
    
    if (buffer1) this.playSound(buffer1, 0.3);
    setTimeout(() => {
      if (buffer2) this.playSound(buffer2, 0.3);
    }, 50);
  }

  playGameOver() {
    // Low descending tone
    const buffer = this.createTone(150, 0.5, 'sawtooth');
    this.playSound(buffer, 0.4);
  }

  playWin() {
    // Ascending victory sound
    const frequencies = [200, 250, 300, 350, 400];
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const buffer = this.createTone(freq, 0.15, 'sine');
        this.playSound(buffer, 0.3);
      }, index * 100);
    });
  }
}

