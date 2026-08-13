import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckSquare, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Trash2,
  Loader2
} from 'lucide-react';

export const MeetingDetailView = ({
  meeting,
  onBack,
  onMeetingUpdated,
  onDeleteMeeting,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

  const handleToggleAction = async (itemId) => {
    try {
      const updatedItem = await api.toggleActionItem(itemId);
      const updatedActionItems = (meeting.action_items || []).map((ai) =>
        ai.id === itemId ? { ...ai, status: updatedItem.status } : ai
      );
      onMeetingUpdated({ ...meeting, action_items: updatedActionItems });
    } catch (err) {
      onError('Failed to update action item status.');
    }
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      const updated = await api.analyzeMeeting(meeting.id);
      onMeetingUpdated(updated);
    } catch (err) {
      onError('Gemini analysis failed.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleCopySummary = () => {
    if (meeting.summary) {
      navigator.clipboard.writeText(meeting.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(meeting, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${meeting.title.replace(/\s+/g, '_')}_summary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{meeting.title}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>{new Date(meeting.created_at).toLocaleString()}</span>
              <span>•</span>
              <span>{formatTimer(meeting.duration_seconds)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isReanalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Re-Analyze</span>
          </button>

          <button
            onClick={handleDownloadExport}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Download JSON Export"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDeleteMeeting(meeting.id)}
            className="p-2 rounded-lg bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
            title="Delete Meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Meeting Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'actions'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Action Items ({meeting.action_items?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'decisions'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Key Decisions ({meeting.decisions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'transcript'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Transcript ({meeting.segments?.length || 0})</span>
        </button>
      </div>

      {/* TAB CONTENT: SUMMARY */}
      {activeTab === 'summary' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Meeting Summary
            </h2>
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-4">
            {meeting.summary || 'No summary generated yet.'}
          </p>
        </div>
      )}

      {/* TAB CONTENT: ACTION ITEMS TABLE */}
      {activeTab === 'actions' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Action Items
          </h2>

          {!meeting.action_items || meeting.action_items.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No action items found for this meeting.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                  {meeting.action_items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleToggleAction(item.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 w-12">
                        <input
                          type="checkbox"
                          checked={item.status === 'completed'}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className={`py-3 px-4 font-medium ${item.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {item.task}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.owner || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.deadline || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DECISIONS */}
      {activeTab === 'decisions' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Key Decisions
          </h2>

          {!meeting.decisions || meeting.decisions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No decisions recorded for this meeting.
            </div>
          ) : (
            <div className="space-y-2">
              {meeting.decisions.map((dec) => (
                <div key={dec.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs sm:text-sm text-slate-800 flex items-start gap-3">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{dec.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TRANSCRIPT */}
      {activeTab === 'transcript' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Transcript
          </h2>

          {!meeting.segments || meeting.segments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No transcript segments found.
            </div>
          ) : (
            <div className="space-y-3">
              {meeting.segments.map((seg) => (
                <div key={seg.id} className="border-b border-slate-100 pb-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="font-semibold text-slate-700">{seg.speaker || 'Speaker'}:</span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed pl-1">{seg.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
