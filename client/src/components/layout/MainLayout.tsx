import React, { useState } from 'react';
import PriceRequestList from '../../pages/PriceRequestList';
import CreateRequest from '../../pages/CreateRequest';
import MasterData from '../../pages/MasterData';

type Page = 'dashboard' | 'requests' | 'create-request' | 'master-data' | 'reports';

const MainLayout: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('requests');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);

  const navigateTo = (page: Page) => {
    setActivePage(page);
    if (page === 'create-request') {
      setEditingRequestId(null);
    }
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleEditRequest = (requestId: string) => {
    setEditingRequestId(requestId);
    setActivePage('create-request');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'requests':
        return <PriceRequestList onNavigate={navigateTo} onEdit={handleEditRequest} />;
      case 'create-request':
        return <CreateRequest 
                  onCancel={() => navigateTo('requests')} 
                  requestId={editingRequestId}
               />;
      case 'master-data':
        return <MasterData />;
      case 'dashboard':
        return <div><h1 className="text-3xl font-bold">Dashboard</h1></div>;
      default:
        return <PriceRequestList onNavigate={navigateTo} onEdit={handleEditRequest} />;
    }
  };

  return (
    <div className="relative flex min-h-screen bg-slate-50">
      {/* Sidebar Overlay (for mobile) */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col transform lg:translate-x-0 z-30 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-200 flex-shrink-0">
            <span className="text-xl font-bold text-slate-800">FG Pricing</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <a href="#" onClick={() => navigateTo('dashboard')} className={`flex items-center px-4 py-2 rounded-lg ${activePage === 'dashboard' ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
            Dashboard
          </a>
          <a href="#" onClick={() => navigateTo('requests')} className={`flex items-center px-4 py-2 rounded-lg ${activePage === 'requests' || activePage === 'create-request' ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
            Price Requests
          </a>
          <a href="#" onClick={() => navigateTo('master-data')} className={`flex items-center px-4 py-2 rounded-lg ${activePage === 'master-data' ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
            Master Data
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
         {/* Mobile Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 z-10 lg:hidden">
            <div className="h-16 flex items-center justify-between px-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-600 hover:text-slate-900">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                </button>
                <div className="text-lg font-bold text-slate-800">FG Pricing</div>
                <div className="w-6"></div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-8">
              {renderPage()}
            </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
