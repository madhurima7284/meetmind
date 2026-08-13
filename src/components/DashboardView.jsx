import React from 'react';
import { Plus, Video, Clock, CheckSquare, Sparkles, ChevronRight } from 'lucide-react';

export const DashboardView = ({
  stats,
  recentMeetings,
  onStartMeeting,
  onSelectMeeting,
  isLoading,
}) => {
  const formatMinutes = (seconds) => {
    return Math.round(seconds / 60);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meetings</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time transcripts, summaries, and action items</p>
        </div>

        <button
          onClick={onStartMeeting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Meeting</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Meetings</span>
            <Video className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total_meetings || 0}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Minutes Recorded</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatMinutes(stats?.total_duration_seconds || 0)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Action Items</span>
            <CheckSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total_action_items || 0}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Decisions</span>
            <Sparkles className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total_decisions || 0}</div>
        </div>
      </div>

      {/* Recent Meetings List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Recent Meetings</h2>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading meetings...</div>
        ) : recentMeetings.length === 0 ? (
          <div className="py-12 border border-dashed border-slate-200 rounded-lg text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">No meetings yet.</p>
            <p className="text-xs text-slate-500">Start your first meeting to see it here.</p>
            <button
              onClick={onStartMeeting}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start First Meeting</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentMeetings.slice(0, 5).map((meeting) => (
              <div
                key={meeting.id}
                onClick={() => onSelectMeeting(meeting.id)}
                className="py-4 px-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-sm text-slate-900 group-hover:text-slate-700">
                      {meeting.title}
                    </span>
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

                <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 group-hover:text-slate-900">
                  <span>View</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
