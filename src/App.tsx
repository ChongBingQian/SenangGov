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
  ShieldCheck,
  Car,
  IdCard,
  LayoutGrid
} from 'lucide-react';
import { Screen, UserData, EligibilityResult, Service, RoadTaxData, LicenseData } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('lobby');
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
    setActiveService(service);
    if (service === 'passport') setCurrentScreen('passport_landing');
    else if (service === 'roadtax') setCurrentScreen('roadtax_landing');
    else if (service === 'license') setCurrentScreen('license_landing');
  };

  const handleBack = () => {
    if (currentScreen === 'lobby') return;
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100">
      <div className="max-w-md mx-auto min-h-screen flex flex-col shadow-xl bg-white relative overflow-hidden">
        
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">SenangGov</h1>
          </div>
          {currentScreen !== 'lobby' && (
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
            {currentScreen === 'lobby' && (
              <motion.div 
                key="lobby"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 space-y-8 h-full flex flex-col justify-center"
              >
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-3xl font-bold text-slate-900">SenangGov Services</h2>
                  <p className="text-slate-500">Choose a service to get started</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <ServiceCard 
                    icon={<ShieldCheck className="text-emerald-600" size={24} />}
                    title="Passport Renewal"
                    desc="Check eligibility & step-by-step guide"
                    onClick={() => handleServiceSelect('passport')}
                  />
                  <ServiceCard 
                    icon={<Car className="text-blue-600" size={24} />}
                    title="RoadTax Renewal"
                    desc="Renew your vehicle road tax online"
                    onClick={() => handleServiceSelect('roadtax')}
                  />
                  <ServiceCard 
                    icon={<IdCard className="text-purple-600" size={24} />}
                    title="Driving License"
                    desc="Renew your Malaysian driving license"
                    onClick={() => handleServiceSelect('license')}
                  />
                </div>

                <div className="mt-8 p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <Info className="text-slate-400 shrink-0" size={20} />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    All information is based on the latest official guidelines from Malaysian government portals.
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
                    onClick={() => setCurrentScreen('passport_checker')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group"
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
                  onClick={() => setCurrentScreen('passport_guidance')}
                  className="w-full bg-slate-900 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all mt-4"
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
                  onClick={() => setCurrentScreen('passport_checklist')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
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
                    onClick={() => setCurrentScreen('lobby')}
                    className="w-full text-slate-500 font-medium py-2 text-sm hover:text-slate-800 transition-colors"
                  >
                    Back to Lobby
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
                className="p-8 flex flex-col items-center text-center h-full justify-center"
              >
                <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-8">
                  <Car size={48} className="text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Road Tax Renewal Helper</h2>
                <p className="text-slate-500 mb-12 leading-relaxed">
                  Check if your vehicle is ready for road tax renewal. We'll check insurance, blacklist status, and more.
                </p>
                
                <div className="w-full space-y-4">
                  <button 
                    onClick={() => setCurrentScreen('roadtax_checker')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
                  >
                    Check My Readiness
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => setCurrentScreen('lobby')}
                    className="w-full text-slate-500 font-medium py-2 text-sm hover:text-slate-800 transition-colors"
                  >
                    Back to Lobby
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
                className="p-6 space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Renewal Readiness</h2>
                  <p className="text-slate-500 text-sm">Quickly check if you can renew your road tax today.</p>
                </div>

                <div className="space-y-6">
                  {/* Insurance */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-blue-600" /> Is your insurance still valid?
                    </label>
                    <div className="flex gap-2">
                      {[true, false].map((val) => (
                        <button
                          key={val.toString()}
                          onClick={() => setRoadTaxData({ ...roadTaxData, hasInsurance: val })}
                          className={`flex-1 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                            roadTaxData.hasInsurance === val 
                              ? 'border-blue-600 bg-blue-50 text-blue-700' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
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
                      <AlertCircle size={16} className="text-blue-600" /> Any active JPJ/PDRM blacklist?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['no', 'yes', 'not_sure'].map((val) => (
                        <button
                          key={val}
                          onClick={() => setRoadTaxData({ ...roadTaxData, isBlacklisted: val as any })}
                          className={`py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                            roadTaxData.isBlacklisted === val 
                              ? 'border-blue-600 bg-blue-50 text-blue-700' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
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
                      <FileText size={16} className="text-blue-600" /> Does it need PUSPAKOM inspection?
                    </label>
                    <p className="text-[10px] text-slate-400 -mt-2">Required if expired &gt; 3 years or commercial vehicle</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['no', 'yes', 'not_sure'].map((val) => (
                        <button
                          key={val}
                          onClick={() => setRoadTaxData({ ...roadTaxData, needsInspection: val as any })}
                          className={`py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                            roadTaxData.needsInspection === val 
                              ? 'border-blue-600 bg-blue-50 text-blue-700' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
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
                      <HelpCircle size={16} className="text-blue-600" /> Do you have vehicle & IC details?
                    </label>
                    <div className="flex gap-2">
                      {[true, false].map((val) => (
                        <button
                          key={val.toString()}
                          onClick={() => setRoadTaxData({ ...roadTaxData, hasRequiredInfo: val })}
                          className={`flex-1 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                            roadTaxData.hasRequiredInfo === val 
                              ? 'border-blue-600 bg-blue-50 text-blue-700' 
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
                  disabled={roadTaxData.hasInsurance === null || roadTaxData.isBlacklisted === null || roadTaxData.needsInspection === null || roadTaxData.hasRequiredInfo === null}
                  onClick={() => setCurrentScreen('roadtax_result')}
                  className="w-full bg-slate-900 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all mt-4"
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
                className="p-6 space-y-8"
              >
                {/* Result Banner */}
                <div className={`p-6 rounded-3xl ${
                  eligibility.status === 'ready' ? 'bg-emerald-50 border border-emerald-100' : 
                  eligibility.status === 'blocked' ? 'bg-rose-50 border border-rose-100' : 
                  'bg-amber-50 border border-amber-100'
                }`}>
                  <div className="flex items-start gap-4">
                    {eligibility.status === 'ready' ? (
                      <CheckCircle2 className="text-emerald-600 mt-1" size={24} />
                    ) : eligibility.status === 'blocked' ? (
                      <AlertCircle className="text-rose-600 mt-1" size={24} />
                    ) : (
                      <HelpCircle className="text-amber-600 mt-1" size={24} />
                    )}
                    <div>
                      <h3 className={`font-bold text-lg ${
                        eligibility.status === 'ready' ? 'text-emerald-900' : 
                        eligibility.status === 'blocked' ? 'text-rose-900' : 
                        'text-amber-900'
                      }`}>
                        {eligibility.status === 'ready' ? 'Ready for Renewal' : 
                         eligibility.status === 'blocked' ? 'Action Required' : 
                         'Status Unclear'}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        eligibility.status === 'ready' ? 'text-emerald-700' : 
                        eligibility.status === 'blocked' ? 'text-rose-700' : 
                        'text-amber-700'
                      }`}>
                        {eligibility.reason || "You can proceed with your road tax renewal."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <ChevronRight size={18} className="text-blue-600" /> 
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
                    <a href="https://www.jpj.gov.my/myjpj/" target="_blank" rel="noopener noreferrer" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-100">
                      Check JPJ Status
                      <ExternalLink size={18} />
                    </a>
                  </div>
                )}

                {/* Status Unclear Action */}
                {eligibility.status === 'pending' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900">Verify Your Status</h4>
                    <a href="https://www.jpj.gov.my/myjpj/" target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                      Check JPJ Status
                      <ExternalLink size={18} />
                    </a>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <button
                    onClick={() => setCurrentScreen('lobby')}
                    className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl transition-all"
                  >
                    Back to Lobby
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
                className="p-8 flex flex-col items-center text-center h-full justify-center"
              >
                <div className="w-24 h-24 bg-purple-50 rounded-3xl flex items-center justify-center mb-8">
                  <IdCard size={48} className="text-purple-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Driving Licence Renewal Helper</h2>
                <p className="text-slate-500 mb-12 leading-relaxed">
                  Check your eligibility to renew your Malaysian driving licence. We'll guide you through the rules and next steps.
                </p>
                
                <div className="w-full space-y-4">
                  <button 
                    onClick={() => setCurrentScreen('license_checker')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2 group"
                  >
                    Check My Eligibility
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => setCurrentScreen('lobby')}
                    className="w-full text-slate-500 font-medium py-2 text-sm hover:text-slate-800 transition-colors"
                  >
                    Back to Lobby
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
                className="p-6 space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Licence Details</h2>
                  <p className="text-slate-500 text-sm">Tell us about your current driving licence.</p>
                </div>

                <div className="space-y-6">
                  {/* Licence Type */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <IdCard size={16} className="text-purple-600" /> What is your licence type?
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
                          className={`py-3 px-2 rounded-xl border-2 transition-all text-xs font-medium ${
                            licenseData.type === type.id 
                              ? 'border-purple-600 bg-purple-50 text-purple-700' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
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
                      <AlertCircle size={16} className="text-purple-600" /> What is the expiry status?
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
                          className={`w-full py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium text-left ${
                            licenseData.expiryStatus === status.id 
                              ? 'border-purple-600 bg-purple-50 text-purple-700' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
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
                        <ChevronRight size={16} className="text-purple-600" /> Intended renewal period?
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 5, 10].map((year) => (
                          <button
                            key={year}
                            onClick={() => setLicenseData({ ...licenseData, renewalDuration: year })}
                            className={`py-2 rounded-lg border-2 transition-all text-xs font-bold ${
                              licenseData.renewalDuration === year 
                                ? 'border-purple-600 bg-purple-50 text-purple-700' 
                                : 'border-slate-100 hover:border-slate-200 text-slate-600'
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
                  className="w-full bg-slate-900 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all mt-4"
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
                className="p-6 space-y-8"
              >
                {/* Result Banner */}
                <div className={`p-6 rounded-3xl ${
                  eligibility.status === 'ready' ? 'bg-emerald-50 border border-emerald-100' : 
                  eligibility.status === 'blocked' ? 'bg-rose-50 border border-rose-100' : 
                  'bg-amber-50 border border-amber-100'
                }`}>
                  <div className="flex items-start gap-4">
                    {eligibility.status === 'ready' ? (
                      <CheckCircle2 className="text-emerald-600 mt-1" size={24} />
                    ) : eligibility.status === 'blocked' ? (
                      <AlertCircle className="text-rose-600 mt-1" size={24} />
                    ) : (
                      <HelpCircle className="text-amber-600 mt-1" size={24} />
                    )}
                    <div>
                      <h3 className={`font-bold text-lg ${
                        eligibility.status === 'ready' ? 'text-emerald-900' : 
                        eligibility.status === 'blocked' ? 'text-rose-900' : 
                        'text-amber-900'
                      }`}>
                        {eligibility.status === 'ready' ? 'Ready to Renew' : 
                         eligibility.status === 'blocked' ? 'Action Required' : 
                         'Status Unclear'}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        eligibility.status === 'ready' ? 'text-emerald-700' : 
                        eligibility.status === 'blocked' ? 'text-rose-700' : 
                        'text-amber-700'
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
                    <ChevronRight size={18} className="text-purple-600" /> 
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
                  <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 flex gap-4">
                    <Info className="text-purple-600 shrink-0" size={20} />
                    <div>
                      <h5 className="font-bold text-purple-900 text-sm">Digital Licence Awareness</h5>
                      <p className="text-xs text-purple-700 mt-1 leading-relaxed">
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
                      <a href="https://www.jpj.gov.my/myjpj/" target="_blank" rel="noopener noreferrer" className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:border-purple-500 transition-all">
                        <span className="text-sm font-semibold">MyJPJ App / JPJ Portal</span>
                        <ExternalLink size={16} className="text-slate-400" />
                      </a>
                      <a href="https://www.myeg.com.my" target="_blank" rel="noopener noreferrer" className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:border-purple-500 transition-all">
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
                    <a href="https://www.jpj.gov.my/myjpj/" target="_blank" rel="noopener noreferrer" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100">
                      Go to JPJ Portal
                      <ExternalLink size={18} />
                    </a>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <button
                    onClick={() => setCurrentScreen('lobby')}
                    className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl transition-all"
                  >
                    Back to Lobby
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

        {/* Footer */}
        <footer className="p-4 text-center border-t border-slate-50">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">SenangGov &copy; 2026</p>
        </footer>
      </div>
    </div>
  );
}

function ServiceCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="p-5 bg-white border-2 border-slate-100 rounded-3xl text-left hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-50 transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-white transition-colors">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
      </div>
    </button>
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
