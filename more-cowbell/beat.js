/* Cowbell beat for the "When the cowbell had rizz" mixer chart.
   Every sound is synthesized with the Web Audio API (no recordings), and every hit is placed on the
   same clock as the chart animation: 5 s of beat at 120 bpm, then one 950 ms step per decade whose
   two light pulses (at 1/8 and 5/8 of the step) get a cowbell hit each, then a closing flourish. */
(function () {
  const BEAT = 0.5, INTRO = 5, STEP = 0.95;

  function noiseBuffer(ctx) {
    if (ctx.__pugNoise) return ctx.__pugNoise;
    const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0);
    let seed = 7; for (let i = 0; i < d.length; i++) { seed = (seed * 16807) % 2147483647; d[i] = (seed / 2147483647) * 2 - 1; }
    return (ctx.__pugNoise = b);
  }

  // classic two-square-wave cowbell through a band-pass filter
  function cowbell(ctx, out, t, vel, shift) {
    const f = Math.pow(2, (shift || 0) / 12), g = ctx.createGain(), bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 2640 * f; bp.Q.value = 0.9;
    [587, 845].forEach((hz) => { const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = hz * f; o.connect(bp); o.start(t); o.stop(t + 0.5); });
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * vel, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.09 * vel, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    bp.connect(g); g.connect(out);
  }
  function kick(ctx, out, t, vel) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.16);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.95 * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4);
  }
  function snare(ctx, out, t, vel) {
    const n = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    n.buffer = noiseBuffer(ctx); hp.type = "highpass"; hp.frequency.value = 1200;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4 * vel, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    n.connect(hp); hp.connect(g); g.connect(out); n.start(t); n.stop(t + 0.2);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.3 * vel, t + 0.002); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.12);
  }
  function hat(ctx, out, t, vel, len) {
    const n = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    n.buffer = noiseBuffer(ctx); hp.type = "highpass"; hp.frequency.value = 7500;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * vel, t + 0.001); g.gain.exponentialRampToValueAtTime(0.0001, t + (len || 0.05));
    n.connect(hp); hp.connect(g); g.connect(out); n.start(t); n.stop(t + (len || 0.05) + 0.02);
  }
  function crash(ctx, out, t, vel) { hat(ctx, out, t, 1.6 * vel, 1.1); snare(ctx, out, t, 0.5 * vel); }

  /* Schedule the whole piece starting at audio time t0. nDec = number of decades the chart steps through.
     Returns the time (s, relative to t0) when the last sound has died away. */
  function schedule(ctx, out, t0, nDec) {
    const at = (s) => t0 + s;
    // intro: 10 beats in 2.5 bars of 4/4
    for (let b = 0; b < 10; b++) {
      const s = b * BEAT, pos = b % 4;
      if (pos === 0 || pos === 2) kick(ctx, out, at(s), pos === 0 ? 1 : 0.85);   // strong beats = the tall bounces
      if (pos === 1 || pos === 3) snare(ctx, out, at(s), 0.9);
      hat(ctx, out, at(s), 0.7); hat(ctx, out, at(s + BEAT / 2), 1);              // eighth notes, offbeats accented
    }
    // cowbell riff per bar, on eighth-note positions (in beats): 0, 1.5, 2, 3, 3.5
    for (let bar = 0; bar < 2; bar++) [0, 1.5, 2, 3, 3.5].forEach((p, i) => cowbell(ctx, out, at((bar * 4 + p) * BEAT), i === 0 ? 1 : 0.75, i === 4 ? 2 : 0));
    cowbell(ctx, out, at(8 * BEAT), 1, 0); kick(ctx, out, at(8 * BEAT), 1);
    // settle beat: a four-hit cowbell roll leading into the decades
    [0, 0.125, 0.25, 0.375].forEach((q, i) => cowbell(ctx, out, at(9 * BEAT + q), 0.55 + i * 0.15, i));
    crash(ctx, out, at(INTRO), 0.8);
    // decades: kick on each new decade, a cowbell on each of its two light pulses, soft hats between
    for (let i = 0; i < nDec; i++) {
      const s = INTRO + i * STEP, up = i;                        // the cowbell climbs a semitone per decade
      kick(ctx, out, at(s), 0.9);
      cowbell(ctx, out, at(s + STEP / 8), 0.95, up);
      cowbell(ctx, out, at(s + (5 * STEP) / 8), 0.8, up);
      hat(ctx, out, at(s + (3 * STEP) / 8), 0.6); hat(ctx, out, at(s + (7 * STEP) / 8), 0.6);
    }
    // ending: the chart settles on the 1970s
    const e = INTRO + nDec * STEP;
    kick(ctx, out, at(e), 1); crash(ctx, out, at(e), 1);
    cowbell(ctx, out, at(e), 1, 0); cowbell(ctx, out, at(e + 0.125), 0.8, 0);
    return e + 1.2;
  }

  window.PugBeat = { schedule };
})();
