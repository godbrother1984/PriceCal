// path: client/src/pages/FormulaManagement.tsx
// version: 3.0 (Add Formula Library - Multiple Formulas)
// last-modified: 23 ตุลาคม 2568 12:20

import React, { useState, useEffect } from 'react';
import api from '../services/api';

type FormulaTab = 'base' | 'library' | 'rules' | 'variables';

// Available formula variables
const FORMULA_VARIABLES = [
  { id: 'materialCost', label: 'Material Cost', description: 'ต้นทุนวัตถุดิบ', color: 'blue' },
  { id: 'fabCost', label: 'FAB Cost', description: 'ค่าผลิต', color: 'green' },
  { id: 'overhead', label: 'Overhead', description: 'ค่าใช้จ่ายโรงงาน', color: 'yellow' },
  { id: 'sellingFactor', label: 'Selling Factor', description: 'ค่าคูณขาย', color: 'purple' },
  { id: 'margin', label: 'Margin %', description: 'กำไรขั้นต้น', color: 'pink' },
  { id: 'discount', label: 'Discount %', description: 'ส่วนลด', color: 'red' },
];

const FORMULA_OPERATORS = [
  { symbol: '+', label: 'บวก' },
  { symbol: '-', label: 'ลบ' },
  { symbol: '×', label: 'คูณ' },
  { symbol: '÷', label: 'หาร' },
  { symbol: '(', label: 'วงเล็บเปิด' },
  { symbol: ')', label: 'วงเล็บปิด' },
];

// Formula Templates
const FORMULA_TEMPLATES = [
  {
    name: 'สูตรมาตรฐาน (Standard)',
    formula: '( Material Cost + FAB Cost + Overhead ) × Selling Factor',
    description: 'สูตรพื้นฐานที่ใช้กันทั่วไป',
  },
  {
    name: 'รวม Margin %',
    formula: '( Material Cost + FAB Cost + Overhead ) × ( 1 + Margin % ) × Selling Factor',
    description: 'สูตรที่รวมกำไรขั้นต้นเข้าไปด้วย',
  },
  {
    name: 'หัก Discount %',
    formula: '( Material Cost + FAB Cost + Overhead ) × Selling Factor × ( 1 - Discount % )',
    description: 'สูตรที่หักส่วนลดออก',
  },
  {
    name: 'เฉพาะ Material + FAB',
    formula: '( Material Cost + FAB Cost ) × Selling Factor',
    description: 'ไม่นับ Overhead',
  },
];

