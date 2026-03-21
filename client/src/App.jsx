import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Levels from './pages/Levels';
import LevelDetail from './pages/LevelDetail';
import TypingExercise from './pages/TypingExercise';
import OJProblem from './pages/OJProblem';
import Rankings from './pages/Rankings';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (role && user?.role !== role && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="levels" element={<Levels />} />
          <Route path="levels/:id" element={<LevelDetail />} />
          <Route path="typing/:id" element={<TypingExercise />} />
          <Route path="oj/:id" element={<OJProblem />} />
          <Route path="rankings" element={<Rankings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin" element={
            <ProtectedRoute role="teacher">
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
          },
        }}
      />
    </BrowserRouter>
  );
};

export default App;
