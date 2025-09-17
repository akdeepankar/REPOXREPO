"use client";
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { supabase } from '../../lib/supabaseClient';

export default function LoginForm({ onSuccess, onGuest }){
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  async function handleGoogle() {
    setLoading(true);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const redirectTo = siteUrl.replace(/\/$/, '') + '/dashboard';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (error) {
      setLoading(false);
      alert(t('loginForm.googleSignInFailed') + ': ' + error.message);
    }
    // On success, Supabase will redirect automatically
  }

  return (
    <Card className="max-w-md mx-auto bg-white shadow-xl rounded-2xl border border-gray-100">
      <CardContent className="space-y-8 pt-10 pb-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('loginForm.welcome')}</h1>
          <p className="text-sm text-gray-600">{t('loginForm.signInToContinue')}</p>
        </div>
        <div className="space-y-4">
            <Button type="button" onClick={handleGoogle} disabled={loading} size="lg" className="btn btn-primary border-2 border-[#7c5cff] text-[#7c5cff] bg-white w-full flex items-center justify-center">
              <span className="text-[#7c5cff] text-center font-semibold tracking-wide">{loading ? t('loginForm.signingIn') : t('loginForm.signInWithGoogle')}</span>
              <style jsx>{`
                .btn.btn-primary {
                  border-radius: 9999px;
                  padding-top: 0.75rem;
                  padding-bottom: 0.75rem;
                  box-shadow: 0 2px 8px rgba(124,92,255,0.08);
                  transition: box-shadow 0.2s, transform 0.2s;
                  gap: 0.75rem;
                }
                .btn.btn-primary:hover {
                  box-shadow: 0 4px 16px rgba(124,92,255,0.18);
                  background: #f3f0ff;
                  transform: translateY(-2px) scale(1.03);
                }
              `}</style>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
