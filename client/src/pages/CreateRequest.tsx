// path: client/src/pages/CreateRequest.tsx
// version: 2.4 (API Response Structure Fix)
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
  const [error, setError] = useState('');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Helper function to extract data from API response
  const extractApiData = (response: any): any[] => {
    // Handle ResponseInterceptor format: { success: true, data: [...], timestamp: "", path: "" }
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    // Handle direct array response
    if (Array.isArray(response)) {
      return response;
    }
    // Handle nested data structure
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    // Default fallback
    console.warn('Unexpected API response format:', response);
    return [];
  };

  useEffect(() => {
    const fetchAllMasterData = async () => {
      try {
        const [custRes, prodRes, rmRes] = await Promise.all([
          fetch('http://localhost:3000/mock-data/customers'),
          fetch('http://localhost:3000/mock-data/products'),
          fetch('http://localhost:3000/mock-data/raw-materials')
        ]);
        
        const [custData, prodData, rmData] = await Promise.all([
          custRes.json(),
          prodRes.json(),
          rmRes.json()
        ]);

        // Use helper function to extract arrays safely
        setCustomers(extractApiData(custData));
        setProducts(extractApiData(prodData));
        setRawMaterials(extractApiData(rmData));

        console.log('[CreateRequest] Master data loaded:', {
          customers: extractApiData(custData).length,
          products: extractApiData(prodData).length,
          rawMaterials: extractApiData(rmData).length
        });

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
          const response = await fetch(`http://localhost:3000/mock-data/requests/${requestId}`);
          const requestData = extractApiData(await response.json());
          
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

  const handleAddToBoq = () => {
    if (!selectedRm || tempQty <= 0) return;
    
    const existingIndex = boqItems.findIndex(item => item.rmId === selectedRm.id);
    if (existingIndex !== -1) {
      setBoqItems(prev => prev.map((item, index) => 
        index === existingIndex ? { ...item, quantity: item.quantity + tempQty } : item
      ));
    } else {
      const newItem: BoqItem = {
        id: Date.now(),
        rmId: selectedRm.id,
        rmName: selectedRm.name,
        rmUnit: selectedRm.unit,
        quantity: tempQty,
      };
      setBoqItems(prev => [...prev, newItem]);
    }
    
    setSelectedRm(null);
    setRmSearch('');
    setTempQty(1);
  };

  const handleUpdateBoqQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setBoqItems(prev => prev.filter(item => item.id !== id));
    } else {
      setBoqItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleRemoveFromBoq = (id: number) => {
    setBoqItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCalculatePrice = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, boqItems })
      });
      
      const result = await response.json();
      const calculation = extractApiData(result);
      
      if (calculation && calculation.calculation) {
        setCalculationResult(calculation.calculation);
      }
    } catch (err) {
      setError('การคำนวณราคาล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const requestData = {
        formData,
        customerType,
        productType,
        boqItems,
        calculationResult
      };

      const url = requestId 
        ? `http://localhost:3000/mock-data/requests/${requestId}` 
        : 'http://localhost:3000/mock-data/requests';
      
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

  // Safe filtering with array validation
  const filteredCustomers = customerSearch && Array.isArray(customers)
    ? customers.filter(c => 
        (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
        (c.id && c.id.toLowerCase().includes(customerSearch.toLowerCase()))
      )
    : [];

  const filteredProducts = productSearch && Array.isArray(products)
    ? products.filter(p => 
        (p.name && p.name.toLowerCase().includes(productSearch.toLowerCase())) ||
        (p.id && p.id.toLowerCase().includes(productSearch.toLowerCase()))
      )
    : [];

  const filteredRawMaterials = rmSearch && Array.isArray(rawMaterials)
    ? rawMaterials.filter(rm =>
        (rm.name && rm.name.toLowerCase().includes(rmSearch.toLowerCase())) ||
        (rm.id && rm.id.toLowerCase().includes(rmSearch.toLowerCase()))
      )
    : [];

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
          <div className="flex items-center space-x-8 mb-6">
            <label className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                name="customer_type" 
                value="existing" 
                checked={customerType === 'existing'} 
                onChange={() => setCustomerType('existing')} 
                className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
              />
              <span className="ml-2 text-sm font-medium text-slate-700">ลูกค้าเดิม</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                name="customer_type" 
                value="new" 
                checked={customerType === 'new'} 
                onChange={() => setCustomerType('new')} 
                className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
              />
              <span className="ml-2 text-sm font-medium text-slate-700">ลูกค้าใหม่</span>
            </label>
          </div>

          {customerType === 'existing' ? (
            <div className="relative w-full md:w-1/2">
              <label htmlFor="customerId" className="block text-sm font-medium text-slate-700 mb-1">ค้นหาลูกค้า</label>
              <input 
                type="text" 
                id="customerId" 
                value={customerSearch}
                onChange={e => {
                  setCustomerSearch(e.target.value);
                  setFormData(prev => ({...prev, customerId: undefined, customerName: undefined}));
                }}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5" 
                placeholder="ค้นหาด้วย ID หรือชื่อ..." 
                autoComplete="off"
              />
              {customerSearch && filteredCustomers.length > 0 && !formData.customerId && (
                <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {filteredCustomers.map(customer => (
                    <li 
                      key={customer.id} 
                      onClick={() => {
                        setFormData(prev => ({...prev, customerId: customer.id, customerName: customer.name}));
                        setCustomerSearch(customer.name);
                      }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                    >
                      {customer.name} <span className="text-slate-400 text-xs">({customer.id})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="newCustomerName" className="block text-sm font-medium text-slate-700 mb-1">ชื่อบริษัท (ชั่วคราว)</label>
                <input 
                  type="text" 
                  id="newCustomerName" 
                  value={formData.newCustomerName || ''} 
                  onChange={e => handleFormChange('newCustomerName', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5" 
                  placeholder="ระบุชื่อลูกค้าใหม่" 
                />
              </div>
              <div>
                <label htmlFor="newCustomerContact" className="block text-sm font-medium text-slate-700 mb-1">ผู้ติดต่อ</label>
                <input 
                  type="text" 
                  id="newCustomerContact" 
                  value={formData.newCustomerContact || ''} 
                  onChange={e => handleFormChange('newCustomerContact', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5" 
                  placeholder="ชื่อผู้ติดต่อ" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 text-slate-800">2. ข้อมูลสินค้า</h2>
          <div className="flex items-center space-x-8 mb-6">
            <label className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                name="product_type" 
                value="existing" 
                checked={productType === 'existing'} 
                onChange={() => setProductType('existing')} 
                className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
              />
              <span className="ml-2 text-sm font-medium text-slate-700">สินค้าเดิม</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                name="product_type" 
                value="new" 
                checked={productType === 'new'} 
                onChange={() => setProductType('new')} 
                className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
              />
              <span className="ml-2 text-sm font-medium text-slate-700">สินค้าใหม่</span>
            </label>
          </div>

          {productType === 'existing' ? (
            <div className="relative w-full md:w-1/2">
              <label htmlFor="productId" className="block text-sm font-medium text-slate-700 mb-1">ค้นหาสินค้า</label>
              <input 
                type="text" 
                id="productId" 
                value={productSearch}
                onChange={e => {
                  setProductSearch(e.target.value);
                  setFormData(prev => ({...prev, productId: undefined, productName: undefined}));
                }}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5" 
                placeholder="ค้นหาด้วย FG Code หรือชื่อ..." 
                autoComplete="off"
              />
              {productSearch && filteredProducts.length > 0 && !formData.productId && (
                <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {filteredProducts.map(product => (
                    <li 
                      key={product.id} 
                      onClick={() => {
                        setFormData(prev => ({...prev, productId: product.id, productName: product.name}));
                        setProductSearch(product.name);
                      }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                    >
                      {product.name} <span className="text-slate-400 text-xs">({product.id})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="newProductName" className="block text-sm font-medium text-slate-700 mb-1">ชื่อสินค้า (ชั่วคราว)</label>
                <input 
                  type="text" 
                  id="newProductName" 
                  value={formData.newProductName || ''} 
                  onChange={e => handleFormChange('newProductName', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5" 
                  placeholder="ระบุชื่อสินค้าใหม่" 
                />
              </div>
              <div>
                <label htmlFor="newProductDrawing" className="block text-sm font-medium text-slate-700 mb-1">Drawing Number</label>
                <input 
                  type="text" 
                  id="newProductDrawing" 
                  value={formData.newProductDrawing || ''} 
                  onChange={e => handleFormChange('newProductDrawing', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5" 
                  placeholder="หมายเลขแบบ" 
                />
              </div>
            </div>
          )}
        </div>

        {/* BOQ Section - Only for new products */}
        {productType === 'new' && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-slate-800">3. รายการวัตถุดิบ (BOQ)</h2>
            
            {/* Add Raw Material */}
            <div className="bg-slate-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-4 text-slate-700">เพิ่มวัตถุดิบ</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">ค้นหาวัตถุดิบ</label>
                  <input 
                    type="text" 
                    value={rmSearch}
                    onChange={e => {
                      setRmSearch(e.target.value);
                      setSelectedRm(null);
                    }}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5" 
                    placeholder="ค้นหาด้วย RM Code หรือชื่อ..." 
                    autoComplete="off"
                  />
                  {rmSearch && filteredRawMaterials.length > 0 && !selectedRm && (
                    <ul className="absolute z-20 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                      {filteredRawMaterials.map(rm => (
                        <li 
                          key={rm.id} 
                          onClick={() => {
                            setSelectedRm(rm);
                            setRmSearch(rm.name);
                          }}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                        >
                          {rm.name} <span className="text-slate-400 text-xs">({rm.id} - {rm.unit})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">จำนวน</label>
                  <input 
                    type="number" 
                    value={tempQty}
                    onChange={e => setTempQty(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5" 
                    placeholder="1.00" 
                    step="0.01"
                    min="0.01"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="button" 
                    onClick={handleAddToBoq}
                    disabled={!selectedRm || tempQty <= 0}
                    className="w-full bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400"
                  >
                    เพิ่มในรายการ
                  </button>
                </div>
              </div>
            </div>

            {/* BOQ List */}
            {boqItems.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                      <th className="px-4 py-3">RM Code</th>
                      <th className="px-4 py-3">ชื่อวัตถุดิบ</th>
                      <th className="px-4 py-3">จำนวน</th>
                      <th className="px-4 py-3">หน่วย</th>
                      <th className="px-4 py-3">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boqItems.map(item => (
                      <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.rmId}</td>
                        <td className="px-4 py-3">{item.rmName}</td>
                        <td className="px-4 py-3">
                          <input 
                            type="number"
                            value={item.quantity}
                            onChange={e => handleUpdateBoqQuantity(item.id, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded p-1"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-3">{item.rmUnit}</td>
                        <td className="px-4 py-3">
                          <button 
                            type="button"
                            onClick={() => handleRemoveFromBoq(item.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Calculation Section */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 text-slate-800">4. การคำนวณราคา</h2>
          
          {calculationResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-green-800 mb-2">ผลการคำนวณ</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Base Price:</span>
                  <p className="font-semibold text-slate-900">{calculationResult.basePrice} {calculationResult.currency}</p>
                </div>
                <div>
                  <span className="text-slate-600">Selling Factor:</span>
                  <p className="font-semibold text-slate-900">{calculationResult.sellingFactor}x</p>
                </div>
                <div>
                  <span className="text-slate-600">Final Price:</span>
                  <p className="font-semibold text-green-700 text-lg">{calculationResult.finalPrice} {calculationResult.currency}</p>
                </div>
              </div>
            </div>
          )}
          
          <button 
            type="button" 
            onClick={handleCalculatePrice}
            disabled={isLoading}
            className="bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-green-700 transition-colors disabled:bg-slate-400 mr-4"
          >
            {isLoading ? 'กำลังคำนวณ...' : 'คำนวณราคา'}
          </button>
        </div>

        {/* Submit Section */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button 
              type="button" 
              onClick={onCancel}
              className="bg-slate-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-slate-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:bg-slate-400"
            >
              {isLoading ? (requestId ? 'กำลังอัปเดต...' : 'กำลังสร้าง...') : (requestId ? 'อัปเดตคำขอ' : 'สร้างคำขอ')}
            </button>
          </div>
        </div>
      </div>
    </form>