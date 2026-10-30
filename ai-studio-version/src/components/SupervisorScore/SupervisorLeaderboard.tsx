import React from 'react';
import { 
  Trophy, Award, Clock, CheckCircle2, Star, ShieldCheck, Lock, 
  TrendingUp, Users, AlertCircle, Sparkles 
} from 'lucide-react';
import { Factory, Supervisor, Ticket } from '../../types';
import { calculateSupervisorMetrics } from '../../utils/ivrRules';

interface SupervisorLeaderboardProps {
  supervisors: Supervisor[];
  factories: Factory[];
  tickets: Ticket[];
  onOpenWorkerPhone?: () => void;
}

export const SupervisorLeaderboard: React.FC<SupervisorLeaderboardProps> = ({
  supervisors,
  factories,
  tickets,
  onOpenWorkerPhone,
}) => {
  // Compute calculated metrics for all supervisors
  const supervisorStats = supervisors.map((sup) => {
    const metrics = calculateSupervisorMetrics(sup, tickets);
    const factory = factories.find((f) => f.id === sup.factoryId);
    return {
      supervisor: sup,
      factory,
      ...metrics,
    };
  });

  // Sort primarily by confirmedResolvedCount (worker-confirmed only), then resolution rate, then lowest time-to-fix
  supervisorStats.sort((a, b) => {
    if (b.confirmedResolvedCount !== a.confirmedResolvedCount) {
      return b.confirmedResolvedCount - a.confirmedResolvedCount;
    }
    if (b.resolutionRatePercent !== a.resolutionRatePercent) {
      return b.resolutionRatePercent - a.resolutionRatePercent;
    }
    return a.avgTimeHours - b.avgTimeHours;
  });

  // Calculate platform-wide totals
  const totalOperationalAssigned = supervisorStats.reduce((acc, curr) => acc + curr.totalAssigned, 0);
  const totalConfirmedResolved = supervisorStats.reduce((acc, curr) => acc + curr.confirmedResolvedCount, 0);
  const overallConfirmationRate = Math.round((totalConfirmedResolved / (totalOperationalAssigned || 1)) * 100);

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Supervisor Resolution Score Leaderboard</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Measuring and rewarding supervisors on verified resolution speed and quality, not problem suppression.
          </p>
        </div>

        <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700/80 text-xs text-slate-300 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Rule: Only worker-confirmed resolutions ("Press 1") unlock score points</span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Confirmed Resolves</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">{totalConfirmedResolved}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1">
            <span>Worker-confirmed via IVR</span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Resolution Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">{overallConfirmationRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Of all operational tickets assigned</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Time-to-Fix</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">14.2 hrs</div>
          <div className="text-[11px] text-emerald-400 mt-1">Well within 48-hr factory SLA</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Supervisors</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">{supervisors.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across Chennai, Sri City & Hosur</div>
        </div>
      </div>

      {/* Anti-Retaliation & 5+ Rating Rules Callout */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl p-4 text-xs text-slate-300 space-y-2 shadow-sm">
        <div className="flex items-center space-x-2 text-amber-300 font-bold">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Anti-Retaliation Rating Threshold System</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          To protect migrant workers from post-complaint retaliation, <strong className="text-white">individual 1–5 star ratings are strictly never displayed</strong>. Worker star ratings are computed and shown only as a rolling aggregate average after <strong className="text-amber-300">5 or more independent worker ratings</strong> have been collected. Supervisors with fewer than 5 ratings show a protected status.
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Factory Supervisor Rankings</span>
          </h3>
          <span className="text-xs text-slate-400">Ranked by Worker-Confirmed Resolutions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-center">Rank</th>
                <th scope="col" className="px-4 py-3">Supervisor & Department</th>
                <th scope="col" className="px-4 py-3">Factory</th>
                <th scope="col" className="px-4 py-3 text-center">Worker-Confirmed Resolves</th>
                <th scope="col" className="px-4 py-3 text-center">Resolution Rate</th>
                <th scope="col" className="px-4 py-3 text-center">Avg Time-to-Fix</th>
                <th scope="col" className="px-4 py-3 text-center">Worker Rating (1-5)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {supervisorStats.map((item, index) => {
                const rank = index + 1;
                const isFirst = rank === 1;

                return (
                  <tr
                    key={item.supervisor.id}
                    className={`hover:bg-slate-700/40 transition-colors ${
                      item.supervisor.id === 'sup-1' ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs font-mono ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {rank}
                      </span>
                    </td>

                    {/* Name & Department */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <span>{item.supervisor.name}</span>
                        {item.supervisor.id === 'sup-1' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            Ramesh's Supervisor
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.supervisor.department}</div>
                    </td>

                    {/* Factory */}
                    <td className="px-4 py-3.5">
                      <span className="text-slate-300 font-medium">{item.factory?.name}</span>
                    </td>

                    {/* Worker Confirmed Count */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center space-x-1 font-mono font-bold text-emerald-400 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.confirmedResolvedCount}</span>
                        <span className="text-slate-500 font-normal text-xs">/ {item.totalAssigned}</span>
                      </div>
                    </td>

                    {/* Resolution Rate */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-bold text-white">{item.resolutionRatePercent}%</span>
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.resolutionRatePercent >= 80 ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${item.resolutionRatePercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Avg Time */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-mono text-slate-300 font-semibold">{item.avgTimeHours} hrs</span>
                    </td>

                    {/* Rating with Anti-Retaliation Threshold Rule */}
                    <td className="px-4 py-3.5 text-center">
                      {item.averageRating !== null ? (
                        <div className="inline-flex items-center space-x-1 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-mono font-bold text-amber-300">{item.averageRating}</span>
                          <span className="text-[10px] text-slate-400">({item.ratingsCount} reviews)</span>
                        </div>
                      ) : (
                        <div
                          className="inline-flex items-center space-x-1 bg-slate-900/80 border border-slate-700 px-2 py-1 rounded-lg text-slate-400"
                          title="Ratings hidden until 5+ worker reviews collected to prevent identifying individual complainants"
                        >
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span className="text-[10px]">Hidden ({item.ratingsCount}/5 reviews)</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer explaining the worker empowerment loop */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Notice how Ramesh's confirmed "Press 1" on Ticket #4579 immediately increases Rajesh Kumar's score from 14 to 15!
          </span>
        </div>
        {onOpenWorkerPhone && (
          <button
            onClick={onOpenWorkerPhone}
            className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs whitespace-nowrap cursor-pointer"
          >
            Go to Worker Phone (Press 1)
          </button>
        )}
      </div>
    </div>
  );
};
