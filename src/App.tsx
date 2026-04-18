/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  CreditCard, 
  FileText, 
  MapPin, 
  Info,
  ArrowLeft,
  ExternalLink,
  User,
  HelpCircle,
  ShieldCheck,
  Car,
  IdCard,
  LayoutGrid,
  Sparkles,
  Send,
  Loader2
} from 'lucide-react';
import { Screen, UserData, EligibilityResult, Service, RoadTaxData, LicenseData } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('lobby');
  const [hasChosenSection, setHasChosenSection] = useState(false);
  const [activeService, setActiveService] = useState<Service | null>(null);
  const [userData, setUserData] = useState<UserData>({
    age: null,
    hasPassport: null,
    isDamagedOrLost: null,
    isSpecialCategory: null,
  });
  const [roadTaxData, setRoadTaxData] = useState<RoadTaxData>({
    hasInsurance: null,
    needsInspection: null,
    isBlacklisted: null,
    hasRequiredInfo: null,
  });
  const [licenseData, setLicenseData] = useState<LicenseData>({
    type: null,
    expiryStatus: null,
    renewalDuration: null,
  });

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: string; status?: 'sent' | 'read'; sources?: string[] }[]>([
    { 
      role: 'assistant', 
      content: "Hello! I'm your SenangGov Assistant. How can I help you with your government service renewals today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [isChatScrolling, setIsChatScrolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (input.length > 0) {
      setUserIsTyping(true);
    } else {
      setUserIsTyping(false);
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, userIsTyping]);

  useEffect(() => {
    return () => {
      if (chatScrollTimeoutRef.current !== null) {
        window.clearTimeout(chatScrollTimeoutRef.current);
      }
    };
  }, []);

  const handleChatScroll = () => {
    setIsChatScrolling(true);
    if (chatScrollTimeoutRef.current !== null) {
      window.clearTimeout(chatScrollTimeoutRef.current);
    }
    chatScrollTimeoutRef.current = window.setTimeout(() => {
      setIsChatScrolling(false);
    }, 650);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { 
      role: 'user' as const, 
      content: input,
      timestamp: now,
      status: 'sent' as const
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mark user message as read after a short delay
    setTimeout(() => {
      setMessages(prev => prev.map((msg, i) => 
        (i === prev.length - 1 && msg.role === 'user') ? { ...msg, status: 'read' } : msg
      ));
    }, 1000);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          systemInstruction: "You are SenangGov Assistant, a helpful AI for Malaysian government services (Passports, Road Tax, Licenses). \n\nRULES:\n1. Keep responses EXTREMELY SHORT and SIMPLE.\n2. If checking eligibility/status, ask ONLY ONE question at a time. Wait for the user's answer before asking the next one. \n3. Ask about 4-5 questions in total before giving a final conclusion.\n4. Base guidance on official Malaysian rules. If unsure, suggest official JPJ/Immigration portals.",
        })
      });

      if (!response.ok) {
        let details = 'Unable to process AI request.';
        try {
          const errData = await response.json();
          details = errData?.error || errData?.text || details;
        } catch {
          // Keep default details if response is not JSON.
        }
        throw new Error(details);
      }
      const data = await response.json();

      const assistantMessage = { 
        role: 'assistant' as const, 
        content: data.text || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read' as const,
        sources: Array.isArray(data.sources) ? data.sources : []
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      const message = error instanceof Error ? error.message : "Sorry, I'm having trouble connecting right now. Please try again later.";
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const eligibility: EligibilityResult = useMemo(() => {
    if (activeService === 'passport') {
      if (userData.age === null) return { isEligibleOnline: false };
      if (userData.age <= 13) {
        return { isEligibleOnline: false, reason: "Children aged 13 and below must renew at the counter." };
      }
      if (userData.hasPassport === false) {
        return { isEligibleOnline: false, reason: "Online renewal is only for existing passport holders." };
      }
      if (userData.isDamagedOrLost === true) {
        return { isEligibleOnline: false, reason: "Lost or damaged passports require a counter visit for verification." };
      }
      if (userData.isSpecialCategory === true) {
        return { isEligibleOnline: false, reason: "OKU, students going overseas for degrees, and hajj pilgrims must use counter services." };
      }
      return { isEligibleOnline: true };
    }

    if (activeService === 'roadtax') {
      if (roadTaxData.hasInsurance === false) {
        return { 
          isEligibleOnline: false, 
          status: 'blocked',
          reason: "Valid insurance is required before renewing road tax.",
          nextStep: "Renew your vehicle insurance first (e.g., via MyJPJ, insurance agent, or online portals)."
        };
      }
      if (roadTaxData.isBlacklisted === 'yes') {
        return { 
          isEligibleOnline: false, 
          status: 'blocked',
          reason: "Your vehicle or IC is blacklisted by JPJ/PDRM.",
          nextStep: "Settle all outstanding summons and clear your blacklist status at JPJ before renewing."
        };
      }
      if (roadTaxData.needsInspection === 'yes') {
        return { 
          isEligibleOnline: false, 
          status: 'blocked',
          reason: "Your vehicle requires a PUSPAKOM inspection (e.g., expired > 3 years or commercial vehicle).",
          nextStep: "Book an appointment at PUSPAKOM for vehicle inspection."
        };
      }
      if (roadTaxData.isBlacklisted === 'not_sure' || roadTaxData.needsInspection === 'not_sure') {
        return { 
          isEligibleOnline: false, 
          status: 'pending',
          reason: "We need to confirm your blacklist or inspection status.",
          nextStep: "Check your status on the MyJPJ app or JPJ portal."
        };
      }
      if (roadTaxData.hasRequiredInfo === false) {
        return { 
          isEligibleOnline: false, 
          status: 'pending',
          reason: "You need your Vehicle Plate No and Owner IC No.",
          nextStep: "Prepare these details before proceeding with renewal."
        };
      }
      
      // If all checks pass
      if (roadTaxData.hasInsurance === true && 
          roadTaxData.isBlacklisted === 'no' && 
          roadTaxData.needsInspection === 'no' && 
          roadTaxData.hasRequiredInfo === true) {
        return { 
          isEligibleOnline: true, 
          status: 'ready',
          nextStep: "You can proceed to renew via MyJPJ, MyEG, or JPJ Portal."
        };
      }
      
      return { isEligibleOnline: false };
    }

    if (activeService === 'license') {
      if (licenseData.type === null || licenseData.expiryStatus === null) {
        return { isEligibleOnline: false, status: 'pending', reason: "Please complete the questions." };
      }

      if (licenseData.type === 'LDL') {
        return {
          isEligibleOnline: false,
          status: 'blocked',
          reason: "Learner's Driving License (LDL) cannot be renewed normally.",
          nextStep: "You must complete your driving test or renew at the JPJ counter if still eligible."
        };
      }

      if (licenseData.type === 'PDL') {
        return {
          isEligibleOnline: false,
          status: 'blocked',
          reason: "Probationary Driving License (PDL) must be converted to CDL after 2 years.",
          nextStep: "Visit a JPJ counter to convert your PDL to a CDL."
        };
      }

      if (licenseData.type === 'Vocational') {
        return {
          isEligibleOnline: false,
          status: 'ready',
          reason: "Vocational licenses (PSV/GDL) require annual renewal.",
          nextStep: "You can renew at JPJ counters or selected post offices. Ensure your medical check (JPJ L8) is valid."
        };
      }

      if (licenseData.expiryStatus === 'expired_over_3y') {
        return {
          isEligibleOnline: false,
          status: 'blocked',
          reason: "Your license has been expired for more than 3 years.",
          nextStep: "You may need to re-sit the driving test. Visit JPJ for an appeal (Rayuan) process."
        };
      }

      if (licenseData.type === 'CDL' && (licenseData.expiryStatus === 'valid' || licenseData.expiryStatus === 'expired_under_3y')) {
        return {
          isEligibleOnline: true,
          status: 'ready',
          reason: "Your Competent Driving License (CDL) is ready for renewal.",
          nextStep: "You can renew for 1-10 years via MyJPJ, MyEG, or JPJ Portal."
        };
      }

      return { isEligibleOnline: false, status: 'pending', reason: "More information needed." };
    }
    
    // Default for other services (placeholders)
    return { isEligibleOnline: true };
  }, [userData, roadTaxData, licenseData, activeService]);

  const fee = useMemo(() => {
    if (activeService === 'passport') {
      if (userData.age === null) return 0;
      return userData.age >= 60 ? 100 : 200;
    }
    
    if (activeService === 'license') {
      if (licenseData.type === 'CDL' && licenseData.renewalDuration) {
        return licenseData.renewalDuration * 30;
      }
      if (licenseData.type === 'PDL') return 60;
      if (licenseData.type === 'LDL') return 20;
      if (licenseData.type === 'Vocational') return 20;
    }
    
    return 0;
  }, [userData.age, activeService, licenseData]);

  const handleServiceSelect = (service: Service) => {
    setHasChosenSection(true);
    setActiveService(service);
    if (service === 'passport') setCurrentScreen('passport_landing');
    else if (service === 'roadtax') setCurrentScreen('roadtax_landing');
    else if (service === 'license') setCurrentScreen('license_landing');
  };

  const handleAiAssistantSelect = () => {
    setHasChosenSection(true);
    setCurrentScreen('ai_assistant');
  };

  const handleBack = () => {
    if (currentScreen === 'lobby') return;
    if (currentScreen === 'ai_assistant') setCurrentScreen('lobby');
    if (currentScreen === 'passport_landing') setCurrentScreen('lobby');
    if (currentScreen === 'passport_checker') setCurrentScreen('passport_landing');
    if (currentScreen === 'passport_guidance') setCurrentScreen('passport_checker');
    if (currentScreen === 'passport_checklist') setCurrentScreen('passport_guidance');
    if (currentScreen === 'roadtax_landing') setCurrentScreen('lobby');
    if (currentScreen === 'roadtax_checker') setCurrentScreen('roadtax_landing');
    if (currentScreen === 'roadtax_result') setCurrentScreen('roadtax_checker');
    if (currentScreen === 'license_landing') setCurrentScreen('lobby');
    if (currentScreen === 'license_checker') setCurrentScreen('license_landing');
    if (currentScreen === 'license_result') setCurrentScreen('license_checker');
  };

  return (
    <div className="gov-app h-[100dvh] min-h-[100dvh] bg-[var(--surface)] text-[var(--on-surface)] font-body selection:bg-blue-100 overflow-hidden px-1 py-1 sm:px-5 sm:py-6">
      <div className="max-w-md mx-auto h-full flex flex-col ambient-float bg-[var(--surface-container-low)] relative overflow-hidden rounded-[2rem]">
        
        {/* Header */}
        {currentScreen !== 'lobby' && (
          <header className="px-6 py-4 flex items-center justify-start glass-top sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBack}
                className="p-2 hover:bg-[var(--surface-container-highest)] rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              {currentScreen === 'ai_assistant' && (
                <>
                  <div className="w-9 h-9 bg-[color-mix(in_srgb,var(--primary)_14%,white)] rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <h1 className="font-display text-[1.5rem] leading-none text-[var(--on-surface)]">AI Assistant</h1>
                </>
              )}
              {currentScreen.startsWith('passport') && (
                <>
                  <div className="w-9 h-9 bg-[color-mix(in_srgb,var(--primary)_14%,white)] rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <h1 className="font-display text-[1.5rem] leading-none text-[var(--on-surface)]">Passport</h1>
                </>
              )}
              {currentScreen.startsWith('roadtax') && (
                <>
                  <div className="w-9 h-9 bg-[color-mix(in_srgb,var(--primary)_14%,white)] rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0">
                    <Car size={18} />
                  </div>
                  <h1 className="font-display text-[1.5rem] leading-none text-[var(--on-surface)]">Road Tax</h1>
                </>
              )}
              {currentScreen.startsWith('license') && (
                <>
                  <div className="w-9 h-9 bg-[color-mix(in_srgb,var(--primary)_14%,white)] rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0">
                    <IdCard size={18} />
                  </div>
                  <h1 className="font-display text-[1.5rem] leading-none text-[var(--on-surface)]">License</h1>
                </>
              )}
            </div>
          </header>
        )}

        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          <AnimatePresence mode="wait">
            {currentScreen === 'lobby' && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 sm:p-8 flex flex-col h-full overflow-hidden min-h-0"
              >
                <div className="pt-1 pb-3 sm:pt-2 sm:pb-5 shrink-0">
                  <h1 className="font-display text-4xl leading-[1.05] text-[var(--on-surface)]">SenangGov</h1>
                  <p className="text-sm text-[var(--on-surface-variant)] mt-2 max-w-xs">
                    Start with one of the four sections below. You can switch sections anytime.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 sm:gap-3 flex-1 min-h-0">
                  <ServiceCard
                    icon={<Sparkles size={22} />}
                    title="AI Assistant"
                    desc="Chat support for all renewal questions"
                    onClick={handleAiAssistantSelect}
                    className="flex-1 min-h-0"
                  />
                  <ServiceCard
                    icon={<ShieldCheck size={22} />}
                    title="Passport"
                    desc="Check eligibility and renewal steps"
                    onClick={() => handleServiceSelect('passport')}
                    className="flex-1 min-h-0"
                  />
                  <ServiceCard
                    icon={<Car size={22} />}
                    title="Road Tax"
                    desc="Verify readiness before renewing"
                    onClick={() => handleServiceSelect('roadtax')}
                    className="flex-1 min-h-0"
                  />
                  <ServiceCard
                    icon={<IdCard size={22} />}
                    title="License"
                    desc="Renewal guidance by license type"
                    onClick={() => handleServiceSelect('license')}
                    className="flex-1 min-h-0"
                  />
                </div>
              </motion.div>
            )}

            {currentScreen === 'ai_assistant' && (
              <motion.div 
                key="ai_assistant"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full bg-[var(--surface-container-low)]"
              >
                {/* Messages Area */}
                <div
                  onScroll={handleChatScroll}
                  className={`flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y px-6 pt-3 pb-6 min-h-0 chat-scroll ${isChatScrolling ? 'chat-scroll-active' : ''}`}
                >
                  {messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} ${idx === 0 ? 'mt-0' : messages[idx - 1].role === msg.role ? 'mt-3' : 'mt-6'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-[0.875rem] leading-relaxed relative ambient-float ${
                        msg.role === 'user' 
                          ? 'bg-[var(--primary)] text-white rounded-br-md' 
                          : 'bg-[var(--surface-container-highest)] text-[var(--on-surface)] rounded-bl-md'
                      }`}>
                        {msg.content}
                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 px-3 py-2 rounded-xl bg-[color-mix(in_srgb,var(--surface-container-low)_80%,white)] text-[11px] text-[var(--on-surface-variant)]">
                            <span className="font-semibold">Sources:</span> {msg.sources.join(' • ')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 px-1 text-[10px] font-medium text-[color-mix(in_srgb,var(--on-surface-variant)_72%,white)]">
                        <span>{msg.timestamp}</span>
                        {msg.role === 'user' && (
                          <span className={msg.status === 'read' ? 'text-[var(--on-secondary-container)]' : 'text-[color-mix(in_srgb,var(--on-surface-variant)_40%,white)]'}>
                            {msg.status === 'read' ? 'Read' : 'Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex flex-col items-start">
                      <div className="bg-[var(--surface-container-highest)] p-4 rounded-[1.5rem] rounded-bl-md ambient-float flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-xs text-[var(--on-surface-variant)] font-medium ml-1">Assistant is typing...</span>
                      </div>
                    </div>
                  )}
                  {userIsTyping && !isTyping && (
                    <div className="flex flex-col items-end">
                      <div className="bg-[color-mix(in_srgb,var(--primary)_12%,white)] p-3 rounded-[1.5rem] rounded-br-md flex items-center gap-2">
                        <span className="text-[10px] text-[color-mix(in_srgb,var(--primary)_60%,white)] font-medium">You are typing...</span>
                        <div className="flex gap-1">
                          <span className="w-1 h-1 bg-[color-mix(in_srgb,var(--primary)_45%,white)] rounded-full animate-pulse"></span>
                          <span className="w-1 h-1 bg-[color-mix(in_srgb,var(--primary)_45%,white)] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-[var(--surface-container-low)]">
                  <div className="relative flex items-center bg-[var(--surface-container-lowest)] rounded-full ambient-float ui-lift-card px-2 py-2">
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about passport, road tax, etc..."
                      className="w-full bg-transparent rounded-full py-3 pl-5 pr-14 text-sm focus:outline-none text-[var(--on-surface)] placeholder:text-[color-mix(in_srgb,var(--on-surface-variant)_60%,white)] transition-all"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isTyping}
                      className={`absolute right-2 p-2 rounded-xl transition-all ui-lift-card ${
                        !input.trim() || isTyping 
                          ? 'text-[color-mix(in_srgb,var(--on-surface-variant)_40%,white)]' 
                          : 'text-white btn-primary !p-3'
                      }`}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--on-surface-variant)]/80 mt-3 text-center">
                    AI can make mistakes. Verify important info on official portals.
                  </p>
                </div>
              </motion.div>
            )}

            {currentScreen === 'passport_landing' && (
              <motion.div 
                key="passport_landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 flex flex-col items-center text-center h-full justify-center overflow-y-auto"
              >
                <div className="w-24 h-24 bg-[color-mix(in_srgb,var(--primary)_10%,white)] rounded-3xl ui-lift-card flex items-center justify-center mb-8">
                  <ShieldCheck size={48} className="text-[var(--primary)]" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Passport Renewal Made Simple</h2>
                <p className="text-slate-500 mb-12 leading-relaxed">
                  Check your eligibility, calculate fees, and get a step-by-step guide for your Malaysian passport renewal.
                </p>
                
                <div className="w-full space-y-4">
                  <button 
                    onClick={() => setCurrentScreen('passport_checker')}
                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white font-semibold py-4 px-6 rounded-2xl transition-all ui-lift-card shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group"
                  >
                    Start Renewal Check
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-xs text-slate-400">Official rules from Jabatan Imigresen Malaysia</p>
                </div>
              </motion.div>
            )}

            {currentScreen === 'passport_checker' && (
              <motion.div 
                key="passport_checker"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8 h-full overflow-y-auto check-scroll"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Eligibility Check</h2>
                  <p className="text-slate-500 text-sm">Answer these 4 questions to see if you can renew online.</p>
                </div>

                <div className="space-y-6">
                  {/* Age Question */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <User size={16} /> How old are you?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[12, 18, 60].map((age) => (
                        <button
                          key={age}
                          onClick={() => setUserData({ ...userData, age })}
                          className={`py-3 rounded-xl border-2 transition-all duration-500 ease-out ui-lift-card text-sm font-medium ${
                            userData.age === age 
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_35%,white)] ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,white)]'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {age === 12 ? '≤ 13' : age === 18 ? '14 - 59' : '60+'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Existing Passport */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <FileText size={16} /> Do you have an existing passport?
                    </label>
                    <div className="flex gap-2">
                      {[true, false].map((val) => (
                        <button
                          key={val.toString()}
                          onClick={() => setUserData({ ...userData, hasPassport: val })}
                          className={`flex-1 py-3 rounded-xl border-2 transition-all duration-500 ease-out ui-lift-card text-sm font-medium ${
                            userData.hasPassport === val 
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_35%,white)] ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,white)]'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {val ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Damaged/Lost */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <AlertCircle size={16} /> Is it lost or damaged?
                    </label>
                    <div className="flex gap-2">
                      {[true, false].map((val) => (
                        <button
                          key={val.toString()}
                          onClick={() => setUserData({ ...userData, isDamagedOrLost: val })}
                          className={`flex-1 py-3 rounded-xl border-2 transition-all duration-500 ease-out ui-lift-card text-sm font-medium ${
                            userData.isDamagedOrLost === val 
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_35%,white)] ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,white)]'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {val ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special Category */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <HelpCircle size={16} /> Are you in a special category?
                    </label>
                    <p className="text-[10px] text-slate-400 -mt-2">OKU, student overseas, or hajj pilgrim</p>
                    <div className="flex gap-2">
                      {[true, false].map((val) => (
                        <button
                          key={val.toString()}
                          onClick={() => setUserData({ ...userData, isSpecialCategory: val })}
                          className={`flex-1 py-3 rounded-xl border-2 transition-all duration-500 ease-out ui-lift-card text-sm font-medium ${
                            userData.isSpecialCategory === val 
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_35%,white)] ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,white)]'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {val ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  disabled={userData.age === null || userData.hasPassport === null || userData.isDamagedOrLost === null || userData.isSpecialCategory === null}
                  onClick={() => setCurrentScreen('passport_guidance')}
                  className="w-full bg-slate-900 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all ui-lift-card mt-4"
                >
                  View My Result
                </button>
              </motion.div>
            )}

            {currentScreen === 'passport_guidance' && (
              <motion.div 
                key="passport_guidance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8 h-full overflow-y-auto chat-scroll"
              >
                {/* Result Banner */}
                <div className={`p-6 rounded-3xl ${eligibility.isEligibleOnline ? 'bg-[color-mix(in_srgb,var(--primary)_10%,white)] border border-emerald-100' : 'bg-[color-mix(in_srgb,var(--tertiary-container)_14%,white)] border border-amber-100'}`}>
                  <div className="flex items-start gap-4">
                    {eligibility.isEligibleOnline ? (
                      <CheckCircle2 className="text-[var(--primary)] mt-1" size={24} />
                    ) : (
                      <AlertCircle className="text-[var(--tertiary-container)] mt-1" size={24} />
                    )}
                    <div>
                      <h3 className={`font-bold text-lg ${eligibility.isEligibleOnline ? 'text-[var(--primary)]' : 'text-[var(--tertiary-container)]'}`}>
                        {eligibility.isEligibleOnline ? 'Eligible for Online Renewal' : 'Counter Service Required'}
                      </h3>
                      <p className={`text-sm mt-1 ${eligibility.isEligibleOnline ? 'text-[var(--primary)]' : 'text-[var(--tertiary-container)]'}`}>
                        {eligibility.isEligibleOnline 
                          ? 'You can proceed with MyOnline Passport.' 
                          : eligibility.reason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fee Section */}
                <div className="bg-slate-50 p-5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <CreditCard className="text-slate-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Renewal Fee</p>
                      <p className="font-bold text-slate-900">RM {fee}.00</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Validity</p>
                    <p className="text-sm font-semibold text-slate-700">5 Years</p>
                  </div>
                </div>

                {/* Steps Section */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Info size={18} className="text-[var(--primary)]" /> 
                    {eligibility.isEligibleOnline ? 'Online Renewal Steps' : 'Counter Renewal Steps'}
                  </h4>
                  <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {eligibility.isEligibleOnline ? (
                      <>
                        <Step number={1} title="Prepare Digital Photo" desc="Follow the strict photo requirements below." />
                        <Step number={2} title="Submit Online" desc="Visit the MyOnline Passport portal." />
                        <Step number={3} title="Pay Online" desc="Via Debit/Credit Card or FPX Banking." />
                        <Step number={4} title="Wait for Email" desc="Notification will be sent when ready." />
                        <Step number={5} title="Collect at Office" desc="Bring required documents for collection." />
                      </>
                    ) : (
                      <>
                        <Step number={1} title="Locate Office" desc="Find the nearest Immigration Office." />
                        <Step number={2} title="Prepare Documents" desc="Bring MyKad and existing passport." />
                        <Step number={3} title="Take Photo" desc="Photo will be taken at the counter." />
                        <Step number={4} title="Payment" desc="Pay at the counter (Cash/Card)." />
                      </>
                    )}
                  </div>
                </div>

                {/* Photo Rules */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <Camera size={18} className="text-emerald-400" /> Photo Requirements
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      White background without shadow.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      Current face photo (taken within 1 month).
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      Dark clothing covering shoulders and chest.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      No glasses, contact lenses, or accessories.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      Hijab: Dark, plain, must not cover face.
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setCurrentScreen('passport_checklist')}
                  className="w-full bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white font-semibold py-4 rounded-2xl transition-all ui-lift-card flex items-center justify-center gap-2"
                >
                  View Collection Checklist
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {currentScreen === 'passport_checklist' && (
              <motion.div 
                key="passport_checklist"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8 h-full overflow-y-auto chat-scroll"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Collection Checklist</h2>
                  <p className="text-slate-500 text-sm">Don't forget these when you go to the office.</p>
                </div>

                <div className="space-y-6">
                  <div className="p-6 border-2 border-slate-100 rounded-3xl space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <User size={18} className="text-[var(--primary)]" /> 
                      {userData.age && userData.age >= 18 ? 'For Applicants 18+' : 'For Applicants Below 18'}
                    </h3>
                    <ul className="space-y-3">
                      {userData.age && userData.age >= 18 ? (
                        <>
                          <CheckItem text="Original MyKad" />
                          <CheckItem text="Current Passport" />
                          <CheckItem text="Printed Payment Receipt" />
                        </>
                      ) : (
                        <>
                          <CheckItem text="Applicant's MyKad" />
                          <CheckItem text="Applicant's Birth Certificate" />
                          <CheckItem text="Applicant's Current Passport" />
                          <CheckItem text="MyKad of Parent/Guardian" />
                          <CheckItem text="Printed Payment Receipt" />
                          <li className="text-xs text-[var(--tertiary-container)] font-medium bg-[color-mix(in_srgb,var(--tertiary-container)_14%,white)] p-2 rounded-lg mt-2">
                            * Parent/Guardian must be present during collection.
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-3xl ring-1 ring-[color-mix(in_srgb,var(--primary)_24%,white)]">
                    <h4 className="font-bold text-slate-900 mb-2">Final Reminder</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Collection must be done at the office you selected during the online application. Ensure your documents are original and in good condition.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <a 
                    href="https://imigresen-online.imi.gov.my/eservices/myPasport"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl transition-all ui-lift-card flex items-center justify-center gap-2"
                  >
                    Go to Official Portal
                    <ExternalLink size={18} />
                  </a>
                  <button
                    onClick={() => setCurrentScreen('ai_assistant')}
                    className="w-full text-slate-500 font-medium py-2 text-sm hover:text-slate-800 transition-colors"
                  >
                    Back to AI Assistant
                  </button>
                </div>
              </motion.div>
            )}

            {currentScreen === 'roadtax_landing' && (
              <motion.div 
                key="roadtax_landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 flex flex-col items-center text-center h-full justify-center overflow-y-auto"
              >
                <div className="w-24 h-24 bg-[color-mix(in_srgb,var(--primary)_10%,white)] rounded-3xl ui-lift-card flex items-center justify-center mb-8">
                  <Car size={48} className="text-[var(--primary)]" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Road Tax Renewal Helper</h2>
                <p className="text-slate-500 mb-12 leading-relaxed">
                  Check if your vehicle is ready for road tax renewal. We'll check insurance, blacklist status, and more.
                </p>
                
                <div className="w-full space-y-4">
                  <button 
                    onClick={() => setCurrentScreen('roadtax_checker')}
                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white font-semibold py-4 px-6 rounded-2xl transition-all ui-lift-card shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
                  >
                    Check My Readiness
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => setCurrentScreen('ai_assistant')}
                    className="w-full text-slate-500 font-medium py-2 text-sm hover:text-slate-800 transition-colors"
                  >
                    Back to AI Assistant
                  </button>
                </div>
              </motion.div>
            )}

            {currentScreen === 'roadtax_checker' && (
              <motion.div 
                key="roadtax_checker"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8 h-full overflow-y-auto check-scroll"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Renewal Readiness</h2>
                  <p className="text-slate-500 text-sm">Quickly check if you can renew your road tax today.</p>
                </div>

                <div className="space-y-6">
                  {/* Insurance */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-[var(--primary)]" /> Is your insurance still valid?
                    </label>
                    <div className="flex gap-2">
                      {[true, false].map((val) => (
                        <button
                          key={val.toString()}
                          onClick={() => setRoadTaxData({ ...roadTaxData, hasInsurance: val })}
                          className={`flex-1 py-3 rounded-xl border-2 transition-all duration-500 ease-out ui-lift-card text-sm font-medium ${
                            roadTaxData.hasInsurance === val 
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_35%,white)] ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,white)]'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {val ? 'Yes' : 'No / Expired'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Blacklist */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <AlertCircle size={16} className="text-[var(--primary)]" /> Any active JPJ/PDRM blacklist?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['no', 'yes', 'not_sure'].map((val) => (
                        <button
                          key={val}
                          onClick={() => setRoadTaxData({ ...roadTaxData, isBlacklisted: val as any })}
                          className={`py-3 rounded-xl border-2 transition-all duration-500 ease-out ui-lift-card text-sm font-medium ${
                            roadTaxData.isBlacklisted === val 
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_35%,white)] ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,white)]'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {val === 'no' ? 'None' : val === 'yes' ? 'Yes' : 'Not Sure'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inspection */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <FileText size={16} className="text-[var(--primary)]" /> Does it need PUSPAKOM inspection?
                    </label>
                    <p className="text-[10px] text-slate-400 -mt-2">Required if expired &gt; 3 years or commercial vehicle</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['no', 'yes', 'not_sure'].map((val) => (
                        <button
                          key={val}
                          onClick={() => setRoadTaxData({ ...roadTaxData, needsInspection: val as any })}
                          className={`py-3 rounded-xl border-2 transition-all duration-500 ease-out ui-lift-card text-sm font-medium ${
                            roadTaxData.needsInspection === val 
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_35%,white)] ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,white)]'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {val === 'no' ? 'No' : val === 'yes' ? 'Yes' : 'Not Sure'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Required Info */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <HelpCircle size={16} className="text-[var(--primary)]" /> Do you have vehicle & IC details?
                    </label>
                    <div className="flex gap-2">
                      {[true, false].map((val) => (
                        <button
                          key={val.toString()}
                          onClick={() => setRoadTaxData({ ...roadTaxData, hasRequiredInfo: val })}
                          className={`flex-1 py-3 rounded-xl border-2 transition-all duration-500 ease-out ui-lift-card text-sm font-medium ${
                            roadTaxData.hasRequiredInfo === val 
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_35%,white)] ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,white)]'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {val ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  disabled={roadTaxData.hasInsurance === null || roadTaxData.isBlacklisted === null || roadTaxData.needsInspection === null || roadTaxData.hasRequiredInfo === null}
                  onClick={() => setCurrentScreen('roadtax_result')}
                  className="w-full bg-slate-900 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all ui-lift-card mt-4"
                >
                  Check Readiness
                </button>
              </motion.div>
            )}

            {currentScreen === 'roadtax_result' && (
              <motion.div 
                key="roadtax_result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8 h-full overflow-y-auto check-scroll"
              >
                {/* Result Banner */}
                <div className={`p-6 rounded-3xl ${
                  eligibility.status === 'ready' ? 'bg-[color-mix(in_srgb,var(--primary)_10%,white)] border border-emerald-100' : 
                  eligibility.status === 'blocked' ? 'bg-[color-mix(in_srgb,var(--error)_12%,white)] border border-rose-100' : 
                  'bg-[color-mix(in_srgb,var(--tertiary-container)_14%,white)] border border-amber-100'
                }`}>
                  <div className="flex items-start gap-4">
                    {eligibility.status === 'ready' ? (
                      <CheckCircle2 className="text-[var(--primary)] mt-1" size={24} />
                    ) : eligibility.status === 'blocked' ? (
                      <AlertCircle className="text-[var(--error)] mt-1" size={24} />
                    ) : (
                      <HelpCircle className="text-[var(--tertiary-container)] mt-1" size={24} />
                    )}
                    <div>
                      <h3 className={`font-bold text-lg ${
                        eligibility.status === 'ready' ? 'text-[var(--primary)]' : 
                        eligibility.status === 'blocked' ? 'text-[var(--error)]' : 
                        'text-[var(--tertiary-container)]'
                      }`}>
                        {eligibility.status === 'ready' ? 'Ready for Renewal' : 
                         eligibility.status === 'blocked' ? 'Action Required' : 
                         'Status Unclear'}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        eligibility.status === 'ready' ? 'text-[var(--primary)]' : 
                        eligibility.status === 'blocked' ? 'text-[var(--error)]' : 
                        'text-[var(--tertiary-container)]'
                      }`}>
                        {eligibility.reason || "You can proceed with your road tax renewal."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Info size={18} className="text-[var(--primary)]" />
                    Step-by-step guide
                  </h4>
                  <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {eligibility.status === 'ready' && (
                      <>
                        <Step number={1} title="Open Renewal Channel" desc="Use MyJPJ app, JPJ portal, or MyEG." />
                        <Step number={2} title="Confirm Vehicle Profile" desc="Check plate number, owner IC, and insurance linkage." />
                        <Step number={3} title="Select Renewal" desc="Choose road tax renewal and review the vehicle details." />
                        <Step number={4} title="Make Payment" desc="Pay online using FPX, debit, or credit card." />
                        <Step number={5} title="Keep Proof" desc="Save your digital receipt and verify active road tax status." />
                      </>
                    )}
                    {eligibility.status === 'blocked' && (
                      <>
                        <Step number={1} title="Identify Blocking Reason" desc="Use the alert above to see if the issue is insurance, blacklist, or inspection." />
                        <Step number={2} title="Resolve the Issue" desc="Renew insurance, settle summons, or complete PUSPAKOM as required." />
                        <Step number={3} title="Wait for System Update" desc="Allow JPJ records to reflect your latest cleared status." />
                        <Step number={4} title="Re-check Eligibility" desc="Return to this checker and verify that your status becomes ready." />
                      </>
                    )}
                    {eligibility.status === 'pending' && (
                      <>
                        <Step number={1} title="Verify Blacklist Status" desc="Check JPJ/PDRM blacklist record in MyJPJ or JPJ portal." />
                        <Step number={2} title="Confirm Inspection Need" desc="Check if your vehicle needs a PUSPAKOM inspection." />
                        <Step number={3} title="Prepare Required Info" desc="Keep your vehicle plate number and owner IC details ready." />
                        <Step number={4} title="Run Checker Again" desc="Update your answers and continue once status is confirmed." />
                      </>
                    )}
                  </div>
                </div>

                {/* Next Steps */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <ChevronRight size={18} className="text-[var(--primary)]" /> 
                    What to do next
                  </h4>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {eligibility.nextStep}
                    </p>
                  </div>
                </div>

                {/* Renewal Channels */}
                {eligibility.status === 'ready' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900">Recommended Channels</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <a href="https://www.jpj.gov.my/myjpj/" target="_blank" rel="noopener noreferrer" className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:border-blue-500 transition-all">
                        <span className="text-sm font-semibold">MyJPJ App / JPJ Portal</span>
                        <ExternalLink size={16} className="text-slate-400" />
                      </a>
                      <a href="https://www.myeg.com.my" target="_blank" rel="noopener noreferrer" className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:border-blue-500 transition-all">
                        <span className="text-sm font-semibold">MyEG Online</span>
                        <ExternalLink size={16} className="text-slate-400" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Action Required Action */}
                {eligibility.status === 'blocked' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900">Resolve Issues</h4>
                    <a href="https://www.jpj.gov.my/myjpj/" target="_blank" rel="noopener noreferrer" className="w-full bg-[var(--error)] hover:bg-[var(--error)] text-white font-semibold py-4 rounded-2xl transition-all ui-lift-card flex items-center justify-center gap-2 shadow-lg shadow-rose-100">
                      Check JPJ Status
                      <ExternalLink size={18} />
                    </a>
                  </div>
                )}

                {/* Status Unclear Action */}
                {eligibility.status === 'pending' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900">Verify Your Status</h4>
                    <a href="https://www.jpj.gov.my/myjpj/" target="_blank" rel="noopener noreferrer" className="w-full bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white font-semibold py-4 rounded-2xl transition-all ui-lift-card flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                      Check JPJ Status
                      <ExternalLink size={18} />
                    </a>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <button
                    onClick={() => setCurrentScreen('ai_assistant')}
                    className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl transition-all ui-lift-card"
                  >
                    Back to AI Assistant
                  </button>
                  <button
                    onClick={() => setCurrentScreen('roadtax_checker')}
                    className="w-full text-slate-500 font-medium py-2 text-sm hover:text-slate-800 transition-colors"
                  >
                    Re-check Status
                  </button>
                </div>
              </motion.div>
            )}

            {currentScreen === 'license_landing' && (
              <motion.div 
                key="license_landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 flex flex-col items-center text-center h-full justify-center overflow-y-auto"
              >
                <div className="w-24 h-24 bg-[color-mix(in_srgb,var(--primary)_10%,white)] rounded-3xl ui-lift-card flex items-center justify-center mb-8">
                  <IdCard size={48} className="text-[var(--primary)]" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Driving Licence Renewal Helper</h2>
                <p className="text-slate-500 mb-12 leading-relaxed">
                  Check your eligibility to renew your Malaysian driving licence. We'll guide you through the rules and next steps.
                </p>
                
                <div className="w-full space-y-4">
                  <button 
                    onClick={() => setCurrentScreen('license_checker')}
                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white font-semibold py-4 px-6 rounded-2xl transition-all ui-lift-card shadow-lg shadow-purple-200 flex items-center justify-center gap-2 group"
                  >
                    Check My Eligibility
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => setCurrentScreen('ai_assistant')}
                    className="w-full text-slate-500 font-medium py-2 text-sm hover:text-slate-800 transition-colors"
                  >
                    Back to AI Assistant
                  </button>
                </div>
              </motion.div>
            )}

            {currentScreen === 'license_checker' && (
              <motion.div 
                key="license_checker"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8 h-full overflow-y-auto check-scroll"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Licence Details</h2>
                  <p className="text-slate-500 text-sm">Tell us about your current driving licence.</p>
                </div>

                <div className="space-y-6">
                  {/* Licence Type */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <IdCard size={16} className="text-[var(--primary)]" /> What is your licence type?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'CDL', label: 'CDL (Competent)' },
                        { id: 'PDL', label: 'PDL (Probationary)' },
                        { id: 'LDL', label: 'LDL (Learner)' },
                        { id: 'Vocational', label: 'Vocational (PSV/GDL)' }
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setLicenseData({ ...licenseData, type: type.id as any })}
                          className={`py-3 px-2 rounded-xl border-2 transition-all duration-500 ease-out ui-lift-card text-xs font-medium ${
                            licenseData.type === type.id 
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_35%,white)] ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,white)]'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expiry Status */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <AlertCircle size={16} className="text-[var(--primary)]" /> What is the expiry status?
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'valid', label: 'Still Valid / Expiring Soon' },
                        { id: 'expired_under_3y', label: 'Expired (Less than 3 years)' },
                        { id: 'expired_over_3y', label: 'Expired (More than 3 years)' }
                      ].map((status) => (
                        <button
                          key={status.id}
                          onClick={() => setLicenseData({ ...licenseData, expiryStatus: status.id as any })}
                          className={`w-full py-3 px-4 rounded-xl border-2 transition-all duration-500 ease-out ui-lift-card text-sm font-medium text-left ${
                            licenseData.expiryStatus === status.id 
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_35%,white)] ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,white)]'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Renewal Duration (Only for CDL) */}
                  {licenseData.type === 'CDL' && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <ChevronRight size={16} className="text-[var(--primary)]" /> Intended renewal period?
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 5, 10].map((year) => (
                          <button
                            key={year}
                            onClick={() => setLicenseData({ ...licenseData, renewalDuration: year })}
                            className={`py-2 rounded-lg border-2 transition-all duration-500 ease-out ui-lift-card text-xs font-bold ${
                              licenseData.renewalDuration === year 
                                ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-[color-mix(in_srgb,var(--primary)_35%,white)] ring-2 ring-[color-mix(in_srgb,var(--primary)_28%,white)]'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            {year}Y
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  disabled={licenseData.type === null || licenseData.expiryStatus === null || (licenseData.type === 'CDL' && licenseData.renewalDuration === null)}
                  onClick={() => setCurrentScreen('license_result')}
                  className="w-full bg-slate-900 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all ui-lift-card mt-4"
                >
                  Check Eligibility
                </button>
              </motion.div>
            )}

            {currentScreen === 'license_result' && (
              <motion.div 
                key="license_result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8 h-full overflow-y-auto check-scroll"
              >
                {/* Result Banner */}
                <div className={`p-6 rounded-3xl ${
                  eligibility.status === 'ready' ? 'bg-[color-mix(in_srgb,var(--primary)_10%,white)] border border-emerald-100' : 
                  eligibility.status === 'blocked' ? 'bg-[color-mix(in_srgb,var(--error)_12%,white)] border border-rose-100' : 
                  'bg-[color-mix(in_srgb,var(--tertiary-container)_14%,white)] border border-amber-100'
                }`}>
                  <div className="flex items-start gap-4">
                    {eligibility.status === 'ready' ? (
                      <CheckCircle2 className="text-[var(--primary)] mt-1" size={24} />
                    ) : eligibility.status === 'blocked' ? (
                      <AlertCircle className="text-[var(--error)] mt-1" size={24} />
                    ) : (
                      <HelpCircle className="text-[var(--tertiary-container)] mt-1" size={24} />
                    )}
                    <div>
                      <h3 className={`font-bold text-lg ${
                        eligibility.status === 'ready' ? 'text-[var(--primary)]' : 
                        eligibility.status === 'blocked' ? 'text-[var(--error)]' : 
                        'text-[var(--tertiary-container)]'
                      }`}>
                        {eligibility.status === 'ready' ? 'Ready to Renew' : 
                         eligibility.status === 'blocked' ? 'Action Required' : 
                         'Status Unclear'}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        eligibility.status === 'ready' ? 'text-[var(--primary)]' : 
                        eligibility.status === 'blocked' ? 'text-[var(--error)]' : 
                        'text-[var(--tertiary-container)]'
                      }`}>
                        {eligibility.reason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fee Section */}
                {(eligibility.status === 'ready' || eligibility.isEligibleOnline) && fee > 0 && (
                  <div className="bg-slate-50 p-5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <CreditCard className="text-slate-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Renewal Fee</p>
                        <p className="font-bold text-slate-900">RM {fee}.00</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Validity</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {activeService === 'license' && licenseData.type === 'CDL' ? `${licenseData.renewalDuration} Years` : 
                         activeService === 'license' && licenseData.type === 'Vocational' ? '1 Year' :
                         activeService === 'license' && licenseData.type === 'PDL' ? '2 Years' :
                         activeService === 'license' && licenseData.type === 'LDL' ? '3/6 Months' :
                         '5 Years'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Info size={18} className="text-[var(--primary)]" />
                    Step-by-step guide
                  </h4>
                  <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {eligibility.status === 'ready' && licenseData.type === 'CDL' && (
                      <>
                        <Step number={1} title="Open Official Channel" desc="Go to MyJPJ app, JPJ portal, or MyEG." />
                        <Step number={2} title="Choose CDL Renewal" desc="Select renewal duration from 1 to 10 years." />
                        <Step number={3} title="Review Details" desc="Confirm your licence class and personal information." />
                        <Step number={4} title="Pay Renewal Fee" desc="Complete payment using available online methods." />
                        <Step number={5} title="Access Digital Licence" desc="Check your renewed licence in MyJPJ after processing." />
                      </>
                    )}
                    {eligibility.status === 'ready' && licenseData.type === 'Vocational' && (
                      <>
                        <Step number={1} title="Prepare Medical Document" desc="Ensure your JPJ L8 medical check is valid." />
                        <Step number={2} title="Prepare Supporting Docs" desc="Bring IC and existing vocational licence documents." />
                        <Step number={3} title="Visit Renewal Counter" desc="Renew at JPJ counter or selected post office." />
                        <Step number={4} title="Make Annual Payment" desc="Pay the vocational renewal fee at the service point." />
                        <Step number={5} title="Verify Renewal Status" desc="Confirm the renewed status in MyJPJ once updated." />
                      </>
                    )}
                    {eligibility.status === 'blocked' && (
                      <>
                        <Step number={1} title="Read the Restriction" desc="Check whether your licence is LDL, PDL, or expired over 3 years." />
                        <Step number={2} title="Follow Required Route" desc="Proceed with conversion, appeal, or test requirement from JPJ guidance." />
                        <Step number={3} title="Visit JPJ Counter" desc="Bring your IC and licence documents for officer verification." />
                        <Step number={4} title="Proceed After Clearance" desc="Continue renewal only after JPJ confirms your eligibility." />
                      </>
                    )}
                    {eligibility.status === 'pending' && (
                      <>
                        <Step number={1} title="Complete Checker Inputs" desc="Select your licence type, expiry status, and duration if CDL." />
                        <Step number={2} title="Re-check Eligibility" desc="Run the checker again to generate accurate guidance." />
                        <Step number={3} title="Verify with JPJ" desc="Use MyJPJ portal if your licence status is still unclear." />
                      </>
                    )}
                  </div>
                </div>

                {/* Next Steps */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <ChevronRight size={18} className="text-[var(--primary)]" /> 
                    What to do next
                  </h4>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {eligibility.nextStep}
                    </p>
                  </div>
                </div>

                {/* Digital Awareness */}
                {eligibility.status === 'ready' && (
                  <div className="bg-[color-mix(in_srgb,var(--primary)_10%,white)] p-6 rounded-3xl border border-purple-100 flex gap-4">
                    <Info className="text-[var(--primary)] shrink-0" size={20} />
                    <div>
                      <h5 className="font-bold text-[var(--primary)] text-sm">Digital Licence Awareness</h5>
                      <p className="text-xs text-[var(--primary)] mt-1 leading-relaxed">
                        After renewal, you can access your digital driving licence via the <strong>MyJPJ</strong> app. Physical cards are no longer mandatory but can be requested.
                      </p>
                    </div>
                  </div>
                )}

                {/* Renewal Channels */}
                {eligibility.status === 'ready' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900">Recommended Channels</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <a href="https://www.jpj.gov.my/myjpj/" target="_blank" rel="noopener noreferrer" className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:border-purple-500 transition-all ui-lift-card">
                        <span className="text-sm font-semibold">MyJPJ App / JPJ Portal</span>
                        <ExternalLink size={16} className="text-slate-400" />
                      </a>
                      <a href="https://www.myeg.com.my" target="_blank" rel="noopener noreferrer" className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:border-purple-500 transition-all ui-lift-card">
                        <span className="text-sm font-semibold">MyEG Online</span>
                        <ExternalLink size={16} className="text-slate-400" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Action Required / Status Unclear Portal Link */}
                {(eligibility.status === 'blocked' || eligibility.status === 'pending') && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900">Verify on Official Portal</h4>
                    <a href="https://www.jpj.gov.my/myjpj/" target="_blank" rel="noopener noreferrer" className="w-full bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white font-semibold py-4 rounded-2xl transition-all ui-lift-card flex items-center justify-center gap-2 shadow-lg shadow-purple-100">
                      Go to JPJ Portal
                      <ExternalLink size={18} />
                    </a>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <button
                    onClick={() => setCurrentScreen('ai_assistant')}
                    className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl transition-all ui-lift-card"
                  >
                    Back to AI Assistant
                  </button>
                  <button
                    onClick={() => setCurrentScreen('license_checker')}
                    className="w-full text-slate-500 font-medium py-2 text-sm hover:text-slate-800 transition-colors"
                  >
                    Re-check Status
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation Bar (hidden on Home) */}
        {hasChosenSection && currentScreen !== 'lobby' && (
          <nav className="glass-top px-3 py-3 flex justify-around items-center shrink-0 z-20 rounded-t-[1.75rem]">
            {[
              { id: 'lobby', label: 'Home', icon: LayoutGrid, screen: 'lobby' as Screen },
              { id: 'ai', label: 'AI Assistant', icon: Sparkles, screen: 'ai_assistant' as Screen },
              { id: 'passport', label: 'Passport', icon: ShieldCheck, screen: 'passport_landing' as Screen, service: 'passport' as Service },
              { id: 'roadtax', label: 'RoadTax', icon: Car, screen: 'roadtax_landing' as Screen, service: 'roadtax' as Service },
              { id: 'license', label: 'License', icon: IdCard, screen: 'license_landing' as Screen, service: 'license' as Service },
            ].map((item) => {
              const active = (item.id === 'lobby' && currentScreen === 'lobby') ||
                             (item.id === 'ai' && currentScreen === 'ai_assistant') ||
                             (item.id === 'passport' && currentScreen.startsWith('passport')) ||
                             (item.id === 'roadtax' && currentScreen.startsWith('roadtax')) ||
                             (item.id === 'license' && currentScreen.startsWith('license'));
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentScreen(item.screen);
                    if (item.screen !== 'lobby') setHasChosenSection(true);
                    if (item.service) setActiveService(item.service);
                  }}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl relative ui-lift-card ambient-float ${
                    active ? 'text-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,white)]' : 'text-[var(--on-surface-variant)] bg-[color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] hover:text-[var(--on-surface)]'
                  }`}
                >
                  <Icon size={20} className={active ? 'scale-110' : ''} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                  {active && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute -bottom-0.5 w-1 h-1 bg-[var(--primary)] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ icon, title, desc, onClick, className = "" }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`p-4 bg-[var(--surface-container-lowest)] rounded-xl text-left transition-all group ambient-float ui-lift-card hover:bg-[var(--surface)] h-full ${className}`}
    >
      <div className="flex items-center justify-between h-full gap-4">
        <div className="w-11 h-11 bg-[var(--surface-container-low)] rounded-xl flex items-center justify-center transition-colors text-[var(--primary)] shrink-0 ui-lift-card">
            {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[var(--on-surface)] leading-tight">{title}</h3>
          <p className="text-xs text-[var(--on-surface-variant)] mt-1 leading-relaxed">{desc}</p>
        </div>
        <ChevronRight size={20} className="text-[var(--on-surface-variant)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all shrink-0" />
      </div>
    </button>
  );
}

function Step({ number, title, desc }: { number: number, title: string, desc: string }) {
  return (
    <div className="flex gap-4 relative z-10 rounded-2xl p-2 -m-2">
      <div className="w-8 h-8 rounded-full bg-[var(--surface-container-lowest)] flex items-center justify-center shrink-0 font-bold text-[var(--primary)] text-sm ambient-float">
        {number}
      </div>
      <div>
        <h5 className="font-bold text-[var(--on-surface)] text-sm">{title}</h5>
        <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-[var(--on-surface-variant)]">
      <div className="w-5 h-5 rounded-md bg-[color-mix(in_srgb,var(--primary)_12%,white)] flex items-center justify-center shrink-0">
        <CheckCircle2 size={14} className="text-[var(--primary)]" />
      </div>
      {text}
    </li>
  );
}
