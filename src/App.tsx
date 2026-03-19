/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { Screen, UserData, EligibilityResult } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [userData, setUserData] = useState<UserData>({
    age: null,
    hasPassport: null,
    isDamagedOrLost: null,
    isSpecialCategory: null,
  });

  const eligibility: EligibilityResult = useMemo(() => {
    if (userData.age === null) return { isEligibleOnline: false };

    // Rules for online renewal:
    // 1. Must be above 13 (official rules say children 13 and below need counter)
    // 2. Must have existing passport
    // 3. Passport must NOT be lost or damaged
    // 4. Must NOT be in special category (OKU, students overseas, hajj)

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
  }, [userData]);

  const fee = useMemo(() => {
    if (userData.age === null) return 0;
    return userData.age >= 60 ? 100 : 200;
  }, [userData.age]);

  const handleStart = () => setCurrentScreen('checker');
  const handleBack = () => {
    if (currentScreen === 'checker') setCurrentScreen('landing');
    if (currentScreen === 'guidance') setCurrentScreen('checker');
    if (currentScreen === 'checklist') setCurrentScreen('guidance');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100">
      <div className="max-w-md mx-auto min-h-screen flex flex-col shadow-xl bg-white relative overflow-hidden">
        
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">SenangGov</h1>
          </div>
          {currentScreen !== 'landing' && (
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentScreen === 'landing' && (
              <motion.div 
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 flex flex-col items-center text-center h-full justify-center"
              >
                <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mb-8">
                  <ShieldCheck size={48} className="text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Passport Renewal Made Simple</h2>
                <p className="text-slate-500 mb-12 leading-relaxed">
                  Check your eligibility, calculate fees, and get a step-by-step guide for your Malaysian passport renewal.
                </p>
                
                <div className="w-full space-y-4">
                  <button 
                    onClick={handleStart}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group"
                  >
                    Start Renewal Check
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-xs text-slate-400">Official rules from Jabatan Imigresen Malaysia</p>
                </div>

                <div className="mt-16 grid grid-cols-2 gap-4 w-full">
                  <div className="p-4 bg-slate-50 rounded-2xl text-left">
                    <CheckCircle2 size={20} className="text-emerald-600 mb-2" />
                    <h3 className="font-semibold text-sm">Fast Check</h3>
                    <p className="text-xs text-slate-500">Know if you can renew online in 1 min.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl text-left">
                    <Camera size={20} className="text-emerald-600 mb-2" />
                    <h3 className="font-semibold text-sm">Photo Guide</h3>
                    <p className="text-xs text-slate-500">Avoid rejection with our photo rules.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {currentScreen === 'checker' && (
              <motion.div 
                key="checker"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8"
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
                          className={`py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                            userData.age === age 
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
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
                          className={`flex-1 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                            userData.hasPassport === val 
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
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
                          className={`flex-1 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                            userData.isDamagedOrLost === val 
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
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
                          className={`flex-1 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                            userData.isSpecialCategory === val 
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
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
                  onClick={() => setCurrentScreen('guidance')}
                  className="w-full bg-slate-900 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all mt-4"
                >
                  View My Result
                </button>
              </motion.div>
            )}

            {currentScreen === 'guidance' && (
              <motion.div 
                key="guidance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8"
              >
                {/* Result Banner */}
                <div className={`p-6 rounded-3xl ${eligibility.isEligibleOnline ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <div className="flex items-start gap-4">
                    {eligibility.isEligibleOnline ? (
                      <CheckCircle2 className="text-emerald-600 mt-1" size={24} />
                    ) : (
                      <AlertCircle className="text-amber-600 mt-1" size={24} />
                    )}
                    <div>
                      <h3 className={`font-bold text-lg ${eligibility.isEligibleOnline ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {eligibility.isEligibleOnline ? 'Eligible for Online Renewal' : 'Counter Service Required'}
                      </h3>
                      <p className={`text-sm mt-1 ${eligibility.isEligibleOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
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
                    <Info size={18} className="text-emerald-600" /> 
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
                  onClick={() => setCurrentScreen('checklist')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  View Collection Checklist
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {currentScreen === 'checklist' && (
              <motion.div 
                key="checklist"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Collection Checklist</h2>
                  <p className="text-slate-500 text-sm">Don't forget these when you go to the office.</p>
                </div>

                <div className="space-y-6">
                  <div className="p-6 border-2 border-slate-100 rounded-3xl space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <User size={18} className="text-emerald-600" /> 
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
                          <li className="text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded-lg mt-2">
                            * Parent/Guardian must be present during collection.
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                    <h4 className="font-bold text-emerald-900 mb-2">Final Reminder</h4>
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      Collection must be done at the office you selected during the online application. Ensure your documents are original and in good condition.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <a 
                    href="https://imigresen-online.imi.gov.my/eservices/myPasport"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    Go to Official Portal
                    <ExternalLink size={18} />
                  </a>
                  <button
                    onClick={() => setCurrentScreen('landing')}
                    className="w-full text-slate-500 font-medium py-2 text-sm hover:text-slate-800 transition-colors"
                  >
                    Back to Home
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center border-t border-slate-50">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">SenangGov &copy; 2026</p>
        </footer>
      </div>
    </div>
  );
}

function Step({ number, title, desc }: { number: number, title: string, desc: string }) {
  return (
    <div className="flex gap-4 relative z-10">
      <div className="w-8 h-8 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center shrink-0 font-bold text-emerald-600 text-sm shadow-sm">
        {number}
      </div>
      <div>
        <h5 className="font-bold text-slate-800 text-sm">{title}</h5>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-slate-600">
      <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
        <CheckCircle2 size={14} className="text-emerald-600" />
      </div>
      {text}
    </li>
  );
}
