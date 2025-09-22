// path: client/src/pages/CreateRequest.tsx
// version: 2.7 (Correct Workflow Implementation)
// last-modified: 31 สิงหาคม 2568

import React, { useState, useEffect } from 'react';

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
}

interface BoqItem {
  id: number;
  rmId: string;
  rmName: string;
  rmUnit: string;
  quantity: number;
}

interface CalculationResult {
  basePrice: string; 
  sellingFactor: number; 
  finalPrice: string; 
  currency: string;
}

interface Customer {
  id: string; 
  name: string;
}

interface Product {
  id: string; 
  name: string;
}

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
}

interface RequestData {
  formData: FormData;
  customerType: 'existing' | 'new';
  productType: 'existing' | 'new';
  boqItems: BoqItem[];
  calculationResult: CalculationResult | null;
}

// --- Main Component ---
const CreateRequest: React.FC<CreateRequestProps> = ({ onCancel, onSuccess, requestId }) => {
  const [customerType, setCustomerType] = useState<'existing' | 'new'>('existing');
  const [productType, setProductType] = useState<'existing' | 'new'>('existing');
  const [formData, setFormData] = useState<FormData>({});
  
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [selectedRm, setSelectedRm] = useState<RawMaterial | null>(null);
  const [rmSearch, setRmSearch] = useState('');
  const [tempQty, setTempQty] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBOM, setIsFetchingBOM] = useState(false);
  const [error, setError] = useState('');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

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
        const [custRes, prodRes, rmRes] = await Promise.all([
          fetch('http://localhost:3000/api/data/customers'),
          fetch('http://localhost:3000/api/data/products'),
          fetch('http://localhost:3000/api/data/raw-materials')
        ]);
        
        const [custData, prodData, rmData] = await Promise.all([
          custRes.json(),
          prodRes.json(),
          rmRes.json()
        ]);

        setCustomers(extractApiArrayData(custData) as Customer[]);
        setProducts(extractApiArrayData(prodData) as Product[]);
        setRawMaterials(extractApiArrayData(rmData) as RawMaterial[]);

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
          const response = await fetch(`http://localhost:3000/api/data/requests/${requestId}`);
          const responseData = await response.json();
          const requestData = extractSingleApiData(responseData) as RequestData;

          if (requestData) {
            setFormData(requestData.formData || {});
            setCustomerType(requestData.customerType || 'existing');
            setProductType(requestData.productType || 'existing');
            setBoqItems(requestData.boqItems || []);
            setCalculationResult(requestData.calculationResult || null);

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

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ฟังก์ชันดึง BOM จากฐานข้อมูลสำหรับสินค้าเดิม
  const fetchBOMForProduct = async (productId: string) => {
    setIsFetchingBOM(true);
    try {
      const response = await fetch(`http://localhost:3000/api/data/bom/product/${productId}`);
      if (response.ok) {
        const bomData = await response.json();
        const bomItems = extractApiArrayData(bomData) as any[];

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
      } else {
        // ถ้าไม่พบ BOM ในระบบ ให้เคลียร์ BOQ และให้ผู้ใช้สร้างเอง
        setBoqItems([]);
        console.log(`[CreateRequest] No BOM found for product ${productId}, manual BOQ required`);
      }
    } catch (err) {
      console.error("Failed to fetch BOM from database", err);
      setBoqItems([]);
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

  const handleAddToBoq = () => {
    if (!selectedRm || tempQty <= 0) return;
    
    const existingIndex = boqItems.findIndex(item => item.rmId === selectedRm.id);
    if (existingIndex !== -1) {
      // Update existing item quantity
      setBoqItems(prev => prev.map((item, index) => 
        index === existingIndex ? 
          { ...item, quantity: item.quantity + tempQty } : 
          item
      ));
    } else {
      // Add new item
      const newItem: BoqItem = {
        id: Date.now(),
        rmId: selectedRm.id,
        rmName: selectedRm.name,
        rmUnit: selectedRm.unit,
        quantity: tempQty
      };
      setBoqItems(prev => [...prev, newItem]);
    }
    
    // Reset selection
    setSelectedRm(null);
    setRmSearch('');
    setTempQty(1);
  };

  const handleUpdateBoqQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromBoq(id);
    } else {
      setBoqItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleRemoveFromBoq = (itemId: number) => {
    setBoqItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleCalculatePrice = async () => {
    setIsLoading(true);
    setError('');

    try {
      const calculationData = {
        formData,
        customerType,
        productType,
        boqItems,
      };

      const response = await fetch('http://localhost:3000/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculationData)
      });

      if (response.ok) {
        const result = await response.json();
        setCalculationResult(extractSingleApiData(result) as CalculationResult || null);
      } else {
        throw new Error('Failed to calculate price');
      }
    } catch (err) {
      setError('ไม่สามารถคำนวณราคาได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const requestData: RequestData = {
        formData,
        customerType,
        productType,
        boqItems,
        calculationResult,
      };

      const url = requestId
        ? `http://localhost:3000/api/data/requests/${requestId}`
        : 'http://localhost:3000/api/data/requests';
      const method = requestId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error('Failed to save request');
      }
    } catch (err) {
      setError('ไม่สามารถบันทึกคำขอได้');
    } finally {
      setIsLoading(false);
    }
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

  const filteredRawMaterials = rmSearch && Array.isArray(rawMaterials)
    ? rawMaterials.filter(rm => {
        const searchLower = rmSearch.toLowerCase();
        return (rm.name && rm.name.toLowerCase().includes(searchLower)) ||
               (rm.id && rm.id.toLowerCase().includes(searchLower));
      })
    : [];

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
            {requestId ? `Edit Price Request #${requestId}` : 'สร้างคำขอราคาใหม่'}
          </h1>
          <p className="text-slate-500">
            {requestId ? 'แก้ไขรายละเอียดและคำนวณราคา' : 'กรอกข้อมูลเพื่อสร้างรายการให้ทีม Costing ทำงานต่อ'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Customer Info */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 text-slate-800">1. ข้อมูลลูกค้า</h2>

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
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
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
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
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
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
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
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 text-slate-800">2. ข้อมูลสินค้า</h2>

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
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
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
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
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
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
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
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="text-sm text-slate-500">{product.id}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Product Display */}
              {formData.productId && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>เลือกแล้ว:</strong> {formData.productName} ({formData.productId})
                    {isFetchingBOM && <span className="ml-2">(กำลังโหลด BOM จากระบบ...)</span>}
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
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* BOQ Section */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">
              3. รายการวัตถุดิบ (BOQ)
              {productType === 'existing' && ' - จาก BOM ในระบบ'}
              {productType === 'new' && ' - BOQ ชั่วคราว'}
            </h2>
            
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

          {/* Add Raw Material (Only for new products or manual BOQ editing) */}
          {(productType === 'new' || (productType === 'existing' && !isFetchingBOM)) && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-slate-700">
                {productType === 'new' ? 'สร้าง BOQ ชั่วคราว' : 'แก้ไข BOQ (เพิ่มเติม)'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">ค้นหาวัตถุดิบ</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={rmSearch}
                      onChange={(e) => {
                        setRmSearch(e.target.value);
                        setSelectedRm(null);
                      }}
                      placeholder="ค้นหาด้วย RM Code หรือชื่อวัตถุดิบ..."
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      autoComplete="off"
                    />
                    
                    {/* Raw Material Search Results */}
                    {rmSearch && filteredRawMaterials.length > 0 && !selectedRm && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredRawMaterials.map(rm => (
                          <button
                            key={rm.id}
                            type="button"
                            onClick={() => {
                              setSelectedRm(rm);
                              setRmSearch(rm.name);
                            }}
                            className="w-full p-3 text-left hover:bg-blue-50 border-b border-slate-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-slate-900">{rm.name}</div>
                            <div className="text-sm text-slate-500">{rm.id} • หน่วย: {rm.unit}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">จำนวน</label>
                  <input 
                    type="number"
                    value={tempQty}
                    onChange={(e) => setTempQty(parseFloat(e.target.value) || 1)}
                    min="0.01"
                    step="0.01"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1.00"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddToBoq}
                    disabled={!selectedRm || tempQty <= 0}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    เพิ่มในรายการ
                  </button>
                </div>
              </div>
              
              {/* Selected Raw Material Display */}
              {selectedRm && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>เลือกแล้ว:</strong> {selectedRm.name} ({selectedRm.id}) - หน่วย: {selectedRm.unit}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BOQ Table */}
          {boqItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">รหัส RM</th>
                    <th className="px-4 py-3">ชื่อวัตถุดิบ</th>
                    <th className="px-4 py-3">จำนวน</th>
                    <th className="px-4 py-3">หน่วย</th>
                    <th className="px-4 py-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {boqItems.map(item => (
                    <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.rmId}</td>
                      <td className="px-4 py-3">{item.rmName}</td>
                      <td className="px-4 py-3">
                        {productType === 'new' ? (
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateBoqQuantity(item.id, parseFloat(e.target.value) || 0)}
                            min="0.01"
                            step="0.01"
                            className="w-20 p-1 border border-slate-300 rounded text-center focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="px-4 py-3">{item.rmUnit}</td>
                      <td className="px-4 py-3 text-center">
                        {productType === 'new' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFromBoq(item.id)}
                            className="text-red-600 hover:text-red-800 font-medium transition-colors"
                            title="ลบรายการนี้"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        {productType === 'existing' && (
                          <span className="text-slate-400 text-xs">จากระบบ</span>
                        )}
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
              <h3 className="mt-2 text-sm font-medium text-slate-900">สร้าง BOQ ชั่วคราวสำหรับสินค้าใหม่</h3>
              <p className="mt-1 text-sm text-slate-500">เพิ่มรายการวัตถุดิบเพื่อเริ่มคำนวณราคา</p>
            </div>
          )}

          {boqItems.length === 0 && productType === 'existing' && formData.productId && !isFetchingBOM && (
            <div className="text-center py-8 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-50">
              <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-yellow-800">ไม่พบ BOM ในระบบ</h3>
              <p className="mt-1 text-sm text-yellow-600">สินค้านี้อาจยังไม่มี BOM หรือต้องสร้าง BOQ ชั่วคราว</p>
            </div>
          )}
        </div>

        {/* Calculation Section */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">4. การคำนวณราคา</h2>
            <button
              type="button"
              onClick={handleCalculatePrice}
              disabled={boqItems.length === 0 || isLoading || isFetchingBOM}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'กำลังคำนวณ...' : 'คำนวณราคา'}
            </button>
          </div>

          {/* Calculation Results */}
          {calculationResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">ผลการคำนวณ</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-green-600 mb-1">ราคาต้นทุนพื้นฐาน</div>
                  <div className="text-2xl font-bold text-green-800">
                    {parseFloat(calculationResult.basePrice).toLocaleString()} {calculationResult.currency}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-green-600 mb-1">อัตราส่วนกำไร</div>
                  <div className="text-2xl font-bold text-green-800">
                    {calculationResult.sellingFactor}x
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-green-600 mb-1">ราคาขายที่แนะนำ</div>
                  <div className="text-3xl font-bold text-green-800">
                    {parseFloat(calculationResult.finalPrice).toLocaleString()} {calculationResult.currency}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Placeholder */}
          {!calculationResult && boqItems.length > 0 && !isFetchingBOM && (
            <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-slate-900">พร้อมคำนวณราคา</h3>
              <p className="mt-1 text-sm text-slate-500">กดปุ่ม "คำนวณราคา" เพื่อดูผลลัพธ์</p>
            </div>
          )}

          {(boqItems.length === 0 || isFetchingBOM) && (
            <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-slate-900">
                {isFetchingBOM ? 'กำลังโหลด BOM จากระบบ...' : 'เพิ่มวัตถุดิบก่อนคำนวณ'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {isFetchingBOM ? 'กรุณารอสักครู่...' : 'กรุณาเพิ่มรายการวัตถุดิบก่อนที่จะสามารถคำนวณราคาได้'}
              </p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 text-slate-700 font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isLoading || isFetchingBOM ||
              (customerType === 'existing' && !formData.customerId) ||
              (customerType === 'new' && !formData.newCustomerName) ||
              (productType === 'existing' && !formData.productId) ||
              (productType === 'new' && !formData.newProductName)
            }
            className="px-6 py-3 text-white font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[140px] flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังบันทึก...
              </>
            ) : (
              requestId ? 'อัปเดตคำขอ' : 'สร้างคำขอ'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CreateRequest;