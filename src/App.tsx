import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import DialogTreePage from '@/pages/DialogTreePage';
import DiffPage from '@/pages/DiffPage';
import ReviewPage from '@/pages/ReviewPage';

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<DialogTreePage />} />
          <Route path="/diff" element={<DiffPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
