'use client';
import { useRef, useState } from 'react';
import { FORMAT_META } from '@/lib/prompts';

const FORMATS = Object.entries(FORMAT_META).map(([id, meta]) => ({ id, ...meta }));

function extractFrames(file, numFrames = 10) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      const interval = duration / (numFrames + 1);
      const frames = [];
      let captured = 0;

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');

      const captureAt = (time) =>
        new Promise((res) => {
          video.currentTime = time;
          video.addEventListener(
            'seeked',
            () => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
              frames.push(data);
              captured++;
              res();
            },
            { once: true }
          );
        });

      const times = Array.from({ length: numFrames }, (_, i) => interval * (i + 1));

      (async () => {
        for (const t of times) await captureAt(t);
        URL.revokeObjectURL(url);
        resolve(frames);
      })();
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load video'));
    });
  });
}

export default function StepContent({ content, fmt, onContentChange, onFmtChange, onBack, onNext }) {
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const imgRef = useRef(null);
  const vidRef = useRef(null);

