"use client";
import React, { useState, useRef } from 'react';
import ResumeModal from './ResumeModal';
import { supabase } from '../../lib/supabaseClient';
import { Button } from './ui/button';
import { Card } from './ui/card';
function SectionCard({ title, children }) {
  return (
    <Card className="p-0 border-b border-gray-100 w-full rounded-2xl">
      <div className="bg-[#ffffff] p-6 rounded-2xl">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {children}
      </div>
    </Card>
  );
}


export default function ProfileSettings({ user = {}, profileCompletion = 0, onBack, onSave }) {
  const [profileData, setProfileData] = useState(user || {});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const profileImageRef = useRef();
  const [educationList, setEducationList] = useState([]);

  // Get name and email from session (user object)
  const sessionName = user?.user_metadata?.name || user?.name || user?.email || 'User';
  const sessionEmail = user?.email || '';

  React.useEffect(() => {
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
        // Fetch education records for completeness
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

  async function handleSave() {
    if (!user || !user.id) {
      alert('No active session or user id found. Please log in.');
      return;
    }
    let profileImageUrl = profileData.profile_image_url;
    // Helper to derive object path from public URL (assumes standard Supabase public URL format)
    const extractPathFromPublicUrl = (url) => {
      if (!url) return null;
      try {
        const u = new URL(url);
        // Public URL usually ends with /object-path (after bucket name). Bucket name here is 'sih'.
        const parts = u.pathname.split('/');
        // Find index of bucket name and take remaining segments as object path
        const bucketIdx = parts.findIndex(p => p === 'sih');
        if (bucketIdx !== -1) {
          const objectSegments = parts.slice(bucketIdx + 1);
          const objectPath = objectSegments.join('/');
          return decodeURIComponent(objectPath);
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    let oldImagePublicUrl = null;
    let oldImagePath = null;
    if (profileImageRef.current && profileImageRef.current.files && profileImageRef.current.files[0]) {
      // Prepare deletion of previous image
      if (profileData.profile_image_url && profileData.profile_image_url !== 'empty') {
        oldImagePublicUrl = profileData.profile_image_url;
        oldImagePath = extractPathFromPublicUrl(oldImagePublicUrl);
      }
      const file = profileImageRef.current.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `profile_${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('sih')
        .upload(fileName, file, { upsert: true });
      if (uploadError) {
        alert('Error uploading profile image: ' + uploadError.message);
        return;
      }
      const { data: urlData } = supabase.storage.from('sih').getPublicUrl(fileName);
      if (urlData && urlData.publicUrl) {
        profileImageUrl = urlData.publicUrl;
        // Delete old image after successful new upload (ignore failure silently)
        if (oldImagePath) {
          supabase.storage.from('sih').remove([oldImagePath]).then(({ error: delError }) => {
            if (delError) console.warn('Failed to delete old profile image:', delError.message);
          });
        }
      }
    }
    const data = {
      profile_image_url: profileImageUrl,
      applicant_id: user.id,
    };
    const { error } = await supabase
      .from('applicants')
      .upsert([data], { onConflict: ['applicant_id'] });
    if (!error) {
      const { data: refreshed, error: fetchError } = await supabase
        .from('applicants')
        .select('*')
        .eq('applicant_id', user.id)
        .single();
      if (!fetchError && refreshed) {
        setProfileData(refreshed);
      }
      onSave && onSave({ success: true });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } else {
      alert('Error updating profile: ' + error.message);
    }
  }

  // Helper to show value or 'empty'
  function showValue(val) {
    if (val === undefined || val === null || val === '') return 'empty';
    if (Array.isArray(val) && val.length === 0) return 'empty';
    return val;
  }
  const initialData = {
    profile_image_url: showValue(profileData.profile_image_url),
    resume_url: showValue(profileData.resume_url),
    name: showValue(profileData.name),
    father_name: showValue(profileData.father_name),
    category: showValue(profileData.category),
    disability_status: profileData.disability_status || false,
    education_level: showValue(profileData.education_level),
    major: showValue(profileData.major),
    experience_years: showValue(profileData.experience_years),
    skills: showValue(profileData.skills),
    sectors_of_interest: Array.isArray(profileData.sectors_of_interest) ? profileData.sectors_of_interest : [],
    preferred_locations: Array.isArray(profileData.preferred_locations) ? profileData.preferred_locations : [],
    remote_ok: profileData.remote_ok || false,
    preferred_language: showValue(profileData.preferred_language),
    languages_known: Array.isArray(profileData.languages_known) ? profileData.languages_known : [],
    mobile_number: showValue(profileData.mobile_number),
    alt_mobile_number: showValue(profileData.alt_mobile_number),
    email: showValue(profileData.email),
    address_line1: showValue(profileData.address_line1),
    address_line2: showValue(profileData.address_line2),
    state: showValue(profileData.state),
    district: showValue(profileData.district),
    pincode: showValue(profileData.pincode),
  };
  const hasPhoto = initialData.profile_image_url && initialData.profile_image_url !== 'empty';

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-gradient-to-br from-[#f3f0ff] to-white pb-8">
      {showSuccess && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-800 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <span className="font-bold">✔</span>
          <span>Profile image updated successfully!</span>
        </div>
      )}
      <div className="w-full max-w-3xl mt-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* User Info Card */}
          <Card className="shadow-lg rounded-2xl border-0 bg-white">
            <div className="flex flex-col items-center justify-center p-6 mt-4">
              <div className="w-36 h-36 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                {initialData.profile_image_url && initialData.profile_image_url !== 'empty' ? (
                  <img src={initialData.profile_image_url} alt="Profile" className="w-36 h-36 rounded-full object-cover border-2 border-purple-300" />
                ) : (
                  <span className="text-6xl text-purple-600 font-bold">{sessionName[0]}</span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">{sessionName}</h2>
              <p className="text-md text-gray-600 mb-4 text-center">{sessionEmail}</p>
            </div>
            <div className="flex justify-center pb-4">
              <Button onClick={() => setShowImageModal(true)} className="btn btn-primary mx-auto" style={{color: '#222'}}>
                {hasPhoto ? 'Change Photo' : 'Add Profile Photo'}
              </Button>
            </div>
          </Card>
          {/* Profile Completeness Card */}
          <Card className="shadow-lg rounded-2xl border-0 bg-white p-6 flex flex-col items-center justify-center text-center">
            <div className="flex flex-col items-center justify-center w-full gap-2">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Profile Completeness</h3>
              <span className="text-md text-gray-500 mb-6">See how much of your profile is filled</span>
              {(() => {
                // ...existing completeness calculation code...
                const requiredFields = [
                  { key: 'name', label: 'Full Name' },
                  { key: 'father_name', label: "Father's Name" },
                  { key: 'category', label: 'Category' },
                  { key: 'education_level', label: 'Education Level' },
                  { key: 'major', label: 'Major' },
                  { key: 'experience_years', label: 'Experience (Years)' },
                  { key: 'skills', label: 'Skills' },
                  { key: 'mobile_number', label: 'Mobile Number' },
                  { key: 'email', label: 'Email' },
                  { key: 'state', label: 'State' },
                  { key: 'district', label: 'District' },
                  { key: 'pincode', label: 'Pincode' },
                ];
                const requiredEduFields = [
                  { key: 'educationLevel', label: 'Education Level' },
                  { key: 'course', label: 'Course' },
                  { key: 'board_university_name', label: 'Board/University' },
                  { key: 'institute_name', label: 'Institute Name' },
                  { key: 'year_of_passing', label: 'Year of Passing' },
                  { key: 'marks_or_grade', label: 'Marks/Grade' },
                ];
                const missingFields = requiredFields.filter(f => !profileData[f.key] || profileData[f.key] === '' || profileData[f.key] === null);
                let missingEduFields = [];
                if (educationList.length === 0) {
                  missingEduFields = requiredEduFields;
                } else {
                  const edu = educationList[0];
                  missingEduFields = requiredEduFields.filter(f => !edu[f.key] || edu[f.key] === '' || edu[f.key] === null);
                }
                const totalFields = requiredFields.length + requiredEduFields.length;
                const missingCount = missingFields.length + missingEduFields.length;
                const completeness = Math.round(((totalFields - missingCount) / totalFields) * 100);
                const circumference = 2 * Math.PI * 70;
                const percent = completeness;
                const offset = circumference * (1 - percent / 100);
                return (
                  <div className="flex flex-col items-center justify-center w-full gap-4">
                    <div className="relative flex items-center justify-center mb-4" style={{ width: '180px', height: '180px' }}>
                      <svg width="180" height="180">
                        <circle cx="90" cy="90" r="80" style={{ stroke: '#f3f0ff', strokeWidth: 14, fill: 'none' }} />
                        <circle
                          cx="90"
                          cy="90"
                          r="80"
                          style={{
                            stroke: '#2563eb',
                            strokeWidth: 14,
                            fill: 'none',
                            strokeDasharray: `${2 * Math.PI * 80}px`,
                            strokeDashoffset: `${2 * Math.PI * 80 * (1 - percent / 100)}px`,
                            transition: 'stroke-dashoffset 0.5s',
                          }}
                        />
                        <text
                          x="90"
                          y="105"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="2.5em"
                          fontWeight="bold"
                          fill="#2563eb"
                        >
                          {percent}%
                        </text>
                      </svg>
                    </div>
                    {missingCount === 0 && (
                      <div className="text-green-700 font-semibold mb-2">Your profile is complete!</div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex justify-center pb-4">
              <Button className="btn btn-primary mx-auto" onClick={() => setShowResumeModal(true)}>
                Complete Profile
              </Button>
            </div>
          </Card>
        </div>
        {showResumeModal && (
          <ResumeModal isOpen={true} onClose={() => setShowResumeModal(false)} user={user} />
        )}
        {showImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
              <h3 className="text-lg font-semibold mb-4">{hasPhoto ? 'Change Profile Photo' : 'Add Profile Photo'}</h3>
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border">
                  {initialData.profile_image_url && initialData.profile_image_url !== 'empty' ? (
                    <img src={initialData.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-gray-400 font-bold">?</span>
                  )}
                </div>
                <input type="file" accept="image/*" className="w-full border rounded-md px-3 py-2 text-sm" ref={profileImageRef} />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" size="sm" className="btn btn-primary" onClick={() => setShowImageModal(false)}>Cancel</Button>
                <Button size="sm" className="btn btn-primary" onClick={async () => { await handleSave(); setShowImageModal(false); }}>Save</Button>
              </div>
            </div>
          </div>
        )}
        {/* Personal Info Card */}
        <Card className="mb-6 shadow rounded-2xl border-0 bg-white">
          <SectionCard title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <div className="py-2 text-gray-700"><span className="font-medium">{initialData.name}</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Father&apos;s Name</label>
                <div className="py-2 text-gray-700"><span className="font-medium">{initialData.father_name}</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <div className="py-2 text-gray-700"><span className="font-medium">{initialData.category}</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Disability Status</label>
                <div className="py-2 text-gray-700"><span className="font-medium">{initialData.disability_status ? 'Disabled' : 'Not Disabled'}</span></div>
              </div>
            </div>
          </SectionCard>
        </Card>

      </div>
    </div>
  );
}
