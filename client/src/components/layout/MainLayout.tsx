// path: client/src/components/layout/MainLayout.tsx
// version: 2.7 (Add PricingView Integration)
// last-modified: 1 กันยายน 2568

import React, { useState } from 'react';
import PriceRequestList from '../../pages/PriceRequestList';
import CreateRequest from '../../pages/CreateRequest';
import MasterData from '../../pages/MasterData';
import PricingView from '../../pages/PricingView';

type Page = 'dashboard' | 'requests' | 'create-request' | 'master-data' | 'pricing-view' | 'reports';

const MainLayout: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('requests');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [pricingRequestId, setPricingRequestId] = useState<string | null>(null);
  const [requestsVersion, setRequestsVersion] = useState(0);

  const navigateTo = (page: Page) => {
    setActivePage(page);
    if (page === 'create-request') {
      setEditingRequestId(null);
    }
    if (page === 'pricing-view') {
      // Don't clear pricingRequestId when navigating to pricing view
    }
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleEditRequest = (requestId: string) => {
    setEditingRequestId(requestId);
    setActivePage('create-request');
  };

  // New function to handle pricing view navigation
  const handleViewPricing = (requestId: string) => {
    setPricingRequestId(requestId);
    setActivePage('pricing-view');
  };

  const handleRequestSuccess = () => {
    setRequestsVersion(v => v + 1);
    navigateTo('requests');
  };

  const handleBackFromPricing = () => {
    setPricingRequestId(null);
    navigateTo('requests');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'requests':
        return (
          <PriceRequestList 
            onNavigate={(page) => navigateTo(page as Page)} 
            onEdit={handleEditRequest}
            onViewPricing={handleViewPricing}
            version={requestsVersion} 
          />
        );
      case 'create-request':
        return (
          <CreateRequest 
            onCancel={() => navigateTo('requests')} 
            onSuccess={handleRequestSuccess}
            requestId={editingRequestId}
          />
        );
      case 'pricing-view':
        return pricingRequestId ? (
          <PricingView
            requestId={pricingRequestId}
            onBack={handleBackFromPricing}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">No request selected for pricing</p>
            <button
              onClick={() => navigateTo('requests')}
              className="mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              Back to Requests
            </button>
          </div>
        );
      case 'master-data':
        return <MasterData key={Date.now()} />;
      default:
        return (
          <PriceRequestList 
            onNavigate={(page) => navigateTo(page as Page)} 
            onEdit={handleEditRequest}
            onViewPricing={handleViewPricing}
            version={requestsVersion} 
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* --- Sidebar --- */}
      <aside className={`fixed lg:relative z-20 h-full w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4">
          <h1 className="text-xl font-bold">FG Pricing</h1>
        </div>
        <nav className="p-4 space-y-2">
          <a 
            href="#" 
            onClick={() => navigateTo('requests')} 
            className={`flex items-center px-4 py-2 rounded-lg ${
              activePage === 'requests' || activePage === 'create-request' || activePage === 'pricing-view'
                ? 'bg-blue-100 text-blue-600 font-semibold' 
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Price Requests
          </a>
          <a 
            href="#" 
            onClick={() => navigateTo('master-data')} 
            className={`flex items-center px-4 py-2 rounded-lg ${
              activePage === 'master-data' 
                ? 'bg-blue-100 text-blue-600 font-semibold' 
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            Master Data
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 z-10 lg:hidden">
          <div className="h-16 flex items-center justify-between px-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-600 hover:text-slate-900">
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="text-lg font-semibold">
              {activePage === 'pricing-view' ? 'Price Calculation' : 'FG Pricing'}
            </div>
            <div></div>
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
      
      {/* Overlay for mobile */}
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-10 lg:hidden"></div>}
    </div>
  );
};

export default MainLayout;