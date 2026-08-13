import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { NewMeetingView } from './components/NewMeetingView';
import { MeetingDetailView } from './components/MeetingDetailView';
import { MeetingHistoryView } from './components/MeetingHistoryView';
import { useWebSocketStatus } from './hooks/useWebSocketStatus';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const connectionState = useWebSocketStatus();

  // Fetch stats and meetings
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, meetingsData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getMeetings().catch(() => []),
      ]);
      if (statsData) setStats(statsData);
      setMeetings(meetingsData);
    } catch (err) {
      setErrorMessage('Failed to connect to backend server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectMeeting = async (meetingId) => {
    setIsLoading(true);
    try {
      const meeting = await api.getMeeting(meetingId);
      setSelectedMeeting(meeting);
      setActiveTab('detail');
    } catch (err) {
      setErrorMessage('Failed to load meeting details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      await api.deleteMeeting(meetingId);
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(null);
        setActiveTab('dashboard');
      }
      fetchData();
    } catch (err) {
      setErrorMessage('Failed to delete meeting.');
    }
  };

  const handleMeetingCompleted = (meetingId) => {
    fetchData();
    handleSelectMeeting(meetingId);
  };

  const handleMeetingUpdated = (updatedMeeting) => {
    setSelectedMeeting(updatedMeeting);
    setMeetings((prev) => prev.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m)));
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      {/* Navigation Header */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'detail') setSelectedMeeting(null);
          setActiveTab(tab);
          fetchData();
        }}
        isMeetingActive={activeTab === 'new-meeting'}
        connectionState={connectionState}
      />

      {/* Global Error Alert Banner */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-red-100 rounded-md transition-colors text-red-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            recentMeetings={meetings}
            onStartMeeting={() => setActiveTab('new-meeting')}
            onSelectMeeting={handleSelectMeeting}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'new-meeting' && (
          <NewMeetingView
            onMeetingCompleted={handleMeetingCompleted}
            onError={(msg) => setErrorMessage(msg)}
          />
        )}

        {activeTab === 'detail' && selectedMeeting && (
          <MeetingDetailView
            meeting={selectedMeeting}
            onBack={() => setActiveTab('dashboard')}
            onMeetingUpdated={handleMeetingUpdated}
            onDeleteMeeting={handleDeleteMeeting}
            onError={(msg) => setErrorMessage(msg)}
          />
        )}

        {activeTab === 'history' && (
          <MeetingHistoryView
            meetings={meetings}
            onSelectMeeting={handleSelectMeeting}
            onDeleteMeeting={handleDeleteMeeting}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>MeetMind — Real-Time Meeting Assistant</p>
      </footer>
    </div>
  );
}
