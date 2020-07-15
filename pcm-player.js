/*
 * https://github.com/samirkumardas/pcm-player/blob/master/pcm-player.min.js
 * MIT License, Copyright (c) 2018 Samir Das <cse.samir@gmail.com>
 */

function PCMPlayer() {
  this.sampleRate = 44100;
  this.channels = 2;
  this.samples = new Float32Array();
  this.flush = this.flush.bind(this);
  this.interval = setInterval(this.flush, 100);

  this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  this.gainNode = this.audioContext.createGain();
  this.gainNode.gain.value = 1;
  this.gainNode.connect(this.audioContext.destination);
  this.startTime = this.audioContext.currentTime;
};

PCMPlayer.prototype.feed = function(raw) {
  let formetted = this.getFormatedValue(raw);
  let tmp = new Float32Array(this.samples.length + formetted.length);
  tmp.set(this.samples, 0);
  tmp.set(formetted, this.samples.length);
  this.samples = tmp;
};

PCMPlayer.prototype.getFormatedValue = function(raw) {
  let data = new Int16Array(raw.buffer);
  let float32 = new Float32Array(data.length);

  for (let i = 0; i < data.length; i++) {
    float32[i] = data[i] / 32768; // max int16
  }
  return float32;
};

PCMPlayer.prototype.destroy = function() {
  clearInterval(this.interval);
  this.samples = null;
  this.audioContext.close();
  this.audioContext = null;
};

PCMPlayer.prototype.flush = function() {
  if (!this.samples.length) return;
  let bufferSource = this.audioContext.createBufferSource();
  let length = this.samples.length / this.channels;
  let audioBuffer = this.audioContext.createBuffer(this.channels, length, this.sampleRate);

  for (let channel = 0; channel < this.channels; channel++) {
    let audioData = audioBuffer.getChannelData(channel);
    let offset = channel;
    let decrement = 50;
    for (let i = 0; i < length; i++) {
      audioData[i] = this.samples[offset];
      /* fadein */
      if (i < 50) {
        audioData[i] =  (audioData[i] * i) / 50;
      }
      /* fadeout*/
      if (i >= (length - 51)) {
        audioData[i] =  (audioData[i] * decrement--) / 50;
      }
      offset += this.channels;
    }
  }

  if (this.startTime < this.audioContext.currentTime) {
    this.startTime = this.audioContext.currentTime;
  }
  bufferSource.buffer = audioBuffer;
  bufferSource.connect(this.gainNode);
  bufferSource.start(this.startTime);
  this.startTime += audioBuffer.duration;
  this.samples = new Float32Array();
};
