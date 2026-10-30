/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { PhoneSimulator } from './components/WorkerPhone/PhoneSimulator';
import { SupervisorDashboard } from './components/SupervisorDashboard/SupervisorDashboard';
import { SupervisorLeaderboard } from './components/SupervisorScore/SupervisorLeaderboard';
import { GrievanceCellDashboard } from './components/GrievanceCell/GrievanceCellDashboard';
import { RameshStoryModal } from './components/GuidedDemo/RameshStoryModal';
import { 
  INITIAL_FACTORIES, 
  INITIAL_SUPERVISORS, 
  INITIAL_TICKETS, 
  INITIAL_SAFETY_REWARDS 
} from './data/seedData';
import { Factory, SafetyReward, Supervisor, Ticket } from './types';
import { checkSafetyRewardEligibility } from './utils/ivrRules';

export default function App() {
  const [activeTab, setActiveTab] = useState<'phone' | 'supervisor' | 'leaderboard' | 'grievance'>('phone');
  const [factories, setFactories] = useState<Factory[]>(INITIAL_FACTORIES);
  const [supervisors, setSupervisors] = useState<Supervisor[]>(INITIAL_SUPERVISORS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [safetyRewards, setSafetyRewards] = useState<SafetyReward[]>(INITIAL_SAFETY_REWARDS);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);

  // Guided demo state for "Ramesh's story"
  const [isDemoOpen, setIsDemoOpen] = useState<boolean>(true);
  const [demoStep, setDemoStep] = useState<number>(1);

  // Create or update a ticket from worker phone
  const handleCreateTicket = (newTicket: Ticket) => {
    setTickets((prev) => {
      const existsIndex = prev.findIndex((t) => t.id === newTicket.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = newTicket;
        return copy;
      }
      return [newTicket, ...prev];
    });

    if (isDemoOpen && demoStep === 1 && newTicket.id === 4579) {
      setDemoStep(2);
      setActiveTab('supervisor');
    }
  };

  // Supervisor marks ticket fixed
  const handleMarkFixed = (ticketId: number) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'awaiting_confirmation',
            supervisorNotes: t.supervisorNotes || 'Fault isolated, wiring checked and verified safe by maintenance.',
          };
        }
        return t;
      })
    );

    if (isDemoOpen && demoStep === 2 && ticketId === 4579) {
      setDemoStep(3);
      setActiveTab('phone');
    }
  };

  // Supervisor starts inspection
  const handleStartWork = (ticketId: number) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'in_progress' } : t))
    );
  };

  // Simulate 48-hour SLA timeout / overdue escalation
  const handleSimulateOverdue = (ticketId: number) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'escalated',
            remainingHours: -6,
            grievanceNotes: [
              ...(t.grievanceNotes || []),
              `Auto-escalated to Grievance Cell on ${new Date().toLocaleDateString()} due to 48hr SLA breach.`,
            ],
          };
        }
        return t;
      })
    );
  };

  // Worker confirms resolution or reports not fixed via IVR (Press 1 or 2)
  const handleConfirmTicket = (ticketId: number, isConfirmed: boolean, rating = 5) => {
    let resolvedTicket: Ticket | undefined;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          resolvedTicket = t;
          if (isConfirmed) {
            return {
              ...t,
              status: 'resolved',
              workerConfirmed: true,
              workerRating: rating,
              remainingHours: 0,
              resolvedAt: new Date().toISOString(),
            };
          } else {
            return {
              ...t,
              status: 'escalated',
              workerConfirmed: false,
              grievanceNotes: [
                ...(t.grievanceNotes || []),
                'Worker rejected repair confirmation via IVR (pressed 2: Not Fixed). Priority inspection requested.',
              ],
            };
          }
        }
        return t;
      })
    );

    if (isConfirmed && resolvedTicket) {
      // 1. Update Supervisor Score
      const supId = resolvedTicket.assignedSupervisorId;
      if (supId) {
        setSupervisors((prev) =>
          prev.map((s) => {
            if (s.id === supId) {
              return {
                ...s,
                resolvedCount: s.resolvedCount + 1,
                ratings: [...s.ratings, rating],
              };
            }
            return s;
          })
        );
      }

      // 2. Safety Reward evaluation
      const eligibility = checkSafetyRewardEligibility(resolvedTicket, tickets);
      if (eligibility.isEligible) {
        const newReward: SafetyReward = {
          id: `rew-${Date.now()}`,
          workerId: resolvedTicket.reporterWorkerId,
          ticketId: resolvedTicket.id,
          factoryId: resolvedTicket.factoryId,
          hazardDescription: resolvedTicket.translatedText,
          points: eligibility.points,
          amountInr: eligibility.amountInr,
          status: 'verified_and_awarded',
          awardedAt: new Date().toISOString(),
        };

        setSafetyRewards((prev) => {
          // Avoid duplicate entry for same ticket
          if (prev.some((r) => r.ticketId === resolvedTicket?.id)) {
            return prev;
          }
          return [newReward, ...prev];
        });
      }

      // Advance story if in step 3
      if (isDemoOpen && demoStep === 3) {
        setDemoStep(4);
        setActiveTab('leaderboard');
      }
    }
  };

  // Grievance cell notes & actions
  const handleAddGrievanceNote = (ticketId: number, note: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            grievanceNotes: [...(t.grievanceNotes || []), note],
          };
        }
        return t;
      })
    );
  };

  const handleResolveSensitiveTicket = (ticketId: number) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'resolved',
            resolvedAt: new Date().toISOString(),
            grievanceNotes: [
              ...(t.grievanceNotes || []),
              'Case successfully investigated and settled by Grievance Cell & NGO Observer.',
            ],
          };
        }
        return t;
      })
    );
  };

  // Reset all state to seed values
  const handleResetData = () => {
    setTickets(INITIAL_TICKETS);
    setSupervisors(INITIAL_SUPERVISORS);
    setFactories(INITIAL_FACTORIES);
    setSafetyRewards(INITIAL_SAFETY_REWARDS);
    setDemoStep(1);
    setIsDemoOpen(true);
    setActiveTab('phone');
  };

  // Step-by-step auto action executor for "Demo: Ramesh's story"
  const handleExecuteAutoAction = (stepNumber: number) => {
    if (stepNumber === 1) {
      // Create ticket 4579 if not present or ensure it's in initial state
      handleCreateTicket({
        id: 4579,
        factoryId: 'factory-chennai',
        lineOrArea: 'Line 3, Machine 12',
        category: 'safety',
        originalVoiceText: 'ସିଲେଇ ମେସିନ୍ ଲାଇନ୍ ୩ ମେସିନ୍ ୧୨ ରେ ନିଆଁ ଝୁଲ ବାହାରୁଛି ଏବଂ ପୋଡ଼ିବା ବାସ୍ନା ଆସୁଛି।',
        translatedText: 'The sewing machine on Line 3, Machine 12 is sparking and making a burning smell.',
        language: 'odia',
        status: 'new',
        createdAt: new Date().toISOString(),
        deadlineHours: 24,
        remainingHours: 24,
        assignedSupervisorId: 'sup-1',
        reporterWorkerId: 'W123',
        isSensitive: false,
        isSafetyVerified: true,
        isFirstReport: true,
        workerConfirmed: false,
      });
      setDemoStep(2);
      setActiveTab('supervisor');
    } else if (stepNumber === 2) {
      handleMarkFixed(4579);
      setDemoStep(3);
      setActiveTab('phone');
    } else if (stepNumber === 3) {
      handleConfirmTicket(4579, true, 5);
      setDemoStep(4);
      setActiveTab('leaderboard');
    } else if (stepNumber === 4) {
      setDemoStep(5);
      setActiveTab('grievance');
    } else if (stepNumber === 5) {
      setActiveTab('phone');
      setIsDemoOpen(false);
    }
  };

  const pendingConfirmationCount = tickets.filter(
    (t) => t.status === 'awaiting_confirmation'
  ).length;

  const escalatedCount = tickets.filter(
    (t) => t.status === 'escalated' || (t.isSensitive && t.status === 'new')
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Global Header with 4 Tabs navigation & Quick controls */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onStartRameshDemo={() => {
          setIsDemoOpen(true);
          setDemoStep(1);
          setActiveTab('phone');
        }}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        onResetData={handleResetData}
        pendingConfirmationCount={pendingConfirmationCount}
        escalatedCount={escalatedCount}
      />

      {/* Guided Walkthrough Bar for Ramesh's Story */}
      <RameshStoryModal
        currentStep={demoStep}
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onNextStep={() => {
          const next = Math.min(5, demoStep + 1);
          setDemoStep(next);
          if (next === 2) setActiveTab('supervisor');
          else if (next === 3) setActiveTab('phone');
          else if (next === 4) setActiveTab('leaderboard');
          else if (next === 5) setActiveTab('grievance');
        }}
        onPrevStep={() => {
          const prev = Math.max(1, demoStep - 1);
          setDemoStep(prev);
          if (prev === 1) setActiveTab('phone');
          else if (prev === 2) setActiveTab('supervisor');
          else if (prev === 3) setActiveTab('phone');
          else if (prev === 4) setActiveTab('leaderboard');
        }}
        onGoToStep={(step) => {
          setDemoStep(step);
          if (step === 1) setActiveTab('phone');
          else if (step === 2) setActiveTab('supervisor');
          else if (step === 3) setActiveTab('phone');
          else if (step === 4) setActiveTab('leaderboard');
          else if (step === 5) setActiveTab('grievance');
        }}
        onExecuteAutoAction={handleExecuteAutoAction}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'phone' && (
          <PhoneSimulator
            tickets={tickets}
            onCreateTicket={handleCreateTicket}
            onConfirmTicket={handleConfirmTicket}
            ttsEnabled={ttsEnabled}
            highlightRameshFlow={isDemoOpen && (demoStep === 1 || demoStep === 3)}
          />
        )}

        {activeTab === 'supervisor' && (
          <SupervisorDashboard
            tickets={tickets}
            factories={factories}
            supervisors={supervisors}
            onMarkFixed={handleMarkFixed}
            onStartWork={handleStartWork}
            onSimulateOverdue={handleSimulateOverdue}
            highlightTicket4579={isDemoOpen && demoStep === 2}
          />
        )}

        {activeTab === 'leaderboard' && (
          <SupervisorLeaderboard
            supervisors={supervisors}
            factories={factories}
            tickets={tickets}
            onOpenWorkerPhone={() => setActiveTab('phone')}
          />
        )}

        {activeTab === 'grievance' && (
          <GrievanceCellDashboard
            tickets={tickets}
            factories={factories}
            safetyRewards={safetyRewards}
            onAddGrievanceNote={handleAddGrievanceNote}
            onResolveSensitiveTicket={handleResolveSensitiveTicket}
            highlightRameshReward={isDemoOpen && demoStep === 5}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            SpeakUp IVR Companion • Voice Helpline Prototype for Migrant Workers in India
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Odia • Hindi • Bengali • Tamil</span>
            <span>•</span>
            <span>48h SLA Tracking</span>
            <span>•</span>
            <span>Zero-Retaliation Isolation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
