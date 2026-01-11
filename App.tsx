
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Phone, 
  CheckCircle2, 
  MessageSquare, 
  Play, 
  RefreshCcw,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Volume2,
  Zap,
  Info,
  Database,
  Cpu,
  TrendingUp,
  Settings2,
  Layers,
  HelpCircle,
  Send
} from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Scenario, CapturedData, DemoStep } from './types';

// --- Constants ---

const FAQ_ITEMS = [
  { q: "How fast can we launch?", a: "Most deployments are completed within 7-14 days. This includes knowledge ingestion, technical CRM integration, and neural voice calibration." },
  { q: "Can it transfer to a human?", a: "Absolutely. You can define specific 'Escalation Triggers' (e.g., complex technical queries or high-intent phrases) that immediately route the call to a human agent with a full transcript of the AI's interaction." },
  { q: "Does it support Arabic/French/English?", a: "Yes. Our engine is natively multilingual, supporting over 50 languages. It can even detect language switches mid-call and adjust its responses accordingly." },
  { q: "What tools can it integrate with?", a: "We integrate with the entire tech stack: Twilio, Salesforce, HubSpot, Calendly, Zapier, and even custom internal APIs via webhooks." },
  { q: "How do you handle compliance/privacy?", a: "Security is non-negotiable. We employ SOC2-compliant data handling, PII scrubbing (automatically removing sensitive data from logs), and end-to-end encryption." },
  { q: "Can we customize the script?", a: "Every agent is bespoke. We don't use generic templates; we map your specific business logic into a complex knowledge graph for high-fidelity accuracy." }
];

const SCENARIOS: Scenario[] = [
  {
    id: 'booking',
    title: 'Dental Clinic - Appointment Booking',
    description: 'Purpose: To eliminate wait times for patients by autonomously handling routine check-up scheduling and triaging emergency calls. The agent syncs directly with the practice calendar and routes critical cases to a human professional.',
    steps: [
      { sender: 'agent', text: "Hi, thank you for calling Smile Dental. Are you looking to book a check-up or do you have an emergency?" },
      { sender: 'user', text: "I'd like to book a routine check-up, please.", fieldToUpdate: 'intent', valueToCapture: 'Check-up' },
      { sender: 'agent', text: "Perfect. We have availability this Thursday at 2 PM or Friday at 10 AM. Which works best?", fieldToUpdate: 'leadScore', valueToCapture: 'High' },
      { sender: 'user', text: "Friday at 10 AM works.", fieldToUpdate: 'dateTime', valueToCapture: 'Friday @ 10:00 AM' },
      { sender: 'agent', text: "Great! Can I get your full name to finalize the booking?" },
      { sender: 'user', text: "Sarah Johnson", fieldToUpdate: 'name', valueToCapture: 'Sarah Johnson', isInput: true },
      { sender: 'agent', text: "Thank you. I've sent a confirmation SMS to your number. See you then!" }
    ]
  },
  {
    id: 'real-estate',
    title: 'Real Estate - Lead Qualification',
    description: 'Purpose: To filter and qualify high-intent property leads 24/7. This agent verifies buyer readiness by capturing budget, mortgage status, and timeline before flagging "Hot" leads for immediate broker follow-up.',
    steps: [
      { sender: 'agent', text: "Hello! You're calling about the property on Maple Ave. Are you looking to buy or rent?" },
      { sender: 'user', text: "I'm looking to buy.", fieldToUpdate: 'intent', valueToCapture: 'Purchase' },
      { sender: 'agent', text: "Excellent. Have you already been pre-approved for a mortgage?" },
      { sender: 'user', text: "Yes, I have.", fieldToUpdate: 'leadScore', valueToCapture: 'Hot' },
      { sender: 'agent', text: "That's great. What is your preferred budget range?" },
      { sender: 'user', text: "$500k to $700k", fieldToUpdate: 'notes', valueToCapture: '$500k to $700k', isInput: true },
      { sender: 'agent', text: "Understood. I'll have an agent call you back shortly. What's your name?" },
      { sender: 'user', text: "Michael Chen", fieldToUpdate: 'name', valueToCapture: 'Michael Chen', isInput: true },
      { sender: 'agent', text: "Perfect. I've flagged this for our senior broker. Talk soon!" }
    ]
  },
  {
    id: 'support',
    title: 'SaaS - Level 1 Support',
    description: 'Purpose: To provide instant resolution for high-frequency technical and billing inquiries. The agent autonomously verifies user accounts and processes standard requests like refunds, significantly reducing human ticket volume.',
    steps: [
      { sender: 'agent', text: "Thanks for calling Codify Support. Are you having trouble with your API key or billing?" },
      { sender: 'user', text: "It's a billing issue.", fieldToUpdate: 'intent', valueToCapture: 'Billing' },
      { sender: 'agent', text: "Understood. Can you provide the last 4 digits of the card on file for verification?" },
      { sender: 'user', text: "4242", fieldToUpdate: 'notes', valueToCapture: '4242', isInput: true },
      { sender: 'agent', text: "Verified. I see the pending charge. Would you like me to process the refund now?" },
      { sender: 'user', text: "Yes, please do.", fieldToUpdate: 'leadScore', valueToCapture: 'Resolved' },
      { sender: 'agent', text: "Done. You'll see that back in your account in 3-5 days. Anything else?" }
    ]
  }
];

// --- Audio Helpers ---

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Sub-components ---

const CodifyLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M256 40L60 153.1V358.9L256 472L452 358.9V153.1L256 40ZM412 335.8L256 425.8L100 335.8V176.2L256 86.2L412 176.2V335.8Z" fill="currentColor" />
    <path d="M372 236H452V276H372V336L256 403L140 336V176L256 109L372 176V216H332V198.8L256 154.8L180 198.8V313.2L256 357.2L332 313.2V236H372Z" fill="currentColor" />
  </svg>
);

const TypewriterText = ({ text, totalDuration, onComplete }: { text: string; totalDuration: number; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const speed = useMemo(() => {
    return (totalDuration * 1000) / text.length;
  }, [totalDuration, text.length]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <span>{displayedText}</span>;
};

const FAQAccordion = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {FAQ_ITEMS.map((item, i) => (
        <div 
          key={i} 
          className={`bg-white/[0.02] border rounded-3xl overflow-hidden transition-all duration-300 ${
            activeIndex === i ? 'border-teal-500/30 bg-white/[0.04]' : 'border-white/5'
          }`}
        >
          <button 
            onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            className="w-full px-8 py-6 flex items-center justify-between text-left group"
          >
            <span className={`text-base md:text-lg font-bold transition-colors ${activeIndex === i ? 'text-teal-400' : 'text-slate-200 group-hover:text-white'}`}>
              {item.q}
            </span>
            <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 transition-all duration-300 ${activeIndex === i ? 'rotate-180 bg-teal-500/10 text-teal-500' : 'group-hover:bg-white/10 group-hover:text-white'}`}>
              <ChevronDown size={18} />
            </div>
          </button>
          <div 
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              activeIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-8 pb-8 text-slate-400 leading-relaxed font-medium">
              {item.a}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);
  const [isCalling, setIsCalling] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [transcript, setTranscript] = useState<DemoStep[]>([]);
  const [capturedData, setCapturedData] = useState<CapturedData>({
    name: '', phone: 'Simulation Mode', intent: '', dateTime: '', notes: '', leadScore: 'Low'
  });
  
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [lastAudioDuration, setLastAudioDuration] = useState(0);
  const [isAudioGenerating, setIsAudioGenerating] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  
  const scenario = useMemo(() => 
    SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0]
  , [selectedScenarioId]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript, isAudioLoading, isAudioGenerating]);

  const generateTTS = async (text: string) => {
    try {
      setIsAudioGenerating(true);
      setIsAudioLoading(true);
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this professionally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(
          decode(base64Audio),
          outputAudioCtxRef.current,
          24000,
          1
        );
        
        const source = outputAudioCtxRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioCtxRef.current.destination);
        
        setLastAudioDuration(audioBuffer.duration);
        setIsAudioLoading(false);
        
        source.start();
        return audioBuffer.duration;
      }
    } catch (err) {
      console.error("TTS generation failed", err);
      setIsAudioLoading(false);
    } finally {
      setIsAudioGenerating(false);
    }
    return 0;
  };

  const startDemo = async () => {
    setIsCalling(true);
    setCurrentStepIndex(0);
    const initialMsg = scenario.steps[0];
    setTranscript([initialMsg]);
    setCapturedData({ name: '', phone: 'Simulation Mode', intent: '', dateTime: '', notes: '', leadScore: 'Low' });
    await generateTTS(initialMsg.text);
  };

  const nextStep = async (manualValue?: string) => {
    if (currentStepIndex + 1 < scenario.steps.length) {
      const userStep = scenario.steps[currentStepIndex + 1];
      const agentStep = scenario.steps[currentStepIndex + 2];
      
      const userMessage = manualValue || userStep.text;
      
      setTranscript(prev => [...prev, { ...userStep, text: userMessage }]);
      
      if (userStep.fieldToUpdate) {
        setCapturedData(prev => ({
          ...prev,
          [userStep.fieldToUpdate!]: manualValue || userStep.valueToCapture || ''
        }));
      }

      setManualInput('');

      if (agentStep) {
        setTimeout(async () => {
          setTranscript(prev => [...prev, agentStep]);
          await generateTTS(agentStep.text);
          if (agentStep.fieldToUpdate) {
            setCapturedData(prev => ({
              ...prev,
              [agentStep.fieldToUpdate!]: agentStep.valueToCapture || ''
            }));
          }
        }, 400);
      }
      setCurrentStepIndex(prev => prev + 2);
    }
  };

  const resetDemo = (newId?: string) => {
    if (newId) setSelectedScenarioId(newId);
    setIsCalling(false);
    setTranscript([]);
    setCurrentStepIndex(0);
    setIsAudioLoading(false);
    setManualInput('');
  };

  const currentStep = scenario.steps[currentStepIndex + 1];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col font-['Inter']">
      <header className="border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <CodifyLogo className="w-7 h-7 text-teal-500 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-lg font-black tracking-tighter uppercase">CODIFY <span className="text-teal-500">AI LABS</span></span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-teal-500/10 border-b border-teal-500/20 py-3">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-3">
            <Info size={14} className="text-teal-500 shrink-0" />
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-teal-500 text-center">
              Disclaimer: This is just a showcase—the real product is far more comprehensive.
            </p>
          </div>
        </div>

        <section className="bg-gradient-to-b from-teal-950/20 to-[#0a0a0b] border-b border-white/5 py-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-8 items-end">
              <div className="animate-message">
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
                  AI <span className="text-teal-500">Voice Agent</span> Showcase
                </h1>
                <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                  Test our conversational engine. Experience high-fidelity neural voices paired with complex logic paths and real-time data capture.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {SCENARIOS.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => resetDemo(s.id)}
                    className={`px-5 py-3 rounded-xl text-xs font-bold transition-all border ${
                      selectedScenarioId === s.id 
                        ? 'bg-teal-500 border-teal-500 text-black shadow-lg shadow-teal-500/20' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 py-10 px-6 overflow-hidden flex flex-col">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 w-full flex-1 min-h-0">
            <div className="lg:col-span-8 space-y-6 flex flex-col min-h-0">
              <div className="bg-[#111113]/80 rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col flex-1 min-h-[500px] backdrop-blur-xl">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-2.5 h-2.5 rounded-full ${isCalling ? 'bg-teal-500' : 'bg-slate-700'}`}></div>
                      {isCalling && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping opacity-75"></div>}
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      {isCalling ? 'Active Session' : 'Ready to Start'}
                    </span>
                  </div>
                </div>

                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 scrollbar-hide">
                  {!isCalling ? (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-message">
                      <div className="w-24 h-24 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-500 mb-8 border border-teal-500/20 shadow-inner">
                        <Phone size={40} />
                      </div>
                      <h3 className="text-3xl font-black mb-3 tracking-tight">Launch Interaction</h3>
                      <p className="text-slate-500 mb-6 max-w-sm text-lg leading-relaxed italic">
                        Experience the <span className="text-white font-bold">{scenario.title}</span> scenario.
                      </p>
                      
                      <div className="max-w-md mx-auto mb-10 p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500">Scenario Purpose</div>
                        <p className="text-slate-400 text-sm leading-relaxed text-center font-medium">
                          {scenario.description.replace('Purpose: ', '')}
                        </p>
                      </div>

                      <button 
                        onClick={startDemo}
                        className="bg-white text-black px-12 py-5 rounded-2xl font-black hover:bg-teal-500 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-4 shadow-xl shadow-white/5"
                      >
                        <Play size={24} fill="currentColor" /> Start Voice Demo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {transcript.map((msg, i) => {
                        const isLast = i === transcript.length - 1;
                        const isAgent = msg.sender === 'agent';
                        
                        return (
                          <div key={i} className={`flex ${isAgent ? 'justify-start' : 'justify-end'} animate-message`}>
                            <div className={`group relative max-w-[85%] md:max-w-[75%] ${isAgent ? 'w-full' : ''}`}>
                              {isAgent && (
                                <div className="flex items-center justify-between gap-4 mb-3.5 px-1">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
                                        <CodifyLogo className="w-3.5 h-3.5 text-black" />
                                      </div>
                                      {(isAudioLoading || !isLast) && isAgent && isLast && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-teal-400 rounded-full border-2 border-black animate-pulse" />
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className={`text-[10px] font-black uppercase tracking-[0.15em] text-teal-500 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20 shadow-sm inline-flex items-center gap-2 ${isLast ? 'animate-badge-pulse' : ''}`}>
                                        Agent Alpha
                                        {isLast && isAgent && !isAudioLoading && (
                                          <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping" />
                                        )}
                                      </span>
                                    </div>
                                    {isAudioLoading && i === transcript.length - 1 && isAgent && (
                                      <div className="flex gap-1 items-center ml-1">
                                        {[0, 1, 2].map(dot => (
                                          <div key={dot} className="w-1.5 h-1.5 bg-teal-500/40 rounded-full animate-bounce" style={{ animationDelay: `${0.15 * dot}s` }} />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {!isAudioLoading && (
                                    <button 
                                      onClick={() => generateTTS(msg.text)}
                                      className="p-2 rounded-xl hover:bg-white/5 text-slate-600 hover:text-teal-500 transition-all group"
                                      disabled={isAudioGenerating}
                                    >
                                      <Volume2 size={15} className="group-active:scale-90 transition-transform" />
                                    </button>
                                  )}
                                </div>
                              )}

                              <div className={`relative px-6 py-5 rounded-[2rem] transition-all duration-300 ${
                                isAgent 
                                  ? 'agent-bubble text-slate-100 rounded-tl-none border border-white/5 bg-white/[0.02] shadow-xl' 
                                  : 'user-bubble text-black font-bold rounded-tr-none shadow-teal-500/10'
                              }`}>
                                <p className="text-base md:text-[1.05rem] leading-relaxed tracking-tight whitespace-pre-wrap">
                                  {isAgent && isLast ? (
                                    isAudioLoading ? (
                                      <span className="opacity-0">{msg.text}</span>
                                    ) : (
                                      <TypewriterText 
                                        text={msg.text} 
                                        totalDuration={lastAudioDuration || 2} 
                                      />
                                    )
                                  ) : (
                                    msg.text
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {isCalling && (
                  <div className="p-6 md:p-8 border-t border-white/5 bg-black/60 backdrop-blur-md animate-message">
                    {currentStepIndex + 1 < scenario.steps.length ? (
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5 flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-500 shadow-inner group-hover:bg-teal-500/10 transition-colors">
                            <MessageSquare size={24} />
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Next Dialogue Interaction</div>
                            <div className="text-base font-bold text-white italic tracking-tight leading-snug">"{scenario.steps[currentStepIndex + 1].text}"</div>
                          </div>
                        </div>

                        <div className="flex-1 flex gap-3 max-w-md">
                          {currentStep?.isInput ? (
                            <div className="flex-1 relative">
                              <input 
                                type="text"
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && manualInput && nextStep(manualInput)}
                                placeholder="Type response..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-teal-500 transition-colors"
                              />
                              <button 
                                onClick={() => manualInput && nextStep(manualInput)}
                                disabled={isAudioLoading || !manualInput}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-teal-500 text-black hover:bg-white transition-all disabled:opacity-50"
                              >
                                <Send size={18} />
                              </button>
                            </div>
                          ) : null}
                          
                          {!currentStep?.isInput ? (
                             <button 
                               onClick={() => nextStep()}
                               disabled={isAudioLoading}
                               className={`min-w-[180px] px-8 py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 group active:scale-95 ${
                                 isAudioLoading 
                                   ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5 shadow-none' 
                                   : 'bg-teal-500 text-black hover:bg-white shadow-xl shadow-teal-500/20 hover:-translate-y-0.5'
                               }`}
                             >
                               {isAudioLoading ? 'Processing...' : 'Send Response'} 
                               {!isAudioLoading && <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />}
                             </button>
                          ) : (
                             <button 
                               onClick={() => nextStep()}
                               disabled={isAudioLoading}
                               className="px-6 py-4 rounded-2xl font-bold bg-white/5 text-slate-400 hover:text-white transition-all text-sm border border-white/10"
                             >
                               Skip to default
                             </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 animate-message">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-500 font-bold mb-6">
                          <CheckCircle2 size={20} /> Interaction Journey Complete
                        </div>
                        <div className="block">
                          <button 
                            onClick={() => resetDemo()} 
                            className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-all underline decoration-teal-500/30 hover:decoration-teal-500 underline-offset-8"
                          >
                            Restart Showcase
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {[
                  { label: 'Neural Fidelity', value: 'Studio', icon: Volume2, detail: 'Clone Voice quality' },
                  { label: 'Response', value: '< 200ms', icon: RefreshCcw, detail: 'Average latency' },
                  { label: 'Safety', value: 'Level 4', icon: ShieldCheck, detail: 'PII Scrubbing enabled' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#111113]/50 p-6 rounded-3xl border border-white/5 flex items-center gap-5 transition-all hover:border-white/10 group animate-message" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-teal-500 group-hover:scale-110 transition-transform">
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                      <div className="text-xl font-black tracking-tighter">{stat.value}</div>
                      <div className="text-[10px] text-slate-600 font-medium">{stat.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6 flex flex-col min-h-0">
              <div className="bg-[#111113]/80 rounded-3xl border border-white/5 p-8 flex flex-col h-full shadow-2xl backdrop-blur-xl animate-message">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-500/10 rounded-xl">
                      <LayoutDashboard size={20} className="text-teal-500" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">Structured Extraction</h3>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/10 rounded-full border border-teal-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                    <span className="text-[10px] font-mono text-teal-500 font-bold uppercase tracking-wider">Active Capture</span>
                  </div>
                </div>

                <div className="space-y-8 flex-1">
                  {[
                    { label: 'Recognized Name', value: capturedData.name, placeholder: 'Scanning utterance...' },
                    { label: 'Detected Intent', value: capturedData.intent, placeholder: 'Categorizing flow...' },
                    { label: 'Appointment / Time', value: capturedData.dateTime, placeholder: 'Awaiting slot data...' },
                    { label: 'Parsed Entities', value: capturedData.notes, placeholder: 'Entity parsing...' },
                  ].map((field, i) => (
                    <div key={i} className="group animate-message" style={{ animationDelay: `${0.5 + i * 0.05}s` }}>
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] mb-2.5 flex justify-between items-center">
                        {field.label}
                        {field.value && <CheckCircle2 size={12} className="text-teal-500" />}
                      </div>
                      <div className={`p-4 rounded-2xl border text-[0.95rem] font-bold transition-all duration-700 ${
                        field.value 
                          ? 'bg-teal-500/5 border-teal-500/20 text-teal-400 shadow-lg shadow-teal-500/5' 
                          : 'bg-black/40 border-white/5 text-slate-700 italic font-medium'
                      }`}>
                        {field.value || field.placeholder}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4">
                    <div className="flex justify-between items-end mb-3">
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Inference Confidence</div>
                      <div className={`text-xs font-black uppercase tracking-tighter transition-colors duration-500 ${
                        capturedData.leadScore === 'High' || capturedData.leadScore === 'Hot' || capturedData.leadScore === 'Resolved' ? 'text-teal-500' : 'text-slate-700'
                      }`}>
                        {capturedData.leadScore} Match
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(20,184,166,0.2)] ${
                          capturedData.leadScore === 'High' || capturedData.leadScore === 'Hot' || capturedData.leadScore === 'Resolved' ? 'bg-teal-500 w-[88%]' : 'bg-slate-800 w-[15%]'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-12 p-6 bg-white/[0.02] rounded-2xl border border-white/5 shadow-inner">
                  <p className="text-xs text-slate-500 leading-relaxed text-center font-medium italic">
                    "Neural logic dynamically populates your CRM schema."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 px-6 bg-[#0a0a0b] relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-24 animate-message">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-500 text-[10px] font-black uppercase tracking-widest mb-6">
                Our Methodology
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                A High-Speed <span className="text-teal-500">Path to Autonomy</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
                We translate your business intelligence into complex conversational flows that feel human and act with surgical precision.
              </p>
            </div>

            <div className="relative">
              <div className="hidden lg:block absolute top-[4.5rem] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent z-0"></div>

              <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
                {[
                  {
                    step: "01",
                    phase: "Discovery",
                    title: "Knowledge Mapping",
                    desc: "We ingest your FAQs, pricing, and brand tone. Our team builds a custom neural knowledge graph that reflects your business perfectly.",
                    icon: Database,
                    color: "from-teal-500 to-emerald-500",
                    shadow: "shadow-teal-500/20"
                  },
                  {
                    step: "02",
                    phase: "Integration",
                    title: "Technical Sync",
                    desc: "We connect your new AI agent to your VoIP provider, CRM (Salesforce/HubSpot), and calendar systems for real-time actions.",
                    icon: Cpu,
                    color: "from-blue-500 to-indigo-500",
                    shadow: "shadow-blue-500/20"
                  },
                  {
                    step: "03",
                    phase: "Operation",
                    title: "Live Deployment",
                    desc: "Your agent goes live. We monitor early interactions, refining logic and audio fidelity based on real-world performance metrics.",
                    icon: TrendingUp,
                    color: "from-purple-500 to-pink-500",
                    shadow: "shadow-purple-500/20"
                  }
                ].map((item, i) => (
                  <div key={i} className="relative group animate-message" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
                    <div className="bg-[#111113]/40 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center text-center h-full transition-all duration-500 hover:bg-white/[0.04] hover:border-white/20 hover:-translate-y-2 hover:shadow-2xl">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black border border-white/10 rounded-full text-[11px] font-black tracking-widest text-slate-400 group-hover:text-white transition-colors">
                        PHASE {item.step}
                      </div>

                      <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${item.color} p-[1px] mb-8 ${item.shadow} group-hover:scale-110 transition-transform duration-500`}>
                        <div className="w-full h-full bg-black rounded-[calc(1.5rem-1px)] flex items-center justify-center">
                          <item.icon size={36} className="text-white" />
                        </div>
                      </div>

                      <div className="text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] mb-4">{item.phase}</div>
                      <h3 className="text-2xl font-black mb-5 tracking-tight group-hover:text-white transition-colors">{item.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                        {item.desc}
                      </p>
                      <div className="mt-10 w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                         <div className={`h-full bg-gradient-to-r ${item.color} w-0 group-hover:w-full transition-all duration-700 ease-out`}></div>
                      </div>
                    </div>
                    {i < 2 && <div className="lg:hidden h-12 w-[1px] bg-gradient-to-b from-white/10 to-transparent mx-auto mt-0"></div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-32 pt-20 border-t border-white/5">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-message">
                 {[
                   { icon: Settings2, label: "Custom Logic", desc: "Hard-coded business rules" },
                   { icon: Zap, label: "0.2s Latency", desc: "Near-instant response time" },
                   { icon: ShieldCheck, label: "Enterprise Encryption", desc: "SOC2 compliant standards" },
                   { icon: Layers, label: "Deep Stack", desc: "Vercel + Google Cloud + Twilio" }
                 ].map((feat, i) => (
                   <div key={i} className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 flex flex-col gap-6 hover:bg-white/[0.03] transition-all hover:border-white/10 group">
                     <div className="w-10 h-10 rounded-xl bg-teal-500/5 flex items-center justify-center text-teal-500 border border-teal-500/10 group-hover:bg-teal-500 group-hover:text-black transition-all">
                       <feat.icon size={20} />
                     </div>
                     <div>
                       <div className="text-xs font-black uppercase tracking-widest text-white mb-2">{feat.label}</div>
                       <div className="text-xs text-slate-500 font-medium leading-relaxed">{feat.desc}</div>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 px-6 bg-[#0a0a0b] border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20 animate-message">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">
                <HelpCircle size={14} className="text-teal-500" /> FAQ
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Common <span className="text-teal-500">Queries</span></h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Everything you need to know about the Codify neural conversational engine and deployment process.
              </p>
            </div>
            <FAQAccordion />
          </div>
        </section>
      </main>

      <footer className="py-10 px-6 border-t border-white/5 bg-[#0a0a0b]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 text-slate-600">
            <CodifyLogo className="w-6 h-6 opacity-40" />
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-60">
              &copy; 2025 CODIFY <span className="text-teal-500 font-black">AI LABS</span>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
