import React, { useState } from 'react';
import { Search, Trash2, ChevronRight, Video } from 'lucide-react';

export const MeetingHistoryView = ({
  meetings,
  onSelectMeeting,
  onDeleteMeeting,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const formatMinutes = (seconds) => {
    return Math.round(seconds / 60);
  };

  const filteredMeetings = meetings.filter((m) => {
    return (
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.summary || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meeting History</h1>
          <p className="text-sm text-slate-500 mt-1">Review past transcripts, summaries, and action items.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading meetings...</div>
        ) : filteredMeetings.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-slate-400">
            <Video className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs">No matching meetings found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="py-4 flex items-center justify-between gap-4 group"
              >
                <div
                  onClick={() => onSelectMeeting(meeting.id)}
                  className="space-y-1 flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-sm text-slate-900 group-hover:text-slate-700 transition-colors">
                      {meeting.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                        meeting.status === 'completed'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {meeting.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {meeting.summary || 'Click to view transcript and meeting analysis.'}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span>{new Date(meeting.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{formatMinutes(meeting.duration_seconds)} min</span>
                    <span>•</span>
                    <span>{meeting.action_items?.length || 0} Action Items</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectMeeting(meeting.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>View</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMeeting(meeting.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete Meeting"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
