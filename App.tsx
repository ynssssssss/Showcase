
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Play, 
  Pause,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Zap,
  Send,
  User,
  Brain,
  Binary,
  CalendarCheck,
  ArrowUpRight,
  MonitorPlay,
  Sparkles,
  Phone,
  Database,
  Globe,
  Settings
} from 'lucide-react';
import { Scenario, CapturedData, DemoStep } from './types';

// --- Constants ---

const DEMO_AUDIO_URL = 'https://raw.githubusercontent.com/ynssssssss/Showcase/main/public/Tests.mp3';

const FAQ_ITEMS = [
  { q: "How fast can we launch?", a: "Most enterprise deployments are completed within 7-14 days. This includes knowledge base ingestion, technical CRM integration, and voice calibration for your specific brand voice." },
  { q: "Is the solution compliant with industry standards?", a: "Yes. Our agents are built on a secure infrastructure that supports SOC2 Type II, HIPAA, and GDPR-compliant data processing pipelines." },
  { q: "Can it transfer to a human?", a: "Absolutely. You can define specific 'Escalation Triggers' that immediately route the session to a human agent with a full real-time transcript." },
  { q: "What tools can it integrate with?", a: "We support native integrations with Salesforce, HubSpot, Zendesk, Calendly, and custom backend systems." }
];

const PROCESS_STEPS = [
  {
    icon: Database,
    title: "1. Calibration",
    desc: "We ingest your documentation, medical protocols, or sales scripts into our neural engine.",
    color: "from-teal-500/20 to-transparent"
  },
  {
    icon: Settings,
    title: "2. Integration",
    desc: "Native sync with your CRM, EHR, or scheduling software for zero-friction data flow.",
    color: "from-blue-500/20 to-transparent"
  },
  {
    icon: Globe,
    title: "3. Deployment",
    desc: "Your agent goes live on any telecom carrier, handling thousands of concurrent calls.",
    color: "from-purple-500/20 to-transparent"
  }
];

const SCENARIO: Scenario = {
  id: 'standard-outbound',
  title: 'Voice Interaction Simulation',
  description: 'Demonstrating real-time logic and data extraction for versatile business use cases.',
  steps: [
    { sender: 'agent', text: "Thank you for reaching out. This is Riley, your automated assistant. How can I help you today?" },
    { sender: 'user', text: "I'm calling to schedule a consultation for my business.", fieldToUpdate: 'intent', valueToCapture: 'Consultation' },
    { sender: 'agent', text: "I'd be happy to help with that. Is this for a new project or an existing account?" },
    { sender: 'user', text: "It's a new project I'm starting.", fieldToUpdate: 'notes', valueToCapture: 'New Business Project' },
    { sender: 'agent', text: "Excellent. To get started, I'll just need your full name and a contact number. Who do I have the pleasure of speaking with?" },
    { sender: 'user', text: "Jordan Smith, 555-0123", fieldToUpdate: 'name', valueToCapture: 'Jordan Smith', isInput: true },
    { sender: 'agent', text: "Got it, Jordan. I've recorded your details. We have openings this Thursday. Would you like a morning or afternoon slot?" }
  ]
};

// --- Sub-components ---

const TypewriterText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 20);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
};

