// path: client/src/components/PriceCalculator.tsx
// version: 2.0 (Use Centralized API with JWT Authentication)
// last-modified: 14 ตุลาคม 2568

import React, { useState } from 'react';
import api from '../services/api';

interface MaterialCostDetail {
  rawMaterialId: string;
  rawMaterialName: string;
  bomQuantity: number;
  bomUnit: string;
  unitPrice: number;
  totalCost: number;
  lmePrice?: number;
  standardPrice?: number;
  priceSource: 'LME' | 'Standard' | 'None';
}

interface CalculationResult {
  productId: string;
  productName: string;
  quantity: number;
  materialCosts: MaterialCostDetail[];
  totalMaterialCost: number;
  fabCost: number;
  fabCostPerUnit: number;
  totalCost: number;
  costPerUnit: number;
  sellingFactor: number;
  sellingPrice: number;
  sellingPricePerUnit: number;
  exchangeRate: number;
  sellingPriceThb: number;
  sellingPriceThbPerUnit: number;
  marginPercentage: number;
  marginAmount: number;
  masterDataVersions: {
    standardPriceVersion?: number;
    exchangeRateVersion?: number;
    lmePriceVersion?: number;
    fabCostVersion?: number;
    sellingFactorVersion?: number;
  };
  calculatedAt: string;
}

interface PriceCalculatorProps {
  productId: string;
  quantity: number;
  customerGroupId?: string;
  onCalculationComplete?: (result: CalculationResult) => void;
}

const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  productId,
  quantity,
  customerGroupId,
  onCalculationComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/price-calculation/calculate', {
        productId,
        quantity,
        customerGroupId,
      });

      const data = response.data;

      if (data.success) {
        setResult(data.data);
        if (onCalculationComplete) {
          onCalculationComplete(data.data);
        }
      } else {
        setError(data.message || 'Failed to calculate price');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while calculating price');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (value: number, decimals: number = 4) => {
    return value.toFixed(decimals);
  };

  return (
    <div className="space-y-4">
      {/* Calculate Button */}
      <div>
        <button
          onClick={calculatePrice}
          disabled={loading || !productId || quantity <= 0}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculating...' : '🧮 Calculate Price'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Calculation Result */}
      {result && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Price Calculation Summary</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Product</p>
                <p className="text-lg font-semibold text-gray-800">{result.productName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quantity</p>
                <p className="text-lg font-semibold text-gray-800">{result.quantity} units</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(result.totalCost, 'USD')}</p>
                <p className="text-xs text-gray-500">({formatCurrency(result.costPerUnit, 'USD')} / unit)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Selling Price (THB)</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(result.sellingPriceThb, 'THB')}</p>
                <p className="text-xs text-gray-500">({formatCurrency(result.sellingPriceThbPerUnit, 'THB')} / unit)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Selling Price (USD)</p>
                <p className="text-lg font-semibold text-green-700">{formatCurrency(result.sellingPrice, 'USD')}</p>
                <p className="text-xs text-gray-500">({formatCurrency(result.sellingPricePerUnit, 'USD')} / unit)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Margin</p>
                <p className="text-lg font-semibold text-purple-600">
                  {formatNumber(result.marginPercentage, 2)}% ({formatCurrency(result.marginAmount, 'USD')})
                </p>
              </div>
            </div>
          </div>

          {/* Material Costs Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">📦 Material Costs Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Raw Material
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BOQ Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.materialCosts.map((material, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {material.rawMaterialName}
                        <span className="text-xs text-gray-500 ml-2">({material.rawMaterialId})</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatNumber(material.bomQuantity, 4)} {material.bomUnit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(material.unitPrice, 'USD')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            material.priceSource === 'LME'
                              ? 'bg-blue-100 text-blue-800'
                              : material.priceSource === 'Standard'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {material.priceSource}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(material.totalCost, 'USD')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={4} className="px-4 py-3 text-sm text-gray-900 text-right">
                      Total Material Cost:
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(result.totalMaterialCost, 'USD')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">💵 Cost Breakdown</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Material Costs</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(result.totalMaterialCost, 'USD')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">
                  FAB Cost ({formatCurrency(result.fabCostPerUnit, 'USD')} × {result.quantity})
                </span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(result.fabCost, 'USD')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b-2 border-gray-400">
                <span className="text-base font-semibold text-gray-800">Total Cost</span>
                <span className="text-base font-bold text-gray-900">{formatCurrency(result.totalCost, 'USD')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Selling Factor</span>
                <span className="text-sm font-semibold text-gray-900">×{formatNumber(result.sellingFactor, 4)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b-2 border-gray-400">
                <span className="text-base font-semibold text-gray-800">Selling Price (USD)</span>
                <span className="text-base font-bold text-green-700">{formatCurrency(result.sellingPrice, 'USD')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Exchange Rate (USD → THB)</span>
                <span className="text-sm font-semibold text-gray-900">{formatNumber(result.exchangeRate, 6)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3">
                <span className="text-lg font-bold text-green-800">Selling Price (THB)</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(result.sellingPriceThb, 'THB')}
                </span>
              </div>
            </div>
          </div>

          {/* Master Data Versions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-gray-700 mb-2">📋 Master Data Versions (Snapshot)</h4>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {result.masterDataVersions.standardPriceVersion && (
                <div>
                  <span className="text-gray-600">Standard Price:</span>
                  <span className="ml-1 font-semibold text-gray-800">v{result.masterDataVersions.standardPriceVersion}</span>
                </div>
              )}
              {result.masterDataVersions.lmePriceVersion && (
                <div>
                  <span className="text-gray-600">LME Price:</span>
                  <span className="ml-1 font-semibold text-gray-800">v{result.masterDataVersions.lmePriceVersion}</span>
                </div>
              )}
              {result.masterDataVersions.fabCostVersion && (
                <div>
                  <span className="text-gray-600">FAB Cost:</span>
                  <span className="ml-1 font-semibold text-gray-800">v{result.masterDataVersions.fabCostVersion}</span>
                </div>
              )}
              {result.masterDataVersions.sellingFactorVersion && (
                <div>
                  <span className="text-gray-600">Selling Factor:</span>
                  <span className="ml-1 font-semibold text-gray-800">v{result.masterDataVersions.sellingFactorVersion}</span>
                </div>
              )}
              {result.masterDataVersions.exchangeRateVersion && (
                <div>
                  <span className="text-gray-600">Exchange Rate:</span>
                  <span className="ml-1 font-semibold text-gray-800">v{result.masterDataVersions.exchangeRateVersion}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Calculated at: {new Date(result.calculatedAt).toLocaleString('th-TH')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceCalculator;
