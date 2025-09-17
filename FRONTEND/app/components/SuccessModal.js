"use client";
import React from 'react';
import { Button } from './ui/button';

export default function SuccessModal({ isOpen, onClose, type, data }){
  if(!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-xl font-semibold">Success</h2>
        {type === 'application' && (
          <p className="text-sm text-gray-600">Application submitted for <strong>{data?.internshipTitle}</strong>.</p>
        )}
        {type === 'profile_complete' && (
          <p className="text-sm text-gray-600">Profile completed. Recommendations generated!</p>
        )}
        <div className="text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
