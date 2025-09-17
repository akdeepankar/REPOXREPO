"use client";
import '../i18n';
import { useState, useEffect } from 'react';
import { BottomNav } from '../components/BottomNav';
import { Navbar } from '../components/Navbar';
import { supabase } from '../../lib/supabaseClient';
import LoginForm from '../components/LoginForm';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

// Columns: Internship Title, Organization, Location, Applied On, Status, Actions

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      const activeUser = userData?.user || null;
      setUser(activeUser);
      if (activeUser) {
        await fetchApplications(activeUser.id);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function fetchApplications(userId) {
    // 1. Get all user_interactions for this user where interaction_type is 'apply'
    const { data: appliedInteractions, error: intError } = await supabase
      .from('user_interactions')
      .select('internship_id, timestamp')
      .eq('candidate_id', userId)
      .eq('interaction_type', 'apply');
    console.log('user_interactions result:', { appliedInteractions, intError });
    if (intError || !appliedInteractions || appliedInteractions.length === 0) {
      setApplications([]);
      return;
    }
    // 2. Get all unique internship_ids from those rows
    const internshipIds = [...new Set(appliedInteractions.map(i => i.internship_id).filter(Boolean))];
    console.log('internshipIds:', internshipIds);
    if (!internshipIds.length) {
      setApplications([]);
      return;
    }
    // 3. Fetch internship details for these IDs
    const { data: internships, error: intErr2 } = await supabase
      .from('internships')
      .select('internship_id, title, location, posted_date')
      .in('internship_id', internshipIds);
    console.log('internships result:', { internships, intErr2 });
    if (!intErr2 && internships && internships.length > 0) {
      // 4. Map applied date from user_interactions
      const mapped = internships.map(intern => {
        const interaction = appliedInteractions.find(i => String(i.internship_id) === String(intern.internship_id));
        return {
          id: intern.internship_id,
          internshipTitle: intern.title || '—',
          // organization: intern.organization || '—',
          location: intern.location || '—',
          status: 'applied',
          appliedDate: interaction && interaction.timestamp ? new Date(interaction.timestamp).toLocaleDateString() : '—',
        };
      });
      setApplications(mapped);
    } else {
      setApplications([]);
    }
  }

  async function handleWithdraw(id) {
    setWithdrawingId(id);
    // Find the user_interactions row for this internship and user, and set interaction_type to 'view'
    if (!user) return;
    const { error } = await supabase
      .from('user_interactions')
      .update({ interaction_type: 'view' })
      .eq('candidate_id', user.id)
      .eq('internship_id', id)
      .eq('interaction_type', 'apply');
    if (!error) {
      // Remove from applications list in UI
      setApplications(prev => prev.filter(a => a.id !== id));
    }
    setWithdrawingId(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-16 flex flex-col">
        <Navbar currentUser={null} />
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading applications...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white pb-16">
        <Navbar currentUser={null} />
        <div className="max-w-4xl mx-auto py-12 px-4 relative min-h-[60vh] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-center">Sign In Required</h2>
            <p className="text-center text-gray-600 mb-6">Please sign in to view your applications.</p>
            <LoginForm />
          </div>
        </div>
        <BottomNav currentView="submitted-applications" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar currentUser={{ name: user.user_metadata?.name || user.email }} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Applications</h1>
        <Card className="overflow-hidden border rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-700">
                  <th className="py-3 px-4 font-semibold">Internship</th>
                  {/* <th className="py-3 px-4 font-semibold">Organization</th> */}
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Applied On</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{app.internshipTitle}</td>
                    {/* <td className="py-3 px-4 text-gray-700">{app.organization}</td> */}
                    <td className="py-3 px-4 text-gray-700">{app.location}</td>
                    <td className="py-3 px-4 text-gray-600">{app.appliedDate}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium capitalize ${app.status === 'withdrawn' ? 'bg-red-100 text-red-700' : app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'}`}>{app.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Button size="xs" variant="outline" className="btn btn-primary text-black" disabled={withdrawingId === app.id} onClick={() => handleWithdraw(app.id)}>
                        {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td className="py-10 px-4 text-center text-gray-500" colSpan={6}>
                      You have not submitted any applications yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <BottomNav currentView="submitted-applications" />
    </div>
  );
}
