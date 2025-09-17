import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export function InternshipCard({ internship, onApply, onViewDetails }){
  const isBestMatch = internship.matchPercent && internship.matchPercent >= 80;
  return (
    <Card className="hover:shadow-md transition-shadow relative">
      {isBestMatch && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-[#7c5cff] text-white text-xs font-semibold px-3 py-1 rounded-full shadow">Best Match</span>
        </div>
      )}
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{internship.title}</h3>
            <span className="text-xs text-gray-400">ID: {internship.id}</span>
          </div>
          {typeof internship.matchPercent === 'number' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#7c5cff] bg-[#f3f0ff] px-2 py-0.5 rounded-full">Match: {internship.matchPercent}%</span>
            </div>
          )}
          <p className="text-sm text-gray-600">{internship.location}</p>
          <p className="text-sm text-gray-500">Sector: {internship.sector}</p>
          <p className="text-sm text-gray-500">Stipend: {internship.stipend}</p>
          <p className="text-sm text-gray-500">Education: {internship.education}</p>
          <p className="text-sm text-gray-500">Posted: {internship.posted_date}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {internship.skills && internship.skills.map((skill, i) => (
              <span key={i} className="bg-[#f3f0ff] text-[#7c5cff] px-2 py-0.5 rounded-full text-xs">{skill}</span>
            ))}
          </div>
          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{internship.description}</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" className="btn btn-primary" onClick={()=>onApply(internship.id)}>Apply</Button>
            <Button variant="outline" size="sm" className="btn btn-primary" onClick={()=>onViewDetails(internship.id)}>Details</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecommendationResults({ recommendations, onApply, onViewDetails, onBack }){
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recommended Internships</h2>
  {onBack && <Button variant="outline" size="sm" className="btn btn-primary" onClick={onBack}>Back</Button>}
      </div>
      {recommendations.length === 0 && <p className="text-sm text-gray-600">No recommendations yet. Fill your profile.</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map(r => <InternshipCard key={r.id} internship={r} onApply={onApply} onViewDetails={onViewDetails} />)}
      </div>
    </div>
  );
}
