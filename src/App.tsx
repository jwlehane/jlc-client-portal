import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import ProjectDashboard from './pages/admin/ProjectDashboard';
import ProjectDetails from './pages/admin/ProjectDetails';
import ClientPortal from './pages/client/ClientPortal';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to admin for alpha */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Client Routes */}
        <Route path="/client/:projectId" element={<ClientPortal />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<ProjectDashboard />} />
          <Route path="upload" element={<div className="p-8 text-gray-500 italic">Multi-project upload helper coming soon.</div>} />
          <Route path="projects/:projectId" element={<ProjectDetails />} />
          <Route path="settings" element={<div className="p-8 text-gray-500 italic">Admin settings coming soon.</div>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<div className="p-20 text-center">404 - Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;