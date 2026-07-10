// audio.js - Utilitário para gerar sons sintéticos (Web Audio API)

let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Cria um buffer de ruído (white noise)
function createNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function playSwish() {
  const ctx = getContext();
  const noiseBuffer = createNoiseBuffer(ctx);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;

  const gainNode = ctx.createGain();
  // Envelope for swish
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  noiseSource.start();
  noiseSource.stop(ctx.currentTime + 0.5);
}

export function playBuzzer() {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.value = 120; // Harsh low freq
  
  osc2.type = 'square';
  osc2.frequency.value = 123; // Slightly detuned

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.8);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);

  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc2.start();
  osc.stop(ctx.currentTime + 1);
  osc2.stop(ctx.currentTime + 1);
}

export function playCrowd(isCheer) {
  const ctx = getContext();
  const noiseBuffer = createNoiseBuffer(ctx);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  
  if (isCheer) {
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 1);
  } else {
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 1.5);
  }

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  
  if (isCheer) {
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
    noiseSource.stop(ctx.currentTime + 2);
  } else {
    // Groan
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    noiseSource.stop(ctx.currentTime + 1.5);
  }

  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  noiseSource.start();
}

export function playDribble() {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}
