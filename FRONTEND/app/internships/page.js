"use client";
import '../i18n';
import React, { useState } from "react";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../context/UserContext';
import LoginForm from '../components/LoginForm';
import { Navbar } from "../components/Navbar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BottomNav } from "../components/BottomNav";

import Modal from "../components/Modal";
import InternshipDetails from "../components/InternshipDetails";


export default function InternshipPage() {
  const { user, loading } = useUser();
  const { t } = useTranslation();
  const [internships, setInternships] = useState([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [remoteFilter, setRemoteFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);

  async function handleCardClick(id) {
    // Log user interaction only if not already present
    if (user && user.id) {
      const { data: existing, error: existingError } = await supabase
        .from('user_interactions')
        .select('interaction_id')
        .eq('candidate_id', user.id)
        .eq('internship_id', id)
        .eq('interaction_type', 'view')
        .limit(1)
        .maybeSingle();
      if (!existing && !existingError) {
        await supabase.from('user_interactions').insert([
          {
            candidate_id: user.id,
            internship_id: id,
            interaction_type: 'view',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
    // Fetch internship details
    const { data, error } = await supabase
      .from('internships')
      .select('*')
      .eq('internship_id', id)
      .single();
    if (!error && data) {
      setSelectedInternship(data);
      setModalOpen(true);
    }
  }
  function handleCloseModal() {
    setModalOpen(false);
    setSelectedInternship(null);
  }
  async function handleApply(id) {
    if (user && user.id) {
      // Check if a user_interactions entry exists for this user/internship
      const { data: existing, error: existingError } = await supabase
        .from('user_interactions')
        .select('interaction_id, interaction_type')
        .eq('candidate_id', user.id)
        .eq('internship_id', id)
        .limit(1)
        .maybeSingle();
      if (existing && !existingError) {
        // If already 'apply', do nothing. If 'view', update to 'apply'.
        if (existing.interaction_type !== 'apply') {
          await supabase
            .from('user_interactions')
            .update({ interaction_type: 'apply', timestamp: new Date().toISOString() })
            .eq('interaction_id', existing.interaction_id);
        }
      } else if (!existing && !existingError) {
        // No entry, insert as 'apply'
        await supabase.from('user_interactions').insert([
          {
            candidate_id: user.id,
            internship_id: id,
            interaction_type: 'apply',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
    alert('Applied for internship ID: ' + id);
  }

  useEffect(() => {
    async function fetchInternships() {
      const { data, error } = await supabase
        .from('internships')
        .select('*');
      if (!error && Array.isArray(data)) {
        setInternships(data);
      }
    }
    fetchInternships();
  }, []);
  const filteredInternships = internships.filter(i => {
    const searchText = search.toLowerCase();
    let matches = (
      i.title?.toLowerCase().includes(searchText) ||
      i.description?.toLowerCase().includes(searchText) ||
      i.skills?.toLowerCase().includes(searchText) ||
      i.location?.toLowerCase().includes(searchText) ||
      i.sector?.toLowerCase().includes(searchText)
    );
    if (locationFilter && i.location !== locationFilter) matches = false;
    if (sectorFilter && i.sector !== sectorFilter) matches = false;
    if (remoteFilter && String(i.remote) !== remoteFilter) matches = false;
    return matches;
  });

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f3f0ff] to-white pb-16">
        <Navbar currentUser={null} />
        <div className="absolute inset-0 z-50 flex min-h-full mt-20 items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-center">{t('internships.signInRequired')}</h2>
            <p className="text-center text-gray-600 mb-6">{t('internships.pleaseSignIn')}</p>
            <LoginForm />
          </div>
        </div>
        <BottomNav currentView="internships" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f0ff] to-white pb-16">
      <Navbar />
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-black">Internships</h1>
          <Button
            className="btn btn-primary"
            onClick={() => alert('Recommendation logic goes here!')}
          >
            Get Recommendation
          </Button>
        </div>
        <div className="bg-white rounded-xl shadow p-6 mb-8 flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex-1 flex flex-col gap-4 md:flex-row md:gap-4">
            <input
              type="text"
              placeholder={t('internships.searchPlaceholder')}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-48 text-gray-700"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
            >
              <option value="">{t('internships.allLocations')}</option>
              {[...new Set(internships.map(i => i.location).filter(Boolean))].map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-48 text-gray-700"
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
            >
              <option value="">All Sectors</option>
              {[...new Set(internships.map(i => i.sector).filter(Boolean))].map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-40 text-gray-700"
              value={remoteFilter}
              onChange={e => setRemoteFilter(e.target.value)}
            >
              <option value="">Remote/Onsite</option>
              <option value="true">Remote</option>
              <option value="false">Onsite</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInternships.map((i) => (
            <div
              key={i.internship_id}
              className="rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-md shadow-lg hover:shadow-2xl hover:scale-[1.015] transition-all duration-300 cursor-pointer"
              style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
              onClick={() => handleCardClick(i.internship_id)}
            >
              <CardContent className="p-6">
                <div className="flex gap-5 items-center">
                  {i.image_url && (
                    <img src={i.image_url} alt={i.title} className="h-16 w-16 object-cover rounded-lg border border-gray-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate mb-2">{i.title}</h2>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {i.location}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3m10-5h3a1 1 0 011 1v4a1 1 0 01-1 1h-3m-10 4h10m-10 4h10" /></svg>
                        {i.sector}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${i.remote ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{i.remote ? <><circle cx="12" cy="12" r="10" /><path d="M8 12l2 2 4-4" /></> : <><rect x="4" y="4" width="16" height="16" rx="4" /></>}</svg>
                        {i.remote ? 'Remote' : 'Onsite'}
                      </span>
                    </div>
                    <div className="text-gray-700 text-sm line-clamp-2">{i.description}</div>
                  </div>
                </div>
              </CardContent>
            </div>
          ))}
          {filteredInternships.length === 0 && <div className="text-center text-gray-500 col-span-2">No internships found.</div>}
        </div>
      </div>

      <Modal open={modalOpen} onClose={handleCloseModal} maxWidth="4xl" padding="p-8">
        <InternshipDetails internship={selectedInternship} onApply={handleApply} onBack={handleCloseModal} />
      </Modal>
      <BottomNav currentView="results" />
    </div>
  );
}
