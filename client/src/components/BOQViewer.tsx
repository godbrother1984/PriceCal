// path: client/src/components/BOQViewer.tsx
// version: 1.1 (Add Item Status Badge)
// last-modified: 21 ตุลาคม 2568 14:35

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ItemStatusBadge from './ItemStatusBadge';

interface BOQItem {
  id: string;
  productId: string;
  productName?: string;
  rawMaterialId: string;
  rawMaterialName?: string;
  quantity: number;
  unit: string;
  notes?: string;
  bomSource: string; // 'D365' | 'PRICECAL'
  isEditable: boolean;
  isSyncedToD365: boolean;
  source?: string; // 'D365' | 'MongoDB' | 'PRICECAL'
}

interface Product {
  id: string;
  name: string;
  code: string;
  hasBOQ: boolean;
  productSource?: string;
  itemStatus?: string; // 'AVAILABLE' | 'IN_USE' | 'MAPPED' | 'REPLACED' | 'PRODUCTION'
}

const BOQViewer: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadBOQ(selectedProductId);
    }
  }, [selectedProductId]);

  const loadProducts = async () => {
    try {
      const response = await api.get('/api/data/products');
      if (response.data.success) {
        setProducts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadBOQ = async (productId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/bom/product/${productId}`);
      if (response.data.success) {
        setBoqItems(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading BOQ:', error);
      setBoqItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const getSourceBadge = (item: BOQItem) => {
    if (item.bomSource === 'D365') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
          📦 D365 {!item.isEditable && '(Read-only)'}
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
          ✏️ PriceCal {item.isEditable && '(Editable)'}
        </span>
      );
    }
  };

  const getTotalQuantity = () => {
    return boqItems.reduce((sum, item) => sum + parseFloat(item.quantity.toString()), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">📋 BOQ Viewer</h3>
        <p className="text-sm text-slate-600">
          ดูรายการ Bill of Quantities (BOQ) สำหรับ Finished Goods จาก D365 และ PriceCal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-slate-200">
              <h4 className="font-semibold mb-3">Select Product</h4>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No products found
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                        selectedProductId === product.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.code}</div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {product.hasBOQ && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                            Has BOQ
                          </span>
                        )}

                        {/* Item Status Badge */}
                        {product.itemStatus && (
                          <ItemStatusBadge status={product.itemStatus} size="sm" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOQ Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {!selectedProductId ? (
              <div className="p-12 text-center text-slate-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-lg font-medium mb-2">No Product Selected</p>
                <p className="text-sm">เลือก Product จากรายการด้านซ้ายเพื่อดู BOQ</p>
              </div>
            ) : (
              <>
                {/* BOQ Header */}
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold mb-1">
                        {selectedProduct?.name}
                      </h4>
                      <p className="text-sm text-slate-600">
                        Code: {selectedProduct?.code}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      {selectedProduct?.productSource && (
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded ${
                            selectedProduct.productSource === 'D365'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {selectedProduct.productSource}
                        </span>
                      )}

                      {/* Item Status Badge */}
                      {selectedProduct?.itemStatus && (
                        <ItemStatusBadge status={selectedProduct.itemStatus} size="md" />
                      )}
                    </div>
                  </div>

                  {boqItems.length > 0 && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-600">
                        Total Items: <strong>{boqItems.length}</strong>
                      </span>
                      <span className="text-slate-600">
                        Total Quantity: <strong>{getTotalQuantity().toFixed(4)}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* BOQ Table */}
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-12 text-center">
                      <svg
                        className="animate-spin h-8 w-8 mx-auto text-blue-600"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="mt-4 text-slate-600">Loading BOQ...</p>
                    </div>
                  ) : boqItems.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                      <p className="text-lg font-medium mb-2">No BOQ Items</p>
                      <p className="text-sm">
                        This product doesn't have any BOQ items yet.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                            Raw Material
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-700 uppercase">
                            Unit
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-700 uppercase">
                            Source
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {boqItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-slate-900">
                                {item.rawMaterialName || item.rawMaterialId}
                              </div>
                              <div className="text-xs text-slate-500">
                                {item.rawMaterialId}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                              {parseFloat(item.quantity.toString()).toFixed(4)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                                {item.unit}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {getSourceBadge(item)}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {item.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOQViewer;
