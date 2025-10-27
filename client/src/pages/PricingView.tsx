// path: client/src/pages/PricingView.tsx
// version: 3.9 (Add Multi-Currency Support - Display Price in Requested Currency)
// last-modified: 24 ตุลาคม 2568 13:30

import React, { useState, useEffect } from 'react';
import api from '../services/api'; // ✅ ใช้ centralized api instance ที่มี JWT interceptor
import eventBus, { EVENTS } from '../services/eventBus';
import ApprovalWorkflow from '../components/ApprovalWorkflow';
import ActivityLogs from '../components/ActivityLogs';
import PriceCalculator from '../components/PriceCalculator'; // ✅ เพิ่ม PriceCalculator

// --- Types ---
interface PricingViewProps {
  requestId: string;
  onBack: () => void;
}

interface SpecialRequest {
  id: number;
  description: string;
  category: string;
  estimatedCost?: number;
}

interface PriceRequest {
  id: string;
  customerName: string;
  productName: string;
  status: 'Draft' | 'Pending' | 'Calculating' | 'Pending Approval' | 'Approved' | 'Rejected';
  customerType: 'existing' | 'new';
  productType: 'existing' | 'new';
  formData: any;
  boqItems: any[];
  revisionReason?: string;
  calculationResult?: any;
  specialRequests?: SpecialRequest[];
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
  const [rawMaterials, setRawMaterials] = useState<MasterDataItem[]>([]);
  const [isEditingBOQ, setIsEditingBOQ] = useState(false);
  const [newBoqItem, setNewBoqItem] = useState({ rmId: '', quantity: 0 });
  const [editableBoqItems, setEditableBoqItems] = useState<any[]>([]);

