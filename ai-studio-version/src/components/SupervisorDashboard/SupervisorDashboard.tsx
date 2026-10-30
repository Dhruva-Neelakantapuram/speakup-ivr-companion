import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, Filter, Wrench, 
  ArrowUpRight, Send, AlertOctagon, Info, ChevronRight, UserX
} from 'lucide-react';
import { Category, Factory, Supervisor, Ticket, TicketStatus } from '../../types';
import { isSensitiveCategory } from '../../utils/ivrRules';

interface SupervisorDashboardProps {
  tickets: Ticket[];
  factories: Factory[];
  supervisors: Supervisor[];
  onMarkFixed: (ticketId: number) => void;
  onStartWork: (ticketId: number) => void;
  onSimulateOverdue: (ticketId: number) => void;
  highlightTicket4579?: boolean;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  tickets,
  factories,
  supervisors,
  onMarkFixed,
  onStartWork,
  onSimulateOverdue,
  highlightTicket4579 = false,
}) => {
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSupervisorId, setActiveSupervisorId] = useState<string>('sup-1'); // Default to Rajesh Kumar (Chennai)

  // CRITICAL FILTER: Wages, harassment, and supervisor complaints NEVER appear here!
  const operationalTickets = tickets.filter((t) => !isSensitiveCategory(t.category));

  // Apply filters
  const filteredTickets = operationalTickets.filter((t) => {
    if (selectedFactoryId !== 'all' && t.factoryId !== selectedFactoryId) return false;
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    return true;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 animate-pulse" />
            New
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
            In Progress
          </span>
        );
      case 'awaiting_confirmation':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-1.5" />
            Awaiting Worker Confirmation
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Resolved (Worker Confirmed)
          </span>
        );
      case 'escalated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertOctagon className="w-3 h-3 mr-1" />
            Escalated to NGO Cell
          </span>
        );
    }
  };

  const currentSupervisor = supervisors.find((s) => s.id === activeSupervisorId) || supervisors[0];

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Role Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">Supervisor Operations Queue</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Factory Fixes First
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Manage routine operational issues (Machine/Safety, Hostel). 48-hour SLA deadline enforced.
          </p>
        </div>

        {/* Supervisor Profile Selector */}
        <div className="flex items-center space-x-3 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700">
          <div className="text-right">
            <div className="text-xs font-bold text-white">{currentSupervisor.name}</div>
            <div className="text-[11px] text-slate-400">{currentSupervisor.department}</div>
          </div>
          <select
            value={activeSupervisorId}
            onChange={(e) => setActiveSupervisorId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Select Supervisor Persona"
          >
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.department.split('(')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zero Retaliation Security Banner */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 flex items-start space-x-3 shadow-inner">
        <UserX className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-amber-300">Zero-Retaliation Protocol Active: </span>
          <span className="text-slate-300">
            Worker names and phone numbers are permanently withheld (shown strictly as anonymous IDs like W123). Complaints regarding{' '}
            <strong className="text-rose-400">Wages, Harassment, and Supervisor Misconduct</strong> are blocked from this view and routed exclusively to the independent Grievance Cell.
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center space-x-1 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Factory filter */}
          <select
            value={selectedFactoryId}
            onChange={(e) => setSelectedFactoryId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Filter by Factory"
          >
            <option value="all">All Factories (3)</option>
            {factories.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Category filter (Operational only) */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Filter by Category"
          >
            <option value="all">All Operational Categories</option>
            <option value="safety">Machine / Safety (24h SLA)</option>
            <option value="hostel">Hostel & Canteen (48h SLA)</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Filter by Status"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_confirmation">Awaiting Worker Confirmation</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>

        <div className="text-slate-400 font-medium">
          Showing <span className="font-bold text-white">{filteredTickets.length}</span> tickets
        </div>
      </div>

      {/* Ticket Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map((ticket) => {
          const factory = factories.find((f) => f.id === ticket.factoryId);
          const isOverdue = ticket.remainingHours <= 0 && ticket.status !== 'resolved';
          const isRameshTarget = ticket.id === 4579;

          return (
            <div
              key={ticket.id}
              className={`bg-slate-800/90 rounded-2xl border transition-all flex flex-col justify-between p-4 shadow-sm relative ${
                isRameshTarget && highlightTicket4579
                  ? 'border-amber-400 ring-4 ring-amber-400/30 bg-slate-800'
                  : isOverdue
                  ? 'border-rose-500/60 bg-rose-950/20'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div>
                {/* Card Top: Ticket ID + Category + Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-extrabold text-amber-400">
                      #{ticket.id}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-700/80 text-slate-300 capitalize">
                      {ticket.category === 'safety' ? 'Machine/Safety' : 'Hostel'}
                    </span>
                  </div>
                  <div>{getStatusBadge(ticket.status)}</div>
                </div>

                {/* Factory & Line location */}
                <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
                  <span>{ticket.lineOrArea}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{factory?.name.split(' ')[0]}</span>
                </div>

                {/* English Translated Description */}
                <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 text-xs text-slate-200 mb-2.5">
                  <p className="font-medium text-slate-100">{ticket.translatedText}</p>
                  <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">
                    Voice ({ticket.language}): "{ticket.originalVoiceText}"
                  </p>
                </div>

                {/* Supervisor Notes if any */}
                {ticket.supervisorNotes && (
                  <div className="bg-slate-900/40 rounded-lg p-2 border border-slate-800/80 text-[11px] text-slate-300 mb-2">
                    <span className="font-semibold text-blue-400">Supervisor Note: </span>
                    {ticket.supervisorNotes}
                  </div>
                )}
              </div>

              {/* Bottom: Countdown SLA + Anonymous Worker ID + Actions */}
              <div className="pt-2 border-t border-slate-700/70 space-y-2.5">
                {/* 48h Countdown and Anonymous Worker */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <Clock
                      className={`w-3.5 h-3.5 ${
                        isOverdue
                          ? 'text-rose-400'
                          : ticket.remainingHours < 6
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    />
                    <span
                      className={`font-semibold text-[11px] ${
                        isOverdue
                          ? 'text-rose-400 font-bold'
                          : ticket.remainingHours < 6
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {ticket.status === 'resolved'
                        ? 'SLA Met'
                        : isOverdue
                        ? `Overdue (${Math.abs(ticket.remainingHours)}h late)`
                        : `${ticket.remainingHours}h remaining of ${ticket.deadlineHours}h`}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Reporter: {ticket.reporterWorkerId}
                  </span>
                </div>

                {/* Action Buttons based on status */}
                <div className="flex items-center gap-1.5 pt-1">
                  {ticket.status === 'new' && (
                    <button
                      onClick={() => onStartWork(ticket.id)}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center space-x-1 transition-all cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Start Inspection</span>
                    </button>
                  )}

                  {(ticket.status === 'new' || ticket.status === 'in_progress') && (
                    <button
                      onClick={() => onMarkFixed(ticket.id)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        isRameshTarget && highlightTicket4579
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-amber-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                      title="Marks ticket fixed and triggers confirmation prompt on Worker Phone"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Mark Fixed</span>
                    </button>
                  )}

                  {ticket.status === 'awaiting_confirmation' && (
                    <div className="w-full py-1.5 px-2 rounded-lg text-xs font-medium bg-purple-500/20 border border-purple-500/40 text-purple-300 text-center flex items-center justify-center space-x-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>IVR Call Sent: Awaiting Worker "Press 1"</span>
                    </div>
                  )}

                  {ticket.status === 'resolved' && (
                    <div className="w-full py-1.5 px-2 rounded-lg text-xs font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-center flex items-center justify-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Closed: Confirmed by {ticket.reporterWorkerId}</span>
                    </div>
                  )}

                  {ticket.status === 'escalated' && (
                    <div className="w-full py-1.5 px-2 rounded-lg text-xs font-semibold bg-rose-500/20 border border-rose-500/40 text-rose-300 text-center">
                      Auto-Escalated to NGO Grievance Cell
                    </div>
                  )}

                  {/* Overdue simulator button for demonstration */}
                  {ticket.status !== 'resolved' && ticket.status !== 'escalated' && (
                    <button
                      onClick={() => onSimulateOverdue(ticket.id)}
                      className="py-1.5 px-2 rounded-lg text-[10px] font-medium bg-slate-700/80 hover:bg-slate-700 text-slate-300 border border-slate-600 hover:text-rose-300 cursor-pointer"
                      title="Fast-forward time past 48 hours to demonstrate auto-escalation"
                    >
                      Simulate Overdue
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
