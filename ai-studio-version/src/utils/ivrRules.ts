import { Category, Language, Supervisor, Ticket } from '../types';

/**
 * Sensitive categories go straight to the neutral grievance cell (NGO).
 * Wages, harassment, and supervisor complaints never appear in the supervisor dashboard.
 */
export function isSensitiveCategory(category: Category): boolean {
  return category === 'wages' || category === 'harassment' || category === 'supervisor';
}

/**
 * Routing logic for incoming complaints.
 */
export function routeComplaint(
  category: Category,
  factoryId: string,
  availableSupervisors: Supervisor[]
): {
  isSensitive: boolean;
  assignedSupervisorId: string | null;
  deadlineHours: number;
} {
  if (isSensitiveCategory(category)) {
    return {
      isSensitive: true,
      assignedSupervisorId: null, // Never assigned to local supervisor
      deadlineHours: 48,
    };
  }

  // Find a supervisor in this factory
  const factorySup = availableSupervisors.find((s) => s.factoryId === factoryId) || availableSupervisors[0] || null;

  return {
    isSensitive: false,
    assignedSupervisorId: factorySup ? factorySup.id : null,
    // Machine/safety issues have urgent 24h SLA; hostel has 48h SLA
    deadlineHours: category === 'safety' ? 24 : 48,
  };
}

/**
 * Check if a ticket has overdue SLA and should auto-escalate.
 */
export function isTicketOverdue(ticket: Ticket): boolean {
  if (ticket.status === 'resolved') return false;
  return ticket.remainingHours <= 0;
}

/**
 * Calculates supervisor statistics.
 * Crucial rule: Worker ratings (1-5) are shown ONLY as an average after 5+ ratings.
 */
export function calculateSupervisorMetrics(
  supervisor: Supervisor,
  tickets: Ticket[]
): {
  confirmedResolvedCount: number;
  totalAssigned: number;
  resolutionRatePercent: number;
  avgTimeHours: number;
  averageRating: number | null; // null if < 5 ratings
  ratingsCount: number;
} {
  const supervisorTickets = tickets.filter(
    (t) => t.assignedSupervisorId === supervisor.id && !t.isSensitive
  );

  const confirmedResolved = supervisorTickets.filter(
    (t) => t.status === 'resolved' && t.workerConfirmed
  );

  const totalAssigned = Math.max(supervisorTickets.length, supervisor.totalAssigned || 1);
  const confirmedCount = confirmedResolved.length + (supervisor.resolvedCount || 0);

  const resolutionRatePercent = Math.min(
    100,
    Math.round((confirmedCount / totalAssigned) * 100)
  );

  const ratingsCount = supervisor.ratings.length;
  let averageRating: number | null = null;

  // Prompt requirement: "Worker ratings (1–5) shown only as an average after 5+ ratings."
  if (ratingsCount >= 5) {
    const sum = supervisor.ratings.reduce((acc, curr) => acc + curr, 0);
    averageRating = Number((sum / ratingsCount).toFixed(1));
  }

  return {
    confirmedResolvedCount: confirmedCount,
    totalAssigned,
    resolutionRatePercent,
    avgTimeHours: supervisor.avgTimeHours || 14,
    averageRating,
    ratingsCount,
  };
}

/**
 * Safety Reward logic:
 * Verified safety reports earn reward points for the first reporter only,
 * credited anonymously by Worker ID (e.g., W123).
 * Non-safety categories (wages, hostel, supervisor, harassment) do not earn safety rewards.
 */
export function checkSafetyRewardEligibility(
  ticket: Ticket,
  allTickets: Ticket[]
): {
  isEligible: boolean;
  points: number;
  amountInr: number;
  reason: string;
} {
  if (ticket.category !== 'safety') {
    return {
      isEligible: false,
      points: 0,
      amountInr: 0,
      reason: 'Rewards apply only to verified machine & workplace safety reports.',
    };
  }

  // Check if an earlier ticket exists for this exact machine or line
  const earlierDuplicate = allTickets.find(
    (t) =>
      t.id !== ticket.id &&
      t.factoryId === ticket.factoryId &&
      t.category === 'safety' &&
      t.lineOrArea.toLowerCase() === ticket.lineOrArea.toLowerCase() &&
      new Date(t.createdAt).getTime() < new Date(ticket.createdAt).getTime()
  );

  if (earlierDuplicate) {
    return {
      isEligible: false,
      points: 0,
      amountInr: 0,
      reason: `Earlier report already logged by another worker on ${earlierDuplicate.lineOrArea}.`,
    };
  }

  return {
    isEligible: true,
    points: 500,
    amountInr: 250,
    reason: 'First verified report of active electrical/mechanical hazard.',
  };
}

