"use client";
import '../i18n';

import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { Navbar } from '../components/Navbar';
import LoginForm from '../components/LoginForm';
import { Card, CardContent } from '../components/ui/card';
import { BottomNav } from '../components/BottomNav';
import ProfileSettings from '../components/ProfileSettings';
import { useUser } from '../context/UserContext';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading } = useUser();

  if (!user && !loading) {
    return (
      <><Navbar currentUser={user ? { name: user.user_metadata?.name || user.email, email: user.email } : null} />
        <div className="absolute inset-0 z-50 flex min-h-full mt-20 items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-center">{t('profile.signInRequired')}</h2>
            <p className="text-center text-gray-600 mb-6">{t('profile.pleaseSignIn')}</p>
            <LoginForm />
          </div>
        </div>
      </>
    );
  }
  const displayName = user?.user_metadata?.name || user?.name || user?.email || 'User';
  const displayInitial = displayName?.[0] || 'U';
  const displayEmail = user?.email || '';
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f0ff] to-white pb-4">
      <Navbar currentUser={user ? { name: displayName, email: displayEmail } : null} />
      <div className="max-w-7xl mx-auto py-4 px-2">
        <div className="w-full h-screen flex flex-col justify-center">
          <Suspense fallback={<div>Loading profile settings...</div>}>
            <ProfileSettings user={user} />
          </Suspense>
        </div>
      </div>
      <BottomNav currentView="profile-settings" />
    </div>
  );
}
