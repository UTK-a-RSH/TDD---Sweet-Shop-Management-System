import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LoginForm } from './features/auth/components/LoginForm';
import { RegisterForm } from './features/auth/components/RegisterForm';
import { ToastProvider } from './context/ToastContext';

function App() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mb-6 flex justify-center space-x-4">
          <Link
            to="/login"
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-200'
              }`}
          >
            Login
          </Link>
          <Link
            to="/register"
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-200'
              }`}
          >
            Register
          </Link>
        </div>

        <Routes>
          <Route path="/login" element={<LoginForm onSubmit={(data) => console.log('Login:', data)} />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </ToastProvider>
  );
}

export default App;
