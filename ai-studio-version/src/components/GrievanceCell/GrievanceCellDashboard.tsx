import React, { useState } from 'react';
import { 
  ShieldAlert, Flame, Clock, Award, AlertTriangle, CheckCircle2, 
  Send, ExternalLink, Filter, HelpCircle, Lock, ChevronDown, Check
} from 'lucide-react';
import { Category, Factory, SafetyReward, Ticket } from '../../types';
import { isSensitiveCategory } from '../../utils/ivrRules';

interface GrievanceCellDashboardProps {
  tickets: Ticket[];
  factories: Factory[];
  safetyRewards: SafetyReward[];
  onAddGrievanceNote: (ticketId: number, note: string) => void;
  onResolveSensitiveTicket: (ticketId: number) => void;
  highlightRameshReward?: boolean;
}

export const GrievanceCellDashboard: React.FC<GrievanceCellDashboardProps> = ({
  tickets,
  factories,
  safetyRewards,
  onAddGrievanceNote,
  onResolveSensitiveTicket,
  highlightRameshReward = false,
}) => {
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{
    factoryId?: string;
    category?: Category;
  } | null>(null);
  const [newNoteText, setNewNoteText] = useState<{ [ticketId: number]: string }>({});
  const [activeTab, setActiveTab] = useState<'tickets' | 'heatmap' | 'rewards'>('tickets');

  // Grievance cell handles:
  // 1. Sensitive tickets (Wages, Harassment, Supervisor)
  // 2. Escalated operational tickets (missed 48-hr SLA)
  const sensitiveAndEscalatedTickets = tickets.filter(
    (t) => t.isSensitive || t.status === 'escalated'
  );

  // Filtered by heatmap selection if active
  const displayedTickets = sensitiveAndEscalatedTickets.filter((t) => {
    if (selectedHeatmapCell?.factoryId && t.factoryId !== selectedHeatmapCell.factoryId) return false;
    if (selectedHeatmapCell?.category && t.category !== selectedHeatmapCell.category) return false;
    return true;
  });

  const categories: { key: Category; label: string; isSensitive: boolean }[] = [
    { key: 'safety', label: 'Machine / Safety', isSensitive: false },
    { key: 'wages', label: 'Wages & Overtime', isSensitive: true },
    { key: 'harassment', label: 'Harassment', isSensitive: true },
    { key: 'hostel', label: 'Hostel & Living', isSensitive: false },
    { key: 'supervisor', label: 'Supervisor Misconduct', isSensitive: true },
  ];

  // Compute heatmap counts
  const getCount = (factoryId: string, category: Category) => {
    return tickets.filter((t) => t.factoryId === factoryId && t.category === category).length;
  };

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/40 text-slate-500 border-slate-700/50';
    if (count === 1) return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50';
    if (count === 2) return 'bg-amber-950/50 text-amber-300 border-amber-800/50';
    if (count === 3) return 'bg-orange-950/60 text-orange-300 border-orange-800/60 font-bold';
    return 'bg-rose-950/80 text-rose-300 border-rose-700 font-extrabold animate-pulse';
  };

  // Average time to fix by category
  const timeToFixByCategory = categories.map((cat) => {
    const catTickets = tickets.filter((t) => t.category === cat.key && t.status === 'resolved');
    const avg =
      catTickets.length > 0
        ? Math.round(
            catTickets.reduce((acc, curr) => acc + (curr.deadlineHours - Math.max(0, curr.remainingHours)), 0) /
              catTickets.length
          )
        : cat.key === 'safety'
        ? 14
        : cat.key === 'hostel'
        ? 34
        : 68;
    return {
      category: cat.key,
      label: cat.label,
      avgHours: avg,
    };
  });

  const handleSaveNote = (ticketId: number) => {
    const text = newNoteText[ticketId];
    if (!text || text.trim() === '') return;
    onAddGrievanceNote(ticketId, text.trim());
    setNewNoteText((prev) => ({ ...prev, [ticketId]: '' }));
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Neutral Grievance Cell & NGO Desk</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Independent oversight desk for sensitive complaints (Wages, Harassment, Supervisor Conduct), 48-hr SLA escalations, cross-factory heatmaps, and worker safety rewards.
          </p>
        </div>

        {/* Sub Navigation pills */}
        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'tickets' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Sensitive & Escalated ({sensitiveAndEscalatedTickets.length})
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'heatmap' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Heatmap & Time-to-Fix
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rewards' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Safety Rewards ({safetyRewards.length})
          </button>
        </div>
      </div>

      {/* Safety Rewards Panel (Show prominent summary at top or in tab) */}
      <div
        className={`bg-slate-800/90 border rounded-2xl p-4 shadow-sm transition-all ${
          highlightRameshReward
            ? 'border-amber-400 ring-4 ring-amber-400/30 bg-slate-800'
            : 'border-slate-700'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Worker Safety Rewards Program (Anonymous Whistleblower Protection)
            </h3>
          </div>
          <span className="text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
            🔒 Names strictly hidden from factory supervisors
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {safetyRewards.map((reward) => {
            const isRamesh = reward.workerId === 'W123';
            return (
              <div
                key={reward.id}
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isRamesh && highlightRameshReward
                    ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/40'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      Worker ID: {reward.workerId} {isRamesh && '(Ramesh - Odia)'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      +{reward.points} PTS (₹{reward.amountInr})
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-200 mt-1.5">
                    {reward.hazardDescription}
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Ref: Ticket #{reward.ticketId}</span>
                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified 1st Reporter</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: Sensitive & Escalated Tickets Queue */}
      {(activeTab === 'tickets' || selectedHeatmapCell) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Sensitive & Escalated Cases Queue</h3>
              {selectedHeatmapCell && (
                <button
                  onClick={() => setSelectedHeatmapCell(null)}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20"
                >
                  <span>Clear Heatmap Filter</span>
                </button>
              )}
            </div>
            <span className="text-xs text-slate-400">
              Showing <strong className="text-white">{displayedTickets.length}</strong> sensitive cases
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedTickets.map((ticket) => {
              const factory = factories.find((f) => f.id === ticket.factoryId);
              const isEscalated = ticket.status === 'escalated';

              return (
                <div
                  key={ticket.id}
                  className={`bg-slate-800/90 border rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 ${
                    isEscalated ? 'border-rose-500/70 bg-rose-950/20' : 'border-slate-700'
                  }`}
                >
                  <div>
                    {/* Header: ID, Category tag, Severity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-amber-400">
                          #{ticket.id}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                          ticket.category === 'harassment'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : ticket.category === 'wages'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : ticket.category === 'supervisor'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {ticket.category}
                        </span>
                      </div>

                      {isEscalated ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                          48H OVERDUE SLA ESCALATED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          CONFIDENTIAL TO NGO
                        </span>
                      )}
                    </div>

                    {/* Location & Anonymous Worker ID */}
                    <div className="flex items-center justify-between text-xs text-slate-300 mt-2">
                      <span className="font-semibold">{factory?.name} ({ticket.lineOrArea})</span>
                      <span className="font-mono text-[11px] text-emerald-400 font-bold">
                        Reporter: {ticket.reporterWorkerId}
                      </span>
                    </div>

                    {/* Original voice audio & translated transcript */}
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs text-slate-200 mt-2 space-y-1.5">
                      <div className="font-semibold text-slate-100">
                        {ticket.translatedText}
                      </div>
                      <div className="text-[11px] text-slate-400 italic">
                        Original Voice ({ticket.language}): "{ticket.originalVoiceText}"
                      </div>
                    </div>

                    {/* Grievance Intervention Log */}
                    <div className="mt-2 space-y-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Grievance Desk Action Notes:
                      </div>
                      {ticket.grievanceNotes && ticket.grievanceNotes.length > 0 ? (
                        <ul className="space-y-1">
                          {ticket.grievanceNotes.map((note, idx) => (
                            <li
                              key={idx}
                              className="text-[11px] bg-slate-900/50 p-2 rounded border border-slate-800 text-slate-300 flex items-start space-x-1.5"
                            >
                              <span className="text-rose-400 font-bold">•</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">
                          No intervention logged yet. Case pending caseworker review.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add NGO Note input & resolve action */}
                  <div className="pt-2 border-t border-slate-700/80 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Log NGO / Legal action note..."
                        value={newNoteText[ticket.id] || ''}
                        onChange={(e) =>
                          setNewNoteText({ ...newNoteText, [ticket.id]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNote(ticket.id);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        aria-label="Add intervention note"
                      />
                      <button
                        onClick={() => handleSaveNote(ticket.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {ticket.status !== 'resolved' && (
                      <button
                        onClick={() => onResolveSensitiveTicket(ticket.id)}
                        className="w-full py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Resolved by Grievance Cell</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Heatmap Matrix & Time-to-Fix Chart */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          {/* Heatmap Matrix: Factory × Category */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  Complaints Heatmap Matrix: Factory × Category
                </h3>
              </div>
              <span className="text-xs text-slate-400">Click any cell to filter tickets</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-2.5 px-3 text-left font-bold text-slate-400 uppercase text-[11px]">
                      Factory
                    </th>
                    {categories.map((c) => (
                      <th
                        key={c.key}
                        className="py-2.5 px-3 font-bold text-slate-300 text-[11px]"
                      >
                        {c.label}
                        {c.isSensitive && <span className="text-rose-400 ml-1 font-mono text-[9px]">*</span>}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 font-bold text-slate-400 text-[11px]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {factories.map((factory) => {
                    const factoryTotal = categories.reduce(
                      (acc, c) => acc + getCount(factory.id, c.key),
                      0
                    );

                    return (
                      <tr key={factory.id} className="hover:bg-slate-700/20">
                        <td className="py-3 px-3 text-left font-semibold text-white">
                          <div>{factory.name}</div>
                          <div className="text-[10px] text-slate-400">{factory.location}</div>
                        </td>

                        {categories.map((cat) => {
                          const count = getCount(factory.id, cat.key);
                          const isSelected =
                            selectedHeatmapCell?.factoryId === factory.id &&
                            selectedHeatmapCell?.category === cat.key;

                          return (
                            <td key={cat.key} className="py-2 px-2">
                              <button
                                onClick={() => {
                                  setSelectedHeatmapCell({ factoryId: factory.id, category: cat.key });
                                  setActiveTab('tickets');
                                }}
                                className={`w-14 h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-sm transition-all cursor-pointer ${getHeatColor(
                                  count
                                )} ${isSelected ? 'ring-2 ring-white shadow-lg' : 'hover:scale-105'}`}
                                title={`Click to filter: ${factory.name} - ${cat.label} (${count} complaints)`}
                              >
                                {count}
                              </button>
                            </td>
                          );
                        })}

                        <td className="py-3 px-3 font-mono font-extrabold text-amber-400">
                          {factoryTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700">
              <span className="flex items-center space-x-1">
                <span className="text-rose-400">*</span>
                <span>Sensitive category (Bypasses supervisor)</span>
              </span>
              <div className="flex items-center space-x-2">
                <span>Intensity:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">0</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">1</span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300">2</span>
                <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300">3</span>
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold">4+ Hotspot</span>
              </div>
            </div>
          </div>

          {/* Time-to-Fix Chart */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-700 pb-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Average Resolution Time by Category</h3>
            </div>

            <div className="space-y-3 pt-1">
              {timeToFixByCategory.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">{item.label}</span>
                    <span className="font-mono font-bold text-amber-400">{item.avgHours} hours</span>
                  </div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.avgHours <= 24
                          ? 'bg-emerald-400'
                          : item.avgHours <= 48
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, (item.avgHours / 72) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-2">
              Machine safety issues are fixed rapidly within 14–24 hours, while complex wage and overtime audits require multi-day NGO intervention.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
