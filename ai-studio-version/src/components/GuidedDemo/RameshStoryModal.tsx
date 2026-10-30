import React from 'react';
import { 
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft, X, Phone, 
  ClipboardList, Trophy, Award, ShieldAlert 
} from 'lucide-react';

export interface RameshStoryStep {
  stepNumber: number;
  title: string;
  tab: 'phone' | 'supervisor' | 'leaderboard' | 'grievance';
  description: string;
  actionHint: string;
  autoActionLabel: string;
}

export const RAMESH_STEPS: RameshStoryStep[] = [
  {
    stepNumber: 1,
    title: "1. Ramesh calls SpeakUp IVR in Odia",
    tab: 'phone',
    description: "Ramesh, a migrant worker from Odisha working in Chennai Garments Park, dials the toll-free helpline. He chooses Odia (Press 1), selects Machine/Safety (Press 2 -> 1), and records his report about the sparking sewing machine on Line 3, Machine 12. SpeakUp's speech-to-text pipeline issues Ticket #4579.",
    actionHint: "On the Worker Phone, tap 'Dial Helpline', press 1 (Odia) -> 2 (Report) -> 1 (Safety) -> # (Finish).",
    autoActionLabel: "Auto-Create Ramesh's Ticket #4579",
  },
  {
    stepNumber: 2,
    title: "2. Supervisor sees Ticket #4579 & Marks Fixed",
    tab: 'supervisor',
    description: "Line Supervisor Rajesh Kumar opens his operational queue. He sees Ticket #4579 ('Sparking sewing machine on Line 3, Machine 12') with a 24-hour urgent safety countdown. Ramesh's name is completely hidden (shown only as Anonymous W123). Maintenance repairs the machine and clicks 'Mark Fixed'.",
    actionHint: "In the Supervisor Dashboard, find Ticket #4579 and click 'Mark Fixed'.",
    autoActionLabel: "Auto-Mark Ticket #4579 as Fixed",
  },
  {
    stepNumber: 3,
    title: "3. Ramesh confirms fix via IVR (Presses 1)",
    tab: 'phone',
    description: "The supervisor's 'Mark Fixed' triggers an automated callback to Ramesh's phone. Ramesh listens to the Odia voice prompt: 'Press 1 if the problem is fixed, 2 if not.' Ramesh inspects Machine 12, presses 1 to verify the repair, and rates the supervisor 5 stars.",
    actionHint: "Switch back to the Worker Phone, look up Ticket #4579, and press 1 to confirm fix!",
    autoActionLabel: "Auto-Confirm Ticket #4579 as Fixed (Press 1)",
  },
  {
    stepNumber: 4,
    title: "4. Supervisor Resolution Score Increases",
    tab: 'leaderboard',
    description: "Because ticket resolution requires worker confirmation to count, Rajesh Kumar's confirmed resolution score immediately increases to 15! His average resolution speed and ranking on the factory leaderboard rise.",
    actionHint: "View Rajesh Kumar's rank on the Supervisor Resolution Score leaderboard.",
    autoActionLabel: "Inspect Rajesh Kumar's Updated Score",
  },
  {
    stepNumber: 5,
    title: "5. Ramesh's Anonymous ID (W123) Receives Safety Reward",
    tab: 'grievance',
    description: "Because Ramesh was the first verified reporter of an active electrical fire hazard on Machine 12, the system automatically awards 500 Safety Points (₹250 cash bonus) to his anonymous Worker ID (W123) in the Grievance Cell desk—protecting his privacy while rewarding his vigilance.",
    actionHint: "Check the Safety Rewards table in the Grievance Cell tab.",
    autoActionLabel: "Complete Story Walkthrough",
  },
];

interface RameshStoryModalProps {
  currentStep: number;
  isOpen: boolean;
  onClose: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onGoToStep: (stepNumber: number) => void;
  onExecuteAutoAction: (stepNumber: number) => void;
}

export const RameshStoryModal: React.FC<RameshStoryModalProps> = ({
  currentStep,
  isOpen,
  onClose,
  onNextStep,
  onPrevStep,
  onGoToStep,
  onExecuteAutoAction,
}) => {
  if (!isOpen) return null;

  const step = RAMESH_STEPS[currentStep - 1] || RAMESH_STEPS[0];

  return (
    <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-b border-amber-500/50 shadow-xl text-white px-4 py-3 sticky top-[57px] z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left Title & Stepper Pills */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shrink-0">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-amber-300">
                  Interactive Story: Ramesh's Sparking Machine (Odisha)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  Step {currentStep} of 5
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-200 mt-0.5">
                {step.title}
              </h4>
            </div>
          </div>

          {/* Stepper Dots & Action Controls */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Step navigation dots */}
            <div className="flex items-center space-x-1 mr-2">
              {RAMESH_STEPS.map((s) => (
                <button
                  key={s.stepNumber}
                  onClick={() => onGoToStep(s.stepNumber)}
                  className={`w-6 h-6 rounded-full text-xs font-bold font-mono transition-all cursor-pointer ${
                    s.stepNumber === currentStep
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 scale-110 font-extrabold'
                      : s.stepNumber < currentStep
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                  title={s.title}
                >
                  {s.stepNumber}
                </button>
              ))}
            </div>

            {/* Quick Auto Action Button */}
            <button
              onClick={() => onExecuteAutoAction(currentStep)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>{step.autoActionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Next / Prev Buttons */}
            {currentStep > 1 && (
              <button
                onClick={onPrevStep}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                title="Previous step"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {currentStep < 5 && (
              <button
                onClick={onNextStep}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                Skip Step
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-1 cursor-pointer"
              title="Close story guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Narrative Description & Action Hint Bar */}
        <div className="mt-2 text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="leading-relaxed">
            <span className="text-amber-300 font-semibold">Narrative: </span>
            {step.description}
          </p>
          <div className="shrink-0 text-slate-400 font-medium">
            <span className="text-emerald-400 font-semibold">Hint: </span>
            {step.actionHint}
          </div>
        </div>
      </div>
    </div>
  );
};
