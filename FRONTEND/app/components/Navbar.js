"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
// import i18next from 'i18next'; // Not needed
import { supabase } from '../../lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, User } from 'lucide-react';
import { Button } from './ui/button';
import NotificationPanel from './NotificationPanel';
import Modal from './Modal';
import LoginForm from './LoginForm';
import { useUser } from "../context/UserContext";

export function Navbar({
  notifications = [],
  onProfileClick,
  onSubmittedApplicationsClick,
  onEligibilityClick,
  onGuidelinesClick,
  onSupportClick,
  submittedApplicationsCount = 0,
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, loading } = useUser();
  const { t, i18n } = useTranslation();
  const navTabs = [
    { label: t('navbar.dashboard'), href: '/dashboard', icon: <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="13" width="18" height="8" rx="2"/><rect x="6" y="6" width="12" height="7" rx="2"/><rect x="9" y="2" width="6" height="4" rx="2"/></svg> },
    { label: t('navbar.internships'), href: '/internships', icon: <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7"/><rect x="7" y="3" width="10" height="6" rx="2"/><path d="M7 9v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9"/></svg> },
    { label: t('navbar.applications'), href: '/applications', icon: <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
  ];

  // Accessibility state
  const [fontSize, setFontSize] = useState(16);
  // const { i18n } = useTranslation(); // Removed duplicate
  const [language, setLanguage] = useState('en');

  // Ensure default language is English on mount

  // Accessibility handlers
  const handleFontSize = (size) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${size}px`;
  };
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <header className="w-full sticky top-0 z-50">
      {/* Top navbar with black background, white text, and reduced height */}
      <div className="bg-[#000000] flex items-center justify-between px-6 py-1 text-white text-sm" style={{minHeight: '36px'}}>
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-4 mr-2 align-middle">
            <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="16" rx="2" fill="#fff" />
              <rect y="0" width="24" height="5.33" fill="#FF9933" />
              <rect y="10.67" width="24" height="5.33" fill="#138808" />
              <circle cx="12" cy="8" r="2.1" fill="#008" />
              <circle cx="12" cy="8" r="2" fill="#fff" />
              <g>
                <circle cx="12" cy="8" r="1.2" fill="#008" />
                <g>
                  <g>
                    <line x1="12" y1="6.8" x2="12" y2="9.2" stroke="#008" strokeWidth="0.2" />
                    <line x1="10.8" y1="8" x2="13.2" y2="8" stroke="#008" strokeWidth="0.2" />
                    <line x1="11.15" y1="6.95" x2="12.85" y2="9.05" stroke="#008" strokeWidth="0.2" />
                    <line x1="12.85" y1="6.95" x2="11.15" y2="9.05" stroke="#008" strokeWidth="0.2" />
                  </g>
                </g>
              </g>
            </svg>
          </span>
          <span className="font-semibold">{t('navbar.govOfIndia')}</span>
        </div>
        <div className="flex items-center gap-4">
          <button aria-label="Normal font size" className="font-medium bg-transparent border-none outline-none hidden sm:inline" style={{fontSize: '1em'}} onClick={() => handleFontSize(16)}>A</button>
          <button aria-label="Increase font size" className="font-medium bg-transparent border-none outline-none hidden sm:inline" style={{fontSize: '1.15em'}} onClick={() => handleFontSize(18)}>A+</button>
          <button aria-label="Decrease font size" className="font-medium bg-transparent border-none outline-none hidden sm:inline" style={{fontSize: '0.9em'}} onClick={() => handleFontSize(14)}>A-</button>
          <select
            aria-label="Change language"
            value={language}
            onChange={handleLanguageChange}
            className="ml-2 px-2 py-1 rounded bg-black text-white border border-gray-300 w-24 min-w-0 max-w-[90vw] truncate sm:w-32 appearance-none"
            style={{maxWidth: '90vw'}}
          >
            <option value="en" style={{backgroundColor: '#000', color: '#fff'}}>English</option>
            <option value="hi" style={{backgroundColor: '#000', color: '#fff'}}>हिन्दी</option>
            <option value="as" style={{backgroundColor: '#000', color: '#fff'}}>অসমীয়া</option>
            <option value="bn" style={{backgroundColor: '#000', color: '#fff'}}>বাংলা</option>
            <option value="gu" style={{backgroundColor: '#000', color: '#fff'}}>ગુજરાતી</option>
            <option value="ta" style={{backgroundColor: '#000', color: '#fff'}}>தமிழ்</option>
            <option value="te" style={{backgroundColor: '#000', color: '#fff'}}>తెలుగు</option>
            <option value="kn" style={{backgroundColor: '#000', color: '#fff'}}>ಕನ್ನಡ</option>
            <option value="ml" style={{backgroundColor: '#000', color: '#fff'}}>മലയാളം</option>
            <option value="mr" style={{backgroundColor: '#000', color: '#fff'}}>मराठी</option>
            <option value="or" style={{backgroundColor: '#000', color: '#fff'}}>ଓଡ଼ିଆ</option>
            <option value="pa" style={{backgroundColor: '#000', color: '#fff'}}>ਪੰਜਾਬੀ</option>
          </select>
        </div>
      </div>
      {/* Main navbar */}
      <div className="bg-white shadow-sm flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/">
            <span className="flex items-center gap-3">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Ministry_of_Corporate_Affairs_India.svg/1200px-Ministry_of_Corporate_Affairs_India.svg.png"
                alt={'Ministry of Corporate Affairs Logo'}
                width={120}
                height={32}
                className="h-8 w-auto cursor-pointer"
                priority
              />
              <Image
                src="https://pminternship.mca.gov.in/assets/images/img/pm_internship_logo_eng.svg"
                alt={'PM Internship Logo'}
                width={120}
                height={32}
                className="h-8 w-auto cursor-pointer"
                priority
              />
            </span>
          </Link>
        </div>
        {/* Centered tab navigation */}
  <nav className="hidden md:flex gap-2 bg-white rounded-full px-2 py-1 shadow-sm border border-gray-100 mx-auto">
          {navTabs.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center px-4 py-2 rounded-full font-medium transition ${pathname === tab.href ? 'bg-[#7c5cff] text-white shadow' : 'text-gray-700 hover:bg-[#7c5cff] hover:text-white'}`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          ))}
          {currentUser && (
            <Link
              key="/profile"
              href="/profile"
              className={`flex items-center px-4 py-2 rounded-full font-medium transition ${pathname === '/profile' ? 'bg-[#7c5cff] text-white shadow' : 'text-gray-700 hover:bg-[#7c5cff] hover:text-white'}`}
            >
              <User className="w-4 h-4 mr-2" />
              {t('navbar.profile')}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {/* Search icon removed */}
          {currentUser ? (
            <div className="relative">
              <button
                className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-[#ede9fe] to-[#f3f0ff] shadow focus:outline-none border border-[#7c5cff]"
                onClick={() => setShowProfilePopup(v => !v)}
              >
                <User className="w-7 h-7 text-[#7c5cff] bg-white rounded-full p-1 border border-[#7c5cff]" />
                <div className="flex flex-col items-start">
                  <span className="font-bold text-[#7c5cff] text-base leading-tight">{currentUser.name}</span>
                  <span className="text-xs text-gray-500 leading-tight">{currentUser.email}</span>
                </div>
              </button>
              {showProfilePopup && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
                  <button
                    className="w-full py-2 text-sm text-red-600 hover:bg-gray-100 rounded"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setShowProfilePopup(false);
                      if (typeof window !== 'undefined') {
                        window.location.replace('/');
                      }
                    }}
                  >{t('navbar.logout')}</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-md border-[#7c5cff] text-[#7c5cff]"
                onClick={() => setShowLoginModal(true)}
              >
                {t('navbar.login')}
              </Button>
              {showLoginModal && (
                <Modal open={showLoginModal} onClose={() => setShowLoginModal(false)}>
                  <div className="w-full max-w-md mx-auto">
                    <LoginForm onGuest={() => setShowLoginModal(false)} />
                  </div>
                </Modal>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