// --- Formula Library (Multiple Formulas) ---
const FormulaLibrary: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formulaExpression, setFormulaExpression] = useState('');
  const [formula, setFormula] = useState<any>({ enabled: true, expression: '' });

  useEffect(() => {
    loadFormula();
  }, []);

  const loadFormula = async () => {
    try {
      const response = await api.get('/api/data/system-config/baseFormula');
      const data = response.data;
      if (data && data.value) {
        const savedFormula = JSON.parse(data.value);
        setFormula(savedFormula);
        setFormulaExpression(savedFormula.expression || '');
      }
    } catch (error) {
      console.error('Failed to load base formula:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertVariable = (variable: string) => {
    setFormulaExpression((prev) => prev + ' ' + variable);
  };

  const handleInsertOperator = (operator: string) => {
    setFormulaExpression((prev) => prev + ' ' + operator);
  };

  const handleClearFormula = () => {
    setFormulaExpression('');
  };

  const handleBackspace = () => {
    setFormulaExpression((prev) => {
      const trimmed = prev.trim();
      const lastSpaceIndex = trimmed.lastIndexOf(' ');
      return lastSpaceIndex === -1 ? '' : trimmed.substring(0, lastSpaceIndex);
    });
  };

  const handleLoadTemplate = (templateFormula: string) => {
    setFormulaExpression(templateFormula);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedFormula = {
        ...formula,
        expression: formulaExpression,
      };

      await api.put('/api/data/system-config/baseFormula', {
        value: JSON.stringify(updatedFormula),
        description: 'Base pricing formula configuration',
      });

      setFormula(updatedFormula);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Failed to save formula:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกสูตร');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">🧮 Base Pricing Formula</h3>
        <p className="text-sm text-blue-700">
          กำหนดสูตรพื้นฐานสำหรับการคำนวณราคาสินค้า สูตรนี้จะถูกใช้เป็นฐานในการคำนวณทุกครั้ง
        </p>
      </div>

      {loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          กำลังโหลดข้อมูล...
        </div>
      )}

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          ✅ บันทึกสูตรเรียบร้อยแล้ว
        </div>
      )}

      {/* Formula Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="space-y-6">
          {/* Formula Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ชื่อสูตร
            </label>
            <input
              type="text"
              value={formula.name}
              onChange={(e) => setFormula({ ...formula, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              คำอธิบาย
            </label>
            <textarea
              value={formula.description}
              onChange={(e) => setFormula({ ...formula, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Visual Formula Builder */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              🧮 Formula Builder
            </label>

            {/* Formula Templates */}
            <div className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span className="text-sm font-bold text-indigo-900">📋 เลือกสูตรสำเร็จรูป (Templates)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {FORMULA_TEMPLATES.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleLoadTemplate(template.formula)}
                    className="text-left p-3 bg-white border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-md transition-all"
                  >
                    <div className="font-semibold text-sm text-indigo-900 mb-1">{template.name}</div>
                    <div className="text-xs text-slate-600 mb-2">{template.description}</div>
                    <code className="text-[10px] text-slate-500 font-mono block truncate">{template.formula}</code>
                  </button>
                ))}
              </div>
            </div>

            {/* Formula Display */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-blue-300 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-600 font-semibold">สูตรปัจจุบัน:</div>
                <button
                  onClick={handleClearFormula}
                  className="text-xs px-3 py-1 bg-red-100 border border-red-300 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ล้าง
                </button>
              </div>
              <div className="bg-white border border-slate-300 rounded-lg p-4 min-h-[80px] flex items-center justify-center">
                <code className="text-xl font-mono text-slate-900 text-center break-all">
                  {formulaExpression || '(เลือก Template หรือคลิกปุ่มด้านล่างเพื่อสร้างสูตร)'}
                </code>
              </div>
            </div>

            {/* Variable Buttons */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-600 uppercase mb-2">📦 ตัวแปร (Variables)</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {FORMULA_VARIABLES.map((variable) => (
                  <button
                    key={variable.id}
                    onClick={() => handleInsertVariable(variable.label)}
                    className={`px-4 py-3 rounded-lg border-2 text-left transition-all hover:scale-105 hover:shadow-md ${
                      variable.color === 'blue' ? 'bg-blue-50 border-blue-300 hover:bg-blue-100' :
                      variable.color === 'green' ? 'bg-green-50 border-green-300 hover:bg-green-100' :
                      variable.color === 'yellow' ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100' :
                      variable.color === 'purple' ? 'bg-purple-50 border-purple-300 hover:bg-purple-100' :
                      variable.color === 'pink' ? 'bg-pink-50 border-pink-300 hover:bg-pink-100' :
                      'bg-red-50 border-red-300 hover:bg-red-100'
                    }`}
                  >
                    <div className="font-semibold text-sm text-slate-900">{variable.label}</div>
                    <div className="text-xs text-slate-600 mt-1">{variable.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Operator Buttons */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-600 uppercase mb-2">🔢 ตัวดำเนินการ (Operators)</div>
              <div className="flex gap-2 flex-wrap">
                {FORMULA_OPERATORS.map((operator) => (
                  <button
                    key={operator.symbol}
                    onClick={() => handleInsertOperator(operator.symbol)}
                    className="px-6 py-3 bg-slate-100 border-2 border-slate-300 rounded-lg font-bold text-lg hover:bg-slate-200 hover:scale-110 transition-all"
                    title={operator.label}
                  >
                    {operator.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-600 uppercase mb-2">⚙️ การจัดการ (Controls)</div>
              <div className="flex gap-2">
                <button
                  onClick={handleBackspace}
                  className="flex-1 px-4 py-3 bg-orange-100 border-2 border-orange-300 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                  </svg>
                  ลบย้อนกลับ
                </button>
              </div>
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <div className="font-semibold text-slate-900">เปิดใช้งานสูตรนี้</div>
              <div className="text-sm text-slate-600">ปิดเพื่อหยุดการคำนวณด้วยสูตรนี้ชั่วคราว</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formula.enabled}
                onChange={(e) => setFormula({ ...formula, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? 'กำลังบันทึก...' : '💾 บันทึกสูตร'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-2">💡 หมายเหตุ:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>สูตรพื้นฐานนี้จะใช้กับทุก Request ที่ไม่มี Custom Rules</li>
              <li>Hybrid System สามารถ Override ค่าต่างๆ ด้วย Pricing Rules ได้</li>
              <li>การเปลี่ยนแปลงสูตรจะมีผลทันทีกับการคำนวณครั้งถัดไป</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Pricing Rules Management ---
const PricingRulesManagement: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await api.get('/api/data/pricing-rules');
      setRules(response.data);
    } catch (error) {
      console.error('Failed to load pricing rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setEditingRule({
      id: null,
      name: '',
      description: '',
      priority: 50,
      isActive: true,
      conditions: {
        customerGroupId: '',
        productId: '',
        quantityMin: null,
        quantityMax: null,
      },
      variableOverrides: {},
      variableAdjustments: {},
    });
  };

  const handleSaveRule = async () => {
    try {
      if (editingRule.id) {
        // Update existing rule
        await api.put(`/api/data/pricing-rules/${editingRule.id}`, editingRule);
      } else {
        // Create new rule
        await api.post('/api/data/pricing-rules', editingRule);
      }
      setEditingRule(null);
      loadRules();
    } catch (error: any) {
      console.error('Failed to save rule:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก Rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('คุณต้องการลบ Rule นี้ใช่หรือไม่?')) return;

    try {
      await api.delete(`/api/data/pricing-rules/${ruleId}`);
      loadRules();
    } catch (error: any) {
      console.error('Failed to delete rule:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ Rule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-purple-900 mb-2">🎯 Pricing Rules (Hybrid System)</h3>
            <p className="text-sm text-purple-700">
              กำหนดกฎพิเศษสำหรับการคำนวณราคาตามเงื่อนไขต่างๆ เช่น กลุ่มลูกค้า, ปริมาณสั่งซื้อ, สินค้าพิเศษ
            </p>
          </div>
          <button
            onClick={handleCreateRule}
            className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            สร้าง Rule ใหม่
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          กำลังโหลดข้อมูล Rules...
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {rules.length === 0 && !loading && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-slate-600">ยังไม่มี Pricing Rules</div>
            <div className="text-sm text-slate-500 mt-1">คลิก "สร้าง Rule ใหม่" เพื่อเริ่มต้น</div>
          </div>
        )}

        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded text-sm font-bold">
                    P{rule.priority}
                  </span>
                  <h4 className="font-semibold text-slate-900">{rule.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    rule.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {rule.isActive ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{rule.description}</p>

                <div className="flex gap-4 text-xs text-slate-500">
                  {rule.conditions.customerGroupId && (
                    <span>👥 Customer Group: {rule.conditions.customerGroupId}</span>
                  )}
                  {rule.conditions.productId && (
                    <span>📦 Product: {rule.conditions.productId}</span>
                  )}
                  {rule.conditions.quantityMin && (
                    <span>📊 Qty: {rule.conditions.quantityMin}+</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => setEditingRule(rule)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                >
                  ✏️ แก้ไข
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                >
                  🗑️ ลบ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">
                {editingRule.id ? 'แก้ไข Pricing Rule' : 'สร้าง Pricing Rule ใหม่'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Rule Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ชื่อ Rule
                </label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="เช่น VIP Customer Discount"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="อธิบายว่า Rule นี้ใช้งานยังไง"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Priority (1-100) - ยิ่งสูงยิ่งถูกใช้ก่อน
                </label>
                <input
                  type="number"
                  value={editingRule.priority}
                  onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) })}
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Conditions */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">เงื่อนไข (Conditions)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Customer Group ID
                    </label>
                    <input
                      type="text"
                      value={editingRule.conditions.customerGroupId || ''}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        conditions: { ...editingRule.conditions, customerGroupId: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-purple-500"
                      placeholder="CG-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Product ID
                    </label>
                    <input
                      type="text"
                      value={editingRule.conditions.productId || ''}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        conditions: { ...editingRule.conditions, productId: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-purple-500"
                      placeholder="PROD-001"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">เปิดใช้งาน Rule นี้</span>
                <input
                  type="checkbox"
                  checked={editingRule.isActive}
                  onChange={(e) => setEditingRule({ ...editingRule, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveRule}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                💾 บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Formula Variables Configuration ---
const FormulaVariablesConfig: React.FC = () => {
  const [variables, setVariables] = useState({
    overhead: {
      name: 'Overhead Cost',
      value: 0,
      unit: 'USD',
      description: 'ค่าใช้จ่ายโรงงาน (ไฟฟ้า, น้ำ, ค่าเช่า, etc.)',
    },
    defaultMargin: {
      name: 'Default Profit Margin',
      value: 15,
      unit: '%',
      description: 'กำไรขั้นต้นมาตรฐาน',
    },
    minSellingFactor: {
      name: 'Minimum Selling Factor',
      value: 1.0,
      unit: 'multiplier',
      description: 'Selling Factor ต่ำสุดที่อนุญาต',
    },
    maxDiscount: {
      name: 'Maximum Discount',
      value: 30,
      unit: '%',
      description: 'ส่วนลดสูงสุดที่อนุญาต',
    },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVariables();
  }, []);

  const loadVariables = async () => {
    try {
      const response = await api.get('/api/data/system-config/formulaVariables');
      const data = response.data;
      if (data && data.value) {
        const savedVars = JSON.parse(data.value);
        setVariables(savedVars);
      }
    } catch (error) {
      console.error('Failed to load formula variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/data/system-config/formulaVariables', {
        value: JSON.stringify(variables),
        description: 'Formula variables configuration',
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Failed to save variables:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกตัวแปร');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-900 mb-2">🔢 Formula Variables</h3>
        <p className="text-sm text-green-700">
          กำหนดตัวแปรและค่าคงที่ต่างๆ ที่ใช้ในสูตรการคำนวณ
        </p>
      </div>

      {loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          กำลังโหลดข้อมูล...
        </div>
      )}

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          ✅ บันทึกตัวแปรเรียบร้อยแล้ว
        </div>
      )}

      {/* Variables List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(variables).map(([key, variable]) => (
          <div key={key} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-slate-900">{variable.name}</div>
                <div className="text-xs text-slate-500 mt-1">{variable.description}</div>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                {variable.unit}
              </span>
            </div>
            <input
              type="number"
              value={variable.value}
              onChange={(e) => setVariables({
                ...variables,
                [key]: { ...variable, value: parseFloat(e.target.value) }
              })}
              step="0.01"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-lg"
            />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? 'กำลังบันทึก...' : '💾 บันทึกตัวแปร'}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-2">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>ตัวแปรเหล่านี้สามารถถูก Override ด้วย Pricing Rules ได้</li>
              <li>การเปลี่ยนแปลงจะมีผลทันทีกับการคำนวณครั้งถัดไป</li>
              <li>ควรตรวจสอบผลกระทบก่อนเปลี่ยนแปลงค่าสำคัญ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Formula Management Component ---
const FormulaManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FormulaTab>('base');

  const tabs = [
    { id: 'base' as FormulaTab, label: '🧮 Base Formula', description: 'สูตรพื้นฐาน' },
    { id: 'rules' as FormulaTab, label: '🎯 Pricing Rules', description: 'กฎการคำนวณ' },
    { id: 'variables' as FormulaTab, label: '🔢 Variables', description: 'ตัวแปรและค่าคงที่' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">🧮 Formula Management</h1>
        <p className="text-slate-600 mt-1">จัดการสูตรการคำนวณราคาและกฎต่างๆ</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <div>{tab.label}</div>
              <div className="text-xs mt-0.5 opacity-75">{tab.description}</div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'base' && <FormulaLibrary />}
        {activeTab === 'rules' && <PricingRulesManagement />}
        {activeTab === 'variables' && <FormulaVariablesConfig />}
      </div>
    </div>
  );
};

export default FormulaManagement;
