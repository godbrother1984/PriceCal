// path: client/src/components/BOQEditor.tsx
// version: 1.0 (BOQ Editor - Create/Edit BOQ for PriceCal Products)
// last-modified: 14 ตุลาคม 2568 16:20

import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface BOQItem {
  id?: string;
  productId: string;
  rawMaterialId: string;
  rawMaterialName?: string;
  rawMaterialCode?: string;
  quantity: number;
  unit: string;
  notes?: string;
  bomSource: string;
  isEditable: boolean;
}

interface Product {
  id: string;
  name: string;
  code: string;
  productSource?: string;
}

interface RawMaterial {
  id: string;
  name: string;
  code: string;
  unit: string;
}

const BOQEditor: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rmSearchTerm, setRmSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // New BOQ Item Form
  const [newItem, setNewItem] = useState<Partial<BOQItem>>({
    rawMaterialId: '',
    quantity: 0,
    unit: 'unit',
    notes: '',
  });

  useEffect(() => {
    loadProducts();
    loadRawMaterials();
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
        // Filter only PriceCal products (editable)
        const allProducts = response.data.data || [];
        const editableProducts = allProducts.filter(
          (p: Product) => p.productSource === 'PRICECAL' || !p.productSource
        );
        setProducts(editableProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadRawMaterials = async () => {
    try {
      const response = await api.get('/api/data/raw-materials');
      if (response.data.success) {
        setRawMaterials(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading raw materials:', error);
    }
  };

  const loadBOQ = async (productId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/bom/product/${productId}`);
      if (response.data.success) {
        // Filter only editable BOQ items
        const allItems = response.data.data || [];
        const editableItems = allItems.filter((item: BOQItem) => item.isEditable);
        setBoqItems(editableItems);
      }
    } catch (error) {
      console.error('Error loading BOQ:', error);
      setBoqItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.rawMaterialId || newItem.quantity === 0) {
      alert('กรุณาเลือก Raw Material และระบุ Quantity');
      return;
    }

    const rm = rawMaterials.find((r) => r.id === newItem.rawMaterialId);
    if (!rm) return;

    const item: BOQItem = {
      productId: selectedProductId,
      rawMaterialId: newItem.rawMaterialId!,
      rawMaterialName: rm.name,
      rawMaterialCode: rm.code,
      quantity: newItem.quantity!,
      unit: newItem.unit || rm.unit,
      notes: newItem.notes || '',
      bomSource: 'PRICECAL',
      isEditable: true,
    };

    if (editingIndex !== null) {
      // Update existing item
      const updated = [...boqItems];
      updated[editingIndex] = item;
      setBoqItems(updated);
      setEditingIndex(null);
    } else {
      // Add new item
      setBoqItems([...boqItems, item]);
    }

    // Reset form
    setNewItem({
      rawMaterialId: '',
      quantity: 0,
      unit: 'unit',
      notes: '',
    });
    setShowAddModal(false);
  };

  const handleEditItem = (index: number) => {
    const item = boqItems[index];
    setNewItem({
      rawMaterialId: item.rawMaterialId,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes,
    });
    setEditingIndex(index);
    setShowAddModal(true);
  };

  const handleDeleteItem = (index: number) => {
    if (confirm('คุณต้องการลบ BOQ item นี้หรือไม่?')) {
      const updated = boqItems.filter((_, i) => i !== index);
      setBoqItems(updated);
    }
  };

  const handleSaveBOQ = async () => {
    if (!selectedProductId) {
      alert('กรุณาเลือก Product');
      return;
    }

    if (boqItems.length === 0) {
      alert('กรุณาเพิ่ม BOQ items อย่างน้อย 1 รายการ');
      return;
    }

    setSaving(true);
    try {
      // Save all BOQ items
      const promises = boqItems.map((item) => {
        if (item.id) {
          // Update existing
          return api.put(`/api/bom/${item.id}`, item);
        } else {
          // Create new
          return api.post('/api/bom', item);
        }
      });

      await Promise.all(promises);

      alert('บันทึก BOQ สำเร็จ!');
      await loadBOQ(selectedProductId); // Reload
    } catch (error: any) {
      console.error('Error saving BOQ:', error);
      alert(`บันทึกไม่สำเร็จ: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyBOQ = async () => {
    if (!selectedProductId) return;

    const copyFromId = prompt('ใส่ Product ID ที่ต้องการ Copy BOQ มา:');
    if (!copyFromId) return;

    setLoading(true);
    try {
      const response = await api.post('/api/bom/copy', {
        sourceProductId: copyFromId,
        targetProductId: selectedProductId,
      });

      if (response.data.success) {
        alert(`Copy BOQ สำเร็จ! (${response.data.data.copiedCount} items)`);
        await loadBOQ(selectedProductId);
      }
    } catch (error: any) {
      console.error('Error copying BOQ:', error);
      alert(`Copy ไม่สำเร็จ: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRM = rawMaterials.filter(
    (rm) =>
      rm.name?.toLowerCase().includes(rmSearchTerm.toLowerCase()) ||
      rm.code?.toLowerCase().includes(rmSearchTerm.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">✏️ BOQ Editor</h3>
        <p className="text-sm text-slate-600">
          สร้างและแก้ไข BOQ สำหรับ Finished Goods ที่สร้างใน PriceCal (สามารถแก้ไขได้)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-slate-200">
              <h4 className="font-semibold mb-3">Select Product (PriceCal Only)</h4>
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
                  No editable products found
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                        selectedProductId === product.id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : ''
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.code}</div>
                      <div className="mt-2">
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                          Editable
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOQ Editor */}
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <p className="text-lg font-medium mb-2">No Product Selected</p>
                <p className="text-sm">เลือก Product จากรายการด้านซ้ายเพื่อแก้ไข BOQ</p>
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
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ➕ Add BOQ Item
                    </button>
                    <button
                      onClick={handleCopyBOQ}
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      📋 Copy from Another Product
                    </button>
                    <button
                      onClick={handleSaveBOQ}
                      disabled={saving || boqItems.length === 0}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors ml-auto"
                    >
                      {saving ? 'Saving...' : '💾 Save BOQ'}
                    </button>
                  </div>
                </div>

                {/* BOQ Items */}
                <div className="p-6">
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
                      <p className="text-sm mb-4">
                        เริ่มสร้าง BOQ โดยคลิก "Add BOQ Item" หรือ "Copy from Another Product"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {boqItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {item.rawMaterialName || item.rawMaterialId}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.rawMaterialCode}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">
                              {parseFloat(item.quantity.toString()).toFixed(4)}
                            </div>
                            <div className="text-xs text-slate-500">{item.unit}</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-slate-600">{item.notes || '-'}</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditItem(index)}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(index)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">
                {editingIndex !== null ? 'Edit BOQ Item' : 'Add BOQ Item'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Raw Material Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Raw Material
                </label>
                <input
                  type="text"
                  placeholder="Search raw materials..."
                  value={rmSearchTerm}
                  onChange={(e) => setRmSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                  {filteredRM.map((rm) => (
                    <button
                      key={rm.id}
                      onClick={() => {
                        setNewItem({ ...newItem, rawMaterialId: rm.id, unit: rm.unit });
                        setRmSearchTerm('');
                      }}
                      className={`w-full p-3 text-left hover:bg-slate-50 border-b border-slate-100 ${
                        newItem.rawMaterialId === rm.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium text-sm">{rm.name}</div>
                      <div className="text-xs text-slate-500">
                        {rm.code} | Unit: {rm.unit}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={newItem.quantity || 0}
                  onChange={(e) =>
                    setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  value={newItem.unit || ''}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={newItem.notes || ''}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingIndex(null);
                  setNewItem({
                    rawMaterialId: '',
                    quantity: 0,
                    unit: 'unit',
                    notes: '',
                  });
                }}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingIndex !== null ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOQEditor;
