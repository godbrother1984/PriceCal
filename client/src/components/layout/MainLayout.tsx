// path: client/src/components/layout/MainLayout.tsx
// version: 3.0 (Restructure Navigation - Add Settings & Profile)
// last-modified: 1 ตุลาคม 2568 12:00

import React, { useState } from 'react';
import PriceRequestList from '../../pages/PriceRequestList';
import CreateRequest from '../../pages/CreateRequest';
import MasterData from '../../pages/MasterData';
import PricingView from '../../pages/PricingView';
import Settings from '../../pages/Settings';
import UserProfile from '../../pages/UserProfile';

type Page = 'dashboard' | 'requests' | 'create-request' | 'master-data' | 'pricing-view' | 'settings' | 'profile' | 'reports';

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
      case 'settings':
        return <Settings />;
      case 'profile':
        return <UserProfile />;
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
        <nav className="p-4 space-y-1">
          {/* Main Navigation */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">
              Main
            </div>
            <a
              href="#"
              onClick={() => navigateTo('requests')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
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
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
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
          </div>

          {/* System Section */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2 mt-4">
              System
            </div>
            <a
              href="#"
              onClick={() => navigateTo('settings')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activePage === 'settings'
                  ? 'bg-blue-100 text-blue-600 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </div>

          {/* User Section - ชิดด้านล่าง */}
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <div className="border-t border-slate-200 pt-4">
              <a
                href="#"
                onClick={() => navigateTo('profile')}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  activePage === 'profile'
                    ? 'bg-blue-100 text-blue-600 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div className="text-sm font-medium">Admin User</div>
                  <div className="text-xs text-slate-500">admin@company.com</div>
                </div>
              </a>
            </div>
          </div>
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