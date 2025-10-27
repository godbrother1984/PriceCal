// path: client/src/components/PriceCalculator.tsx
// version: 3.6 (Fix Currency Display - All prices in THB, convert to requested currency)
// last-modified: 24 ตุลาคม 2568 14:00

import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface MaterialCostDetail {
  rawMaterialId: string;
  rawMaterialName: string;
  bomQuantity: number;
  bomUnit: string;
  unitPrice: number; // ราคาต่อหน่วยของ RM (USD/KG)
  costPerUnit: number; // ต้นทุน RM ต่อ 1 unit Product
  totalCost: number; // ต้นทุน RM รวมทั้งหมด
  lmePrice?: number;
  rmFabCost?: number;
  standardPrice?: number;
  priceSource: 'LME' | 'Standard' | 'None';
}

interface AppliedRule {
  ruleId: string;
  ruleName: string;
  priority: number;
  type: 'override' | 'adjustment' | 'action';
  field?: string;
  adjustments?: Record<string, any>;
  actions?: Record<string, any>;
}

interface CalculationResult {
  productId: string;
  productName: string;
  quantity: number;
  customerGroupId?: string; // ✅ เพิ่ม Customer Group Info
  customerGroupName?: string;
  isUsingDefaultGroup?: boolean; // ✅ แสดงว่าใช้ Default Customer Group หรือไม่
  appliedRules?: AppliedRule[]; // ✅ Hybrid System - Rules ที่ถูก apply
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
  customerId?: string; // ✅ เพิ่ม customerId เพื่อดึง customerGroupId จาก Customer
  customerGroupId?: string; // Optional - ถ้าไม่มี จะใช้จาก Customer
  currency?: string; // ✅ สกุลเงินที่ลูกค้าต้องการ (THB, USD, EUR, etc.)
  readonly?: boolean; // ✅ ถ้า true จะไม่สามารถกดปุ่ม Calculate ได้
  savedResult?: CalculationResult | null; // ✅ เพิ่ม prop สำหรับผลการคำนวณที่บันทึกไว้
  onCalculationComplete?: (result: CalculationResult) => void;
}

