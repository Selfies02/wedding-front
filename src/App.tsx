import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Gallery from './components/Gallery/Gallery';
import Videos from './components/Videos/Videos';
import Login from './login/Login';
import Home from './components/Home/Home';
import { ModalContainer, modalRef } from './components/Toast/ConfirmationModal';
import { ToastContainer, toastRef } from './components/Toast/Toast';
import { AuthProvider } from './services/AuthContext';

function App() {
  return (
    <>
      {/* 🔥 Ahora el ToastContainer está afuera del Router y del AuthProvider */}
      <ToastContainer ref={toastRef} position="top-right" />

      <AuthProvider>
        <Router>
          <Header />
          <div className="content-container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/login" element={<Login />} />
              <Route path="/video" element={<Videos />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
        <ModalContainer ref={modalRef} />
      </AuthProvider>
    </>
  );
}

export default App;
