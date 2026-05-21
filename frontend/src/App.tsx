import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

// Lazy-load de todas las páginas — solo se descargan cuando el usuario las visita
const LandingPage             = lazy(() => import('./pages/LandingPage'));
const Login                   = lazy(() => import('./pages/Login'));
const Register                = lazy(() => import('./pages/Register'));
const ForgotPassword          = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword           = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail             = lazy(() => import('./pages/VerifyEmail'));
const Contact                 = lazy(() => import('./pages/Contact'));

const TalentProfileWizard     = lazy(() => import('./pages/TalentProfileWizard'));
const TalentDashboard         = lazy(() => import('./pages/TalentDashboard'));
const SensoryProfile          = lazy(() => import('./pages/SensoryProfile'));
const SensoryOnboardingWizard = lazy(() => import('./pages/SensoryOnboardingWizard'));
const SensoryVerificationSheet = lazy(() => import('./pages/SensoryVerificationSheet'));
const MyAdjustments           = lazy(() => import('./pages/MyAdjustments'));
const SolutionsCatalog        = lazy(() => import('./pages/SolutionsCatalog'));
const OpportunityExplorer     = lazy(() => import('./pages/OpportunityExplorer'));
const CaminoExcelencia        = lazy(() => import('./pages/CaminoExcelencia'));

const AdminDashboard          = lazy(() => import('./pages/AdminDashboard'));
const SuperAdminConfig        = lazy(() => import('./pages/SuperAdminConfig'));
const SuperadminMatchesDashboard = lazy(() => import('./pages/SuperadminMatchesDashboard'));

const MunicipalityDashboard   = lazy(() => import('./pages/MunicipalityDashboard'));
const MunicipalityProfile     = lazy(() => import('./pages/MunicipalityProfile'));
const RegisterMunicipality    = lazy(() => import('./pages/RegisterMunicipality'));
const MunicipalityOnboarding  = lazy(() => import('./pages/MunicipalityOnboarding'));
const MunicipalitySuccess     = lazy(() => import('./pages/MunicipalitySuccess'));

const EnterpriseDashboard     = lazy(() => import('./pages/EnterpriseDashboard'));
const CompanyOnboarding       = lazy(() => import('./pages/CompanyOnboarding'));
const OrganizationSettings    = lazy(() => import('./pages/OrganizationSettings'));
const SubscriptionSettings    = lazy(() => import('./pages/SubscriptionSettings'));

const MainDashboard           = lazy(() => import('./pages/MainDashboard'));
const CreateProject           = lazy(() => import('./pages/CreateProject'));
const ProjectDetail           = lazy(() => import('./pages/ProjectDetail'));
const Chat                    = lazy(() => import('./pages/Chat'));
const LearningCenter          = lazy(() => import('./pages/LearningCenter'));
const ReportsDashboard        = lazy(() => import('./pages/ReportsDashboard'));
const ChallengeWizard         = lazy(() => import('./components/ChallengeWizard'));

// Named exports de ScaffoldedPages
const UserSettings = lazy(() =>
  import('./pages/ScaffoldedPages').then(m => ({ default: m.UserSettings }))
);
const NotFound = lazy(() =>
  import('./pages/ScaffoldedPages').then(m => ({ default: m.NotFound }))
);

function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<ChallengeWizard />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/company" element={<Register />} />
          <Route path="/register-municipality" element={<RegisterMunicipality />} />
          <Route path="/municipality-onboarding" element={<MunicipalityOnboarding />} />
          <Route path="/municipality-success" element={<MunicipalitySuccess />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<TalentProfileWizard />} />
          <Route path="/sensory-wizard" element={<SensoryOnboardingWizard />} />

          <Route path="/talent-dashboard" element={<TalentDashboard />} />
          <Route path="/municipality-dashboard" element={<MunicipalityDashboard />} />
          <Route path="/enterprise-dashboard" element={<EnterpriseDashboard />} />
          <Route path="/municipality/:id" element={<MunicipalityProfile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/config" element={<SuperAdminConfig />} />
          <Route path="/admin/matches" element={<SuperadminMatchesDashboard />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/chat/:applicationId" element={<Chat />} />

          <Route path="/dashboard" element={<MainDashboard />} />
          <Route path="/onboarding" element={<CompanyOnboarding />} />
          <Route path="/camino-excelencia" element={<CaminoExcelencia />} />
          <Route path="/verify-sensory/:applicationId" element={<SensoryVerificationSheet />} />
          <Route path="/org-settings" element={<OrganizationSettings />} />
          <Route path="/learning" element={<LearningCenter />} />
          <Route path="/reports" element={<ReportsDashboard />} />
          <Route path="/subscription" element={<SubscriptionSettings />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/sensory-profile" element={<SensoryProfile />} />
          <Route path="/solutions" element={<SolutionsCatalog />} />
          <Route path="/my-adjustments" element={<MyAdjustments />} />
          <Route path="/explorer" element={<OpportunityExplorer />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
