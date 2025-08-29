// path: client/src/pages/CreateRequest.tsx
// version: 2.3 (Data Population Fix)
// last-modified: 29 สิงหาคม 2568 14:40

import React, { useState, useEffect } from 'react';

// --- Interfaces ---
interface CreateRequestProps {
  onCancel: () => void;
  onSuccess: () => void;
  requestId: string | null;
}
interface FormData {
  customerId?: string; customerName?: string;
  newCustomerName?: string; newCustomerContact?: string;
  productId?: string; productName?: string;
  newProductName?: string; newProductDrawing?: string;
}
interface BoqItem {
  id: number;
  rmId: string;
  rmName: string;
  rmUnit: string;
  quantity: number;
}
interface CalculationResult {
  basePrice: string; sellingFactor: number; finalPrice: string; currency: string;
}
interface Customer {
  id: string; name: string;
}
interface Product {
  id: string; name: string;
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

  useEffect(() => {
    const fetchAllMasterData = async () => {
      try {
        const [custRes, prodRes, rmRes] = await Promise.all([
          fetch('http://localhost:3000/mock-data/customers'),
          fetch('http://localhost:3000/mock-data/products'),
          fetch('http://localhost:3000/mock-data/raw-materials')
        ]);
        setCustomers(await custRes.json());
        setProducts(await prodRes.json());
        setRawMaterials(await rmRes.json());
      } catch (err) {
        console.error("Failed to fetch master data", err);
        setError("Could not load master data.");
      }
    };
    
    const fetchRequestData = async (id: string) => {
      console.log("Editing request with ID:", id);
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/mock-data/requests/${id}`);
        if (!res.ok) throw new Error('Request not found');
        const data = await res.json();
        
        const initialFormData: FormData = data.formData || {};
        setFormData(initialFormData);
        
        if(data.customerType === 'existing' && initialFormData.customerName) {
          setCustomerType('existing');
          setCustomerSearch(initialFormData.customerName);
        } else {
          setCustomerType('new');
        }

        if(data.productType === 'existing' && initialFormData.productName) {
          setProductType('existing');
          setProductSearch(initialFormData.productName);
        } else {
          setProductType('new');
        }

        setBoqItems(data.boqItems || []);
        setCalculationResult(data.calculationResult || null);

      } catch (err) {
        console.error("Failed to fetch request data", err);
        setError(`Could not load data for request ${id}.`);
        onCancel();
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMasterData();
    if (requestId) {
      fetchRequestData(requestId);
    }
  }, [requestId, onCancel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBoqItem = () => {
    if (!selectedRm || tempQty <= 0) {
      alert('Please select a valid Raw Material and quantity.');
      return;
    }
    setBoqItems([...boqItems, { 
      id: Date.now(), 
      rmId: selectedRm.id,
      rmName: selectedRm.name,
      rmUnit: selectedRm.unit,
      quantity: tempQty 
    }]);
    setRmSearch('');
    setSelectedRm(null);
    setTempQty(1);
  };

  const handleBoqQuantityChange = (id: number, newQuantity: number) => {
    setBoqItems(boqItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemoveBoqItem = (id: number) => {
    setBoqItems(boqItems.filter(item => item.id !== id));
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3000/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, boq: boqItems }),
      });
      if (!response.ok) throw new Error('Calculation failed');
      const result = await response.json();
      setCalculationResult(result.calculation);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการคำนวณราคา');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateOrUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = requestId ? `http://localhost:3000/mock-data/requests/${requestId}` : 'http://localhost:3000/mock-data/requests';
    const method = requestId ? 'PUT' : 'POST';

    setIsLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, customerType, productType, boqItems, calculationResult }),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'Operation failed');
      }
      
      alert(`Price Request ${requestId ? 'Updated' : 'Created'} Successfully!`);
      onSuccess();
    } catch (err) {
      setError(`Failed to ${requestId ? 'update' : 'create'} the price request.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredCustomers = customerSearch
    ? customers.filter(c => 
        (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
        (c.id && c.id.toLowerCase().includes(customerSearch.toLowerCase()))
      )
    : [];
  const filteredProducts = productSearch
    ? products.filter(p => 
        (p.name && p.name.toLowerCase().includes(productSearch.toLowerCase())) ||
        (p.id && p.id.toLowerCase().includes(productSearch.toLowerCase()))
      )
    : [];
  const filteredRawMaterials = rmSearch
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

      <div className="space-y-8">
        {/* Customer Info */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-slate-800">1. ข้อมูลลูกค้า</h2>
            <div className="flex items-center space-x-8 mb-6">
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="customer_type" value="existing" checked={customerType === 'existing'} onChange={() => setCustomerType('existing')} className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                <span className="ml-2 text-sm font-medium text-slate-700">ลูกค้าเดิม</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="customer_type" value="new" checked={customerType === 'new'} onChange={() => setCustomerType('new')} className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
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
                  <input type="text" id="newCustomerName" name="newCustomerName" value={formData.newCustomerName || ''} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="เช่น ABC Corporation" />
                </div>
                <div>
                  <label htmlFor="newCustomerContact" className="block text-sm font-medium text-slate-700 mb-1">ผู้ติดต่อ (ชั่วคราว)</label>
                  <input type="text" id="newCustomerContact" name="newCustomerContact" value={formData.newCustomerContact || ''} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="เช่น คุณสมศรี" />
                </div>
              </div>
            )}
        </div>
        
        {/* Product Info */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-slate-800">2. ข้อมูลสินค้า</h2>
            <div className="flex items-center space-x-8 mb-6">
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="product_type" value="existing" checked={productType === 'existing'} onChange={() => setProductType('existing')} className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                <span className="ml-2 text-sm font-medium text-slate-700">สินค้าเดิม</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="product_type" value="new" checked={productType === 'new'} onChange={() => setProductType('new')} className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                <span className="ml-2 text-sm font-medium text-slate-700">สินค้าใหม่</span>
              </label>
            </div>
            {productType === 'existing' ? (
              <div className="relative w-full md:w-1/2">
                <label htmlFor="productId" className="block text-sm font-medium text-slate-700 mb-1">ค้นหาสินค้า (FG)</label>
                <input 
                  type="text" 
                  id="productId" 
                  value={productSearch}
                  onChange={e => {
                      setProductSearch(e.target.value);
                      setFormData(prev => ({...prev, productId: undefined, productName: undefined}));
                  }}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5" 
                  placeholder="ค้นหาด้วย FG Code หรือชื่อ Part..." 
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
                    <label htmlFor="newProductName" className="block text-sm font-medium text-slate-700 mb-1">Part Name</label>
                    <input type="text" id="newProductName" name="newProductName" value={formData.newProductName || ''} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" />
                  </div>
                  <div>
                    <label htmlFor="newProductDrawing" className="block text-sm font-medium text-slate-700 mb-1">Drawing No.</label>
                    <input type="text" id="newProductDrawing" name="newProductDrawing" value={formData.newProductDrawing || ''} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" />
                  </div>
              </div>
            )}
        </div>

        {/* --- BOQ Section (only for new products) --- */}
        {productType === 'new' && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-slate-800">2.1 Bill of Quantities (BOQ)</h2>
            <div className="mb-4">
              {boqItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-slate-500 px-2">
                    <div className="col-span-2">RM Name</div>
                    <div>Quantity</div>
                    <div>Unit</div>
                    <div></div>
                  </div>
                  <ul className="divide-y divide-slate-200">
                    {boqItems.map(item => (
                      <li key={item.id} className="py-2 grid grid-cols-5 gap-4 items-center px-2">
                        <div className="col-span-2">
                          <p className="font-medium text-slate-800">{item.rmName}</p>
                          <p className="font-mono text-xs text-slate-500">{item.rmId}</p>
                        </div>
                        <input 
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleBoqQuantityChange(item.id, Number(e.target.value))}
                          className="w-24 p-1.5 border border-slate-300 rounded-md bg-slate-50 text-sm"
                        />
                        <span className="text-sm text-slate-600">{item.rmUnit}</span>
                        <button type="button" onClick={() => handleRemoveBoqItem(item.id)} className="text-slate-400 hover:text-red-500 justify-self-end">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09a2.09 2.09 0 00-2.09 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : <p className="text-slate-500 text-sm italic">No items added to BOQ.</p>}
            </div>
            <div className="flex items-end gap-4 pt-4 border-t border-slate-200">
              <div className="flex-grow relative">
                <label className="block text-sm font-medium text-slate-700">ค้นหา Raw Material</label>
                <input 
                  type="text" 
                  value={rmSearch} 
                  onChange={e => {
                    setRmSearch(e.target.value);
                    setSelectedRm(null);
                  }}
                  className="w-full p-2 border border-slate-300 rounded mt-1 bg-slate-50"
                  placeholder="ค้นหาด้วย ID หรือชื่อ..."
                  autoComplete="off"
                />
                {rmSearch && filteredRawMaterials.length > 0 && !selectedRm && (
                  <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {filteredRawMaterials.map(rm => (
                      <li
                        key={rm.id}
                        onClick={() => {
                          setSelectedRm(rm);
                          setRmSearch(`${rm.name} (${rm.id})`);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                      >
                        {rm.name} <span className="text-slate-400 text-xs">({rm.id})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Quantity</label>
                <input type="number" value={tempQty} onChange={e => setTempQty(Number(e.target.value))} className="w-24 p-2 border border-slate-300 rounded mt-1 bg-slate-50" />
              </div>
              <button type="button" onClick={handleAddBoqItem} className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">Add</button>
            </div>
          </div>
        )}

        {/* --- Calculation Result Section --- */}
        {calculationResult && (
          <div className="bg-blue-50 p-6 sm:p-8 rounded-xl border border-blue-200">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">3. ผลการคำนวณราคา</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-slate-600">Base Price:</div>
                <div className="text-right font-medium text-slate-800">{calculationResult.basePrice} {calculationResult.currency}</div>
                <div className="text-slate-600">Selling Factor:</div>
                <div className="text-right font-medium text-slate-800">x {calculationResult.sellingFactor}</div>
                <div className="font-bold text-slate-800 text-lg border-t border-slate-300 pt-4 mt-2">Final Price:</div>
                <div className="font-bold text-blue-600 text-lg text-right border-t border-slate-300 pt-4 mt-2">{calculationResult.finalPrice} {calculationResult.currency}</div>
            </div>
          </div>
        )}
        
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* --- Action Buttons --- */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-4">
          <button type="button" onClick={onCancel} className="bg-white text-slate-700 font-semibold px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors">ยกเลิก</button>
          <button type="button" onClick={handleCalculate} disabled={isLoading} className="bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-green-700 transition-colors disabled:bg-slate-400">
            {isLoading ? 'กำลังคำนวณ...' : 'คำนวณราคา'}
          </button>
          <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:bg-slate-400">
            {isLoading ? (requestId ? 'Updating...' : 'Creating...') : (requestId ? 'Update Request' : 'Create Request')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CreateRequest;

