"use client";
import '../i18n';
import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { supabase } from "../../lib/supabaseClient";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Bell, User, Briefcase, Settings } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { BottomNav } from "../components/BottomNav";
import { useUser } from '../context/UserContext';
import LoginForm from '../components/LoginForm';

export default function Dashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [educationList, setEducationList] = useState([]);

  useEffect(() => {
    async function fetchProfile() {
      if (user && user.id) {
        const { data: fetched, error } = await supabase
          .from('applicants')
          .select('*')
          .eq('applicant_id', user.id)
          .single();
        if (!error && fetched) {
          setProfileData(fetched);
        }
        const { data: eduData, error: eduError } = await supabase
          .from('education')
          .select('*')
          .eq('applicant_id', user.id);
        if (!eduError && Array.isArray(eduData)) {
          setEducationList(eduData);
        }
      }
    }
    fetchProfile();
  }, [user && user.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f0ff] to-white pb-16">
      <Navbar currentUser={user ? { name: user.user_metadata?.name || user.email, email: user.email } : null} />
      <div className="max-w-6xl mx-auto py-12 px-4 relative">
        {!user && !loading && (
          <div className="absolute inset-0 z-50 flex min-h-full mt-50 items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 text-center">{t('dashboard.signInRequired')}</h2>
              <p className="text-center text-gray-600 mb-6">{t('dashboard.pleaseSignIn')}</p>
              <LoginForm />
            </div>
          </div>
        )}
        {user && (
          <>
            <h1 className="text-4xl font-bold mb-2 text-gray-900">{t('dashboard.welcome')}{user ? `, ${user.user_metadata?.name || user.email}` : ''}!</h1>
            <p className="text-lg text-gray-600 mb-8">{t('dashboard.trackAll')}</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
              {/* Profile Summary Card */}
              <Card className="border rounded-xl bg-white col-span-1 md:col-span-2">
                <CardContent className="py-6 px-4">
                  <div className="flex items-center gap-4 mb-4">
                    <User className="w-10 h-10 text-blue-500" />
                    <div>
                      <div className="font-bold text-xl text-gray-900">{profileData?.name || 'Your Name'}</div>
                      <div className="text-gray-500 text-sm">{profileData?.email || user?.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{profileData?.education_level || 'Education'}</span>
                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">{profileData?.major || 'Major'}</span>
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">{profileData?.state || 'State'}</span>
                  </div>
                  <div className="text-gray-700 text-sm mb-2">{profileData?.skills || 'Skills: React, Node.js, SQL'}</div>
                  <div className="text-gray-500 text-xs">Last login: {profileData?.last_login || 'Today'}</div>
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              <Card className="border rounded-xl bg-white col-span-1">
                <CardContent className="py-6 px-4 flex flex-col gap-3">
                  <div className="font-semibold text-gray-700 text-base mb-2">Quick Stats</div>
                  <div className="flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4 text-blue-400" /> Total Applications: <span className="font-bold ml-1">3</span></div>
                  <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-green-400" /> Profile Complete: <span className="font-bold ml-1">{profileData ? 'Yes' : 'No'}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Settings className="w-4 h-4 text-gray-400" /> Account Status: <span className="font-bold ml-1">Active</span></div>
                </CardContent>
              </Card>

              {/* Recent Activity Card */}
              <Card className="border rounded-xl bg-white col-span-1">
                <CardContent className="py-6 px-4">
                  <div className="font-semibold text-gray-700 text-base mb-2">Recent Activity</div>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-400" /> Viewed: Internship at Google</div>
                    <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-400" /> Viewed: Internship at Microsoft</div>
                    <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-400" /> Applied: Internship at Amazon</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <BottomNav currentView="dashboard" className="fixed inset-x-0 bottom-0 z-50" />
          </>
        )}
      </div>
    </div>
  );
}
