// path: client/src/pages/CreateRequest.tsx
// version: 5.2 (Add Quantity and Currency fields for order details)
// last-modified: 24 ตุลาคม 2568 09:45

import React, { useState, useEffect } from 'react';
import api from '../services/api'; // ✅ ใช้ centralized api instance ที่มี JWT interceptor
import eventBus, { EVENTS } from '../services/eventBus';
import ApprovalWorkflow from '../components/ApprovalWorkflow';
import ItemStatusBadge from '../components/ItemStatusBadge';

// --- Interfaces ---
interface CreateRequestProps {
  onCancel: () => void;
  onSuccess: () => void;
  requestId: string | null;
}

interface FormData {
  customerId?: string;
  customerName?: string;
  newCustomerName?: string;
  newCustomerContact?: string;
  productId?: string;
  productName?: string;
  newProductName?: string;
  newProductDrawing?: string;
  quantity?: number; // จำนวนที่ลูกค้าต้องการสั่ง
  currency?: string; // สกุลเงินที่ลูกค้าต้องการ (THB, USD, EUR, etc.)
}

interface BoqItem {
  id: number;
  rmId: string;
  rmName: string;
  rmUnit: string;
  quantity: number;
}

interface SpecialRequest {
  id: number;
  description: string;
  category: string;
  estimatedCost?: number;
}

// ลบ CalculationResult interface - ไม่ต้องใช้สำหรับ Sales user

interface Customer {
  id: string; 
  name: string;
}

interface Product {
  id: string;
  name: string;
  itemStatus?: string; // 'AVAILABLE' | 'IN_USE' | 'MAPPED' | 'REPLACED' | 'PRODUCTION'
}

// interface RawMaterial {
//   id: string;
//   name: string;
//   unit: string;
// }

interface RequestData {
  formData: FormData;
  customerType: 'existing' | 'new';
  productType: 'existing' | 'new';
  boqItems: BoqItem[];
  specialRequests: SpecialRequest[];
  status?: 'Draft' | 'Submitted' | 'Calculating' | 'Priced' | 'Approved' | 'Rejected';
}

