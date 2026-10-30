import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, RefreshCw, CheckCircle2, 
  AlertTriangle, Shield, Clock, HelpCircle, Star, Sparkles, ArrowLeft
} from 'lucide-react';
import { Category, InformationTopic, Language, Ticket } from '../../types';
import { IVR_PROMPTS, isSensitiveCategory, routeComplaint } from '../../utils/ivrRules';
import { INFORMATION_TOPICS } from '../../data/seedData';
import { speakText, stopSpeaking } from '../../utils/speechHelper';

type PhoneState =
  | 'idle'
  | 'connecting'
  | 'lang_select'
  | 'main_menu'
  | 'info_menu'
  | 'info_detail'
  | 'category_select'
  | 'recording'
  | 'processing'
  | 'ticket_issued'
  | 'check_ticket_input'
  | 'check_ticket_status'
  | 'confirm_resolution'
  | 'rate_supervisor'
  | 'call_ended';

interface PhoneSimulatorProps {
  tickets: Ticket[];
  onCreateTicket: (newTicket: Ticket) => void;
  onConfirmTicket: (ticketId: number, isConfirmed: boolean, rating?: number) => void;
  ttsEnabled: boolean;
  highlightRameshFlow?: boolean;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  tickets,
  onCreateTicket,
  onConfirmTicket,
  ttsEnabled,
  highlightRameshFlow = false,
}) => {
  const [phoneState, setPhoneState] = useState<PhoneState>('idle');
  const [selectedLang, setSelectedLang] = useState<Language>('odia');
  const [selectedCategory, setSelectedCategory] = useState<Category>('safety');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [currentPromptText, setCurrentPromptText] = useState<string>('');
  const [currentPromptTranslation, setCurrentPromptTranslation] = useState<string>('');
  const [enteredDigits, setEnteredDigits] = useState<string>('');
  const [issuedTicketId, setIssuedTicketId] = useState<number | null>(4579);
  const [targetTicket, setTargetTicket] = useState<Ticket | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [sampleVoiceChoice, setSampleVoiceChoice] = useState<'ramesh' | 'hostel' | 'wage' | 'custom'>('ramesh');
  const [customVoiceText, setCustomVoiceText] = useState<string>('');
  const [selectedInfoTopic, setSelectedInfoTopic] = useState<InformationTopic | null>(null);

  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto increment call duration while active
  useEffect(() => {
    if (phoneState !== 'idle' && phoneState !== 'call_ended') {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [phoneState]);

  // Recording counter
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Helper to pronounce voice prompts
  const announcePrompt = (text: string, lang: Language, translationText: string) => {
    setCurrentPromptText(text);
    setCurrentPromptTranslation(translationText);
    if (ttsEnabled) {
      speakText(text, lang);
    }
  };

  // Start Call
  const handleStartCall = (preset?: 'ramesh' | 'general') => {
    stopSpeaking();
    setPhoneState('connecting');
    setEnteredDigits('');

    setTimeout(() => {
      setPhoneState('lang_select');
      if (preset === 'ramesh') {
        setSelectedLang('odia');
      }
      announcePrompt(
        'Welcome to SpeakUp helpline. For Odia press 1, Hindi press 2, Bengali press 3, Tamil press 4.',
        'odia',
        'Welcome to SpeakUp. Press 1 for Odia (ଓଡ଼ିଆ), 2 for Hindi (हिंदी), 3 for Bengali (বাংলা), 4 for Tamil (தமிழ்).'
      );
    }, 900);
  };

  // End Call
  const handleEndCall = () => {
    stopSpeaking();
    setIsRecording(false);
    setPhoneState('call_ended');
    setTimeout(() => {
      setPhoneState('idle');
      setCurrentPromptText('');
      setCurrentPromptTranslation('');
    }, 1200);
  };

  // Keypad Press handler
  const handleKeyPress = (key: string) => {
    // Play DTMF click feel if available
    setEnteredDigits((prev) => (prev.length < 10 ? prev + key : prev));

    if (phoneState === 'lang_select') {
      if (key === '1') {
        setSelectedLang('odia');
        goToMainMenu('odia');
      } else if (key === '2') {
        setSelectedLang('hindi');
        goToMainMenu('hindi');
      } else if (key === '3') {
        setSelectedLang('bengali');
        goToMainMenu('bengali');
      } else if (key === '4') {
        setSelectedLang('tamil');
        goToMainMenu('tamil');
      }
    } else if (phoneState === 'main_menu') {
      if (key === '1') {
        // Information menu
        goToInfoMenu(selectedLang);
      } else if (key === '2') {
        // Report problem
        goToCategorySelect(selectedLang);
      } else if (key === '3') {
        // Check ticket status / confirm fix
        goToCheckTicketInput(selectedLang);
      }
    } else if (phoneState === 'info_menu') {
      if (key === '1') showInfoTopic(0);
      else if (key === '2') showInfoTopic(1);
      else if (key === '3') showInfoTopic(2);
      else if (key === '4') showInfoTopic(3);
      else if (key === '9' || key === '*') goToMainMenu(selectedLang);
    } else if (phoneState === 'category_select') {
      if (key === '1') selectCategory('safety');
      else if (key === '2') selectCategory('wages');
      else if (key === '3') selectCategory('harassment');
      else if (key === '4') selectCategory('hostel');
      else if (key === '5') selectCategory('supervisor');
    } else if (phoneState === 'recording') {
      if (key === '#' || key === '0') {
        finishRecording();
      }
    } else if (phoneState === 'check_ticket_input') {
      if (key === '#') {
        submitTicketLookup();
      }
    } else if (phoneState === 'confirm_resolution') {
      if (key === '1') {
        // Confirmed resolved
        handleConfirmResponse(true);
      } else if (key === '2') {
        // Not resolved
        handleConfirmResponse(false);
      }
    } else if (phoneState === 'rate_supervisor') {
      const rating = parseInt(key, 10);
      if (rating >= 1 && rating <= 5) {
        submitSupervisorRating(rating);
      }
    }
  };

  const goToMainMenu = (lang: Language) => {
    setPhoneState('main_menu');
    setEnteredDigits('');
    const prompt = IVR_PROMPTS[lang].mainMenu;
    const translation =
      'Press 1 for information about shifts, rules, and benefits. Press 2 to report a problem. Press 3 to check ticket status or confirm solution.';
    announcePrompt(prompt, lang, translation);
  };

  const goToInfoMenu = (lang: Language) => {
    setPhoneState('info_menu');
    setEnteredDigits('');
    const prompt =
      'ଶିଫ୍ଟ୍ ପାଇଁ ୧, ଛୁଟି ପାଇଁ ୨, ମଜୁରି ଓ PF ପାଇଁ ୩, କାର୍ଯ୍ୟକ୍ଷେତ୍ର ସୁରକ୍ଷା ପାଇଁ ୪ ଦବାନ୍ତୁ। ମୁଖ୍ୟ ମେନୁ ଫେରିବାକୁ ୯ ଦବାନ୍ତୁ।';
    const translation =
      'Press 1 for Shifts & Overtime. Press 2 for Leave & Holidays. Press 3 for Wages & PF/ESI. Press 4 for Workplace Safety Rights. Press 9 for Main Menu.';
    announcePrompt(prompt, lang, translation);
  };

  const showInfoTopic = (index: number) => {
    const topic = INFORMATION_TOPICS[index];
    if (!topic) return;
    setSelectedInfoTopic(topic);
    setPhoneState('info_detail');
    const content = topic.contents[selectedLang];
    announcePrompt(content, selectedLang, topic.englishSummary);
  };

  const goToCategorySelect = (lang: Language) => {
    setPhoneState('category_select');
    setEnteredDigits('');
    const prompt = IVR_PROMPTS[lang].categoryMenu;
    const translation =
      'Press 1 for Machine / Safety, 2 for Wages & Overtime, 3 for Harassment, 4 for Hostel & Canteen, 5 for Supervisor Conduct.';
    announcePrompt(prompt, lang, translation);
  };

  const selectCategory = (category: Category) => {
    setSelectedCategory(category);
    setPhoneState('recording');
    setIsRecording(true);

    const isSensitive = isSensitiveCategory(category);
    const extraWarning = isSensitive
      ? ' [CONFIDENTIAL: Directly routed to Neutral Grievance Cell & External NGO. Supervisor will never see this complaint.]'
      : '';

    const prompt = IVR_PROMPTS[selectedLang].recordInstruction;
    announcePrompt(
      prompt,
      selectedLang,
      'Speak your complaint after the beep. Do not state your name if you wish to remain anonymous. Press # when finished.' +
        extraWarning
    );
  };

  const finishRecording = () => {
    setIsRecording(false);
    setPhoneState('processing');

    setTimeout(() => {
      // Determine what text was recorded
      let originalText = '';
      let translatedText = '';
      let lineOrArea = 'Line 3, Machine 12';
      let workerId = 'W123';

      if (sampleVoiceChoice === 'ramesh' || selectedCategory === 'safety') {
        originalText = 'ସିଲେଇ ମେସିନ୍ ଲାଇନ୍ ୩ ମେସିନ୍ ୧୨ ରେ ନିଆଁ ଝୁଲ ବାହାରୁଛି ଏବଂ ପୋଡ଼ିବା ବାସ୍ନା ଆସୁଛି।';
        translatedText = 'The sewing machine on Line 3, Machine 12 is sparking and making a burning smell.';
        lineOrArea = 'Line 3, Machine 12';
        workerId = 'W123';
      } else if (sampleVoiceChoice === 'hostel' || selectedCategory === 'hostel') {
        originalText = 'ହଷ୍ଟେଲ ବ୍ଲକ୍ C ପାଇଖାନାରେ ୩ ଦିନ ହେଲା ପାଣି ଆସୁନାହିଁ।';
        translatedText = 'Hostel Block C bathroom pipeline leaking with no running water for 3 days.';
        lineOrArea = 'Hostel Block C';
        workerId = 'W177';
      } else if (sampleVoiceChoice === 'wage' || selectedCategory === 'wages') {
        originalText = 'ଗତ ମାସର ୧୫ ଘଣ୍ଟା ଓଭରଟାଇମ୍ ମଜୁରି ଏପର୍ଯ୍ୟନ୍ତ ମିଳିନାହିଁ।';
        translatedText = '15 hours of overtime for last month has not been credited in salary slip.';
        lineOrArea = 'Finishing Unit';
        workerId = 'W408';
      } else {
        originalText = customVoiceText || 'କାର୍ଯ୍ୟକ୍ଷେତ୍ରରେ ସୁରକ୍ଷା ଉପକରଣ ମିଳୁନାହିଁ।';
        translatedText = customVoiceText || 'Safety guards missing on line workstation.';
        lineOrArea = 'Production Bay 1';
        workerId = 'W999';
      }

      // Check if ticket 4579 already exists in tickets
      const existing4579 = tickets.find((t) => t.id === 4579);
      const newTicketId = existing4579 && selectedCategory === 'safety' ? 4579 : 4000 + Math.floor(Math.random() * 900);
      setIssuedTicketId(newTicketId);

      const routing = routeComplaint(selectedCategory, 'factory-chennai', [
        {
          id: 'sup-1',
          name: 'Rajesh Kumar',
          factoryId: 'factory-chennai',
          department: 'Stitching & Maintenance',
          resolvedCount: 14,
          totalAssigned: 16,
          avgTimeHours: 11.5,
          ratings: [5, 4, 5],
        },
      ]);

      const newTicket: Ticket = {
        id: newTicketId,
        factoryId: 'factory-chennai',
        lineOrArea,
        category: selectedCategory,
        originalVoiceText: originalText,
        translatedText,
        language: selectedLang,
        status: 'new',
        createdAt: new Date().toISOString(),
        deadlineHours: routing.deadlineHours,
        remainingHours: routing.deadlineHours,
        assignedSupervisorId: routing.assignedSupervisorId,
        reporterWorkerId: workerId,
        isSensitive: routing.isSensitive,
        isSafetyVerified: selectedCategory === 'safety',
        isFirstReport: true,
        workerConfirmed: false,
      };

      onCreateTicket(newTicket);
      setPhoneState('ticket_issued');

      const prompt = IVR_PROMPTS[selectedLang].ticketIssued(newTicketId);
      announcePrompt(
        prompt,
        selectedLang,
        `Your complaint is registered. Your ticket number is ${newTicketId
          .toString()
          .split('')
          .join(' - ')}. Keep this number to check status.`
      );
    }, 1500);
  };

  const goToCheckTicketInput = (lang: Language) => {
    setPhoneState('check_ticket_input');
    setEnteredDigits('');
    const prompt = IVR_PROMPTS[lang].checkStatusPrompt;
    announcePrompt(
      prompt,
      lang,
      'Please enter your 4-digit ticket number using the keypad, followed by #, or tap a quick ticket below.'
    );
  };

  const submitTicketLookup = (presetId?: number) => {
    const ticketId = presetId ?? parseInt(enteredDigits, 10);
    const found = tickets.find((t) => t.id === ticketId);

    if (!found) {
      announcePrompt(
        'ଟିକେଟ୍ ମିଳିଲା ନାହିଁ। ଦୟାକରି ସଠିକ୍ ନମ୍ବର ଦବାନ୍ତୁ।',
        selectedLang,
        `Ticket #${ticketId} not found in database. Please check your 4-digit number.`
      );
      return;
    }

    setTargetTicket(found);

    if (found.status === 'awaiting_confirmation') {
      setPhoneState('confirm_resolution');
      const prompt = IVR_PROMPTS[selectedLang].confirmationQuestion;
      announcePrompt(
        `ଟିକେଟ୍ ${found.id}: ସୁପରଭାଇଜର ମରାମତି ଶେଷ କରିଛନ୍ତି। ` + prompt,
        selectedLang,
        `Ticket #${found.id} (${found.translatedText}) has been marked fixed by Maintenance. Press 1 if the problem is fixed. Press 2 if it is NOT fixed.`
      );
    } else {
      setPhoneState('check_ticket_status');
      let statusExplanation = '';
      if (found.status === 'new') statusExplanation = 'New report, queued for inspection.';
      else if (found.status === 'in_progress')
        statusExplanation = `In progress by maintenance team. SLA: ${found.remainingHours} hours remaining.`;
      else if (found.status === 'resolved')
        statusExplanation = 'Problem resolved and confirmed by worker. Case closed.';
      else if (found.status === 'escalated')
        statusExplanation = 'Escalated to neutral Grievance Cell & external NGO for emergency intervention.';

      announcePrompt(
        `ଟିକେଟ୍ ${found.id} ର ସ୍ଥିତି: ${found.status}।`,
        selectedLang,
        `Ticket #${found.id}: Status is ${found.status.toUpperCase()}. ${statusExplanation}`
      );
    }
  };

  const handleConfirmResponse = (isConfirmed: boolean) => {
    if (!targetTicket) return;

    if (isConfirmed) {
      setPhoneState('rate_supervisor');
      const prompt = IVR_PROMPTS[selectedLang].ratingPrompt;
      announcePrompt(
        prompt,
        selectedLang,
        'Thank you for confirming resolution. Please press 1 to 5 to rate the repair speed and supervisor quality.'
      );
    } else {
      onConfirmTicket(targetTicket.id, false);
      announcePrompt(
        'ସମସ୍ୟା ସମାଧାନ ହୋଇନାହିଁ। ଟିକେଟ୍ ଗ୍ରୀଭାନ୍ସ ସେଲ୍ କୁ ପଠାଗଲା।',
        selectedLang,
        'Problem marked as NOT solved. The ticket is immediately escalated to the independent Grievance Cell for inspection.'
      );
      setTimeout(() => {
        handleEndCall();
      }, 3500);
    }
  };

  const submitSupervisorRating = (rating: number) => {
    if (!targetTicket) return;
    onConfirmTicket(targetTicket.id, true, rating);

    announcePrompt(
      IVR_PROMPTS[selectedLang].thankYou,
      selectedLang,
      `Thank you! You rated ${rating} stars. Your resolution is officially verified. Supervisor score updated, and anonymous safety reward credited to your Worker ID!`
    );

    setTimeout(() => {
      handleEndCall();
    }, 3500);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Find any tickets waiting for worker confirmation
  const awaitingTickets = tickets.filter((t) => t.status === 'awaiting_confirmation');

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      {/* Intro banner */}
      <div className="mb-6 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm text-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              IVR
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Interactive Phone Voice Helpline</h2>
              <p className="text-xs text-slate-300">
                Simulates toll-free call from basic mobile phone. Big accessible buttons, spoken audio prompts, and zero typing required.
              </p>
            </div>
          </div>

          {awaitingTickets.length > 0 && (
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center space-x-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">
                {awaitingTickets.length} Ticket waiting for worker's "Press 1" confirmation!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Phone Device Shell on left + Telephony Debug / Script monitor on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Phone Shell (7 cols) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[380px] bg-slate-950 border-4 border-slate-700 rounded-[44px] shadow-2xl p-4 flex flex-col relative overflow-hidden">
            {/* Phone Speaker Notch */}
            <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center space-x-2">
              <div className="w-10 h-1 bg-slate-600 rounded-full" />
              <div className="w-2 h-2 rounded-full bg-slate-700" />
            </div>

            {/* Screen Area */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 min-h-[380px] flex flex-col justify-between text-white relative shadow-inner">
              {/* Top Status Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="font-semibold text-orange-400">1800-889-SPEAK</span>
                <span>{phoneState !== 'idle' ? `In Call: ${formatTimer(callDuration)}` : 'Helpline Ready'}</span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
                  <span>4G VoLTE</span>
                </span>
              </div>

              {/* Dynamic State Screen */}
              <div className="py-3 flex-1 flex flex-col justify-center">
                {phoneState === 'idle' && (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-orange-500/20 text-orange-400 mx-auto flex items-center justify-center shadow-lg shadow-orange-500/10">
                      <Phone className="w-8 h-8 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">SpeakUp Toll-Free</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        1800-889-SPEAK (1800-889-7732)
                      </p>
                      <p className="text-xs text-emerald-400 font-medium mt-1">
                        Free for all workers • No balance required
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => handleStartCall('ramesh')}
                        className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                          highlightRameshFlow
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 ring-4 ring-amber-400/50 shadow-lg shadow-amber-500/30'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <Phone className="w-4 h-4" />
                        <span>Dial Helpline (Start Call)</span>
                      </button>

                      {/* Quick shortcut if ticket 4579 is awaiting confirmation */}
                      {awaitingTickets.some((t) => t.id === 4579) && (
                        <button
                          onClick={() => {
                            handleStartCall();
                            setTimeout(() => {
                              setSelectedLang('odia');
                              submitTicketLookup(4579);
                            }, 1200);
                          }}
                          className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Simulate Callback: Confirm Ticket #4579</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {phoneState === 'connecting' && (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-medium text-orange-300">Connecting toll-free call...</p>
                    <p className="text-xs text-slate-400">Negotiating multi-lingual audio channel...</p>
                  </div>
                )}

                {phoneState === 'lang_select' && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">Step 1: Choose Language</span>
                      <h4 className="text-sm font-bold text-white mt-1">ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ / भाषा चुनें</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleKeyPress('1')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          highlightRameshFlow
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-700 text-amber-400">1</span>
                          <span className="text-[10px] text-slate-400">Odia</span>
                        </div>
                        <div className="font-semibold text-sm mt-1">ଓଡ଼ିଆ</div>
                      </button>

                      <button
                        onClick={() => handleKeyPress('2')}
                        className="p-2.5 rounded-xl border bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-white text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-700 text-orange-400">2</span>
                          <span className="text-[10px] text-slate-400">Hindi</span>
                        </div>
                        <div className="font-semibold text-sm mt-1">हिंदी</div>
                      </button>

                      <button
                        onClick={() => handleKeyPress('3')}
                        className="p-2.5 rounded-xl border bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-white text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-700 text-orange-400">3</span>
                          <span className="text-[10px] text-slate-400">Bengali</span>
                        </div>
                        <div className="font-semibold text-sm mt-1">বাংলা</div>
                      </button>

                      <button
                        onClick={() => handleKeyPress('4')}
                        className="p-2.5 rounded-xl border bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-white text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-700 text-orange-400">4</span>
                          <span className="text-[10px] text-slate-400">Tamil</span>
                        </div>
                        <div className="font-semibold text-sm mt-1">தமிழ்</div>
                      </button>
                    </div>
                  </div>
                )}

                {phoneState === 'main_menu' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400">IVR Main Menu</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                        {selectedLang}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleKeyPress('1')}
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-left flex items-center justify-between transition-all cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-blue-400">1. Information</div>
                          <div className="text-[11px] text-slate-300">Shifts, Rules & Benefits</div>
                        </div>
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded font-mono font-bold">1</span>
                      </button>

                      <button
                        onClick={() => handleKeyPress('2')}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          highlightRameshFlow
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50'
                            : 'border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-orange-400">2. Report a Problem</div>
                          <div className="text-[11px] text-slate-300">Safety, Wages, Harassment, Hostel</div>
                        </div>
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded font-mono font-bold">2</span>
                      </button>

                      <button
                        onClick={() => handleKeyPress('3')}
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-left flex items-center justify-between transition-all cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-emerald-400">3. Check Ticket / Confirm Fix</div>
                          <div className="text-[11px] text-slate-300">Verify repair & give rating</div>
                        </div>
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded font-mono font-bold">3</span>
                      </button>
                    </div>
                  </div>
                )}

                {phoneState === 'info_menu' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400">1. Pre-recorded Information</span>
                      <button
                        onClick={() => goToMainMenu(selectedLang)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Back</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {INFORMATION_TOPICS.map((topic, idx) => (
                        <button
                          key={topic.id}
                          onClick={() => showInfoTopic(idx)}
                          className="w-full p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs flex items-center justify-between cursor-pointer"
                        >
                          <div className="truncate mr-2">
                            <span className="font-semibold text-white">{topic.titles[selectedLang]}</span>
                          </div>
                          <span className="text-xs font-mono px-1.5 py-0.5 bg-slate-900 rounded text-blue-400">
                            {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {phoneState === 'info_detail' && selectedInfoTopic && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400">{selectedInfoTopic.titleKey}</span>
                      <button
                        onClick={() => goToInfoMenu(selectedLang)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Menu</span>
                      </button>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs space-y-2">
                      <p className="text-slate-200 font-medium">{selectedInfoTopic.contents[selectedLang]}</p>
                      <div className="pt-2 border-t border-slate-700 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">English Summary: </span>
                        {selectedInfoTopic.englishSummary}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        announcePrompt(
                          selectedInfoTopic.contents[selectedLang],
                          selectedLang,
                          selectedInfoTopic.englishSummary
                        )
                      }
                      className="w-full py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-medium flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Replay Spoken Audio</span>
                    </button>
                  </div>
                )}

                {phoneState === 'category_select' && (
                  <div className="space-y-2">
                    <div className="text-center">
                      <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">Step 2: Select Problem Category</span>
                    </div>

                    <div className="space-y-1.5">
                      <button
                        onClick={() => selectCategory('safety')}
                        className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          highlightRameshFlow
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-white'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-amber-400">1. Machine or Safety</div>
                          <div className="text-[10px] text-slate-300">Sparking, loose guards, fire hazard</div>
                        </div>
                        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">1</span>
                      </button>

                      <button
                        onClick={() => selectCategory('wages')}
                        className="w-full p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-left flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-emerald-400">2. Wages & Overtime</div>
                          <div className="text-[10px] text-slate-300">Unpaid overtime, wage cuts [Confidential]</div>
                        </div>
                        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">2</span>
                      </button>

                      <button
                        onClick={() => selectCategory('harassment')}
                        className="w-full p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-left flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-rose-400">3. Harassment</div>
                          <div className="text-[10px] text-slate-300">Abuse, threats, discrimination [Confidential]</div>
                        </div>
                        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">3</span>
                      </button>

                      <button
                        onClick={() => selectCategory('hostel')}
                        className="w-full p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-left flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-sky-400">4. Hostel or Canteen</div>
                          <div className="text-[10px] text-slate-300">Water, electricity, food hygiene</div>
                        </div>
                        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">4</span>
                      </button>

                      <button
                        onClick={() => selectCategory('supervisor')}
                        className="w-full p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-left flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-purple-400">5. Supervisor Conduct</div>
                          <div className="text-[10px] text-slate-300">Kickbacks, retaliation [Bypasses supervisor]</div>
                        </div>
                        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">5</span>
                      </button>
                    </div>
                  </div>
                )}

                {phoneState === 'recording' && (
                  <div className="space-y-3 text-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center animate-pulse">
                        <Mic className="w-8 h-8 text-rose-400" />
                      </div>
                      <span className="absolute top-0 right-1/3 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">Recording Voice Complaint...</h4>
                      <p className="text-xs text-rose-400 font-mono font-bold mt-1">
                        REC {formatTimer(recordingSeconds)} / 00:30
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Category: <span className="font-semibold text-white capitalize">{selectedCategory}</span>
                      </p>
                    </div>

                    {/* Preset voice simulation select */}
                    <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700 text-left space-y-2">
                      <div className="text-[11px] font-semibold text-amber-400 flex items-center justify-between">
                        <span>Simulation Voice Input:</span>
                        <span className="text-[10px] text-slate-400">Odia Sample</span>
                      </div>

                      <div className="text-xs text-slate-200 bg-slate-900/80 p-2 rounded border border-slate-800">
                        <div className="font-medium text-amber-300">
                          "ସିଲେଇ ମେସିନ୍ ଲାଇନ୍ ୩ ମେସିନ୍ ୧୨ ରେ ନିଆଁ ଝୁଲ ବାହାରୁଛି ଏବଂ ପୋଡ଼ିବା ବାସ୍ନା ଆସୁଛି..."
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 italic">
                          "The sewing machine on Line 3, Machine 12 is sparking and making a burning smell."
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={finishRecording}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <MicOff className="w-4 h-4" />
                      <span>Press # to Finish Recording</span>
                    </button>
                  </div>
                )}

                {phoneState === 'processing' && (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <h4 className="text-sm font-bold text-white">AI Voice-to-Text & Translation...</h4>
                    <div className="text-xs text-slate-300 space-y-1">
                      <p>1. Transcribing speech in {selectedLang.toUpperCase()}...</p>
                      <p>2. Translating to English for dispatch...</p>
                      <p>3. Generating secure anonymous Ticket ID...</p>
                    </div>
                  </div>
                )}

                {phoneState === 'ticket_issued' && issuedTicketId && (
                  <div className="space-y-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Complaint Registered</span>
                      <h4 className="text-lg font-extrabold text-amber-400 tracking-wider font-mono mt-0.5">
                        TICKET #{issuedTicketId}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        SLA Target: <span className="font-semibold text-white">24 Hours (Urgent Safety)</span>
                      </p>
                    </div>

                    <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700 text-left text-xs space-y-1">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Anonymous ID:</span>
                        <span className="font-mono text-emerald-400 font-bold">W123 (Ramesh)</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Assigned to:</span>
                        <span className="text-white font-medium">Supervisor Rajesh Kumar</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Reward Status:</span>
                        <span className="text-amber-400 font-medium">Safety Hazard First Reporter</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleEndCall}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                      >
                        End Call
                      </button>
                      <button
                        onClick={() => goToMainMenu(selectedLang)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white cursor-pointer"
                      >
                        Main Menu
                      </button>
                    </div>
                  </div>
                )}

                {phoneState === 'check_ticket_input' && (
                  <div className="space-y-3 text-center">
                    <span className="text-xs font-bold text-emerald-400">Enter Ticket Number</span>
                    <div className="h-10 bg-slate-800 rounded-xl flex items-center justify-center font-mono text-xl tracking-widest text-amber-400 border border-slate-700">
                      {enteredDigits || '____'}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Enter 4 digits and press # or tap quick ticket:
                    </p>

                    {/* Quick Ticket select buttons */}
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => submitTicketLookup(4579)}
                        className="w-full py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between cursor-pointer"
                      >
                        <span>Ticket #4579 (Sparking Machine)</span>
                        <span className="text-[10px] bg-amber-500/40 px-1.5 py-0.5 rounded">Select</span>
                      </button>

                      {tickets
                        .filter((t) => t.id !== 4579 && t.status === 'awaiting_confirmation')
                        .slice(0, 2)
                        .map((t) => (
                          <button
                            key={t.id}
                            onClick={() => submitTicketLookup(t.id)}
                            className="w-full py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center justify-between cursor-pointer"
                          >
                            <span>Ticket #{t.id} ({t.category})</span>
                            <span className="text-[10px] text-emerald-400 font-medium">Awaiting Fix</span>
                          </button>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setEnteredDigits('')}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:text-white"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => submitTicketLookup()}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      >
                        Search (#)
                      </button>
                    </div>
                  </div>
                )}

                {phoneState === 'check_ticket_status' && targetTicket && (
                  <div className="space-y-3 text-center">
                    <span className="text-xs font-bold text-orange-400">Ticket Status Result</span>
                    <h4 className="text-base font-extrabold text-white font-mono">
                      #{targetTicket.id}
                    </h4>

                    <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-left text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Category:</span>
                        <span className="font-semibold text-white capitalize">{targetTicket.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Status:</span>
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-700 text-amber-300 uppercase">
                          {targetTicket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-700">
                        {targetTicket.translatedText}
                      </div>
                    </div>

                    <button
                      onClick={() => goToMainMenu(selectedLang)}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    >
                      Back to Main Menu
                    </button>
                  </div>
                )}

                {phoneState === 'confirm_resolution' && targetTicket && (
                  <div className="space-y-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center animate-bounce">
                      <AlertTriangle className="w-6 h-6" />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                        Supervisor Marked Fixed
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        Ticket #{targetTicket.id}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 font-medium">
                        "Press 1 if fixed, 2 if not fixed"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleConfirmResponse(true)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          highlightRameshFlow
                            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-4 ring-emerald-400/50 shadow-lg'
                            : 'bg-emerald-600/30 hover:bg-emerald-600/40 border-emerald-500/50 text-emerald-300'
                        }`}
                      >
                        <div className="text-xl font-bold font-mono">1</div>
                        <div className="text-xs font-bold mt-1 text-emerald-300">Yes, Fixed!</div>
                        <div className="text-[10px] text-emerald-400/80">Confirm repair</div>
                      </button>

                      <button
                        onClick={() => handleConfirmResponse(false)}
                        className="p-3 rounded-xl border border-rose-500/50 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-center transition-all cursor-pointer"
                      >
                        <div className="text-xl font-bold font-mono">2</div>
                        <div className="text-xs font-bold mt-1 text-rose-300">No, Still Broken</div>
                        <div className="text-[10px] text-rose-400/80">Escalate case</div>
                      </button>
                    </div>
                  </div>
                )}

                {phoneState === 'rate_supervisor' && (
                  <div className="space-y-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                      <Star className="w-6 h-6 fill-amber-400" />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        Resolution Confirmed!
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        Rate Repair Quality (1 to 5 Stars)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        🔒 Ratings are 100% anonymous & averaged only after 5+ reviews
                      </p>
                    </div>

                    <div className="flex justify-center space-x-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => submitSupervisorRating(star)}
                          className={`w-10 h-10 rounded-xl font-bold font-mono text-sm border flex items-center justify-center transition-all cursor-pointer ${
                            star === 5 && highlightRameshFlow
                              ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300'
                              : 'bg-slate-800 hover:bg-amber-500/20 border-slate-700 text-amber-300'
                          }`}
                        >
                          {star}★
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {phoneState === 'call_ended' && (
                  <div className="text-center py-8 space-y-2">
                    <PhoneOff className="w-10 h-10 text-rose-400 mx-auto" />
                    <h4 className="text-base font-bold text-white">Call Disconnected</h4>
                    <p className="text-xs text-slate-400">Duration: {formatTimer(callDuration)}</p>
                  </div>
                )}
              </div>

              {/* Bottom Quick Call Hangup / Mute Controls */}
              {phoneState !== 'idle' && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (currentPromptText) {
                        announcePrompt(currentPromptText, selectedLang, currentPromptTranslation);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center space-x-1 cursor-pointer"
                    title="Repeat voice prompt"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px]">Repeat Prompt</span>
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="py-1 px-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-md shadow-rose-600/30 cursor-pointer"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>End Call</span>
                  </button>
                </div>
              )}
            </div>

            {/* Accessible Dial Keypad (Always available on basic phone) */}
            <div className="pt-3">
              <div className="grid grid-cols-3 gap-2 text-white">
                {[
                  { num: '1', letters: 'Odia / Info' },
                  { num: '2', letters: 'Hindi / Report' },
                  { num: '3', letters: 'Bengali / Status' },
                  { num: '4', letters: 'Tamil' },
                  { num: '5', letters: 'J-K-L' },
                  { num: '6', letters: 'M-N-O' },
                  { num: '7', letters: 'P-Q-R-S' },
                  { num: '8', letters: 'T-U-V' },
                  { num: '9', letters: 'W-X-Y-Z' },
                  { num: '*', letters: 'Clear' },
                  { num: '0', letters: '+' },
                  { num: '#', letters: 'Finish' },
                ].map(({ num, letters }) => (
                  <button
                    key={num}
                    onClick={() => handleKeyPress(num)}
                    disabled={phoneState === 'idle' || phoneState === 'connecting'}
                    className="h-11 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:bg-orange-500 active:text-white border border-slate-700/80 flex flex-col items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    aria-label={`Keypad button ${num}`}
                  >
                    <span className="font-bold text-sm leading-none">{num}</span>
                    <span className="text-[8px] text-slate-400 tracking-tighter leading-none mt-0.5 uppercase">
                      {letters}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Audio Transcript, NLP pipeline, & Call Flow Monitor (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Transcript Card */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-2">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Live Voice Channel & Transcript</h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                ttsEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
              }`}>
                {ttsEnabled ? 'Audio Active' : 'Text Only (Muted)'}
              </span>
            </div>

            {/* Prompt text in original chosen Indian language */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Helpline Voice Prompt ({selectedLang}):
              </span>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 font-medium text-sm text-amber-200 min-h-[50px] flex items-center">
                {currentPromptText || 'Waiting for call initiation (press Dial Helpline)...'}
              </div>
            </div>

            {/* English Subtitles / Translation */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                English Subtitle & Explanation:
              </span>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 min-h-[50px]">
                {currentPromptTranslation || 'The IVR speaks to workers in their native language (Odia, Hindi, Bengali, Tamil).'}
              </div>
            </div>
          </div>

          {/* AI Voice-to-Text & Categorization Pipeline Card */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-700/70 pb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Automated STT & NLP Engine</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="font-semibold text-white">Speech-to-Text (STT)</div>
                  <div className="text-slate-400 text-[11px]">
                    Converts Odia/Hindi/Bengali/Tamil voice stream into text without requiring the worker to type.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="font-semibold text-white">Neural Translation & Classification</div>
                  <div className="text-slate-400 text-[11px]">
                    Translates into English. Automatically detects machine numbers (e.g. "Line 3, Machine 12") and severity tags.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="font-semibold text-white">Zero-Retaliation Isolation Routing</div>
                  <div className="text-slate-400 text-[11px]">
                    Operational tickets go to supervisors with a 48h/24h SLA. Sensitive issues (wages, harassment, supervisor conduct) strictly bypass the supervisor and route directly to the NGO Grievance Cell.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Flow Navigator */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-300">
            <span className="font-bold text-amber-400">Helpline Phone Shortcuts:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-slate-400">
              <li>Dial → 1 (Odia) → 2 (Report) → 1 (Safety) → # (Finish) → Ticket 4579 created</li>
              <li>Dial → 1 (Odia) → 3 (Check Ticket) → 4579# → Press 1 to confirm fix!</li>
              <li>Dial → 1 (Odia) → 1 (Info) → 1 (Hear 8hr shift & 2x overtime rules)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
