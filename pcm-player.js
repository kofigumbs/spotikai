"use strict";

/*
 * https://github.com/samirkumardas/pcm-player/blob/master/pcm-player.min.js
 * MIT License, Copyright (c) 2018 Samir Das <cse.samir@gmail.com>
 */

const CHANNELS = 2;
const SAMPLE_RATE = 44100;
const MAX_INT16 = 32768;

function PCMPlayer() {
  this.samples = new Float32Array();
  this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  this.startTime = this.audioContext.currentTime;

  requestAnimationFrame(this.flush.bind(this));
};

PCMPlayer.prototype.feed = function(raw) {
  let data = new Int16Array(raw.buffer);
  let formatted = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    formatted[i] = data[i] / MAX_INT16;
  }

  let tmp = new Float32Array(this.samples.length + formatted.length);
  tmp.set(this.samples, 0);
  tmp.set(formatted, this.samples.length);
  this.samples = tmp;
};

PCMPlayer.prototype.flush = function() {
  requestAnimationFrame(this.flush.bind(this));

  if (!this.samples.length) return;
  let bufferSource = this.audioContext.createBufferSource();
  let length = this.samples.length / CHANNELS;
  let audioBuffer = this.audioContext.createBuffer(CHANNELS, length, SAMPLE_RATE);

  for (let channel = 0; channel < CHANNELS; channel++) {
    let audioData = audioBuffer.getChannelData(channel);
    let offset = channel;
    let decrement = 50;
    for (let i = 0; i < length; i++) {
      audioData[i] = this.samples[offset];
      /* fadein */
      if (i < 50) {
        audioData[i] = (audioData[i] * i) / 50;
      }
      /* fadeout*/
      if (i >= (length - 51)) {
        audioData[i] = (audioData[i] * decrement--) / 50;
      }
      offset += CHANNELS;
    }
  }

  if (this.startTime < this.audioContext.currentTime) {
    this.startTime = this.audioContext.currentTime;
  }
  bufferSource.buffer = audioBuffer;
  bufferSource.connect(this.audioContext.destination);
  bufferSource.start(this.startTime);
  this.startTime += audioBuffer.duration;
  this.samples = new Float32Array();
};
