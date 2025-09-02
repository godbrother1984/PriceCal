// path: client/src/pages/PricingView.tsx
// version: 1.0 (Master Data Display & Edit)
// last-modified: 1 กันยายน 2568

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- API Configuration ---
const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => {
    if (response.data?.success && response.data?.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// --- Types ---
interface PricingViewProps {
  requestId: string;
  onBack: () => void;
}

interface PriceRequest {
  id: string;
  customerName: string;
  productName: string;
  status: string;
  customerType: 'existing' | 'new';
  productType: 'existing' | 'new';
  formData: any;
  boqItems: any[];
  calculationResult?: any;
}

interface MasterDataItem {
  id: string;
  name: string;
  [key: string]: any;
}

interface PricingData {
  customerGroup: MasterDataItem | null;
  fabCost: MasterDataItem | null;
  standardPrices: MasterDataItem[];
  sellingFactors: MasterDataItem[];
  lmePrices: MasterDataItem[];
  exchangeRates: MasterDataItem[];
}

// --- Components ---
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-slate-600">Loading...</span>
  </div>
);

const EditableValue: React.FC<{
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number';
  unit?: string;
}> = ({ label, value, onChange, type = 'text', unit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value?.toString() || '');

  const handleSave = () => {
    const newValue = type === 'number' ? parseFloat(tempValue) : tempValue;
    onChange(newValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value?.toString() || '');
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <span className="text-sm font-medium text-slate-700">{label}:</span>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="px-2 py-1 border border-slate-300 rounded text-sm w-24"
            autoFocus
          />
          {unit && <span className="text-xs text-slate-500">{unit}</span>}
          <button
            onClick={handleSave}
            className="text-green-600 hover:text-green-800"
            title="Save"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={handleCancel}
            className="text-red-600 hover:text-red-800"
            title="Cancel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-900">
            {value} {unit}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

const MasterDataCard: React.FC<{
  title: string;
  data: any;
  onUpdate: (updatedData: any) => void;
}> = ({ title, data, onUpdate }) => {
  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...data, [field]: value };
    onUpdate(updatedData);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">{title}</h4>
      {data ? (
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => {
            if (key === 'id' || key.includes('Date') || key.includes('User')) return null;
            
            const isNumber = typeof value === 'number' || 
              (typeof value === 'string' && !isNaN(Number(value)) && value !== '');
            
            return (
              <EditableValue
                key={key}
                label={key}
                value={value as string | number}
                onChange={(newValue) => handleFieldChange(key, newValue)}
                type={isNumber ? 'number' : 'text'}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No data available</p>
      )}
    </div>
  );
};

// --- Main Component ---
const PricingView: React.FC<PricingViewProps> = ({ requestId, onBack }) => {
  const [request, setRequest] = useState<PriceRequest | null>(null);
  const [pricingData, setPricingData] = useState<PricingData>({
    customerGroup: null,
    fabCost: null,
    standardPrices: [],
    sellingFactors: [],
    lmePrices: [],
    exchangeRates: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calculationResult, setCalculationResult] = useState<any>(null);

  // Load request data
  useEffect(() => {
    const loadRequestData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/mock-data/requests/${requestId}`);
        const requestData = response.data;
        setRequest(requestData);

        // Load related master data
        await loadMasterData(requestData);
      } catch (err) {
        console.error('Failed to load request:', err);
        setError('Failed to load pricing data');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      loadRequestData();
    }
  }, [requestId]);

  const loadMasterData = async (requestData: PriceRequest) => {
    try {
      // Load customer group (for new customers, they should have default group)
      let customerGroupData = null;
      if (requestData.customerType === 'new') {
        // Find default group
        const groupsResponse = await api.get('/mock-data/customer-groups');
        customerGroupData = groupsResponse.data.find((g: any) => g.name === 'Default');
      }

      // Load fab cost, standard prices, selling factors, etc.
      const [fabCostRes, standardPricesRes, sellingFactorsRes, lmePricesRes, exchangeRatesRes] = await Promise.all([
        api.get('/mock-data/fab-costs'),
        api.get('/mock-data/standard-prices'),
        api.get('/mock-data/selling-factors'),
        api.get('/mock-data/lme-prices'),
        api.get('/mock-data/exchange-rates')
      ]);

      setPricingData({
        customerGroup: customerGroupData,
        fabCost: fabCostRes.data[0] || null, // Get first fab cost for demo
        standardPrices: standardPricesRes.data || [],
        sellingFactors: sellingFactorsRes.data || [],
        lmePrices: lmePricesRes.data || [],
        exchangeRates: exchangeRatesRes.data || []
      });

    } catch (err) {
      console.error('Failed to load master data:', err);
    }
  };

  const handleCalculatePrice = async () => {
    try {
      const calculationPayload = {
        requestId,
        customerGroup: pricingData.customerGroup,
        fabCost: pricingData.fabCost,
        standardPrices: pricingData.standardPrices,
        sellingFactors: pricingData.sellingFactors,
        lmePrices: pricingData.lmePrices,
        exchangeRates: pricingData.exchangeRates,
        boqItems: request?.boqItems || []
      };

      const response = await api.post('/pricing/calculate', calculationPayload);
      setCalculationResult(response.data.calculation);
    } catch (err) {
      console.error('Price calculation failed:', err);
      setError('Failed to calculate price');
    }
  };

  const updateMasterData = (category: keyof PricingData, updatedData: any) => {
    setPricingData(prev => ({
      ...prev,
      [category]: updatedData
    }));
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={onBack}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">Request not found</p>
        <button
          onClick={onBack}
          className="mt-2 text-blue-600 hover:text-blue-800 underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={onBack}
              className="text-slate-600 hover:text-slate-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-slate-900">
              Price Calculation - {request.id}
            </h1>
          </div>
          <p className="text-slate-600">
            Customer: <span className="font-semibold">{request.customerName}</span> | 
            Product: <span className="font-semibold">{request.productName}</span>
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleCalculatePrice}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Calculate Price
          </button>
        </div>
      </div>

      {/* Request Info */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Request Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-slate-600">Customer Type</label>
            <div className="flex items-center gap-2">
              <span className="font-medium">{request.customerType}</span>
              {request.customerType === 'new' && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">New</span>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">Product Type</label>
            <div className="flex items-center gap-2">
              <span className="font-medium">{request.productType}</span>
              {request.productType === 'new' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">New</span>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">Status</label>
            <p className="font-medium">{request.status}</p>
          </div>
          <div>
            <label className="text-sm text-slate-600">BOQ Items</label>
            <p className="font-medium">{request.boqItems?.length || 0} items</p>
          </div>
        </div>
      </div>

      {/* BOQ Items */}
      {request.boqItems && request.boqItems.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Bill of Quantities (BOQ)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left">Raw Material</th>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                </tr>
              </thead>
              <tbody>
                {request.boqItems.map((item: any, index: number) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2 font-medium">{item.rmName}</td>
                    <td className="px-4 py-2 text-slate-600">{item.rmId}</td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-slate-600">{item.rmUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Master Data Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Master Data Values</h3>
          <p className="text-sm text-slate-600">Click edit icons to modify values for calculation</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Customer Group */}
          <MasterDataCard
            title="Customer Group"
            data={pricingData.customerGroup}
            onUpdate={(data) => updateMasterData('customerGroup', data)}
          />

          {/* Fab Cost */}
          <MasterDataCard
            title="Fab Cost"
            data={pricingData.fabCost}
            onUpdate={(data) => updateMasterData('fabCost', data)}
          />

          {/* Standard Prices */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Standard Prices</h4>
            {pricingData.standardPrices.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pricingData.standardPrices.slice(0, 3).map((price: any, index) => (
                  <div key={index} className="p-2 bg-slate-50 rounded text-xs">
                    <div className="font-medium">{price.rmName}</div>
                    <div className="text-slate-600">{price.price} {price.currencyName}</div>
                  </div>
                ))}
                {pricingData.standardPrices.length > 3 && (
                  <div className="text-xs text-slate-500">
                    +{pricingData.standardPrices.length - 3} more items
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No standard prices available</p>
            )}
          </div>

          {/* Selling Factors */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Selling Factors</h4>
            {pricingData.sellingFactors.length > 0 ? (
              <div className="space-y-2">
                {pricingData.sellingFactors.slice(0, 3).map((factor: any, index) => (
                  <div key={index} className="p-2 bg-slate-50 rounded text-xs">
                    <div className="font-medium">{factor.patternName}</div>
                    <div className="text-slate-600">Factor: {factor.factor}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No selling factors available</p>
            )}
          </div>

          {/* LME Prices */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">LME Prices</h4>
            {pricingData.lmePrices.length > 0 ? (
              <div className="space-y-2">
                {pricingData.lmePrices.slice(0, 2).map((lme: any, index) => (
                  <div key={index} className="p-2 bg-slate-50 rounded text-xs">
                    <div className="font-medium">{lme.itemGroupName}</div>
                    <div className="text-slate-600">{lme.price} {lme.currencyName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No LME prices available</p>
            )}
          </div>

          {/* Exchange Rates */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Exchange Rates</h4>
            {pricingData.exchangeRates.length > 0 ? (
              <div className="space-y-2">
                {pricingData.exchangeRates.slice(0, 2).map((rate: any, index) => (
                  <div key={index} className="p-2 bg-slate-50 rounded text-xs">
                    <div className="font-medium">
                      {rate.sourceCurrencyName} → {rate.destinationCurrencyName}
                    </div>
                    <div className="text-slate-600">Rate: {rate.rate}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No exchange rates available</p>
            )}
          </div>
        </div>
      </div>

      {/* Calculation Result */}
      {calculationResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Price Calculation Result</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <label className="text-sm text-green-700">Base Price</label>
              <p className="text-xl font-bold text-green-900">{calculationResult.basePrice}</p>
            </div>
            <div className="text-center">
              <label className="text-sm text-green-700">Selling Factor</label>
              <p className="text-xl font-bold text-green-900">{calculationResult.sellingFactor}</p>
            </div>
            <div className="text-center">
              <label className="text-sm text-green-700">Currency</label>
              <p className="text-xl font-bold text-green-900">{calculationResult.currency}</p>
            </div>
            <div className="text-center">
              <label className="text-sm text-green-700">Final Price</label>
              <p className="text-2xl font-bold text-green-900">{calculationResult.finalPrice}</p>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Approve Price
            </button>
            <button className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50">
              Request Revision
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingView;