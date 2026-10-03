"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  useVoiceRecorder — raw-PCM microphone capture encoded to WAV.      */
/*  The ASR field accepts WAV with certainty, so the hook taps the     */
/*  microphone directly, keeps 16-bit mono PCM frames and wraps them   */
/*  in a canonical WAV header on stop. A live level (0..1) is exposed  */
/*  so composers and the live call can breathe with the voice.         */
/* ------------------------------------------------------------------ */

export type VoiceRecorderError = "unavailable" | "denied" | null;

interface VoiceRecorder {
  recording: boolean;
  /** Live microphone level, 0..1 — drive waveforms with it. */
  level: number;
  error: VoiceRecorderError;
  start: () => Promise<boolean>;
  /** Stops and returns the encoded WAV plus duration in ms. */
  stop: () => Promise<{ wav: Blob; durationMs: number } | null>;
  /** Stops and discards everything recorded. */
  cancel: () => void;
  clearError: () => void;
}

const SAMPLE_RATE = 16000;

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function useVoiceRecorder(): VoiceRecorder {
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<VoiceRecorderError>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const lengthRef = useRef(0);
  const startedAtRef = useRef(0);
  const rafRef = useRef<number>(0);
  const recordingRef = useRef(false);
  /* A start still in flight — stop()/cancel() wait for it, so a quick
     tap can never release the microphone before it has begun. */
  const pendingStartRef = useRef<Promise<boolean> | null>(null);

  const teardown = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    try {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
    } catch {
      /* nodes already gone */
    }
    processorRef.current = null;
    sourceRef.current = null;
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void contextRef.current?.close().catch(() => undefined);
    contextRef.current = null;
    recordingRef.current = false;
    setRecording(false);
    setLevel(0);
  }, []);

  useEffect(() => teardown, [teardown]);

  const start = useCallback(async (): Promise<boolean> => {
    if (recordingRef.current) return true;
    if (pendingStartRef.current) return pendingStartRef.current;
    const attempt = (async () => {
      return await openMicrophone();
    })();
    pendingStartRef.current = attempt;
    attempt.finally(() => {
      if (pendingStartRef.current === attempt) pendingStartRef.current = null;
    });
    return attempt;

    async function openMicrophone(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("unavailable");
      return false;
    }
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) {
      setError("unavailable");
      return false;
    }
    /* The context opens synchronously — before any await — and is
       resumed if the platform wakes it suspended. A context born after
       an await can stay silent on some platforms, which once made the
       live call answer exactly once and then fall forever quiet. */
    const context = new AudioCtor();
    contextRef.current = context;
    try {
      if (context.state === "suspended") {
        await context.resume().catch(() => undefined);
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const contextRate = context.sampleRate;
      if (context.state === "suspended") {
        await context.resume().catch(() => undefined);
      }

      const source = context.createMediaStreamSource(stream);
      sourceRef.current = source;

      /* Downmix to 16 kHz mono for compact, ASR-friendly WAV. */
      const targetRate = SAMPLE_RATE;
      const ratio = contextRate / targetRate;
      const processor = context.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      chunksRef.current = [];
      lengthRef.current = 0;
      startedAtRef.current = Date.now();
      recordingRef.current = true;
      setRecording(true);
      setError(null);

      processor.onaudioprocess = (event) => {
        if (!recordingRef.current) return;
        const input = event.inputBuffer.getChannelData(0);
        if (ratio >= 2) {
          /* simple nearest decimation — plenty for speech */
          const step = Math.round(ratio);
          const out = new Float32Array(Math.ceil(input.length / step));
          for (let i = 0; i < out.length; i++) out[i] = input[i * step] ?? 0;
          chunksRef.current.push(out);
          lengthRef.current += out.length;
        } else {
          const copy = new Float32Array(input.length);
          copy.set(input);
          chunksRef.current.push(copy);
          lengthRef.current += copy.length;
        }
      };
      source.connect(processor);
      processor.connect(context.destination);

      /* live level loop */
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!recordingRef.current || !analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setLevel((prev) => {
          const next = Math.min(1, rms * 3.2);
          return prev + (next - prev) * 0.4;
        });
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      return true;
    } catch (err) {
      teardown();
      setError(
        err instanceof DOMException &&
          (err.name === "NotAllowedError" || err.name === "SecurityError")
          ? "denied"
          : "unavailable"
      );
      return false;
    }
    }
  }, [teardown]);

  const stop = useCallback(async (): Promise<{
    wav: Blob;
    durationMs: number;
  } | null> => {
    /* If the microphone is still opening, wait for it first — a quick
       tap-and-release must still capture everything said from the start. */
    if (pendingStartRef.current) await pendingStartRef.current.catch(() => false);
    if (!recordingRef.current) return null;
    const durationMs = Date.now() - startedAtRef.current;
    const merged = new Float32Array(lengthRef.current);
    let offset = 0;
    for (const chunk of chunksRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    teardown();
    if (merged.length === 0) return null;
    return {
      wav: encodeWav(merged, SAMPLE_RATE),
      durationMs,
    };
  }, [teardown]);

  const cancel = useCallback(() => {
    chunksRef.current = [];
    lengthRef.current = 0;
    void pendingStartRef.current
      ?.catch(() => false)
      .then(() => teardown());
    if (!pendingStartRef.current) teardown();
  }, [teardown]);

  const clearError = useCallback(() => setError(null), []);

  return { recording, level, error, start, stop, cancel, clearError };
}
