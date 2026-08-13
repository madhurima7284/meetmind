import React, { useState, useEffect, useRef } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { api } from '../services/api';
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  Clock, 
  Loader2,
  FileText,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const NewMeetingView = ({ onMeetingCompleted, onError }) => {
  const [title, setTitle] = useState('Product discussion');
  const [meeting, setMeeting] = useState(null);
  const [segments, setSegments] = useState([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const transcriptContainerRef = useRef(null);

  const handleSegmentReceived = (segment) => {
    setSegments((prev) => {
      if (prev.some((s) => s.id === segment.id)) return prev;
      return [...prev, segment];
    });
  };

  const {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    wsStatus,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useAudioRecorder({
    meetingId: meeting?.id || '',
    onSegmentReceived: handleSegmentReceived,
    onError: (msg) => onError(msg),
  });

  // Auto-scroll transcript container
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [segments, manualInput]);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  };

  const formatTimeOfDay = (isoString) => {
    const date = isoString ? new Date(isoString) : new Date();
    return date.toTimeString().split(' ')[0];
  };

  // Start Meeting handler
  const handleStartMeeting = async () => {
    if (isRecording || isStarting) return;
    setIsStarting(true);
    try {
      const created = await api.createMeeting(title.trim() || 'Product discussion');
      setMeeting(created);
      setIsStarting(false);
      // Wait for state to bind, then start audio
      setTimeout(() => {
        startRecording();
      }, 100);
    } catch (err) {
      setIsStarting(false);
      onError(err.message || 'Failed to initialize meeting session.');
    }
  };

  const handleStopAndAnalyze = async () => {
    stopRecording();
    if (!meeting) return;

    setIsAnalyzing(true);
    try {
      const analyzed = await api.analyzeMeeting(meeting.id);
      setIsAnalyzing(false);
      onMeetingCompleted(analyzed.id);
    } catch (err) {
      setIsAnalyzing(false);
      onError(err.message || 'Analysis failed.');
    }
  };

  const handleAddManualSegment = (e) => {
    e.preventDefault();
    if (!manualInput.trim() || !meeting) return;

    const newSeg = {
      id: `seg_${Date.now()}`,
      meeting_id: meeting.id,
      text: manualInput.trim(),
      start_time: duration,
      end_time: duration + 2,
      speaker: 'Speaker',
      created_at: new Date().toISOString(),
    };

    setSegments((prev) => [...prev, newSeg]);
    setManualInput('');

    // Send segment over WS
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/meetings/${meeting.id}`);
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'text_segment',
            text: newSeg.text,
            speaker: newSeg.speaker,
            start_time: newSeg.start_time,
            end_time: newSeg.end_time,
          })
        );
        setTimeout(() => ws.close(), 500);
      };
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Meeting</h1>
        <p className="text-sm text-slate-500 mt-1">Start recording live audio to transcribe and summarize the discussion.</p>
      </div>

      {/* Top Configuration & Control Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5 flex-1 max-w-xl">
            <label className="text-xs font-semibold text-slate-700">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isRecording || !!meeting}
              placeholder="e.g. Product discussion"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all disabled:opacity-60"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Recording status badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
              <span className={`w-2 h-2 rounded-full ${isRecording ? (isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse') : 'bg-slate-400'}`} />
              <span>{isRecording ? (isPaused ? 'Paused' : '● Recording') : 'Ready to start'}</span>
            </div>

            {/* Timer Clock */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs font-semibold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTimer(duration)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isRecording ? (
              <button
                onClick={handleStartMeeting}
                disabled={isStarting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Start Meeting</span>
                  </>
                )}
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={handleStopAndAnalyze}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Summary & Action Items...</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop Meeting</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Audio Input Level Meter */}
          {isRecording && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-slate-500">Mic Level</span>
              <div className="h-2.5 w-28 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Transcript Stream Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Live Transcript</h2>
          </div>

          {meeting && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>{wsStatus === 'connected' ? 'WebSocket Sync' : 'Connecting WebSocket...'}</span>
            </div>
          )}
        </div>

        {/* Line-by-line Transcript Feed */}
        <div
          ref={transcriptContainerRef}
          className="min-h-[260px] max-h-[420px] overflow-y-auto space-y-4 pr-1 scrollbar-thin"
        >
          {segments.length === 0 ? (
            <div className="py-16 text-center space-y-2 text-slate-400">
              <Mic className="w-6 h-6 mx-auto opacity-40" />
              <p className="text-xs">
                {isRecording
                  ? 'Listening for speech audio...'
                  : 'Click "Start Meeting" to begin live speech transcription.'}
              </p>
            </div>
          ) : (
            segments.map((seg) => (
              <div key={seg.id} className="border-b border-slate-100 pb-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>{formatTimeOfDay(seg.created_at)}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">{seg.speaker || 'Speaker'}:</span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed pl-1">{seg.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Manual note / segment entry input */}
        {meeting && (
          <form onSubmit={handleAddManualSegment} className="flex gap-2 pt-3 border-t border-slate-100">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Type a transcript segment or meeting note manually..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 border border-slate-200 transition-colors cursor-pointer"
            >
              Add Note
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
