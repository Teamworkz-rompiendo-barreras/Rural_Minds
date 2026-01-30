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
import MunicipalityDashboard from './pages/MunicipalityDashboard';
import EnterpriseDashboard from './pages/EnterpriseDashboard';
import CreateProject from './pages/CreateProject';
import ProjectDetail from './pages/ProjectDetail';
import Chat from './pages/Chat';
import Contact from './pages/Contact';

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
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<TalentProfileWizard />} />

        {/* Dashboards by Profile */}
        <Route path="/talent-dashboard" element={<TalentDashboard />} />
        <Route path="/municipality-dashboard" element={<MunicipalityDashboard />} />
        <Route path="/enterprise-dashboard" element={<EnterpriseDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} /> {/* Superadmin */}
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/chat/:applicationId" element={<Chat />} />

        <Route path="/dashboard" element={<MainDashboard />} /> {/* Legacy/Generic */}

        <Route path="/onboarding" element={<CompanyOnboarding />} />
        <Route path="/org-settings" element={<OrganizationSettings />} />
        <Route path="/learning" element={<LearningCenter />} />
        <Route path="/reports" element={<ReportsDashboard />} />
        <Route path="/subscription" element={<SubscriptionSettings />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/sensory-profile" element={<SensoryProfile />} />
        <Route path="/solutions" element={<SolutionsCatalog />} />
        <Route path="/my-adjustments" element={<MyAdjustments />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
