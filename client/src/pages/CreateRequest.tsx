import React, { useState } from 'react';

interface CreateRequestProps {
  onCancel: () => void;
}

interface FormData {
  customerId?: string;
  newCustomerName?: string;
  newCustomerContact?: string;
  productId?: string;
  newProductName?: string;
  newProductDrawing?: string;
}

// (ใหม่) สร้าง Interface สำหรับผลลัพธ์การคำนวณ
interface CalculationResult {
  basePrice: string;
  sellingFactor: number;
  finalPrice: string;
  currency: string;
}

const CreateRequest: React.FC<CreateRequestProps> = ({ onCancel }) => {
  const [customerType, setCustomerType] = useState<'existing' | 'new'>('existing');
  const [productType, setProductType] = useState<'existing' | 'new'>('existing');
  const [formData, setFormData] = useState<FormData>({});
  
  // (ใหม่) เพิ่ม State สำหรับจัดการ Loading, Error, และผลลัพธ์
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setCalculationResult(null);

    try {
      const response = await fetch('http://localhost:3000/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerType, productType, ...formData }),
      });

      if (!response.ok) {
        throw new Error('Calculation failed on the server.');
      }

      const result = await response.json();
      if (result.success && result.calculation) {
        setCalculationResult(result.calculation);
      } else {
        throw new Error(result.message || 'Invalid response from server.');
      }

    } catch (err) {
      setError('เกิดข้อผิดพลาดในการคำนวณราคา กรุณาลองใหม่อีกครั้ง');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">สร้างคำขอราคาใหม่</h1>
          <p className="text-slate-500">กรอกข้อมูลเพื่อคำนวณและส่งขออนุมัติราคา</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Section 1: Customer Information */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 text-slate-800">1. ข้อมูลลูกค้า</h2>
          {/* ... Customer Type Radio Buttons ... */}
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
            <div>
              <label htmlFor="customerId" className="block text-sm font-medium text-slate-700 mb-1">ค้นหาลูกค้า</label>
              <input type="text" id="customerId" name="customerId" onChange={handleInputChange} className="w-full md:w-1/2 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="ค้นหาด้วย Customer ID หรือชื่อ..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="newCustomerName" className="block text-sm font-medium text-slate-700 mb-1">ชื่อบริษัท (ชั่วคราว)</label>
                <input type="text" id="newCustomerName" name="newCustomerName" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="เช่น ABC Corporation" />
              </div>
              <div>
                <label htmlFor="newCustomerContact" className="block text-sm font-medium text-slate-700 mb-1">ผู้ติดต่อ (ชั่วคราว)</label>
                <input type="text" id="newCustomerContact" name="newCustomerContact" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="เช่น คุณสมศรี" />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Product Information */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 text-slate-800">2. ข้อมูลสินค้า</h2>
          {/* ... Product Type Radio Buttons ... */}
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
            <div>
              <label htmlFor="productId" className="block text-sm font-medium text-slate-700 mb-1">ค้นหาสินค้า (FG)</label>
              <input type="text" id="productId" name="productId" onChange={handleInputChange} className="w-full md:w-1/2 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="ค้นหาด้วย FG Code หรือชื่อ Part..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="newProductName" className="block text-sm font-medium text-slate-700 mb-1">Part Name</label>
                <input type="text" id="newProductName" name="newProductName" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" />
              </div>
              <div>
                <label htmlFor="newProductDrawing" className="block text-sm font-medium text-slate-700 mb-1">Drawing No.</label>
                <input type="text" id="newProductDrawing" name="newProductDrawing" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" />
              </div>
            </div>
          )}
        </div>

        {/* (ใหม่) Section 3: Calculation Result */}
        {calculationResult && (
          <div className="bg-blue-50 p-6 sm:p-8 rounded-xl border border-blue-200">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">3. ผลการคำนวณราคา</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-slate-600">Base Price:</div>
                <div className="text-right font-medium text-slate-800">{calculationResult.basePrice} {calculationResult.currency}</div>
                <div className="text-slate-600">Selling Factor:</div>
                <div className="text-right font-medium text-slate-800">x {calculationResult.sellingFactor}</div>
                <div className="font-bold text-slate-800 text-lg border-t pt-4 mt-2">Final Price:</div>
                <div className="font-bold text-blue-600 text-lg text-right border-t pt-4 mt-2">{calculationResult.finalPrice} {calculationResult.currency}</div>
            </div>
          </div>
        )}
        
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="bg-white text-slate-700 font-semibold px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors duration-200"
          >
            ยกเลิก
          </button>
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'กำลังคำนวณ...' : 'คำนวณและส่งขออนุมัติ'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CreateRequest;
