import React, { useState } from 'react';

const SetupWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    adminUsername: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.adminUsername) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/setup/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      await response.json();
      handleNext(); // Go to the final step on success
    } catch (err) {
      setError('การติดตั้งล้มเหลว กรุณาตรวจสอบ Backend Server');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">Installation Wizard</h1>
        <p className="text-slate-500 text-center mb-6">Step {step} of 3</p>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Welcome!</h2>
            <p className="text-slate-600">This wizard will guide you through the initial setup of the FG Pricing System.</p>
            <button 
              onClick={handleNext} 
              className="w-full bg-blue-600 text-white p-2 rounded mt-6 hover:bg-blue-700 transition-colors"
            >
              Start Setup
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">System Settings</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">Company Name</label>
                <input 
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded mt-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your Company Co., Ltd."
                />
              </div>
              <div>
                <label htmlFor="adminUsername" className="block text-sm font-medium text-slate-700">Initial Admin Username</label>
                <input
                  id="adminUsername"
                  name="adminUsername"
                  type="text"
                  value={formData.adminUsername}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded mt-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin"
                />
              </div>
            </div>
            
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

            <div className="flex justify-between mt-6">
                <button 
                  onClick={handleBack} 
                  className="bg-slate-200 text-slate-800 px-4 py-2 rounded hover:bg-slate-300 transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-slate-400"
                >
                  {isLoading ? 'Installing...' : 'Finish Installation'}
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
                <p className="text-slate-600">You can now proceed to the login page.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-slate-600 text-white p-2 rounded mt-6 hover:bg-slate-700 transition-colors"
                >
                  Go to Login
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
