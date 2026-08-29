import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground font-sans">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-background relative animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default App;
