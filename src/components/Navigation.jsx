import React from 'react';
import { LayoutDashboard, Plus, History } from 'lucide-react';

export const Navigation = ({
  activeTab,
  setActiveTab,
  isMeetingActive,
  connectionState,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Subtitle */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-tight">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base tracking-tight">MeetMind</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Meeting Assistant</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Meetings</span>
          </button>

          <button
            onClick={() => setActiveTab('new-meeting')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all relative ${
              activeTab === 'new-meeting'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Meeting</span>
            {isMeetingActive && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'history' || activeTab === 'detail'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </nav>

        {/* System Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium">
          {connectionState === 'connected' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-700">● Connected</span>
            </>
          )}
          {connectionState === 'connecting' && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-slate-700">Connecting...</span>
            </>
          )}
          {connectionState === 'disconnected' && (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="text-slate-600">● Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
