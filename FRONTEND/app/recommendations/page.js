"use client";
import '../i18n';
import { Suspense, useState } from 'react';
import { RecommendationResults } from '../components/InternshipCard';
export default function RecommendationsPage() {
  const [recommendations] = useState([]);
  return <Suspense fallback={<div>Loading...</div>}><RecommendationResults recommendations={recommendations} /></Suspense>;
}