/**
 * IVR audio prompts in the 4 supported languages.
 */
export const IVR_PROMPTS: Record<
  Language,
  {
    welcome: string;
    mainMenu: string;
    categoryMenu: string;
    recordInstruction: string;
    ticketIssued: (id: number) => string;
    checkStatusPrompt: string;
    confirmationQuestion: string;
    ratingPrompt: string;
    thankYou: string;
  }
> = {
  odia: {
    welcome: 'ସ୍ପିକ୍-ଅପ୍ କୁ ସ୍ଵାଗତ। ଓଡ଼ିଆ ପାଇଁ ୧ ଦବାନ୍ତୁ, ହିନ୍ଦୀ ପାଇଁ ୨, ବଙ୍ଗଳା ପାଇଁ ୩, ତାମିଲ ପାଇଁ ୪।',
    mainMenu: 'ସୂଚନା ଜାଣିବା ପାଇଁ ୧ ଦବାନ୍ତୁ। ଅଭିଯୋଗ ଦାଖଲ ପାଇଁ ୨ ଦବାନ୍ତୁ। ଟିକେଟ୍ ସ୍ଥିତି ଯାଞ୍ଚ କିମ୍ବା ସମାଧାନ ନିଶ୍ଚିତ କରିବା ପାଇଁ ୩ ଦବାନ୍ତୁ।',
    categoryMenu: 'ମେସିନ୍ କିମ୍ବା ସୁରକ୍ଷା ପାଇଁ ୧, ମଜୁରି ପାଇଁ ୨, ନିର୍ଯାତନା ପାଇଁ ୩, ହଷ୍ଟେଲ ପାଇଁ ୪, ସୁପରଭାଇଜର ଆଚରଣ ପାଇଁ ୫ ଦବାନ୍ତୁ।',
    recordInstruction: 'ବିପ୍ ଶବ୍ଦ ପରେ ଆପଣଙ୍କ ସମସ୍ୟା କୁହନ୍ତୁ। ଗୋପନୀୟ ରହିବାକୁ ଚାହୁଁଥିଲେ ନିଜ ନାମ କୁହନ୍ତୁ ନାହିଁ। ଶେଷ ହେଲେ ହ୍ୟାଶ୍ ଦବାନ୍ତୁ।',
    ticketIssued: (id) => `ଆପଣଙ୍କ ଟିକେଟ୍ ନମ୍ବର ହେଉଛି ${id.toString().split('').join(' - ')}। ସ୍ଥିତି ଜାଣିବା ପାଇଁ ଏହି ନମ୍ବର ମନେ ରଖନ୍ତୁ।`,
    checkStatusPrompt: 'ଦୟାକରି ଆପଣଙ୍କ ୪ ଅଙ୍କ ବିଶିଷ୍ଟ ଟିକେଟ୍ ନମ୍ବର ଦବାନ୍ତୁ।',
    confirmationQuestion: 'ଆପଣଙ୍କ ସମସ୍ୟାର ସମାଧାନ ହୋଇଥିଲେ ୧ ଦବାନ୍ତୁ, ଯଦି ସମାଧାନ ହୋଇନାହିଁ ତେବେ ୨ ଦବାନ୍ତୁ।',
    ratingPrompt: 'କାମ କେତେ ଭଲ ହୋଇଛି ଜଣାଇବାକୁ ୧ ରୁ ୫ ମଧ୍ୟରେ ଷ୍ଟାର୍ ରେଟିଂ ଦିଅନ୍ତୁ।',
    thankYou: 'ଧନ୍ୟବାଦ। ଆପଣଙ୍କ ମତାମତ ଗ୍ରହଣ କରାଯାଇଛି।',
  },
  hindi: {
    welcome: 'स्पीक-अप में आपका स्वागत है। ओडिया के लिए 1, हिंदी के लिए 2, बंगाली के लिए 3, तमिल के लिए 4 दबाएं।',
    mainMenu: 'नियम और लाभ की जानकारी के लिए 1 दबाएं। समस्या दर्ज करने के लिए 2 दबाएं। टिकट स्थिति जांचने के लिए 3 दबाएं।',
    categoryMenu: 'मशीन या सुरक्षा के लिए 1, वेतन के लिए 2, उत्पीड़न के लिए 3, हॉस्टल के लिए 4, सुपरवाइजर के लिए 5 दबाएं।',
    recordInstruction: 'बीप की आवाज़ के बाद अपनी समस्या बोलें। पहचान गुप्त रखने के लिए अपना नाम न बताएं। समाप्त होने पर हैश दबाएं।',
    ticketIssued: (id) => `आपका टिकट नंबर है ${id.toString().split('').join(' - ')}। स्थिति जानने के लिए इसे सुरक्षित रखें।`,
    checkStatusPrompt: 'कृपया अपना 4 अंकों का टिकट नंबर दर्ज करें।',
    confirmationQuestion: 'यदि आपकी समस्या ठीक हो गई है तो 1 दबाएं, यदि ठीक नहीं हुई है तो 2 दबाएं।',
    ratingPrompt: 'समाधान की गुणवत्ता बताने के लिए 1 से 5 स्टार रेटिंग दें।',
    thankYou: 'धन्यवाद। आपकी प्रतिक्रिया दर्ज कर ली गई है।',
  },
  bengali: {
    welcome: 'স্পিক-আপ এ স্বাগতম। ওড়িয়া জন্য 1, হিন্দি জন্য 2, বাংলা জন্য 3, তামিল জন্য 4 চাপুন।',
    mainMenu: 'কাজের তথ্য ও সুবিধার জন্য 1 চাপুন। অভিযোগ জানাতে 2 চাপুন। টিকিট স্ট্যাটাস চেক করতে 3 চাপুন।',
    categoryMenu: 'মেশিন বা সুরক্ষার জন্য 1, মজুরির জন্য 2, হয়রানির জন্য 3, হোস্টেলের জন্য 4, সুপারভাইজারের জন্য 5 চাপুন।',
    recordInstruction: 'বিপ শব্দের পর আপনার সমস্যা বলুন। নাম গোপন রাখতে চাইলে নাম বলবেন না। শেষ হলে হ্যাশ চাপুন।',
    ticketIssued: (id) => `আপনার টিকিট নম্বর হল ${id.toString().split('').join(' - ')}। স্ট্যাটাস জানতে এটি মনে রাখুন।`,
    checkStatusPrompt: 'অনুগ্রহ করে আপনার 4 ডিজিটের টিকিট নম্বর চাপুন।',
    confirmationQuestion: 'সমস্যা সমাধান হয়ে থাকলে 1 চাপুন, সমাধান না হলে 2 চাপুন।',
    ratingPrompt: 'কাজের গুণমান জানাতে 1 থেকে 5 স্টার রেটিং দিন।',
    thankYou: 'ধন্যবাদ। আপনার মতামত গ্রহণ করা হয়েছে।',
  },
  tamil: {
    welcome: 'ஸ்பீக்-அப்-க்கு வரவேற்கிறோம். ஒடியாவுக்கு 1, இந்திக்கு 2, பெங்காலிக்கு 3, தமிழுக்கு 4 அழுத்தவும்.',
    mainMenu: 'தகவல் அறிய 1 ஐ அழுத்தவும். புகாரைப் பதிவு செய்ய 2 ஐ அழுத்தவும். டிக்கெட் நிலையை சரிபார்க்க 3 ஐ அழுத்தவும்.',
    categoryMenu: 'இயந்திரம்/பாதுகாப்புக்கு 1, ஊதியத்திற்கு 2, தொல்லைக்கு 3, விடுதிக்கு 4, மேற்பார்வையாளருக்கு 5 அழுத்தவும்.',
    recordInstruction: 'பீப் சத்தத்திற்குப் பிறகு உங்கள் புகாரைப் பேசுங்கள். பெயர் கூற வேண்டாம். முடிந்ததும் ஹேஷ் அழுத்தவும்.',
    ticketIssued: (id) => `உங்கள் டிக்கெட் எண் ${id.toString().split('').join(' - ')}. நிலையை அறிய இதை நினைவில் கொள்ளுங்கள்.`,
    checkStatusPrompt: 'தயவுசெய்து உங்கள் 4 இலக்க டிக்கெட் எண்ணை உள்ளிடவும்.',
    confirmationQuestion: 'பிரச்சினை தீர்க்கப்பட்டால் 1 ஐ அழுத்தவும், தீர்க்கப்படவில்லை என்றால் 2 ஐ அழுத்தவும்.',
    ratingPrompt: 'தீர்வின் தரத்தை மதிப்பிட 1 முதல் 5 வரை தேர்வு செய்யவும்.',
    thankYou: 'நன்றி. உங்கள் பதில் பதிவு செய்யப்பட்டது.',
  },
};