const FAQAccordion = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      {FAQ_ITEMS.map((item, i) => (
        <div 
          key={i} 
          className={`group border border-white/5 rounded-3xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${
            activeIndex === i ? 'bg-white/[0.04] border-white/20 shadow-[0_0_40px_-10px_rgba(20,184,166,0.1)]' : 'hover:bg-white/[0.02]'
          }`}
        >
          <button 
            onClick={() => setActiveIndex(activeIndex === i ? null : i)} 
            className="w-full px-8 py-7 flex items-center justify-between text-left transition-all"
          >
            <span className={`text-base md:text-lg font-bold transition-all duration-300 ${activeIndex === i ? 'text-teal-400 translate-x-1' : 'text-slate-200'}`}>
              {item.q}
            </span>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              activeIndex === i ? 'bg-teal-500 text-black rotate-180' : 'bg-white/5 text-slate-500'
            }`}>
              <ChevronDown size={20} strokeWidth={3} />
            </div>
          </button>
          <div 
            className={`grid transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              activeIndex === i ? 'grid-rows-[1fr] opacity-100 mb-8' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="px-8 text-[0.95rem] md:text-base text-slate-400 leading-relaxed font-medium">
                <div className="pt-4 border-t border-white/5">
                  {item.a}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const HowItWorks = () => {
  return (
    <div className="grid md:grid-cols-3 gap-12 relative">
      {/* Connecting Line (Desktop) */}
      <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />
      
      {PROCESS_STEPS.map((step, i) => (
        <div 
          key={i} 
          className="relative z-10 p-10 rounded-[3rem] border border-white/5 bg-[#0A0A0A] hover:bg-[#0D0D0D] transition-all duration-500 group overflow-hidden animate-fade-up"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          {/* Subtle Glow Background */}
          <div className={`absolute inset-0 bg-gradient-to-b ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
          
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-teal-400 mb-8 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-black transition-all duration-500 shadow-inner">
              <step.icon size={36} />
            </div>
            <h5 className="text-2xl font-black mb-4 tracking-tight group-hover:text-teal-400 transition-colors">{step.title}</h5>
            <p className="text-slate-500 font-bold leading-relaxed text-lg group-hover:text-slate-300 transition-colors">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [isCalling, setIsCalling] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [transcript, setTranscript] = useState<DemoStep[]>([]);
  const [capturedData, setCapturedData] = useState<CapturedData>({
    name: '', phone: 'Simulation Active', intent: '', dateTime: '', notes: '', leadScore: 'Low'
  });
  
  const [isTyping, setIsTyping] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isPlayingMp3, setIsPlayingMp3] = useState(false);
  
  const demoAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentStep = SCENARIO.steps[currentStepIndex + 1];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [transcript, isTyping]);

  const togglePlayMp3 = () => {
    if (!demoAudioRef.current) {
      const audio = new Audio();
      audio.src = DEMO_AUDIO_URL;
      audio.onended = () => setIsPlayingMp3(false);
      demoAudioRef.current = audio;
    }
    if (isPlayingMp3) {
      demoAudioRef.current.pause();
      setIsPlayingMp3(false);
    } else {
      demoAudioRef.current.play()
        .then(() => setIsPlayingMp3(true))
        .catch(() => console.error("Audio blocked"));
    }
  };

  const startDemo = () => {
    setIsCalling(true);
    setCurrentStepIndex(0);
    setTranscript([SCENARIO.steps[0]]);
    setCapturedData({ name: '', phone: 'Simulation Active', intent: '', dateTime: '', notes: '', leadScore: 'Low' });
  };

  const nextStep = (manualValue?: string) => {
    if (currentStepIndex + 1 < SCENARIO.steps.length) {
      const userStep = SCENARIO.steps[currentStepIndex + 1];
      const agentStep = SCENARIO.steps[currentStepIndex + 2];
      const userMessage = manualValue || userStep.text;
      
      setTranscript(prev => [...prev, { ...userStep, text: userMessage }]);
      if (userStep.fieldToUpdate) {
        setCapturedData(prev => {
          const newData = { ...prev, [userStep.fieldToUpdate!]: manualValue || userStep.valueToCapture || '' };
          return { ...newData, leadScore: calculateLeadScore(newData) };
        });
      }
      setManualInput('');

      if (agentStep) {
        setIsTyping(true);
        setTimeout(() => {
          setTranscript(prev => [...prev, agentStep]);
          setIsTyping(false);
          if (agentStep.fieldToUpdate) {
            setCapturedData(prev => {
              const newData = { ...prev, [agentStep.fieldToUpdate!]: agentStep.valueToCapture || '' };
              return { ...newData, leadScore: calculateLeadScore(newData) };
            });
          }
        }, 1200);
      }
      setCurrentStepIndex(prev => prev + 2);
    }
  };

  const calculateLeadScore = (data: CapturedData): string => {
    if (data.name && data.intent) return 'Hot';
    if (data.intent && data.notes) return 'High';
    if (data.intent) return 'Medium';
    return 'Low';
  };

  const resetDemo = () => {
    setIsCalling(false);
    setTranscript([]);
    setCurrentStepIndex(0);
    setIsTyping(false);
  };

  return (
    <div className="min-h-screen flex flex-col hero-gradient selection:bg-teal-500/30 overflow-x-hidden">
      {/* Dynamic Header Banner */}
      <div className="bg-teal-500 py-3 text-center overflow-hidden shadow-xl z-50">
        <div className="whitespace-nowrap flex animate-flow gap-12 items-center">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-black text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-6">
              <Sparkles size={14} className="animate-pulse" /> 
              LIMITED INTERACTIVE SHOWCASE • PRODUCTION AGENTS FEATURE FULL VOICE CAPABILITIES
              <Sparkles size={14} className="animate-pulse" />
            </span>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter uppercase leading-none">
              Codify <span className="text-teal-500">AI</span>
            </span>
            <span className="text-[10px] font-black text-teal-500/80 uppercase tracking-[0.3em] mt-2">Voice Intelligence Lab</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Simplified Hero Section */}
        <section className="pt-24 pb-12 px-6 text-center">
          <div className="max-w-4xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-[0.4em] mb-8">
              <MonitorPlay size={14} /> Global Prototype Environment
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.95]">
              CUSTOMER INTERACTION <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600">REIMAGINED.</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto font-medium mb-12">
              Witness the logic behind our medical booking and enterprise agents. Precision qualification through neural-intent mapping.
            </p>
          </div>
        </section>

        {/* Professional Simulation Area */}
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10">
            {/* Chat Simulation Area */}
            <div className="lg:col-span-8 flex flex-col min-h-[650px]">
              <div className="glass-panel rounded-[3rem] overflow-hidden flex flex-col flex-1 border border-white/10 shadow-2xl">
                {/* Header for Simulator */}
                <div className="px-10 py-6 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-500">RILEY ENGINE • LIVE SIMULATION</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/10"></div>
                    <div className="w-2 h-2 rounded-full bg-white/10"></div>
                    <div className="w-2 h-2 rounded-full bg-white/10"></div>
                  </div>
                </div>

                {/* Conversation Scroll */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 scrollbar-hide">
                  {!isCalling ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-fade-up">
                      <div className="w-24 h-24 rounded-[2rem] bg-teal-500/10 flex items-center justify-center text-teal-500 mb-10 border border-teal-500/10">
                        <Zap size={40} className="animate-pulse" />
                      </div>
                      <h3 className="text-3xl font-black mb-4 tracking-tight uppercase">Initialize Prototype</h3>
                      <p className="text-slate-500 max-w-md text-base leading-relaxed font-bold mb-12">
                        Step into Riley's decision-making flow. Experience real-time intent extraction and logical routing.
                      </p>
                      
                      <div className="flex flex-col md:flex-row gap-6 w-full max-w-lg">
                        <button 
                          onClick={startDemo}
                          className="flex-1 bg-white text-black h-16 rounded-2xl font-black hover:bg-teal-500 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                        >
                          <Play size={20} fill="currentColor" /> START DEMO
                        </button>
                        <button 
                          onClick={togglePlayMp3}
                          className={`flex-1 h-16 rounded-2xl font-black border transition-all flex items-center justify-center gap-3 ${
                            isPlayingMp3 ? 'bg-teal-500 border-teal-500 text-black' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                          }`}
                        >
                          {isPlayingMp3 ? <Pause size={20} fill="currentColor" /> : <Phone size={20} />}
                          {isPlayingMp3 ? 'PLAYING...' : 'AUDIO SAMPLE'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {transcript.map((msg, i) => {
                        const isAgent = msg.sender === 'agent';
                        return (
                          <div key={i} className={`flex ${isAgent ? 'justify-start' : 'justify-end'} animate-fade-up`}>
                            <div className={`max-w-[85%] rounded-[2rem] px-8 py-5 text-lg leading-relaxed font-medium shadow-xl ${
                              isAgent 
                                ? 'bg-white/[0.04] border border-white/5 text-slate-100' 
                                : 'bg-teal-500 text-black font-black'
                            }`}>
                              {isAgent && i === transcript.length - 1 ? <TypewriterText text={msg.text} /> : msg.text}
                            </div>
                          </div>
                        );
                      })}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white/[0.04] border border-white/5 rounded-2xl px-6 py-4 flex gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Control Bar */}
                {isCalling && (
                  <div className="p-8 border-t border-white/5 bg-black/60 backdrop-blur-xl">
                    {currentStepIndex + 1 < SCENARIO.steps.length ? (
                      <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1 flex items-center gap-5 text-slate-400">
                          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/10">
                            <MessageSquare size={22} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">Simulation Context</p>
                            <p className="text-sm font-bold text-white italic">"{SCENARIO.steps[currentStepIndex + 1].text}"</p>
                          </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                          {currentStep?.isInput ? (
                            <div className="relative flex-1 md:w-80">
                              <input 
                                type="text"
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && manualInput && !isTyping && nextStep(manualInput)}
                                placeholder="Type patient response..."
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-6 text-sm font-bold focus:outline-none focus:border-teal-500 transition-all"
                              />
                              <button 
                                onClick={() => manualInput && !isTyping && nextStep(manualInput)}
                                disabled={isTyping || !manualInput}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-teal-500 text-black rounded-lg hover:bg-white transition-all disabled:opacity-30 flex items-center justify-center"
                              >
                                <Send size={18} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => !isTyping && nextStep()}
                              disabled={isTyping}
                              className="w-full md:w-auto px-10 h-14 bg-teal-500 text-black rounded-xl font-black hover:bg-white transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30"
                            >
                              NEXT STEP <ChevronRight size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <button onClick={resetDemo} className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all">
                          END OF SIMULATION • RESET ENVIRONMENT
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Live Data Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className="glass-panel rounded-[3rem] p-10 border border-white/10 shadow-2xl h-full flex flex-col">
                <div className="flex items-center gap-4 mb-12">
                  <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                    <LayoutDashboard size={24} className="text-teal-500" />
                  </div>
                  <h4 className="text-xl font-black tracking-tighter">DATA HUD</h4>
                </div>

                <div className="space-y-10 flex-1">
                  {[
                    { label: 'Patient Name', value: capturedData.name, icon: User },
                    { label: 'Neural Intent', value: capturedData.intent, icon: Brain },
                    { label: 'Extracted Logic', value: capturedData.notes, icon: Binary },
                  ].map((field, i) => (
                    <div key={i} className="group">
                      <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">
                        <field.icon size={14} className="text-teal-500" />
                        {field.label}
                      </div>
                      <div className={`p-5 rounded-2xl border font-bold text-base transition-all duration-700 ${
                        field.value ? 'bg-teal-500/5 border-teal-500/20 text-teal-400' : 'bg-black/40 border-white/5 text-slate-700 italic'
                      }`}>
                        {field.value || 'Waiting for stream...'}
                      </div>
                    </div>
                  ))}

                  <div className="pt-6">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Lead Maturity</span>
                      <span className="text-[11px] font-black text-teal-500 uppercase">{capturedData.leadScore}</span>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div 
                        className="h-full bg-teal-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(20,184,166,0.6)]"
                        style={{ width: capturedData.leadScore === 'Hot' ? '100%' : capturedData.leadScore === 'High' ? '80%' : capturedData.leadScore === 'Medium' ? '50%' : '15%' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
                    REAL-TIME SYNC ACTIVE
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Improved How It Works Section */}
        <section className="py-32 px-6 border-t border-white/5 bg-black/40 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <span className="text-teal-500 text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">The Workflow</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight uppercase">How It Works</h2>
            </div>
            <HowItWorks />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6 bg-black/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-black tracking-tight text-center mb-16 uppercase italic">Deployment Faq</h2>
            <FAQAccordion />
          </div>
        </section>
      </main>

      <footer className="py-24 px-6 border-t border-white/5 bg-[#050505] text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-3xl font-black tracking-tighter uppercase mb-12 block">Codify <span className="text-teal-500">AI Labs</span></span>
          <div className="p-8 rounded-[2rem] bg-teal-500/5 border border-teal-500/10 inline-block mb-12">
            <p className="text-[11px] font-black text-teal-500 uppercase tracking-[0.4em] mb-4">SHOWCASE DISCLAIMER</p>
            <p className="text-xs text-slate-500 font-bold leading-loose tracking-widest uppercase opacity-80 max-w-2xl mx-auto">
              This environment is a technical demonstration of conversational interface logic. The final production-grade product features significantly enhanced capabilities including ultra-low latency voice synthesis, global telecom carrier routing, and industry-standard security compliance.
            </p>
          </div>
          <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.6em] mt-12">
            &copy; 2025 CODIFY AI LABS • ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>
    </div>
  );
}