// --- Main Component ---
const CreateRequest: React.FC<CreateRequestProps> = ({ onCancel, onSuccess, requestId }) => {
  const [customerType, setCustomerType] = useState<'existing' | 'new'>('existing');
  const [productType, setProductType] = useState<'existing' | 'new'>('existing');
  const [formData, setFormData] = useState<FormData>({});
  
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [specialRequests, setSpecialRequests] = useState<SpecialRequest[]>([]);
  const [newSpecialRequest, setNewSpecialRequest] = useState({ description: '', category: '' });
  // ลบ state variables สำหรับการแก้ไข BOQ - Sales user ไม่สามารถแก้ไขได้

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBOM, setIsFetchingBOM] = useState(false);
  const [error, setError] = useState('');
  const [requestStatus, setRequestStatus] = useState<'Draft' | 'Submitted' | 'Calculating' | 'Priced' | 'Approved' | 'Rejected'>('Draft');
  // Draft: กำลังสร้าง | Submitted: ส่งไปให้ Pricing Team แล้ว | Calculating: กำลังคำนวณ | Priced: คำนวณเสร็จแล้ว

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // 🔒 Sales ห้ามแก้ไขหลังจาก Submit Request แล้ว
  const isReadonly = requestStatus !== 'Draft';

  // Helper function to extract array data from API response
  const extractApiArrayData = (response: any): any[] => {
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    console.warn('Unexpected API response format:', response);
    return [];
  };

  // Helper function สำหรับแยก single object จาก API response
  const extractSingleApiData = (response: any): any => {
    if (response && response.success && response.data && typeof response.data === 'object') {
      return response.data;
    }
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      return response;
    }
    if (response && response.data && typeof response.data === 'object') {
      return response.data;
    }
    console.warn('Unexpected API response format:', response);
    return null;
  };

  // Load master data
  useEffect(() => {
    const fetchAllMasterData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get('/api/data/customers'),
          api.get('/api/data/products')
          // ลบการโหลด raw-materials - Sales user ไม่ต้องใช้
        ]);

        // axios response.data contains the response body already parsed
        setCustomers(extractApiArrayData(custRes.data) as Customer[]);
        setProducts(extractApiArrayData(prodRes.data) as Product[]);

        console.log('[CreateRequest] Master data loaded');

      } catch (err) {
        console.error("Failed to fetch master data", err);
        setError("Could not load master data. Please check your connection.");
      }
    };

    fetchAllMasterData();
  }, []);

  // Load existing request data for editing
  useEffect(() => {
    if (requestId) {
      const loadRequestData = async () => {
        try {
          const response = await api.get(`/api/data/requests/${requestId}`);
          // axios response.data contains the response body already parsed
          const requestData = extractSingleApiData(response.data) as RequestData;

          if (requestData) {
            setFormData(requestData.formData || {});
            setCustomerType(requestData.customerType || 'existing');
            setProductType(requestData.productType || 'existing');
            setBoqItems(requestData.boqItems || []);
            setSpecialRequests(requestData.specialRequests || []);
            setRequestStatus(requestData.status || 'Draft');
            console.log('[CreateRequest] Loaded request status:', requestData.status);
            // ลบ setCalculationResult - ไม่ต้องใช้สำหรับ Sales user

            // Set search values
            if (requestData.formData?.customerName) {
              setCustomerSearch(requestData.formData.customerName);
            }
            if (requestData.formData?.productName) {
              setProductSearch(requestData.formData.productName);
            }
          }
        } catch (err) {
          console.error("Failed to load request data", err);
          setError("Could not load request data.");
        }
      };
      loadRequestData();
    }
  }, [requestId]);

  // Listen to status update events
  useEffect(() => {
    if (requestId) {
      const unsubscribe = eventBus.on(EVENTS.REQUEST_STATUS_UPDATED, (data) => {
        if (data.requestId === requestId) {
          console.log('[CreateRequest] Received status update for current request:', data);
          setRequestStatus(data.status);
        }
      });

      return unsubscribe;
    }
  }, [requestId]);

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ฟังก์ชันดึง BOM จากฐานข้อมูลสำหรับสินค้าเดิม
  const fetchBOMForProduct = async (productId: string) => {
    setIsFetchingBOM(true);
    try {
      const response = await api.get(`/api/data/bom/product/${productId}`);
      // axios response.data contains the response body already parsed
      const bomItems = extractApiArrayData(response.data) as any[];

      // แปลง BOM data เป็น BOQ format
      const boqItems: BoqItem[] = bomItems.map((bom, index) => ({
        id: Date.now() + index,
        rmId: bom.rawMaterial?.id || bom.rawMaterialId,
        rmName: bom.rawMaterial?.name || 'Unknown Material',
        rmUnit: bom.rawMaterial?.unit || 'pcs',
        quantity: parseFloat(bom.quantity) || 0
      }));

      setBoqItems(boqItems);
      console.log(`[CreateRequest] BOM loaded for product ${productId}:`, boqItems.length, 'items');
    } catch (err) {
      // axios throws error for HTTP error status (404, 500, etc.)
      console.error("Failed to fetch BOM from database", err);
      // ถ้าไม่พบ BOM ในระบบ ให้เคลียร์ BOQ และให้ผู้ใช้สร้างเอง
      setBoqItems([]);
      console.log(`[CreateRequest] No BOM found for product ${productId}, manual BOQ required`);
    } finally {
      setIsFetchingBOM(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    handleFormChange('customerId', customer.id);
    handleFormChange('customerName', customer.name);
    setCustomerSearch(customer.name);
  };

  const handleProductSelect = async (product: Product) => {
    handleFormChange('productId', product.id);
    handleFormChange('productName', product.name);
    setProductSearch(product.name);
    
    // สำหรับสินค้าเดิม: ดึง BOM จากฐานข้อมูลอัตโนมัติ
    if (productType === 'existing') {
      await fetchBOMForProduct(product.id);
    }
  };

  // ลบฟังก์ชัน handleAddToBoq - Sales user ไม่สามารถแก้ไข BOQ ได้

  // ลบฟังก์ชัน handleUpdateBoqQuantity - Sales user ไม่สามารถแก้ไข BOQ ได้

  // ลบฟังก์ชัน handleRemoveFromBoq - Sales user ไม่สามารถแก้ไข BOQ ได้

  // ลบ handleCalculatePrice function - ไม่ต้องใช้สำหรับ Sales user

  // Special Requests Management
  const handleAddSpecialRequest = () => {
    if (!newSpecialRequest.description.trim() || !newSpecialRequest.category.trim()) {
      alert('กรุณากรอกรายละเอียดและประเภทคำขอพิเศษ');
      return;
    }

    const specialRequest: SpecialRequest = {
      id: Date.now(),
      description: newSpecialRequest.description.trim(),
      category: newSpecialRequest.category.trim()
    };

    setSpecialRequests(prev => [...prev, specialRequest]);
    setNewSpecialRequest({ description: '', category: '' });
  };

  const handleRemoveSpecialRequest = (id: number) => {
    setSpecialRequests(prev => prev.filter(req => req.id !== id));
  };

  // บันทึกแบบร่าง (Draft)
  const handleSaveDraft = async () => {
    setIsLoading(true);
    setError('');

    try {
      const requestData: RequestData = {
        formData,
        customerType,
        productType,
        boqItems,
        specialRequests,
        status: 'Draft' // บันทึกเป็น Draft ยังไม่ส่ง
      };

      // Use axios for PUT/POST
      if (requestId) {
        await api.put(`/api/data/requests/${requestId}`, requestData);
      } else {
        await api.post('/api/data/requests', requestData);
      }

      setRequestStatus('Draft');
      alert('✅ บันทึกแบบร่างเรียบร้อยแล้ว\n\nคุณสามารถกลับมาแก้ไขและส่งคำขอได้ภายหลัง');
      onSuccess();
    } catch (err) {
      console.error('Failed to save draft:', err);
      setError('ไม่สามารถบันทึกได้');
    } finally {
      setIsLoading(false);
    }
  };

  // ส่งคำขอ (เปลี่ยนเป็น Submitted)
  const handleSubmitRequest = async () => {
    setIsLoading(true);
    setError('');

    try {
      const requestData: RequestData = {
        formData,
        customerType,
        productType,
        boqItems,
        specialRequests,
        status: 'Submitted' // ส่งให้ Pricing Team
      };

      // Use axios for PUT/POST
      if (requestId) {
        await api.put(`/api/data/requests/${requestId}`, requestData);
      } else {
        await api.post('/api/data/requests', requestData);
      }

      setRequestStatus('Submitted');
      alert('✅ ส่งคำขอราคาให้ Pricing Team เรียบร้อยแล้ว\n\n🔒 คุณไม่สามารถแก้ไขข้อมูลได้อีกแล้ว');
      onSuccess();
    } catch (err) {
      console.error('Failed to submit request:', err);
      setError('ไม่สามารถส่งคำขอได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    // ป้องกันการ submit form โดยตรง - ให้ใช้ปุ่มแทน
  };

  // Safe filtering with proper search logic (ID and Name)
  const filteredCustomers = customerSearch && Array.isArray(customers)
    ? customers.filter(c => {
        const searchLower = customerSearch.toLowerCase();
        return (c.name && c.name.toLowerCase().includes(searchLower)) ||
               (c.id && c.id.toLowerCase().includes(searchLower));
      })
    : [];

  const filteredProducts = productSearch && Array.isArray(products)
    ? products.filter(p => {
        const searchLower = productSearch.toLowerCase();
        return (p.name && p.name.toLowerCase().includes(searchLower)) ||
               (p.id && p.id.toLowerCase().includes(searchLower));
      })
    : [];

  // ลบ filteredRawMaterials - Sales user ไม่ต้องเลือก raw materials

  // Reset BOQ when product type changes
  useEffect(() => {
    if (productType === 'new') {
      setBoqItems([]); // เคลียร์ BOQ เมื่อเปลี่ยนเป็นสินค้าใหม่
    }
  }, [productType]);

  return (
    <form onSubmit={handleCreateOrUpdateRequest}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {requestId ? (isReadonly ? `ดูข้อมูลคำขอราคา #${requestId}` : `แก้ไขคำขอราคา #${requestId}`) : 'สร้างคำขอราคาใหม่'}
          </h1>
          <p className="text-slate-500">
            {isReadonly ? 'ข้อมูลคำขอราคาที่ได้ส่งแล้ว (ไม่สามารถแก้ไขได้)' : (requestId ? 'แก้ไขรายละเอียดคำขอราคา' : 'กรอกข้อมูลพื้นฐานเพื่อส่งให้ทีม Costing ประเมินราคา')}
          </p>
        </div>
      </div>

      {/* Readonly Warning Banner */}
      {isReadonly && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <div className="font-medium text-orange-800">เอกสารนี้ได้ส่งแล้ว</div>
              <div className="text-sm text-orange-700">สถานะ: {requestStatus} - ไม่สามารถแก้ไขข้อมูลได้แล้ว</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Status Badge */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">สถานะ:</span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              requestStatus === 'Draft' ? 'bg-gray-100 text-gray-700' :
              requestStatus === 'Submitted' ? 'bg-blue-100 text-blue-700' :
              requestStatus === 'Calculating' ? 'bg-yellow-100 text-yellow-700' :
              requestStatus === 'Priced' ? 'bg-green-100 text-green-700' :
              requestStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
              'bg-red-100 text-red-700'
            }`}>
              {requestStatus === 'Draft' ? '📝 กำลังสร้าง' :
               requestStatus === 'Submitted' ? '📤 ส่งให้ Pricing Team แล้ว' :
               requestStatus === 'Calculating' ? '⚙️ กำลังคำนวณ' :
               requestStatus === 'Priced' ? '✅ คำนวณเสร็จแล้ว' :
               requestStatus === 'Approved' ? '✨ อนุมัติแล้ว' :
               '❌ ปฏิเสธ'}
            </span>
            {isReadonly && (
              <span className="text-sm text-amber-600 font-medium">🔒 ไม่สามารถแก้ไขได้</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Main Information */}
          <div className="space-y-6">
            {/* Customer Info Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  ข้อมูลลูกค้า
                </h2>
              </div>
              <div className="p-6">

          {/* Customer Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">ประเภทลูกค้า</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="customerType"
                  value="existing"
                  checked={customerType === 'existing'}
                  onChange={(e) => setCustomerType(e.target.value as 'existing' | 'new')}
                  disabled={isReadonly}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="ml-2 text-sm font-medium text-slate-700">ลูกค้าเดิม</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="customerType"
                  value="new"
                  checked={customerType === 'new'}
                  onChange={(e) => setCustomerType(e.target.value as 'existing' | 'new')}
                  disabled={isReadonly}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="ml-2 text-sm font-medium text-slate-700">ลูกค้าใหม่</span>
              </label>
            </div>
          </div>

          {/* Customer Fields */}
          {customerType === 'existing' ? (
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ค้นหาลูกค้า <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  // Clear selection when typing
                  if (e.target.value !== formData.customerName) {
                    setFormData(prev => ({ ...prev, customerId: '', customerName: '' }));
                  }
                }}
                placeholder="ค้นหาด้วย Customer ID หรือชื่อลูกค้า..."
                disabled={isReadonly}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                autoComplete="off"
              />
              
              {/* Customer Search Results */}
              {customerSearch && filteredCustomers.length > 0 && !formData.customerId && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full p-3 text-left hover:bg-blue-50 border-b border-slate-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-slate-900">{customer.name}</div>
                      <div className="text-sm text-slate-500">{customer.id}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Customer Display */}
              {formData.customerId && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>เลือกแล้ว:</strong> {formData.customerName} ({formData.customerId})
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ชื่อลูกค้าใหม่ <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={formData.newCustomerName || ''}
                  onChange={(e) => handleFormChange('newCustomerName', e.target.value)}
                  placeholder="ชื่อบริษัท/ลูกค้า"
                  disabled={isReadonly}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ข้อมูลติดต่อ
                </label>
                <input 
                  type="text"
                  value={formData.newCustomerContact || ''}
                  onChange={(e) => handleFormChange('newCustomerContact', e.target.value)}
                  placeholder="เบอร์โทร/อีเมล"
                  disabled={isReadonly}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}
              </div>
            </div>

            {/* Order Details Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  รายละเอียดการสั่งซื้อ
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quantity Field */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      จำนวนที่ต้องการ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.quantity || ''}
                      onChange={(e) => handleFormChange('quantity', e.target.value)}
                      placeholder="ระบุจำนวน"
                      min="1"
                      disabled={isReadonly}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-500">จำนวนสินค้าที่ลูกค้าต้องการสั่ง</p>
                  </div>

                  {/* Currency Field */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      สกุลเงินที่ต้องการเสนอราคา <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.currency || ''}
                      onChange={(e) => handleFormChange('currency', e.target.value)}
                      disabled={isReadonly}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">เลือกสกุลเงิน</option>
                      <option value="THB">THB - บาทไทย</option>
                      <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                      <option value="EUR">EUR - ยูโร</option>
                      <option value="JPY">JPY - เยนญี่ปุ่น</option>
                      <option value="CNY">CNY - หยวนจีน</option>
                      <option value="SGD">SGD - ดอลลาร์สิงคโปร์</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">สกุลเงินที่ลูกค้าต้องการให้เสนอราคา</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  ข้อมูลสินค้า
                </h2>
              </div>
              <div className="p-6">

          {/* Product Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">ประเภทสินค้า</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="productType"
                  value="existing"
                  checked={productType === 'existing'}
                  onChange={(e) => setProductType(e.target.value as 'existing' | 'new')}
                  disabled={isReadonly}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="ml-2 text-sm font-medium text-slate-700">สินค้าเดิม (ดึง BOM อัตโนมัติ)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="productType"
                  value="new"
                  checked={productType === 'new'}
                  onChange={(e) => setProductType(e.target.value as 'existing' | 'new')}
                  disabled={isReadonly}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="ml-2 text-sm font-medium text-slate-700">สินค้าใหม่ (สร้าง BOQ ชั่วคราว)</span>
              </label>
            </div>
          </div>

          {/* Product Fields */}
          {productType === 'existing' ? (
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ค้นหาสินค้า <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  // Clear selection when typing
                  if (e.target.value !== formData.productName) {
                    setFormData(prev => ({ ...prev, productId: '', productName: '' }));
                  }
                }}
                placeholder="ค้นหาด้วย FG Code หรือชื่อสินค้า..."
                disabled={isReadonly}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                autoComplete="off"
              />
              
              {/* Product Search Results */}
              {productSearch && filteredProducts.length > 0 && !formData.productId && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className="w-full p-3 text-left hover:bg-blue-50 border-b border-slate-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{product.name}</div>
                          <div className="text-sm text-slate-500">{product.id}</div>
                        </div>

                        {/* Item Status Badge */}
                        {product.itemStatus && (
                          <div className="ml-2">
                            <ItemStatusBadge status={product.itemStatus} size="sm" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Product Display */}
              {formData.productId && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-800">
                      <strong>เลือกแล้ว:</strong> {formData.productName} ({formData.productId})
                      {isFetchingBOM && <span className="ml-2">(กำลังโหลด BOM จากระบบ...)</span>}
                    </div>

                    {/* Item Status Badge */}
                    {(() => {
                      const selectedProduct = products.find(p => p.id === formData.productId);
                      return selectedProduct?.itemStatus ? (
                        <ItemStatusBadge status={selectedProduct.itemStatus} size="sm" />
                      ) : null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ชื่อสินค้าใหม่ <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={formData.newProductName || ''}
                  onChange={(e) => handleFormChange('newProductName', e.target.value)}
                  placeholder="ชื่อสินค้าใหม่"
                  disabled={isReadonly}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  เลขแบบ/Drawing No.
                </label>
                <input 
                  type="text"
                  value={formData.newProductDrawing || ''}
                  onChange={(e) => handleFormChange('newProductDrawing', e.target.value)}
                  placeholder="เลขที่แบบ"
                  disabled={isReadonly}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}
              </div>
            </div>
          </div>

          {/* Right Column - BOQ and Special Requests */}
          <div className="space-y-6">
            {/* BOQ Section Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  รายการวัตถุดิบ (BOQ)
                  {productType === 'existing' && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">จาก BOM ในระบบ</span>
                  )}
                  {productType === 'new' && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">BOQ ชั่วคราว</span>
                  )}
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
            
            {/* Auto-fetch BOM status for existing products */}
            {productType === 'existing' && formData.productId && (
              <div className="text-sm text-slate-600">
                {isFetchingBOM ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังดึง BOM จากระบบ...
                  </div>
                ) : (
                  <div className="text-green-600">✓ BOM โหลดแล้ว ({boqItems.length} รายการ)</div>
                )}
              </div>
            )}
          </div>
          </div>

          {/* ลบส่วน BOQ editing สำหรับ Sales user - ไม่จำเป็นต้องใช้ */}

          {/* BOQ Table - Read Only for Sales */}
          {boqItems.length > 0 && (
            <div className="overflow-x-auto">
              <div className="mb-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <svg className="inline w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                รายการวัตถุดิบจาก BOM ในระบบ (ทีม Costing จะตรวจสอบและปรับปรุง)
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">รหัส RM</th>
                    <th className="px-4 py-3">ชื่อวัตถุดิบ</th>
                    <th className="px-4 py-3">จำนวน</th>
                    <th className="px-4 py-3">หน่วย</th>
                    <th className="px-4 py-3 text-center">แหล่งข้อมูล</th>
                  </tr>
                </thead>
                <tbody>
                  {boqItems.map(item => (
                    <tr key={item.id} className="bg-white border-b">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.rmId}</td>
                      <td className="px-4 py-3">{item.rmName}</td>
                      <td className="px-4 py-3 font-medium">{item.quantity}</td>
                      <td className="px-4 py-3">{item.rmUnit}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          จาก BOM
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty BOQ States */}
          {boqItems.length === 0 && productType === 'new' && (
            <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-slate-900">สินค้าใหม่ยังไม่มี BOQ</h3>
              <p className="mt-1 text-sm text-slate-500">ทีม Costing จะสร้าง BOQ และคำนวณราคาให้หลังจากรับคำขอ</p>
            </div>
          )}

          {boqItems.length === 0 && productType === 'existing' && formData.productId && !isFetchingBOM && (
            <div className="text-center py-8 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-50">
              <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-yellow-800">ไม่พบ BOM ในระบบ</h3>
              <p className="mt-1 text-sm text-yellow-600">ทีม Costing จะตรวจสอบและสร้าง BOM ให้หลังจากรับคำขอ</p>
            </div>
          )}
            </div>

            {/* Special Requests Section Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    คำขอพิเศษ
                  </h2>
                  <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{specialRequests.length} รายการ</span>
                </div>
              </div>
              <div className="p-6">

            {/* Add Special Request Form - Only show when not readonly */}
            {!isReadonly && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="text-sm font-semibold text-orange-900 mb-3">เพิ่มคำขอพิเศษ</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ประเภท</label>
                  <select
                    value={newSpecialRequest.category}
                    onChange={(e) => setNewSpecialRequest(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">เลือกประเภท</option>
                    <option value="พิเศษทางเทคนิค">พิเศษทางเทคนิค</option>
                    <option value="การปรับแต่งสินค้า">การปรับแต่งสินค้า</option>
                    <option value="การจัดส่งพิเศษ">การจัดส่งพิเศษ</option>
                    <option value="การบรรจุภัณฑ์พิเศษ">การบรรจุภัณฑ์พิเศษ</option>
                    <option value="อื่น ๆ">อื่น ๆ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียด</label>
                  <textarea
                    value={newSpecialRequest.description}
                    onChange={(e) => setNewSpecialRequest(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="อธิบายรายละเอียดคำขอพิเศษ..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSpecialRequest}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  เพิ่มคำขอ
                </button>
              </div>
              </div>
            )}

            {/* Special Requests List */}
            {specialRequests.length > 0 && (
              <div className="space-y-3">
                {specialRequests.map((request) => (
                  <div key={request.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {request.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{request.description}</p>
                      </div>
                      {!isReadonly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialRequest(request.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="ลบคำขอพิเศษ"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {specialRequests.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50">
                <svg className="mx-auto h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-orange-800">ไม่มีคำขอพิเศษ</h3>
                <p className="mt-1 text-sm text-orange-600">ใช้ฟอร์มด้านบนเพื่อเพิ่มคำขอพิเศษ</p>
              </div>
            )}
              </div>
            </div>

            {/* ApprovalWorkflow - Show only in edit mode */}
            {requestId && (
              <ApprovalWorkflow
                requestStatus={requestStatus}
                readonly={isReadonly}
                onApproveStep={(stepId, comment) => {
                  console.log(`Approved step ${stepId} with comment: ${comment}`);
                  // TODO: Implement approval logic
                }}
              />
            )}

            {/* Price Calculator - ลบออกแล้ว เพราะ Sales ไม่ควรคำนวณราคาเอง */}
            {/* Pricing Team จะคำนวณราคาในหน้า Price Calculator แยกต่างหาก */}
          </div>
        </div>
      </div>

      {/* Form Actions - Full width below both columns */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 text-slate-700 font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isReadonly ? 'กลับ' : 'ยกเลิก'}
          </button>

          {/* Save Draft Button - Only show when not readonly */}
          {!isReadonly && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLoading || isFetchingBOM ||
                (customerType === 'existing' && !formData.customerId) ||
                (customerType === 'new' && !formData.newCustomerName) ||
                (productType === 'existing' && !formData.productId) ||
                (productType === 'new' && !formData.newProductName)
              }
              className="px-6 py-3 text-slate-700 font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[140px] flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึกร่าง'
              )}
            </button>
          )}

          {/* Submit Button - Only show when not readonly */}
          {!isReadonly && (
            <button
              type="button"
              onClick={handleSubmitRequest}
              disabled={isLoading || isFetchingBOM ||
                (customerType === 'existing' && !formData.customerId) ||
                (customerType === 'new' && !formData.newCustomerName) ||
                (productType === 'existing' && !formData.productId) ||
                (productType === 'new' && !formData.newProductName) ||
                !formData.quantity ||
                !formData.currency
              }
              className="px-6 py-3 text-white font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[140px] flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังส่ง...
                </>
              ) : (
                requestId ? 'อัปเดตและส่งคำขอ' : 'ส่งคำขอราคา'
              )
              }
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default CreateRequest;