import React from 'react';
import { Phone, ClipboardList, Trophy, ShieldAlert, Sparkles, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'phone' | 'supervisor' | 'leaderboard' | 'grievance';
  setActiveTab: (tab: 'phone' | 'supervisor' | 'leaderboard' | 'grievance') => void;
  onStartRameshDemo: () => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  onResetData: () => void;
  pendingConfirmationCount: number;
  escalatedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onStartRameshDemo,
  ttsEnabled,
  setTtsEnabled,
  onResetData,
  pendingConfirmationCount,
  escalatedCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with branding & quick actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">SpeakUp IVR Companion</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Interactive Prototype
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Voice Helpline for Migrant Factory Workers in India (Odia • Hindi • Bengali • Tamil)
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Demo: Ramesh's Story Button */}
            <button
              onClick={onStartRameshDemo}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 shadow-md shadow-orange-500/20 transition-all cursor-pointer font-semibold"
              title="Launch step-by-step walkthrough of Ramesh reporting sparking Machine 12"
            >
              <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>Demo: Ramesh's story</span>
            </button>

            {/* TTS Toggle */}
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                ttsEnabled
                  ? 'bg-slate-800 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={ttsEnabled ? 'Speech Synthesis Voice: ON' : 'Speech Synthesis Voice: MUTED'}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{ttsEnabled ? 'Voice Prompts: ON' : 'Voice: Muted'}</span>
            </button>

            {/* Reset Seed Data */}
            <button
              onClick={onResetData}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors"
              title="Reset tickets, scores, and demo progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* 4 Tabs Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('phone')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'phone'
                ? 'bg-orange-500 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>1. Worker Phone (IVR Call)</span>
            {pendingConfirmationCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-400 text-slate-950 font-bold text-xs rounded-full animate-pulse">
                {pendingConfirmationCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('supervisor')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'supervisor'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>2. Supervisor Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-amber-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>3. Resolution Score</span>
          </button>

          <button
            onClick={() => setActiveTab('grievance')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'grievance'
                ? 'bg-rose-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>4. Grievance Cell (NGO)</span>
            {escalatedCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-rose-400 text-slate-950 font-bold text-xs rounded-full">
                {escalatedCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
