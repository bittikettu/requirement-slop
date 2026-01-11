import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import RequirementDetail from './components/RequirementDetail';
import RequirementForm from './components/RequirementForm';
import ExportView from './components/ExportView';
import TraceabilityMatrix from './components/TraceabilityMatrix';
import ProjectList from './components/ProjectList';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <Routes>
          <Route path="/" element={<div className="main-content"><div style={{padding:'2rem', color:'#666'}}>Select a requirement to view details.</div></div>} />
          <Route path="/requirements/new" element={<RequirementForm />} />
          <Route path="/requirements/:id" element={<RequirementDetail />} />
          <Route path="/export" element={<ExportView />} />
          <Route path="/traceability" element={<TraceabilityMatrix />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