  // Load request data function
  const loadRequestData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/data/requests/${requestId}`);
      const requestData = response.data;

      // ถ้า status เป็น Submitted (เพิ่งส่งมา) ให้เปลี่ยนเป็น Calculating
      if (requestData.status === 'Submitted') {
        const updatePayload = {
          ...requestData,
          status: 'Calculating'
        };
        await api.put(`/api/data/requests/${requestId}`, updatePayload);
        requestData.status = 'Calculating'; // Update local state
        console.log('[PricingView] Changed status from Submitted to Calculating');
      }

      setRequest(requestData);

      // โหลดผลการคำนวณที่บันทึกไว้ (ถ้ามี)
      if (requestData.calculationResult) {
        setCalculationResult(requestData.calculationResult);
        console.log('[PricingView] Loaded saved calculation result:', requestData.calculationResult);
      }

      // Initialize editable BOQ items
      setEditableBoqItems([...(requestData.boqItems || [])]);

      // Load related master data
      await loadMasterData(requestData);
    } catch (err) {
      console.error('Failed to load request:', err);
      setError('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  // Load request data on mount
  useEffect(() => {
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
        const groupsResponse = await api.get('/api/data/customer-groups');
        customerGroupData = groupsResponse.data.find((g: any) => g.name === 'Default');
      }

      // Load fab cost, standard prices, selling factors, etc.
      const [fabCostRes, standardPricesRes, sellingFactorsRes, lmePricesRes, exchangeRatesRes, rawMaterialsRes] = await Promise.all([
        api.get('/api/data/fab-costs'),
        api.get('/api/data/standard-prices'),
        api.get('/api/data/selling-factors'),
        api.get('/api/data/lme-prices'),
        api.get('/api/data/exchange-rates'),
        api.get('/api/data/raw-materials')
      ]);

      setPricingData({
        customerGroup: customerGroupData,
        fabCost: fabCostRes.data[0] || null, // Get first fab cost for demo
        standardPrices: standardPricesRes.data || [],
        sellingFactors: sellingFactorsRes.data || [],
        lmePrices: lmePricesRes.data || [],
        exchangeRates: exchangeRatesRes.data || []
      });

      setRawMaterials(rawMaterialsRes.data || []);

    } catch (err) {
      console.error('Failed to load master data:', err);
    }
  };

  const handleCalculatePrice = async () => {
    if (!request) {
      alert('ไม่พบข้อมูลคำขอราคา');
      return;
    }

    try {
      // 1. เปลี่ยนสถานะเป็น Calculating
      const calculatingPayload = {
        ...request,
        status: 'Calculating'
      };

      await api.put(`/api/data/requests/${requestId}`, calculatingPayload);
      setRequest(prev => prev ? { ...prev, status: 'Calculating' } : null);

      // 2. คำนวณราคา
      const calculationPayload = {
        requestId,
        customerGroup: pricingData.customerGroup,
        fabCost: pricingData.fabCost,
        standardPrices: pricingData.standardPrices,
        sellingFactors: pricingData.sellingFactors,
        lmePrices: pricingData.lmePrices,
        exchangeRates: pricingData.exchangeRates,
        boqItems: editableBoqItems || []
      };

      const calculationResponse = await api.post('/pricing/calculate', calculationPayload);
      setCalculationResult(calculationResponse.data.calculation);

      // 3. บันทึกผลการคำนวณราคาแต่ยังคงสถานะ Calculating
      const calculatedPayload = {
        ...request,
        status: 'Calculating',
        calculationResult: calculationResponse.data.calculation
      };

      await api.put(`/api/data/requests/${requestId}`, calculatedPayload);
      setRequest(prev => prev ? { ...prev, status: 'Calculating', calculationResult: calculationResponse.data.calculation } : null);

      alert('คำนวณราคาเสร็จเรียบร้อย กรุณาเลือก บันทึกร่าง หรือ ส่งอนุมัติ');

      // รีเฟรชข้อมูลจาก API โดยไม่ reload หน้า
      await loadRequestData();
    } catch (err) {
      console.error('Price calculation failed:', err);
      setError('Failed to calculate price');
      alert('เกิดข้อผิดพลาดในการคำนวณราคา');
    }
  };


  const handleApprovePrice = async () => {
    console.log('handleApprovePrice called');
    console.log('calculationResult:', calculationResult);
    console.log('request:', request);
    console.log('requestId:', requestId);

    if (!calculationResult) {
      alert('กรุณาคำนวณราคาก่อนอนุมัติ');
      return;
    }

    try {
      // อัพเดท status ของ request เป็น 'Approved'
      const payload = {
        ...request,
        status: 'Approved',
        calculationResult: calculationResult
      };

      console.log('Sending PUT request with payload:', payload);

      const response = await api.put(`/api/data/requests/${requestId}`, payload);

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (response.status === 200) {
        console.log('Price approved successfully');
        alert('อนุมัติราคาเรียบร้อยแล้ว');
        // อัพเดท local state
        setRequest(prev => prev ? { ...prev, status: 'Approved' } : null);
        // Emit event เพื่อแจ้งหน้าอื่นๆ ให้รีเฟรชข้อมูล
        eventBus.emit(EVENTS.REQUEST_STATUS_UPDATED, {
          requestId,
          status: 'Approved'
        });
        // รีเฟรชข้อมูลจาก server โดยไม่ reload หน้า
        await loadRequestData();
      }
    } catch (err) {
      console.error('Failed to approve price:', err);
      const error = err as any;
      console.error('Error details:', error.response?.data);
      alert('เกิดข้อผิดพลาดในการอนุมัติราคา: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    }
  };

  // บันทึกผลการคำนวณแต่ยังคงสถานะ Calculating
  const handleSaveDraftAfterCalculation = async () => {
    if (!calculationResult) {
      alert('กรุณาคำนวณราคาก่อนบันทึก');
      return;
    }

    try {
      const payload = {
        ...request,
        status: 'Calculating', // ยังคงสถานะ Calculating
        calculationResult: calculationResult
      };

      await api.put(`/api/data/requests/${requestId}`, payload);
      setRequest(prev => prev ? { ...prev, status: 'Calculating', calculationResult: calculationResult } : null);

      eventBus.emit(EVENTS.REQUEST_STATUS_UPDATED, {
        requestId,
        status: 'Calculating'
      });

      alert('บันทึกผลการคำนวณเรียบร้อยแล้ว');
      await loadRequestData();
    } catch (err) {
      console.error('Failed to save calculation:', err);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // ส่งอนุมัติหลังจากคำนวณราคาเสร็จแล้ว
  const handleSubmitForApproval = async () => {
    if (!calculationResult) {
      alert('กรุณาคำนวณราคาก่อนส่งอนุมัติ');
      return;
    }

    try {
      // เช็คการตั้งค่า bypass approval
      const bypassResponse = await api.get('/api/data/system-config/bypassApproval');
      const bypassApproval = bypassResponse.data?.value === 'true';

      const finalStatus = bypassApproval ? 'Approved' : 'Pending Approval';
      const alertMessage = bypassApproval ? 'อนุมัติราคาเรียบร้อยแล้ว (ข้ามขั้นตอนอนุมัติ)' : 'ส่งอนุมัติเรียบร้อยแล้ว';

      const payload = {
        ...request,
        status: finalStatus,
        calculationResult: calculationResult
      };

      await api.put(`/api/data/requests/${requestId}`, payload);
      setRequest(prev => prev ? { ...prev, status: finalStatus } : null);

      eventBus.emit(EVENTS.REQUEST_STATUS_UPDATED, {
        requestId,
        status: finalStatus
      });

      alert(alertMessage);
      await loadRequestData();
    } catch (err) {
      console.error('Failed to submit for approval:', err);
      alert('เกิดข้อผิดพลาดในการส่งอนุมัติ');
    }
  };

  const handleRequestRevision = async () => {
    const reason = prompt('กรุณาระบุเหตุผลที่ต้องการให้แก้ไข:');

    if (!reason || reason.trim() === '') {
      alert('กรุณาระบุเหตุผลที่ต้องการให้แก้ไข');
      return;
    }

    try {
      const response = await api.put(`/api/data/requests/${requestId}`, {
        ...request,
        status: 'Revision Required',
        revisionReason: reason.trim()
      });

      if (response.status === 200) {
        alert('ส่งคำขอแก้ไขเรียบร้อยแล้ว');
        setRequest(prev => prev ? { ...prev, status: 'Pending' } : null);

        // Emit event for activity log
        eventBus.emit(EVENTS.REQUEST_STATUS_UPDATED, {
          requestId,
          status: 'Pending',
          reason: reason.trim()
        });

        // Refresh data
        await loadRequestData();
      }
    } catch (err) {
      console.error('Failed to request revision:', err);
      alert('เกิดข้อผิดพลาดในการส่งคำขอแก้ไข');
    }
  };

  const updateMasterData = (category: keyof PricingData, updatedData: any) => {
    setPricingData(prev => ({
      ...prev,
      [category]: updatedData
    }));
  };

  // BOM/BOQ Management Functions
  const handleAddBoqItem = () => {
    if (!newBoqItem.rmId || newBoqItem.quantity <= 0) {
      alert('กรุณาเลือกวัตถุดิบและระบุจำนวนที่ถูกต้อง');
      return;
    }

    const selectedRM = rawMaterials.find(rm => rm.id === newBoqItem.rmId);
    if (!selectedRM) return;

    const newItem = {
      id: Date.now(),
      rmId: selectedRM.id,
      rmName: selectedRM.name,
      rmUnit: selectedRM.unit || 'kg',
      quantity: newBoqItem.quantity
    };

    setEditableBoqItems(prev => [...prev, newItem]);
    setNewBoqItem({ rmId: '', quantity: 0 });
  };

  const handleUpdateBoqQuantity = (index: number, newQuantity: number) => {
    setEditableBoqItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveBoqItem = (index: number) => {
    setEditableBoqItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveBoq = async () => {
    try {
      const payload = {
        ...request,
        boqItems: editableBoqItems
      };

      await api.put(`/api/data/requests/${requestId}`, payload);
      setRequest(prev => prev ? { ...prev, boqItems: editableBoqItems } : null);
      setIsEditingBOQ(false);
      alert('บันทึก BOQ เรียบร้อยแล้ว');
      await loadRequestData();
    } catch (err) {
      console.error('Failed to save BOQ:', err);
      alert('เกิดข้อผิดพลาดในการบันทึก BOQ');
    }
  };

  const handleCancelBoqEdit = () => {
    setEditableBoqItems([...(request?.boqItems || [])]);
    setIsEditingBOQ(false);
    setNewBoqItem({ rmId: '', quantity: 0 });
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
          <div className="flex items-center gap-4">
            <p className="text-slate-600">
              Customer: <span className="font-semibold">{request.customerName}</span> |
              Product: <span className="font-semibold">{request.productName}</span>
            </p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              request.status === 'Approved' ? 'bg-green-100 text-green-800' :
              request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
              request.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' :
              'bg-slate-100 text-slate-600'
            }`}>
              {request.status === 'Approved' ? 'อนุมัติแล้ว' :
               request.status === 'Rejected' ? 'ถูกปฏิเสธ' :
               request.status === 'Pending Approval' ? 'รออนุมัติ' :
               request.status}
            </span>
          </div>
        </div>
      </div>

      {/* Request Info */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Request Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

        {/* Order Details Row */}
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">รายละเอียดการสั่งซื้อ</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <label className="text-sm text-purple-700 font-medium">จำนวนที่ต้องการ</label>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {request.formData?.quantity ? Number(request.formData.quantity).toLocaleString() : 'N/A'}
              </p>
              <p className="text-xs text-purple-600 mt-1">ชิ้น</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="text-sm text-blue-700 font-medium">สกุลเงินที่ต้องการ</label>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {request.formData?.currency || 'N/A'}
              </p>
              <p className="text-xs text-blue-600 mt-1">สกุลเงินเสนอราคา</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <label className="text-sm text-green-700 font-medium">ราคาต่อหน่วย (เมื่อคำนวณแล้ว)</label>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {(() => {
                  console.log('[PricingView Order Details Card] calculationResult:', calculationResult);
                  console.log('[PricingView Order Details Card] sellingPricePerUnitInRequestedCurrency:', calculationResult?.sellingPricePerUnitInRequestedCurrency);
                  console.log('[PricingView Order Details Card] requestedCurrency:', calculationResult?.requestedCurrency);
                  console.log('[PricingView Order Details Card] currency:', request.formData?.currency);

                  // ✅ ใช้ sellingPricePerUnitInRequestedCurrency ถ้ามี ไม่งั้นใช้ sellingPriceThbPerUnit (backward compatibility)
                  let pricePerUnit = calculationResult?.sellingPricePerUnitInRequestedCurrency;
                  let currency = calculationResult?.requestedCurrency || request.formData?.currency;

                  // Fallback: ถ้าไม่มี field ใหม่ ให้ใช้ field เก่า
                  if (pricePerUnit === undefined || pricePerUnit === null) {
                    console.log('[PricingView] Using fallback for old data format');
                    // ถ้า currency ที่ต้องการเป็น THB หรือไม่ระบุ ใช้ sellingPriceThbPerUnit
                    if (!currency || currency === 'THB') {
                      pricePerUnit = calculationResult?.sellingPriceThbPerUnit;
                      currency = 'THB';
                    } else if (currency === 'USD') {
                      // ถ้าต้องการ USD ใช้ sellingPricePerUnit (USD)
                      pricePerUnit = calculationResult?.sellingPricePerUnit;
                    } else {
                      // สกุลเงินอื่นๆ ที่ยังไม่รองรับในข้อมูลเก่า
                      pricePerUnit = calculationResult?.sellingPriceThbPerUnit;
                      currency = 'THB';
                    }
                  }

                  console.log('[PricingView] Final pricePerUnit:', pricePerUnit, 'currency:', currency);

                  if (calculationResult && pricePerUnit !== undefined && pricePerUnit !== null && pricePerUnit > 0) {
                    return `${currency} ${Number(pricePerUnit).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                  }
                  return 'ยังไม่ได้คำนวณ';
                })()}
              </p>
              <p className="text-xs text-green-600 mt-1">ราคาต่อชิ้น</p>
            </div>
          </div>
        </div>
      </div>

      {/* BOQ Items */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Bill of Quantities (BOQ)
            {request.productType === 'new' && (
              <span className="ml-2 text-sm font-normal text-orange-600">(สินค้าใหม่ - ต้องสร้าง BOM)</span>
            )}
            {request.productType === 'existing' && (
              <span className="ml-2 text-sm font-normal text-blue-600">(สินค้าเดิม - สามารถแก้ไข BOQ ได้)</span>
            )}
          </h3>
          {!isEditingBOQ && (request.status === 'Calculating' || request.status === 'Submitted') && (
            <button
              onClick={() => setIsEditingBOQ(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              จัดการ BOQ
            </button>
          )}
          {!isEditingBOQ && (request.status === 'Pending Approval' || request.status === 'Approved' || request.status === 'Rejected') && (
            <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg cursor-not-allowed flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>ล็อก BOQ (อนุมัติแล้ว)</span>
            </div>
          )}
          {isEditingBOQ && (
            <div className="flex gap-2">
              <button
                onClick={handleSaveBoq}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                บันทึก
              </button>
              <button
                onClick={handleCancelBoqEdit}
                className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>

        {/* Add New BOQ Item (for new products) */}
        {isEditingBOQ && request.productType === 'new' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">เพิ่มวัตถุดิบใหม่</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">วัตถุดิบ</label>
                <select
                  value={newBoqItem.rmId}
                  onChange={(e) => setNewBoqItem(prev => ({ ...prev, rmId: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">เลือกวัตถุดิบ</option>
                  {rawMaterials.map(rm => (
                    <option key={rm.id} value={rm.id}>{rm.name} ({rm.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">จำนวน</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBoqItem.quantity}
                  onChange={(e) => setNewBoqItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="จำนวน"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddBoqItem}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  เพิ่ม
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOQ Table */}
        {(editableBoqItems.length > 0 || (request.boqItems && request.boqItems.length > 0)) && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left">Raw Material</th>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                  {isEditingBOQ && <th className="px-4 py-2 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(isEditingBOQ ? editableBoqItems : request.boqItems).map((item: any, index: number) => (
                  <tr key={item.id || index} className="border-t">
                    <td className="px-4 py-2 font-medium">{item.rmName}</td>
                    <td className="px-4 py-2 text-slate-600">{item.rmId}</td>
                    <td className="px-4 py-2 text-right">
                      {isEditingBOQ ? (
                        <input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleUpdateBoqQuantity(index, parseFloat(e.target.value) || 0)}
                          className="w-20 p-1 border border-slate-300 rounded text-center"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{item.rmUnit}</td>
                    {isEditingBOQ && (
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleRemoveBoqItem(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!editableBoqItems.length && !request.boqItems?.length && (
          <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">ไม่มี BOQ</h3>
            <p className="mt-1 text-sm text-slate-500">
              {request.productType === 'new'
                ? 'กดปุ่ม "จัดการ BOQ" เพื่อเพิ่มวัตถุดิบสำหรับสินค้าใหม่'
                : 'ไม่พบข้อมูล BOQ สำหรับสินค้านี้'
              }
            </p>
          </div>
        )}
      </div>

      {/* Special Requests */}
      {request.specialRequests && request.specialRequests.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">คำขอพิเศษ (Special Requests)</h3>
          <div className="space-y-3">
            {request.specialRequests.map((specialReq, index) => (
              <div key={specialReq.id || index} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {specialReq.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">{specialReq.description}</p>
                    <div className="flex items-center gap-4">
                      <label className="text-xs text-slate-600">ราคาเพิ่มเติม:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={specialReq.estimatedCost || ''}
                        onChange={(e) => {
                          const updatedRequests = request.specialRequests?.map(req =>
                            req.id === specialReq.id
                              ? { ...req, estimatedCost: parseFloat(e.target.value) || 0 }
                              : req
                          ) || [];
                          setRequest(prev => prev ? { ...prev, specialRequests: updatedRequests } : null);
                        }}
                        className="w-32 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                      <span className="text-xs text-slate-600">THB</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 กรุณาระบุราคาเพิ่มเติมสำหรับคำขอพิเศษแต่ละรายการ เพื่อใช้ในการคำนวณราคารวม
            </p>
          </div>
        </div>
      )}

      {/* Price Calculator - Detailed Calculation */}
      {request?.productId && (
        <div className="mt-8">
          <PriceCalculator
            productId={request.productId}
            customerId={request.customerId}
            quantity={request.formData?.quantity ? Number(request.formData.quantity) : 1}
            currency={request.formData?.currency || 'THB'}
            readonly={request.status === 'Pending Approval' || request.status === 'Approved' || request.status === 'Rejected'}
            savedResult={calculationResult}
            onCalculationComplete={(result) => {
              console.log('[PricingView] Price calculation completed:', result);
              console.log('[PricingView] sellingPrice:', result.sellingPrice);
              console.log('[PricingView] sellingPricePerUnit:', result.sellingPricePerUnit);
              console.log('[PricingView] quantity:', result.quantity);
              setCalculationResult(result);
            }}
          />
        </div>
      )}

      {/* Action Buttons - สำหรับ Costing Team */}
      {(request.status === 'Calculating' || request.status === 'Submitted') && (
        <div className="mt-8 bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              <p>บันทึกข้อมูลการคำนวณและส่งต่อเพื่อขออนุมัติ</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    if (!calculationResult) {
                      alert('กรุณาคำนวณราคาก่อนบันทึก');
                      return;
                    }

                    const payload = {
                      ...request,
                      calculationResult: calculationResult,
                      // ไม่เปลี่ยน status - ให้คงเป็น Calculating
                    };

                    await api.put(`/api/data/requests/${requestId}`, payload);
                    console.log('[PricingView] Saved calculation successfully');
                    alert('บันทึกผลการคำนวณเรียบร้อย');

                    // Reload เพื่อดึงข้อมูลล่าสุด
                    await loadRequestData();
                  } catch (err) {
                    console.error('[PricingView] Failed to save:', err);
                    alert('เกิดข้อผิดพลาดในการบันทึก');
                  }
                }}
                disabled={!calculationResult}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                บันทึกผลการคำนวณ
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!calculationResult) {
                      alert('กรุณาคำนวณราคาก่อน Submit');
                      return;
                    }

                    if (!confirm('ยืนยันส่งคำขอเพื่อขออนุมัติ?')) {
                      return;
                    }

                    const payload = {
                      ...request,
                      calculationResult: calculationResult,
                      status: 'Pending Approval'
                    };

                    await api.put(`/api/data/requests/${requestId}`, payload);
                    console.log('[PricingView] Submitted for approval successfully');
                    alert('ส่งคำขอเพื่ออนุมัติเรียบร้อย');

                    // Reload เพื่อดึงข้อมูลล่าสุด
                    await loadRequestData();
                  } catch (err) {
                    console.error('[PricingView] Failed to submit:', err);
                    alert('เกิดข้อผิดพลาดในการ Submit');
                  }
                }}
                disabled={!calculationResult}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit เพื่อขออนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Buttons - สำหรับผู้อนุมัติ */}
      {request.status === 'Pending Approval' && (
        <div className="mt-8 bg-white border border-amber-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-1">รออนุมัติราคา</h3>
              <p className="text-sm text-amber-700">กรุณาตรวจสอบข้อมูลการคำนวณราคาและอนุมัติหรือปฏิเสธ</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const reason = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
                  if (!reason) {
                    alert('กรุณาระบุเหตุผลในการปฏิเสธ');
                    return;
                  }

                  if (!confirm('ยืนยันการปฏิเสธคำขอนี้?')) {
                    return;
                  }

                  try {
                    const payload = {
                      ...request,
                      status: 'Rejected',
                      revisionReason: reason
                    };

                    await api.put(`/api/data/requests/${requestId}`, payload);
                    console.log('[PricingView] Rejected successfully');
                    alert('ปฏิเสธคำขอเรียบร้อย\n\nเหตุผล: ' + reason);

                    // Reload เพื่อดึงข้อมูลล่าสุด
                    await loadRequestData();
                  } catch (err) {
                    console.error('[PricingView] Failed to reject:', err);
                    alert('เกิดข้อผิดพลาดในการปฏิเสธคำขอ');
                  }
                }}
                className="px-6 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                ปฏิเสธ (Reject)
              </button>
              <button
                onClick={async () => {
                  if (!confirm('ยืนยันการอนุมัติราคานี้?')) {
                    return;
                  }

                  try {
                    const payload = {
                      ...request,
                      status: 'Approved',
                      calculationResult: calculationResult
                    };

                    await api.put(`/api/data/requests/${requestId}`, payload);
                    console.log('[PricingView] Approved successfully');
                    alert('✅ อนุมัติราคาเรียบร้อยแล้ว');

                    // Reload เพื่อดึงข้อมูลล่าสุด
                    await loadRequestData();
                  } catch (err) {
                    console.error('[PricingView] Failed to approve:', err);
                    alert('เกิดข้อผิดพลาดในการอนุมัติ');
                  }
                }}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                อนุมัติ (Approve)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Message - เมื่ออนุมัติหรือปฏิเสธแล้ว */}
      {(request.status === 'Approved' || request.status === 'Rejected') && (
        <div className={`mt-8 border rounded-lg p-6 ${
          request.status === 'Approved'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {request.status === 'Approved' ? (
              <>
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">อนุมัติแล้ว</h3>
                  <p className="text-sm text-green-700">คำขอนี้ได้รับการอนุมัติเรียบร้อยแล้ว ไม่สามารถแก้ไขได้</p>
                </div>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">ถูกปฏิเสธ</h3>
                  <p className="text-sm text-red-700">เหตุผล: {request.revisionReason || 'ไม่ระบุ'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Approval Workflow - Moved here before Activity Logs */}
      <div className="mt-8">
        <ApprovalWorkflow
          requestStatus={request.status as 'Draft' | 'Submitted' | 'Calculating' | 'Priced' | 'Approved' | 'Rejected'}
          readonly={false}
          onApproveStep={(stepId, comment) => {
            console.log(`Approved step ${stepId} with comment: ${comment}`);
            // TODO: Implement approval logic
          }}
        />
      </div>

      {/* Activity Logs Section */}
      <div className="mt-8">
        <ActivityLogs
          requestId={requestId}
          title={`Activity Logs - ${request?.customerName} (${request?.productName})`}
        />
      </div>
    </div>
  );
};

export default PricingView;