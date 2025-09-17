"use client";
import './i18n';
import React, { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { Navbar } from './components/Navbar';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Sparkles, Target, Globe, CheckCircle, Award, Users, GraduationCap, BriefcaseBusiness, IndianRupee } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { calculateRecommendations } from './components/RecommendationEngine';
import { toast } from 'sonner';

// Lazy heavy components (already simple but keep pattern)
const LoginForm = lazy(()=>import('./components/LoginForm'));
const RecommendationResults = lazy(()=>import('./components/InternshipCard').then(m=>({default:m.RecommendationResults})));
const InternshipDetails = lazy(()=>import('./components/InternshipDetails'));
const ProfileSettings = lazy(()=>import('./components/ProfileSettings'));
const SuccessModal = lazy(()=>import('./components/SuccessModal'));
const SubmittedApplications = lazy(()=>import('./components/SubmittedApplications'));

function Page() {
  const { t, i18n } = useTranslation();
  function LoadingSpinner(){
    return <div className="flex items-center justify-center min-h-[120px]"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

    const [currentView, setCurrentView] = useState('welcome');
    const [recommendations, setRecommendations] = useState([]);
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [submittedApps, setSubmittedApps] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [modalState, setModalState] = useState({ isOpen:false, type:'registration', data:{} });

    React.useEffect(() => {
      if (typeof window !== 'undefined' && i18n && typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage('en'); // Set English as default
      }
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setCurrentUser({ name: data.user.user_metadata?.name || data.user.email });
        } else {
          setCurrentUser(null);
        }
      });
    }, [i18n]);
    const notifications = useMemo(()=>[
      {id:'1', title:t('homepage.notifications.newMatchTitle'), message:t('homepage.notifications.newMatchMessage'), time:'2h', read:false},
    ],[]);
    const [dynamicNotifications, setDynamicNotifications] = useState([]);
    const allNotifications = useMemo(()=>[...dynamicNotifications, ...notifications],[dynamicNotifications, notifications]);

    // Handlers
    const router = useRouter();
    const handleStartForm = useCallback(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }, [router]);
    const handleLoginSuccess = useCallback(user => {
      toast.success(`Welcome ${user.name}!`);
      setCurrentView('form');
    },[]);
    const handleGuest = useCallback(()=>{ toast.info('Continuing as guest'); setCurrentView('form'); },[]);
    const handleProfileSubmit = useCallback(profile => {
      const results = calculateRecommendations(profile);
      setRecommendations(results);
      setCurrentView('results');
      toast.success(`Found ${results.length} personalized recommendations for you!`);
      setModalState({ isOpen:true, type:'profile_complete', data:{} });
    },[]);
    const handleApply = useCallback(id => {
      const internship = recommendations.find(i=>i.id===id);
      if(!internship) return;
      const newApplication = { id:Date.now().toString(), internshipTitle:internship.title, organization:internship.organization, location:internship.location, appliedDate:new Date().toLocaleDateString(), status:'pending', deadline:internship.deadline, stipend:internship.stipend, sector:internship.sector };
      setSubmittedApps(prev=>[newApplication, ...prev]);
      toast.success(`Application submitted for ${internship.title}!`);
      setModalState({ isOpen:true, type:'application', data:{ internshipTitle: internship.title }});
    },[recommendations]);
    const handleViewDetails = useCallback(id => { const intn = recommendations.find(i=>i.id===id); if(intn){ setSelectedInternship(intn); setCurrentView('internship-details'); }},[recommendations]);
    const handleBack = useCallback(()=>setCurrentView('results'),[]);
    const handleProfileSettings = useCallback(()=>setCurrentView('profile-settings'),[]);
    const handleSubmittedApplications = useCallback(()=>setCurrentView('submitted-applications'),[]);
    const handleWithdrawApplication = useCallback(aid => { setSubmittedApps(prev=>prev.map(p=>p.id===aid?{...p, status:'withdrawn'}:p)); },[]);
    const handleProfileSave = useCallback(()=>{ toast.success('Profile updated'); setCurrentView('results'); },[]);
    const handleCloseModal = useCallback(()=> setModalState(m=>({...m, isOpen:false})),[]);
    const handleEligibilityClick = useCallback(()=>{ const el = document.getElementById('eligibility-section'); if(el) el.scrollIntoView({behavior:'smooth'}); },[]);
    const handleGuidelinesClick = useCallback(()=> toast.info('Guidelines coming soon'),[]);
    const handleSupportClick = useCallback(()=> toast.info('Support coming soon'),[]);
    const handleNavigate = useCallback((key)=>{
      if(key==='welcome') setCurrentView('welcome');
      else if(key==='results') setCurrentView(recommendations.length? 'results' : 'form');
      else if(key==='submitted-applications') setCurrentView('submitted-applications');
      else if(key==='profile-settings') setCurrentView('profile-settings');
    },[recommendations.length]);

    // View rendering helpers (avoid returning early before hooks defined)
    const renderLogin = () => (
      <div className="min-h-screen pb-16 md:pb-0 bg-white">
        <Navbar notifications={allNotifications} onProfileClick={handleProfileSettings} onSubmittedApplicationsClick={handleSubmittedApplications} onEligibilityClick={handleEligibilityClick} onGuidelinesClick={handleGuidelinesClick} onSupportClick={handleSupportClick} currentUser={currentUser} submittedApplicationsCount={submittedApps.length} />
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-10 text-center text-white">
          <h1 className="text-3xl font-semibold mb-2">{t('homepage.login.title')}</h1>
          <p className="text-white/80">{t('homepage.login.subtitle')}</p>
        </div>
        <div className="max-w-4xl mx-auto p-6">
          <Suspense fallback={<LoadingSpinner />}> <LoginForm onSuccess={handleLoginSuccess} onGuest={handleGuest} /> </Suspense>
        </div>
        <BottomNav currentView={currentView} onNavigate={handleNavigate} />
      </div>
    );
    // View rendering
    if(currentView==='login') return renderLogin();
    if(currentView==='internship-details' && selectedInternship){
      return <div className="pb-16 md:pb-0">
        <Navbar notifications={allNotifications} onProfileClick={handleProfileSettings} onSubmittedApplicationsClick={handleSubmittedApplications} onEligibilityClick={handleEligibilityClick} onGuidelinesClick={handleGuidelinesClick} onSupportClick={handleSupportClick} currentUser={currentUser} submittedApplicationsCount={submittedApps.length} />
        <Suspense fallback={<LoadingSpinner />}> <InternshipDetails internship={selectedInternship} onBack={handleBack} onApply={handleApply} /> </Suspense>
        <Suspense fallback={<LoadingSpinner />}> <SuccessModal isOpen={modalState.isOpen} onClose={handleCloseModal} type={modalState.type} data={modalState.data} /> </Suspense>
        <BottomNav currentView={currentView} onNavigate={handleNavigate} />
      </div>;
    }
    if(currentView==='profile-settings'){
      return <div className="pb-16 md:pb-0">
        <Navbar notifications={allNotifications} onProfileClick={handleProfileSettings} onSubmittedApplicationsClick={handleSubmittedApplications} onEligibilityClick={handleEligibilityClick} onGuidelinesClick={handleGuidelinesClick} onSupportClick={handleSupportClick} currentUser={currentUser} submittedApplicationsCount={submittedApps.length} />
        <Suspense fallback={<LoadingSpinner />}> <ProfileSettings onBack={()=>setCurrentView('results')} onSave={handleProfileSave} /> </Suspense>
        <Suspense fallback={<LoadingSpinner />}> <SuccessModal isOpen={modalState.isOpen} onClose={handleCloseModal} type={modalState.type} data={modalState.data} /> </Suspense>
        <BottomNav currentView={currentView} onNavigate={handleNavigate} />
      </div>;
    }
    if(currentView==='submitted-applications'){
      return <div className="pb-16 md:pb-0">
        <Navbar notifications={allNotifications} onProfileClick={handleProfileSettings} onSubmittedApplicationsClick={handleSubmittedApplications} onEligibilityClick={handleEligibilityClick} onGuidelinesClick={handleGuidelinesClick} onSupportClick={handleSupportClick} currentUser={currentUser} submittedApplicationsCount={submittedApps.length} />
        <Suspense fallback={<LoadingSpinner />}> <SubmittedApplications applications={submittedApps} onBack={()=>setCurrentView('results')} onWithdraw={handleWithdrawApplication} /> </Suspense>
        <Suspense fallback={<LoadingSpinner />}> <SuccessModal isOpen={modalState.isOpen} onClose={handleCloseModal} type={modalState.type} data={modalState.data} /> </Suspense>
        <BottomNav currentView={currentView} onNavigate={handleNavigate} />
      </div>;
    }
    if(currentView==='form'){
      return <div className="min-h-screen pb-16 md:pb-0 bg-white">
        <Navbar notifications={allNotifications} onProfileClick={handleProfileSettings} onSubmittedApplicationsClick={handleSubmittedApplications} onEligibilityClick={handleEligibilityClick} onGuidelinesClick={handleGuidelinesClick} onSupportClick={handleSupportClick} currentUser={currentUser} submittedApplicationsCount={submittedApps.length} />
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-10 text-center text-white">
          <h1 className="text-3xl font-semibold mb-2">{t('homepage.form.title')}</h1>
          <p className="text-white/80">{t('homepage.form.subtitle')}</p>
        </div>

        <Suspense fallback={<LoadingSpinner />}> <SuccessModal isOpen={modalState.isOpen} onClose={handleCloseModal} type={modalState.type} data={modalState.data} /> </Suspense>
        <BottomNav currentView={currentView} onNavigate={handleNavigate} />
      </div>;
    }
    if(currentView==='results'){
      return <div className="min-h-screen pb-16 md:pb-0 bg-white">
        <Navbar notifications={allNotifications} onProfileClick={handleProfileSettings} onSubmittedApplicationsClick={handleSubmittedApplications} onEligibilityClick={handleEligibilityClick} onGuidelinesClick={handleGuidelinesClick} onSupportClick={handleSupportClick} currentUser={currentUser} submittedApplicationsCount={submittedApps.length} />
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-10 text-center text-white">
          <h1 className="text-3xl font-semibold mb-2">{t('homepage.results.title')}</h1>
          <p className="text-white/80">{t('homepage.results.subtitle')}</p>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <Suspense fallback={<LoadingSpinner />}> <RecommendationResults recommendations={recommendations} onApply={handleApply} onViewDetails={handleViewDetails} onBack={()=>setCurrentView('form')} /> </Suspense>
        </div>
        <Suspense fallback={<LoadingSpinner />}> <SuccessModal isOpen={modalState.isOpen} onClose={handleCloseModal} type={modalState.type} data={modalState.data} /> </Suspense>
        <BottomNav currentView={currentView} onNavigate={handleNavigate} />
      </div>;
    }

    // Welcome view
    return <div className="min-h-screen pb-16 md:pb-0 bg-white">
      <Navbar notifications={allNotifications} onProfileClick={handleProfileSettings} onSubmittedApplicationsClick={handleSubmittedApplications} onEligibilityClick={handleEligibilityClick} onGuidelinesClick={handleGuidelinesClick} onSupportClick={handleSupportClick} currentUser={currentUser} submittedApplicationsCount={submittedApps.length} />
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><Award className="w-8 h-8 text-white" /></div>
            <div><h1 className="text-3xl font-semibold">{t('homepage.welcome.title')}</h1><p className="text-white/80">{t('homepage.welcome.subtitle')}</p></div>
          </div>
          <p className="text-white/90 max-w-3xl mx-auto text-lg mb-8">{t('homepage.welcome.description')}</p>
    <Button onClick={handleStartForm} size="lg" variant="default" className="px-8 py-4">{t('homepage.welcome.cta')} <Sparkles className="w-5 h-5 ml-2" /></Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
    <h2 className="text-2xl font-semibold mb-4">{t('homepage.empowering.title')}</h2>
      <p className="text-gray-600 max-w-2xl mx-auto">{t('homepage.empowering.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"><CardContent className="space-y-4 pt-0"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto"><Target className="w-8 h-8 text-blue-600" /></div><h3 className="font-semibold">{t('homepage.features.smartMatching.title')}</h3><p className="text-sm text-gray-600">{t('homepage.features.smartMatching.description')}</p></CardContent></Card>
          <Card className="text-center p-6 hover:shadow-lg transition-shadow border-l-4 border-l-green-500"><CardContent className="space-y-4 pt-0"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><Globe className="w-8 h-8 text-green-600" /></div><h3 className="font-semibold">{t('homepage.features.inclusiveAccess.title')}</h3><p className="text-sm text-gray-600">{t('homepage.features.inclusiveAccess.description')}</p></CardContent></Card>
          <Card className="text-center p-6 hover:shadow-lg transition-shadow border-l-4 border-l-purple-500"><CardContent className="space-y-4 pt-0"><div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8 text-purple-600" /></div><h3 className="font-semibold">{t('homepage.features.simpleProcess.title')}</h3><p className="text-sm text-gray-600">{t('homepage.features.simpleProcess.description')}</p></CardContent></Card>
        </div>
        <div id="eligibility-section" className="mb-16">
          <Card className="p-8 bg-gradient-to-r from-orange-50 to-green-50 border-0">
            <div className="text-center mb-8"><h2 className="text-2xl font-semibold mb-4">{t('homepage.eligibility.title')}</h2><p className="text-gray-600">{t('homepage.eligibility.subtitle')}</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow"><CardContent className="pt-0"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-blue-600" /></div><h3 className="mb-2 font-medium">{t('homepage.eligibility.age.title')}</h3><p className="text-blue-600 font-semibold">{t('homepage.eligibility.age.value')}</p></CardContent></Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow"><CardContent className="pt-0"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><BriefcaseBusiness className="w-8 h-8 text-green-600" /></div><h3 className="mb-2 font-medium">{t('homepage.eligibility.jobStatus.title')}</h3><p className="text-green-600 font-semibold">{t('homepage.eligibility.jobStatus.value')}</p></CardContent></Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow"><CardContent className="pt-0"><div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><GraduationCap className="w-8 h-8 text-purple-600" /></div><h3 className="mb-2 font-medium">{t('homepage.eligibility.education.title')}</h3><p className="text-purple-600 font-semibold">{t('homepage.eligibility.education.value')}</p></CardContent></Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow"><CardContent className="pt-0"><div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><IndianRupee className="w-8 h-8 text-orange-600" /></div><h3 className="mb-2 font-medium">{t('homepage.eligibility.familyIncome.title')}</h3><p className="text-orange-600 font-semibold text-sm">{t('homepage.eligibility.familyIncome.value')}</p></CardContent></Card>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-center mb-6 font-medium">{t('homepage.eligibility.benefitsTitle')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" /><div><p className="font-medium">{t('homepage.eligibility.benefits.0.title')}</p><p className="text-sm text-gray-600">{t('homepage.eligibility.benefits.0.subtitle')}</p></div></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" /><div><p className="font-medium">{t('homepage.eligibility.benefits.1.title')}</p><p className="text-sm text-gray-600">{t('homepage.eligibility.benefits.1.subtitle')}</p></div></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" /><div><p className="font-medium">{t('homepage.eligibility.benefits.2.title')}</p><p className="text-sm text-gray-600">{t('homepage.eligibility.benefits.2.subtitle')}</p></div></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" /><div><p className="font-medium">{t('homepage.eligibility.benefits.3.title')}</p><p className="text-sm text-gray-600">{t('homepage.eligibility.benefits.3.subtitle')}</p></div></div>
              </div>
            </div>
          </Card>
        </div>
        <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <div className="text-center mb-8"><h2 className="text-2xl font-semibold">{t('homepage.impact.title')}</h2><p className="text-gray-600">{t('homepage.impact.subtitle')}</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2"><div className="text-green-600 font-bold text-3xl">{t('homepage.impact.opportunities')}</div><div className="text-gray-600">{t('homepage.impact.opportunitiesLabel')}</div><p className="text-sm text-gray-500">{t('homepage.impact.opportunitiesDesc')}</p></div>
            <div className="space-y-2"><div className="text-blue-600 font-bold text-3xl">{t('homepage.impact.students')}</div><div className="text-gray-600">{t('homepage.impact.studentsLabel')}</div><p className="text-sm text-gray-500">{t('homepage.impact.studentsDesc')}</p></div>
            <div className="space-y-2"><div className="text-purple-600 font-bold text-3xl">{t('homepage.impact.success')}</div><div className="text-gray-600">{t('homepage.impact.successLabel')}</div><p className="text-sm text-gray-500">{t('homepage.impact.successDesc')}</p></div>
          </div>
        </Card>
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
            <h2 className="text-2xl font-semibold mb-4">{t('homepage.cta.title')}</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">{t('homepage.cta.subtitle')}</p>
            <Button onClick={handleStartForm} size="lg" variant="soft" className="px-8 py-3">{t('homepage.cta.button')} <Sparkles className="w-5 h-5 ml-2" /></Button>
            <p className="text-white/70 mt-4 text-sm">{t('homepage.cta.note')}</p>
          </div>
        </div>
      </div>
      <Suspense fallback={<LoadingSpinner />}> <SuccessModal isOpen={modalState.isOpen} onClose={handleCloseModal} type={modalState.type} data={modalState.data} /> </Suspense>
      <BottomNav currentView={currentView} onNavigate={handleNavigate} />
    </div>;
}

export default Page;
