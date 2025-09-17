"use client";
import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

// Heroicons SVGs
function LocationIcon() {
  return <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 10c-4.418 0-8-5.373-8-10a8 8 0 1116 0c0 4.627-3.582 10-8 10z"/></svg>;
}
function BriefcaseIcon() {
  return <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/></svg>;
}
function AcademicCapIcon() {
  return <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0 0c-3.866 0-7-1.343-7-3"/></svg>;
}
function SparklesIcon() {
  return <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8l2 2 4-4m0 0l2 2 4-4"/></svg>;
}
function ClipboardIcon() {
  return <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>;
}
function GlobeIcon() {
  return <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>;
}
function UsersIcon() {
  return <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0zm6 13v-2a4 4 0 00-3-3.87M6 7a4 4 0 018 0"/></svg>;
}
function BookOpenIcon() {
  return <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9-5-9-5-9 5 9 5zm0 0v6m0 0c-3.866 0-7-1.343-7-3"/></svg>;
}
function CalendarIcon() {
  return <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18"/></svg>;
}
function ClockIcon() {
  return <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>;
}
function HourglassIcon() {
  return <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 2h12M6 22h12M6 2v6a6 6 0 0012 0V2M6 22v-6a6 6 0 0112 0v6"/></svg>;
}
function MapIcon() {
  return <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A2 2 0 013 15.382V6.618a2 2 0 011.553-1.894L9 2m6 18l5.447-2.724A2 2 0 0021 15.382V6.618a2 2 0 00-1.553-1.894L15 2M9 2v18m6-18v18"/></svg>;
}
function MapPinIcon() {
  return <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 10c-4.418 0-8-5.373-8-10a8 8 0 1116 0c0 4.627-3.582 10-8 10z"/></svg>;
}
function HashtagIcon() {
  return <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 10h10M7 14h10M9 3L5 21M15 3l-4 18"/></svg>;
}

export default function InternshipDetails({ internship, onApply }) {
  if (!internship) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-gray-500">
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">No internship details available</h2>
            <p className="mb-4">Please select an internship to view its details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100">
      {/* Quick Info Row */}
      <div className="flex flex-wrap gap-3 mb-4">
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
          <BriefcaseIcon /> {internship.sector}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${internship.remote ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
          <GlobeIcon /> {internship.remote ? 'Remote' : 'Onsite'}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
          <HourglassIcon /> {internship.duration_weeks} weeks
        </span>
      </div>
      {/* Summary Header */}
      <div className="flex flex-col md:flex-row gap-8 items-center mb-8 border-b pb-6">
        {internship.image_url && (
          <div className="flex-shrink-0">
            <img src={internship.image_url} alt={internship.title} className="h-40 w-40 object-cover rounded-2xl border shadow-lg" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">{internship.title}</h1>
          <div className="flex flex-wrap gap-2 mb-3">
            {internship.skills && internship.skills.split(',').map((skill, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{skill.trim()}</span>
            ))}
          </div>
          <div className="text-gray-700 text-base leading-relaxed mb-1 line-clamp-4">{internship.description}</div>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Location */}
        <Card className="rounded-2xl border border-blue-100 bg-white/60 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-200 p-1">
          <CardContent className="space-y-2">
            <h3 className="text-md font-semibold text-gray-800 mb-2 border-b pb-1">Location</h3>
            <div className="flex items-center gap-2"><LocationIcon /><span className="font-medium">{internship.location}</span></div>
            <div className="flex items-center gap-2"><MapIcon /><span className="font-medium">State:</span> {internship.state}</div>
            <div className="flex items-center gap-2"><MapPinIcon /><span className="font-medium">District:</span> {internship.district}</div>
            <div className="flex items-center gap-2"><HashtagIcon /><span className="font-medium">Pincode:</span> {internship.pincode}</div>
          </CardContent>
        </Card>
        {/* Internship Info */}
        <Card className="rounded-2xl border border-purple-100 bg-white/60 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-200 p-1">
          <CardContent className="space-y-2">
            <h3 className="text-md font-semibold text-gray-800 mb-2 border-b pb-1">Internship Info</h3>
            <div className="flex items-center gap-2"><BriefcaseIcon /><span className="font-medium">Sector:</span> {internship.sector}</div>
            <div className="flex items-center gap-2"><AcademicCapIcon /><span className="font-medium">Course:</span> {internship.course}</div>
            <div className="flex items-center gap-2"><SparklesIcon /><span className="font-medium">Specialisation:</span> {internship.specialisation_area}</div>
            <div className="flex items-center gap-2"><ClipboardIcon /><span className="font-medium">Field:</span> {internship.field}</div>
            <div className="flex items-center gap-2"><GlobeIcon /><span className="font-medium">Remote:</span> {internship.remote ? 'Yes' : 'No'}</div>
            <div className="flex items-center gap-2"><UsersIcon /><span className="font-medium">Opportunities:</span> {internship.no_of_opportunities}</div>
            <div className="flex items-center gap-2"><BookOpenIcon /><span className="font-medium">Education:</span> {internship.min_education_level}</div>
          </CardContent>
        </Card>
        {/* Dates */}
        <Card className="rounded-2xl border border-yellow-100 bg-white/60 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-200 p-1">
          <CardContent className="space-y-2">
            <h3 className="text-md font-semibold text-gray-800 mb-2 border-b pb-1">Dates</h3>
            <div className="flex items-center gap-2"><CalendarIcon /><span className="font-medium">Posted:</span> {internship.posted_date}</div>
            <div className="flex items-center gap-2"><ClockIcon /><span className="font-medium">Deadline:</span> {internship.application_deadline}</div>
            <div className="flex items-center gap-2"><HourglassIcon /><span className="font-medium">Duration:</span> {internship.duration_weeks} weeks</div>
          </CardContent>
        </Card>
      </div>

      {/* Perks & Benefits */}
      {internship.perks && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-1">Perks & Benefits</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            {internship.perks.split(',').map((perk, i) => (
              <li key={i}>{perk.trim()}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Apply Button */}
      <div className="pt-2 sticky bottom-0 bg-white/80 backdrop-blur-md rounded-b-2xl z-10">
        <Button
          size="lg"
          className="btn btn-primary w-full py-4 text-lg font-bold shadow-md flex items-center justify-center"
          onClick={() => onApply(internship.internship_id)}
        >
          <span className="w-full text-center">Apply Now</span>
        </Button>
      </div>
    </div>
  );
}
