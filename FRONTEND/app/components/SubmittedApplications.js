"use client";
import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export default function SubmittedApplications({ applications, onBack, onWithdraw }){
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
      <h1 className="text-2xl font-semibold">Submitted Applications</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {applications.map(app => (
          <Card key={app.id} className="border-l-4 border-l-blue-600">
            <CardContent className="space-y-2">
              <h3 className="font-semibold">{app.internshipTitle}</h3>
              <p className="text-sm text-gray-600">{app.organization} • {app.location}</p>
              <p className="text-xs text-gray-500">Applied: {app.appliedDate}</p>
              <p className="text-xs"><span className="font-medium">Status:</span> {app.status}</p>
              {app.status !== 'withdrawn' && (
                <Button size="sm" variant="outline" onClick={()=>onWithdraw(app.id)}>Withdraw</Button>
              )}
            </CardContent>
          </Card>
        ))}
        {applications.length === 0 && <p className="text-sm text-gray-600 col-span-full">No applications yet.</p>}
      </div>
    </div>
  );
}
