// path: client/src/pages/SetupWizard.tsx
// version: 2.1 (Props Fix and Error Correction)
// last-modified: 31 สิงหาคม 2568

import React, { useState } from 'react';

interface SetupWizardProps {
  onSetupComplete: () => void;
}

interface FormData {
  companyName: string;
  adminUsername: string;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    adminUsername: 'admin'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user types
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.companyName.trim() || !formData.adminUsername.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/setup/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Setup failed');
      }

      const result = await response.json();
      console.log('[Setup] Installation successful:', result);
      
      setStep(3); // Go to success step
      
      // Delay before completing setup to show success message
      setTimeout(() => {
        onSetupComplete();
      }, 2000);

    } catch (err: any) {
      console.error('[Setup] Installation failed:', err);
      setError(err.message || 'Installation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center">
            {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  num <= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {num === 3 && step === 3 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : num}
                </div>
                {num < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    num < step ? 'bg-blue-600' : 'bg-slate-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">Welcome to FG Pricing System</h2>
            <p className="text-slate-600 mb-6">
              This setup wizard will help you configure the system for first-time use. 
              The process takes just a few minutes.
            </p>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <svg className="h-5 w-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-800">Company Information Setup</span>
              </div>
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <svg className="h-5 w-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm text-slate-600">Admin Account Setup</span>
              </div>
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <svg className="h-5 w-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-600">Complete Installation</span>
              </div>
            </div>
            <button 
              onClick={handleNext} 
              className="w-full bg-blue-600 text-white p-3 rounded-lg mt-6 hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">System Configuration</h2>
            <p className="text-slate-600 mb-6">Please provide the basic information to set up your system.</p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your Company Co., Ltd."
                  required
                />
              </div>
              <div>
                <label htmlFor="adminUsername" className="block text-sm font-medium text-slate-700 mb-1">
                  Initial Admin Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="adminUsername"
                  name="adminUsername"
                  type="text"
                  value={formData.adminUsername}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="admin"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Default password will be 'admin' (can be changed later)</p>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button 
                onClick={handleBack} 
                className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Back
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 font-medium flex items-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Installing...
                  </>
                ) : (
                  'Finish Installation'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-700">Setup Complete!</h2>
            <p className="text-slate-600 mb-4">Your FG Pricing System is now ready to use.</p>
            <div className="text-sm text-slate-500">
              <p>Company: <span className="font-medium text-slate-700">{formData.companyName}</span></p>
              <p>Admin User: <span className="font-medium text-slate-700">{formData.adminUsername}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;