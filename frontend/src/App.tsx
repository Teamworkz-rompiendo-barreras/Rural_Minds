import { Routes, Route } from 'react-router-dom';
import ChallengeWizard from './components/ChallengeWizard';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import TalentProfileWizard from './pages/TalentProfileWizard';
import TalentDashboard from './pages/TalentDashboard';
import SensoryProfile from './pages/SensoryProfile';
import SolutionsCatalog from './pages/SolutionsCatalog';
import MyAdjustments from './pages/MyAdjustments';
import AdminDashboard from './pages/AdminDashboard';

import LandingPage from './pages/LandingPage';
import MainDashboard from './pages/MainDashboard';
import OrganizationSettings from './pages/OrganizationSettings';
import CompanyOnboarding from './pages/CompanyOnboarding';
import SubscriptionSettings from './pages/SubscriptionSettings';
import LearningCenter from './pages/LearningCenter';
import ReportsDashboard from './pages/ReportsDashboard';
import {
  UserSettings, NotFound
} from './pages/ScaffoldedPages';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<ChallengeWizard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<TalentProfileWizard />} />
        <Route path="/talent-dashboard" element={<TalentDashboard />} />
        <Route path="/dashboard" element={<MainDashboard />} />
        <Route path="/onboarding" element={<CompanyOnboarding />} />
        <Route path="/org-settings" element={<OrganizationSettings />} />
        <Route path="/learning" element={<LearningCenter />} />
        <Route path="/reports" element={<ReportsDashboard />} />
        <Route path="/subscription" element={<SubscriptionSettings />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/sensory-profile" element={<SensoryProfile />} />
        <Route path="/solutions" element={<SolutionsCatalog />} />
        <Route path="/my-adjustments" element={<MyAdjustments />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
