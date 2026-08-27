import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
        <Header />
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-slate-950">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;
