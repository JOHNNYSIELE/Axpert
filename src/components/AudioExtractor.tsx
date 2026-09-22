/**
 * @file src/components/AudioExtractor.tsx
 * Video Audio Extractor Module for AXpert.
 * Extracts high-fidelity audio streams (WAV 16-bit PCM, MP3, AAC, FLAC, OGG) from video files.
 */

import React, { useState, useRef } from 'react';
import {
  Music,
  Upload,
  Play,
  Pause,
  Download,
  Volume2,
  RefreshCw,
  Film,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Radio
} from 'lucide-react';
import { AudioExtractionOptions, AudioExtractionResult } from '../types';
import { extractAudioFromVideo } from '../services/audioExtractor';
import { formatFileSize } from '../services/fileService';

export const AudioExtractor: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [result, setResult] = useState<AudioExtractionResult | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Audio options
  const [options, setOptions] = useState<AudioExtractionOptions>({
    format: 'wav',
    bitrate: '320k',
    channels: 2,
    sampleRate: 44100,
    normalize: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadVideoFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (
        file.type.startsWith('video/') ||
        /\.(mp4|mkv|mov|webm|avi|flv|wmv|m4v)$/i.test(file.name)
      ) {
        loadVideoFile(file);
      } else {
        setErrorMessage('Please provide a valid video file (.mp4, .mov, .webm, .mkv, .avi).');
      }
    }
  };

  const loadVideoFile = (file: File) => {
    setSelectedVideo(file);
    setResult(null);
    setErrorMessage(null);
    setProgress(0);
    setProgressStage('');

    try {
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    } catch {
      setVideoPreviewUrl(null);
    }
  };

  const handleExtractAudio = async () => {
    if (!selectedVideo) return;

    setIsExtracting(true);
    setErrorMessage(null);
    setProgress(10);
    setProgressStage('Initializing audio demuxer...');

    try {
      const res = await extractAudioFromVideo(selectedVideo, options, (p, stage) => {
        setProgress(p);
        setProgressStage(stage);
      });
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to extract audio stream';
      setErrorMessage(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.audioUrl;
    link.download = result.outputFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setSelectedVideo(null);
    setVideoPreviewUrl(null);
    setResult(null);
    setIsPlaying(false);
    setProgress(0);
    setProgressStage('');
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div id="audio-extractor-view" className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mov,.mkv,.webm,.avi,.flv,.wmv,.m4v"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Music className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Audio Extractor from Video
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              PCM DEMUXER
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Demux and resample sound tracks from MP4, WebM, MOV, and MKV video files
          </p>
        </div>

        {selectedVideo && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Select Different Video
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: DROPZONE / INPUT SELECTOR */}
      {!selectedVideo ? (
        <div
          id="audio-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectFile}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-950/30'
              : 'border-slate-700/80 bg-slate-900/50 hover:border-cyan-500/60 hover:bg-slate-900/80'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700 mx-auto flex items-center justify-center text-cyan-400 mb-4 shadow-md">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 uppercase tracking-wide">
            CLICK OR DROP VIDEO FILE FOR AUDIO EXTRACTION
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Supports MP4, MOV, WebM, MKV, AVI video containers
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300">
              Extract to: WAV (Lossless PCM)
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              MP3 / AAC / OGG
            </span>
          </div>
        </div>
      ) : (
        /* Video Selected Details Card */
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400 flex items-center justify-center shrink-0">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 font-mono">
                {selectedVideo.name}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {formatFileSize(selectedVideo.size)} • {selectedVideo.type || 'video/mp4'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-cyan-300 text-xs font-mono border border-slate-700 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              Soundtrack Demux Ready
            </span>
          </div>
        </div>
      )}

      {/* STEP 2: EXTRACTION OPTIONS CONFIGURATION */}
      {selectedVideo && !result && (
        <section aria-label="Audio Configuration" className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Target Audio Stream Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            {/* Output Format */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold block uppercase">
                Target Format
              </label>
              <select
                value={options.format}
                onChange={(e) =>
                  setOptions({ ...options, format: e.target.value as AudioExtractionOptions['format'] })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="wav">WAV — 16-bit PCM (Lossless)</option>
                <option value="mp3">MP3 — MPEG Layer-3</option>
                <option value="aac">AAC — Advanced Audio Coding</option>
                <option value="flac">FLAC — Free Lossless Audio</option>
                <option value="ogg">OGG — Ogg Vorbis</option>
              </select>
            </div>

            {/* Bitrate */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold block uppercase">
                Bitrate Quality
              </label>
              <select
                value={options.bitrate}
                onChange={(e) =>
                  setOptions({ ...options, bitrate: e.target.value as AudioExtractionOptions['bitrate'] })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="pcm16">PCM (Uncompressed Studio)</option>
                <option value="320k">320 kbps (High Fidelity)</option>
                <option value="192k">192 kbps (Standard HQ)</option>
                <option value="128k">128 kbps (Voice / Podcast)</option>
              </select>
            </div>

            {/* Channels */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold block uppercase">
                Channels
              </label>
              <select
                value={options.channels}
                onChange={(e) =>
                  setOptions({ ...options, channels: Number(e.target.value) as 1 | 2 })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value={2}>Stereo (2 Channels)</option>
                <option value={1}>Mono (Single Channel)</option>
              </select>
            </div>

            {/* Sample Rate */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold block uppercase">
                Sample Rate
              </label>
              <select
                value={options.sampleRate}
                onChange={(e) =>
                  setOptions({ ...options, sampleRate: Number(e.target.value) as 44100 | 48000 })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value={44100}>44,100 Hz (CD Standard)</option>
                <option value={48000}>48,000 Hz (Video Standard)</option>
              </select>
            </div>
          </div>

          {/* Peak Normalization Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200">Volume Peak Normalization</div>
              <div className="text-[11px] text-slate-400">
                Optimizes waveform amplitude to -0.5 dB to prevent digital clipping
              </div>
            </div>
            <input
              type="checkbox"
              checked={options.normalize}
              onChange={(e) => setOptions({ ...options, normalize: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 cursor-pointer rounded"
            />
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              id="btn-start-audio-extraction"
              type="button"
              disabled={isExtracting}
              onClick={handleExtractAudio}
              className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/30 active:scale-[0.99]"
            >
              <Music className="w-4 h-4" />
              <span>{isExtracting ? 'EXTRACTING AUDIO STREAM...' : 'EXTRACT AUDIO FROM VIDEO'}</span>
            </button>
          </div>
        </section>
      )}

      {/* EXTRACTION PROGRESS */}
      {isExtracting && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-800/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 animate-spin">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-100 font-mono">
                  Demuxing Audio Track
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {options.format.toUpperCase()} • {options.sampleRate}Hz • {options.channels === 2 ? 'Stereo' : 'Mono'}
                </div>
              </div>
            </div>
            <span className="text-sm font-bold font-mono text-cyan-400">{progress}%</span>
          </div>

          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{progressStage}</span>
          </div>
        </div>
      )}

      {/* STEP 3: AUDIO EXTRACTION RESULT & PLAYBACK */}
      {result && (
        <section aria-label="Audio Extraction Results" className="p-6 rounded-2xl bg-slate-900 border border-emerald-800/60 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-base font-bold text-slate-100 font-mono">
                  Audio Extraction Succeeded
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Extracted from {result.sourceFileName}
                </div>
              </div>
            </div>

            <button
              id="btn-download-audio"
              type="button"
              onClick={handleDownload}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/30 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD AUDIO ({result.format.toUpperCase()})</span>
            </button>
          </div>

          {/* Hidden HTML5 Audio Element */}
          <audio
            ref={audioRef}
            src={result.audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Interactive Player & Waveform Visualizer */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="w-12 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-950/40 transition-transform active:scale-95"
                  title={isPlaying ? 'Pause' : 'Play extracted audio'}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
                <div>
                  <div className="text-sm font-semibold text-slate-200 font-mono">
                    {result.outputFileName}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {result.durationSeconds.toFixed(1)}s • {formatFileSize(result.outputSize)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>{isPlaying ? 'PLAYING PREVIEW' : 'READY TO PLAY'}</span>
              </div>
            </div>

            {/* Waveform Bar Graphic */}
            <div className="h-16 flex items-center gap-1 px-2 bg-slate-900/60 rounded-lg border border-slate-800/80 overflow-hidden">
              {result.waveformPeaks.map((peak, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-all duration-150 ${
                    isPlaying
                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-300 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-700'
                  }`}
                  style={{
                    height: `${Math.max(12, peak * (isPlaying ? 100 : 70))}%`,
                    opacity: isPlaying ? 0.9 : 0.5
                  }}
                />
              ))}
            </div>
          </div>

          {/* Stream Properties Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Encoding</span>
              <span className="text-slate-200 font-semibold">{result.format.toUpperCase()} PCM</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Duration</span>
              <span className="text-slate-200 font-semibold">{result.durationSeconds.toFixed(2)} sec</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Sample Rate</span>
              <span className="text-slate-200 font-semibold">{result.sampleRate.toLocaleString()} Hz</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Channels</span>
              <span className="text-slate-200 font-semibold">
                {result.channels === 2 ? 'Stereo (2.0)' : 'Mono (1.0)'}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
