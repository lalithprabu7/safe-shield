import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastProvider } from './components/common/Toast';
import DashboardLayout from './components/layout/DashboardLayout';
import Home from './pages/Home';
import ScamCallClassifier from './pages/ScamCallClassifier';
import VoiceDeepfakeDetector from './pages/VoiceDeepfakeDetector';
import CitizenFraudShield from './pages/CitizenFraudShield';
import CounterfeitScanner from './pages/CounterfeitScanner';
import FraudNetworkGraph from './pages/FraudNetworkGraph';
import DemoMode from './pages/DemoMode';
import MultiLanguageAdvisory from './pages/MultiLanguageAdvisory';
import EvidenceReport from './pages/EvidenceReport';
import FalsePositiveDashboard from './pages/FalsePositiveDashboard';
import GeospatialHeatmap from './pages/GeospatialHeatmap';
import Login from './pages/Login';

// Protect routes requiring authentication
function ProtectedRoute() {
  const isAuth = localStorage.getItem('isAuthenticated') === 'true';
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="login" element={<Login />} />

            {/* Protected dashboard routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Home />} />
                <Route path="scam-classifier" element={<ScamCallClassifier />} />
                <Route path="voice-detector" element={<VoiceDeepfakeDetector />} />
                <Route path="fraud-shield" element={<CitizenFraudShield />} />
                <Route path="counterfeit-scanner" element={<CounterfeitScanner />} />
                <Route path="fraud-network" element={<FraudNetworkGraph />} />
                <Route path="demo-mode" element={<DemoMode />} />
                <Route path="multi-language" element={<MultiLanguageAdvisory />} />
                <Route path="evidence-report" element={<EvidenceReport />} />
                <Route path="false-positive" element={<FalsePositiveDashboard />} />
                <Route path="heatmap" element={<GeospatialHeatmap />} />
              </Route>
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