const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  productId,
  quantity,
  customerId,
  customerGroupId,
  currency = 'THB', // Default THB
  readonly = false, // Default false
  savedResult,
  onCalculationComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(savedResult || null);
  const [error, setError] = useState<string | null>(null);
  const [useHybridSystem, setUseHybridSystem] = useState(true); // ✅ Default ใช้ Hybrid System

  // ✅ Update result เมื่อ savedResult เปลี่ยน (กรณีโหลดจาก database)
  useEffect(() => {
    if (savedResult) {
      console.log('[PriceCalculator] Loaded saved result:', savedResult);

      // ✅ Normalize all numeric fields to ensure they are numbers, not strings
      const normalizedResult: CalculationResult = {
        ...savedResult,
        quantity: Number(savedResult.quantity) || 0,
        totalMaterialCost: Number(savedResult.totalMaterialCost) || 0,
        fabCost: Number(savedResult.fabCost) || 0,
        fabCostPerUnit: Number(savedResult.fabCostPerUnit) || 0,
        totalCost: Number(savedResult.totalCost) || 0,
        costPerUnit: Number(savedResult.costPerUnit) || 0,
        sellingFactor: Number(savedResult.sellingFactor) || 0,
        sellingPrice: Number(savedResult.sellingPrice) || 0,
        sellingPricePerUnit: Number(savedResult.sellingPricePerUnit) || 0,
        exchangeRate: Number(savedResult.exchangeRate) || 0,
        sellingPriceThb: Number(savedResult.sellingPriceThb) || 0,
        sellingPriceThbPerUnit: Number(savedResult.sellingPriceThbPerUnit) || 0,
        marginPercentage: Number(savedResult.marginPercentage) || 0,
        marginAmount: Number(savedResult.marginAmount) || 0,
        materialCosts: savedResult.materialCosts?.map(m => ({
          ...m,
          bomQuantity: Number(m.bomQuantity) || 0,
          unitPrice: Number(m.unitPrice) || 0,
          costPerUnit: Number(m.costPerUnit) || 0,
          totalCost: Number(m.totalCost) || 0,
          lmePrice: m.lmePrice ? Number(m.lmePrice) : undefined,
          rmFabCost: m.rmFabCost ? Number(m.rmFabCost) : undefined,
          standardPrice: m.standardPrice ? Number(m.standardPrice) : undefined,
        })) || [],
      };

      console.log('[PriceCalculator] Normalized result:', normalizedResult);
      setResult(normalizedResult);
    }
  }, [savedResult]);

  const calculatePrice = async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ เลือก endpoint ตาม useHybridSystem
      const endpoint = useHybridSystem
        ? '/api/price-calculation/calculate-hybrid'
        : '/api/price-calculation/calculate';

      const response = await api.post(endpoint, {
        productId,
        quantity,
        customerId, // ✅ ส่ง customerId ไปให้ Backend ดึง customerGroupId
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

  const formatNumber = (value: number | null | undefined, decimals: number = 4) => {
    if (value === null || value === undefined) {
      return '0.' + '0'.repeat(decimals);
    }
    return value.toFixed(decimals);
  };

  return (
    <div className="space-y-4">
      {/* Hybrid System Toggle */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useHybridSystem}
            onChange={(e) => setUseHybridSystem(e.target.checked)}
            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="text-sm font-medium text-gray-700">
            🎯 ใช้ Hybrid Formula System
          </span>
        </label>
        {useHybridSystem && (
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
            Base Formula + Custom Rules
          </span>
        )}
        {!useHybridSystem && (
          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            Legacy (Hardcoded)
          </span>
        )}
      </div>

      {/* Calculate Button */}
      <div>
        <button
          onClick={calculatePrice}
          disabled={loading || !productId || quantity <= 0 || readonly}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {readonly ? '🔒 ไม่สามารถคำนวณใหม่ได้ (อนุมัติแล้ว)' : (loading ? 'Calculating...' : '🧮 Calculate Price')}
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

            {/* Default Customer Group Warning */}
            {result.isUsingDefaultGroup && (
              <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-start gap-2">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    กำลังใช้ราคามาตรฐาน (Default Pricing)
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Customer ยังไม่ได้ถูก map กับ Customer Group - กรุณาไปตั้งค่าใน Master Data
                  </p>
                </div>
              </div>
            )}

            {/* Customer Group Badge */}
            {result.customerGroupName && (
              <div className={`mb-4 inline-flex items-center px-4 py-2 rounded-lg ${
                result.isUsingDefaultGroup
                  ? 'bg-yellow-100 border border-yellow-300'
                  : 'bg-blue-100 border border-blue-300'
              }`}>
                <span className={`text-sm font-medium ${
                  result.isUsingDefaultGroup ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  👥 Customer Group: <span className="font-bold">{result.customerGroupName}</span>
                </span>
                {result.customerGroupId && (
                  <span className={`ml-2 text-xs ${
                    result.isUsingDefaultGroup ? 'text-yellow-600' : 'text-blue-600'
                  }`}>({result.customerGroupId})</span>
                )}
              </div>
            )}

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
                <p className="text-sm text-gray-600">Total Cost (THB)</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(result.totalCost, 'THB')}</p>
                <p className="text-xs text-gray-500">({formatCurrency(result.costPerUnit, 'THB')} / unit)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Selling Price ({result.requestedCurrency || currency || 'THB'})
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    result.sellingPriceInRequestedCurrency || result.sellingPriceThb || 0,
                    result.requestedCurrency || currency || 'THB'
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  ({formatCurrency(
                    result.sellingPricePerUnitInRequestedCurrency || result.sellingPriceThbPerUnit || 0,
                    result.requestedCurrency || currency || 'THB'
                  )} / unit)
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Selling Price (THB - Base)</p>
                <p className="text-lg font-semibold text-green-700">{formatCurrency(result.sellingPrice, 'THB')}</p>
                <p className="text-xs text-gray-500">({formatCurrency(result.sellingPricePerUnit, 'THB')} / unit)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Margin</p>
                <p className="text-lg font-semibold text-purple-600">
                  {formatNumber(result.marginPercentage, 2)}% ({formatCurrency(result.marginAmount, 'THB')})
                </p>
              </div>
            </div>
          </div>

          {/* Material Costs Breakdown - Compact */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 border-b">
              <h4 className="text-sm font-bold text-gray-800">📦 Material Costs</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Material</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">Unit Price</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-600">Source</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.materialCosts?.map((material, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-900">
                        <div className="font-medium">{material.rawMaterialName}</div>
                        <div className="text-[10px] text-gray-500">{material.rawMaterialId}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700">
                        {formatNumber(material.bomQuantity, 2)} {material.bomUnit}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-gray-900">
                        {formatCurrency(material.unitPrice, 'THB')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                          material.priceSource === 'LME' ? 'bg-blue-100 text-blue-800' :
                          material.priceSource === 'Standard' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {material.priceSource}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-gray-900">
                        {formatCurrency(material.totalCost, 'THB')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-50 font-bold border-t-2 border-gray-300">
                    <td colSpan={4} className="px-3 py-2.5 text-right text-gray-800">
                      Total Material Cost (THB):
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-900">
                      {formatCurrency(result.totalMaterialCost, 'THB')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost Breakdown - Compact */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b">
              <h4 className="text-sm font-bold text-gray-800">💵 Cost Summary</h4>
            </div>
            <div className="p-4">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="py-2 text-gray-700">Material Costs (THB)</td>
                    <td className="py-2 text-right font-mono font-semibold text-gray-900">
                      {formatCurrency(result.totalMaterialCost, 'THB')}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-2 text-gray-700">
                      FAB Cost (THB)
                      <span className="ml-1 text-[10px] text-gray-500">
                        ({formatCurrency(result.fabCostPerUnit, 'THB')} × {result.quantity})
                      </span>
                    </td>
                    <td className="py-2 text-right font-mono font-semibold text-gray-900">
                      {formatCurrency(result.fabCost, 'THB')}
                    </td>
                  </tr>
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="py-2 font-bold text-blue-900">Total Cost (THB)</td>
                    <td className="py-2 text-right font-mono font-bold text-blue-900">
                      {formatCurrency(result.totalCost, 'THB')}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-2 text-gray-700">Selling Factor</td>
                    <td className="py-2 text-right font-mono font-semibold text-gray-900">
                      ×{formatNumber(result.sellingFactor, 4)}
                    </td>
                  </tr>
                  <tr className="bg-green-50 border-t-2 border-green-200">
                    <td className="py-2 font-bold text-green-900">Selling Price (THB)</td>
                    <td className="py-2 text-right font-mono font-bold text-green-900">
                      {formatCurrency(result.sellingPrice, 'THB')}
                    </td>
                  </tr>
                  {result.requestedCurrency && result.requestedCurrency !== 'THB' && (
                    <>
                      <tr className="hover:bg-gray-50">
                        <td className="py-2 text-gray-700">Exchange Rate (THB → {result.requestedCurrency})</td>
                        <td className="py-2 text-right font-mono font-semibold text-gray-900">
                          1 {result.requestedCurrency} = {formatNumber(result.exchangeRate, 4)} THB
                        </td>
                      </tr>
                      <tr className="bg-gradient-to-r from-emerald-100 to-green-100 border-t-2 border-green-300">
                        <td className="py-3 font-bold text-green-900 text-sm">Selling Price ({result.requestedCurrency})</td>
                        <td className="py-3 text-right font-mono font-bold text-green-900 text-sm">
                          {formatCurrency(result.sellingPriceInRequestedCurrency, result.requestedCurrency)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Master Data Values - Compact Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-bold text-gray-800">
                📋 Master Data Used (Snapshot)
                <span className="ml-2 text-[10px] px-2 py-1 bg-red-500 text-white rounded">
                  ← Applied Rules จะอยู่ด้านล่างนี้
                </span>
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Calculated at: {new Date(result.calculatedAt).toLocaleString('th-TH')}
              </p>
            </div>
            <div className="p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-600 font-semibold">Data Type</th>
                    <th className="text-right py-2 text-gray-600 font-semibold">Value</th>
                    <th className="text-center py-2 text-gray-600 font-semibold">Version</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="py-2 text-gray-700">Selling Factor</td>
                    <td className="py-2 text-right font-mono font-semibold text-gray-900">
                      ×{formatNumber(result.sellingFactor, 4)}
                    </td>
                    <td className="py-2 text-center">
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        v{result.masterDataVersions?.sellingFactorVersion || 'N/A'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-2 text-gray-700">Exchange Rate (USD→THB)</td>
                    <td className="py-2 text-right font-mono font-semibold text-gray-900">
                      {formatNumber(result.exchangeRate, 4)}
                    </td>
                    <td className="py-2 text-center">
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        v{result.masterDataVersions?.exchangeRateVersion || 'N/A'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-2 text-gray-700">FAB Cost (per unit)</td>
                    <td className="py-2 text-right font-mono font-semibold text-gray-900">
                      {formatCurrency(result.fabCostPerUnit, 'USD')}
                    </td>
                    <td className="py-2 text-center">
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        v{result.masterDataVersions?.fabCostVersion || 'N/A'}
                      </span>
                    </td>
                  </tr>
                  {result.masterDataVersions?.lmePriceVersion && (
                    <tr className="hover:bg-gray-50">
                      <td className="py-2 text-gray-700">LME Price (used)</td>
                      <td className="py-2 text-right font-mono font-semibold text-blue-900">
                        Used for materials
                      </td>
                      <td className="py-2 text-center">
                        <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          v{result.masterDataVersions?.lmePriceVersion}
                        </span>
                      </td>
                    </tr>
                  )}
                  {result.masterDataVersions?.standardPriceVersion && (
                    <tr className="hover:bg-gray-50">
                      <td className="py-2 text-gray-700">Standard Price (used)</td>
                      <td className="py-2 text-right font-mono font-semibold text-green-900">
                        Used for materials
                      </td>
                      <td className="py-2 text-center">
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                          v{result.masterDataVersions?.standardPriceVersion}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Applied Rules (Hybrid System) - Moved here before logs */}
          {useHybridSystem && result.appliedRules && result.appliedRules.length > 0 && (
            <div className="bg-white border border-purple-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-purple-200">
                <h4 className="text-sm font-bold text-purple-800">🎯 Applied Rules ({result.appliedRules.length})</h4>
                <p className="text-xs text-purple-600 mt-1">
                  Rules that modified the base formula
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {result.appliedRules?.map((rule, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors">
                      <span className="bg-purple-500 text-white px-2.5 py-1 rounded text-xs font-bold shadow-sm">
                        P{rule.priority}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-purple-900 text-sm">{rule.ruleName}</div>
                        <div className="text-xs text-purple-600 mt-1 flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded ${
                            rule.type === 'override' ? 'bg-blue-100 text-blue-800' :
                            rule.type === 'adjustment' ? 'bg-green-100 text-green-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {rule.type === 'override' ? '🔄 Override' : rule.type === 'adjustment' ? '⚙️ Adjustment' : '⚡ Action'}
                          </span>
                          {rule.field && (
                            <span className="text-purple-500">
                              Field: <span className="font-mono font-semibold">{rule.field}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceCalculator;
