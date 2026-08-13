import { useState, useRef, useCallback, useEffect } from 'react';
import { getWebSocketUrl } from '../services/api';

export function useAudioRecorder({ meetingId, onSegmentReceived, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [wsStatus, setWsStatus] = useState('disconnected');

  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  // Initialize WebSocket connection for meeting
  const connectWebSocket = useCallback(() => {
    if (!meetingId) {
      setWsStatus('disconnected');
      return;
    }

    setWsStatus('connecting');

    try {
      const wsUrl = getWebSocketUrl(meetingId);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'transcript_segment' && data.segment) {
            onSegmentReceived?.(data.segment);
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('Meeting WebSocket connection error:', err);
        setWsStatus('disconnected');
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket initialization error:', err);
      setWsStatus('disconnected');
    }
  }, [meetingId, onSegmentReceived]);

  useEffect(() => {
    if (meetingId) {
      connectWebSocket();
    } else {
      setWsStatus('disconnected');
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [meetingId, connectWebSocket]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Audio visualizer setup
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Audio level polling loop
      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
        }
        if (isRecording) {
          requestAnimationFrame(updateLevel);
        }
      };
      requestAnimationFrame(updateLevel);

      // MediaRecorder setup
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mediaRecorder = new MediaRecorder(
        stream,
        MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined
      );

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then((buffer) => {
            wsRef.current?.send(buffer);
          });
        }
      };

      mediaRecorder.start(2000); // Send audio chunk every 2 seconds
      mediaRecorderRef.current = mediaRecorder;

      // Web Speech API fallback for live transcript text in browser
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (e) => {
          const currentResultIndex = e.resultIndex;
          const transcriptText = e.results[currentResultIndex][0].transcript.trim();

          if (transcriptText && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'text_segment',
                text: transcriptText,
                speaker: 'Speaker',
                start_time: duration,
                end_time: duration + 2,
              })
            );
          }
        };

        recognition.onerror = (e) => {
          console.warn('Speech recognition warning:', e.error);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      }

      setIsRecording(true);
      setIsPaused(false);

      // Start duration timer
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;
          if (wsRef.current?.readyState === WebSocket.OPEN && next % 5 === 0) {
            wsRef.current.send(
              JSON.stringify({
                type: 'update_duration',
                duration: next,
              })
            );
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        onError?.('Microphone permission denied. Please allow microphone access in browser settings.');
      } else {
        onError?.('Failed to access microphone audio device.');
      }
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      if (speechRecognitionRef.current) speechRecognitionRef.current.start();
      timerRef.current = window.setInterval(() => setDuration((prev) => prev + 1), 1000);
      setIsPaused(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);
    setIsPaused(false);
    setAudioLevel(0);
  };

  return {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    wsStatus,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
