import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; // Import central api service

// --- Interfaces ---
interface CustomerGroup { id: string; name: string; type: string; description: string; }
interface CustomerMapping { id: string; customerId: string; customerName: string; customerGroupId: string; }
type MasterDataType = CustomerGroup | CustomerMapping | any;

// --- Reusable Searchable Select Component (FIXED: Added missing component) ---
const SearchableSelect = ({ endpoint, value, onChange, displayField = 'name' }: { endpoint: string, value: string, onChange: (id: string) => void, displayField?: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await api.get(`/mock-data/${endpoint}`);
        setItems(data);
        const selectedItem = data.find((item: any) => item.id === value);
        if (selectedItem) {
          setSearchTerm(selectedItem[displayField]);
        } else {
          setSearchTerm('');
        }
      } catch (error) {
        console.error(`Failed to fetch ${endpoint}`, error);
      }
    };
    fetchItems();
  }, [endpoint, value, displayField]);

  const filteredItems = searchTerm
    ? items.filter(item => item[displayField]?.toLowerCase().includes(searchTerm.toLowerCase()))
    : items;

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={searchTerm}
        onChange={e => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
          onChange(''); // Clear selection when user types
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5"
        autoComplete="off"
      />
      {showDropdown && (
        <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredItems.length > 0 ? filteredItems.map(item => (
            <li
              key={item.id}
              onClick={() => {
                onChange(item.id);
                setSearchTerm(item[displayField]);
                setShowDropdown(false);
              }}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
            >
              {item[displayField]} <span className="text-slate-400 text-xs">({item.id})</span>
            </li>
          )) : <li className="px-4 py-2 text-slate-500">No results found</li>}
        </ul>
      )}
    </div>
  );
};


// --- Reusable Modal for Add/Edit Forms ---
const MasterDataFormModal = ({ isOpen, onClose, onSave, item, columns, title }: { isOpen: boolean, onClose: () => void, onSave: (item: any) => void, item: any | null, columns: any[], title: string }) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    setFormData(item || {});
  }, [item]);

  if (!isOpen) return null;

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">{item?.id ? 'Edit' : 'Add'} {title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {columns.map(col => (
            <div key={col.key}>
              <label className="block text-sm font-medium text-slate-700">{col.label}</label>
              <input
                type={col.type || 'text'}
                value={formData[col.key] || ''}
                onChange={e => handleInputChange(col.key, e.target.value)}
                className="mt-1 w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5"
                required
              />
            </div>
          ))}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-white text-slate-700 font-semibold px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Reusable Master Data Table Component (CRUD Enabled) ---
const MasterDataTable = ({ title, endpoint, columns }: { title: string, endpoint: string, columns: any[] }) => {
  const [data, setData] = useState<MasterDataType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataType | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/mock-data/${endpoint}`);
      setData(response.data);
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}`, error);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (item: MasterDataType | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (itemToSave: MasterDataType) => {
    try {
      if (itemToSave.id) {
        await api.put(`/mock-data/${endpoint}/${itemToSave.id}`, itemToSave);
      } else {
        await api.post(`/mock-data/${endpoint}`, itemToSave);
      }
      fetchData(); // Refresh data
    } catch (error) {
      console.error(`Failed to save item to ${endpoint}`, error);
    } finally {
      handleCloseModal();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/mock-data/${endpoint}/${id}`);
        fetchData(); // Refresh data
      } catch (error) {
        console.error(`Failed to delete item from ${endpoint}`, error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold">Add New</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                <tr>
                    {columns.map(col => <th key={col.key} scope="col" className="px-6 py-3">{col.label}</th>)}
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={columns.length + 1} className="text-center p-4">Loading...</td></tr>
              ) : data.map(item => (
                  <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                      {columns.map(col => <td key={col.key} className="px-6 py-4">{item[col.key]}</td>)}
                      <td className="px-6 py-4 text-right space-x-4">
                          <button onClick={() => handleOpenModal(item)} className="font-medium text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                      </td>
                  </tr>
              ))}
            </tbody>
        </table>
      </div>
      <MasterDataFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} item={editingItem} columns={columns} title={title} />
    </div>
  );
};


// --- Customer Mapping View Component (CRUD Enabled) ---
const CustomerMappingView: React.FC = () => {
  const [groupedMappings, setGroupedMappings] = useState<{ [groupName: string]: CustomerMapping[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // States for Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMapping, setNewMapping] = useState({ customerId: '', customerGroupId: '' });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [mappingsRes, groupsRes] = await Promise.all([
        api.get('/mock-data/customer-mappings'),
        api.get('/mock-data/customer-groups')
      ]);
      const mappingsData: CustomerMapping[] = mappingsRes.data;
      const groupsData: CustomerGroup[] = groupsRes.data;
      const groupNameMap = new Map(groupsData.map(g => [g.id, g.name]));

      const grouped = mappingsData.reduce((acc, mapping) => {
        const groupName = groupNameMap.get(mapping.customerGroupId) || mapping.customerGroupId;
        if (!acc[groupName]) { acc[groupName] = []; }
        acc[groupName].push(mapping);
        return acc;
      }, {} as { [groupName: string]: CustomerMapping[] });
      setGroupedMappings(grouped);
    } catch (err) {
      console.error("Failed to fetch customer mappings", err);
      setError('Could not load customer mapping data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemove = async (mappingId: string) => {
    if(window.confirm('Are you sure you want to remove this mapping?')) {
      try {
        await api.delete(`/mock-data/customer-mappings/${mappingId}`);
        fetchData(); // Refresh
      } catch (err) {
        console.error('Failed to remove mapping', err);
        alert('Error: Could not remove mapping.');
      }
    }
  };

  const handleAddMapping = async () => {
    if (!newMapping.customerId || !newMapping.customerGroupId) {
      alert('Please select both a customer and a group.');
      return;
    }
    try {
      await api.post('/mock-data/customer-mappings', newMapping);
      setIsAddModalOpen(false);
      setNewMapping({ customerId: '', customerGroupId: '' });
      fetchData(); // Refresh
    } catch (err) {
      console.error('Failed to add mapping', err);
      alert('Error: Could not add mapping.');
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Customer Mappings (Grouped View)</h2>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold">
          Add New Mapping
        </button>
      </div>

      {isLoading && <p className="text-slate-500">Loading mappings...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!isLoading && !error && Object.keys(groupedMappings).length === 0 && (
          <p className="text-slate-500 italic">No customer mappings found.</p>
      )}

      <div className="space-y-6">
        {Object.entries(groupedMappings).map(([groupName, mappings]) => (
          <div key={groupName}>
            <h3 className="font-semibold text-slate-800 mb-2 border-b pb-2">{groupName}</h3>
            <ul className="divide-y divide-slate-200">
              {mappings.map(mapping => (
                <li key={mapping.id} className="px-2 py-3 flex justify-between items-center">
                  <span>{mapping.customerName} <span className="text-slate-400 text-xs font-mono">({mapping.customerId})</span></span>
                  <button onClick={() => handleRemove(mapping.id)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

       {/* Add Mapping Modal */}
       {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Customer Mapping</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                <SearchableSelect endpoint="customers" value={newMapping.customerId} onChange={(id: string) => setNewMapping(p => ({...p, customerId: id}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Group</label>
                <SearchableSelect endpoint="customer-groups" value={newMapping.customerGroupId} onChange={(id: string) => setNewMapping(p => ({...p, customerGroupId: id}))} />
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-6">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-white text-slate-700 font-semibold px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={handleAddMapping} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Add Mapping</button>
            </div>
          </div>
        </div>
       )}
    </div>
  );
};


// --- Main MasterData Page Component ---
const MasterData: React.FC = () => {
  const [activeTab, setActiveTab] = useState('customerGroups');

  const renderContent = () => {
    switch (activeTab) {
      case 'customerGroups':
        return <MasterDataTable title="Customer Groups" endpoint="customer-groups" columns={[
          { key: 'name', label: 'Group Name' },
          { key: 'description', label: 'Description' },
          { key: 'type', label: 'Type' }
        ]} />;
      case 'customerMappings':
        return <CustomerMappingView />;
      case 'fabCost':
        return <MasterDataTable title="Fab Cost" endpoint="fab-costs" columns={[
          { key: 'customerGroupId', label: 'Group ID' },
          { key: 'costValue', label: 'Cost Value' },
          { key: 'currency', label: 'Currency' }
        ]} />;
      case 'standardPrices':
         return <MasterDataTable title="Standard Prices" endpoint="standard-prices" columns={[
            { key: 'rmId', label: 'RM ID' },
            { key: 'price', label: 'Price' },
            { key: 'currency', label: 'Currency' }
        ]} />;
      case 'sellingFactors':
        return <MasterDataTable title="Selling Factors" endpoint="selling-factors" columns={[
            { key: 'pattern', label: 'Pattern' },
            { key: 'factor', label: 'Factor' },
        ]} />;
      case 'lmePrices':
        return <MasterDataTable title="LME Prices" endpoint="lme-prices" columns={[
            { key: 'customerGroupId', label: 'Group ID' },
            { key: 'itemGroupCode', label: 'Item Group' },
            { key: 'price', label: 'Price' },
            { key: 'currency', label: 'Currency' }
        ]} />;
      case 'exchangeRates':
        return <MasterDataTable title="Exchange Rates" endpoint="exchange-rates" columns={[
            { key: 'customerGroupId', label: 'Group ID' },
            { key: 'sourceCurrency', label: 'Source' },
            { key: 'destinationCurrency', label: 'Destination' },
            { key: 'rate', label: 'Rate' },
        ]} />;
      default:
        return <div>Select a category</div>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Master Data Management</h1>
          <p className="text-slate-500">Manage all master data for the pricing system.</p>
        </div>
      </div>
      
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs" style={{overflowX: 'auto'}}>
          <button onClick={() => setActiveTab('customerGroups')} className={`${activeTab === 'customerGroups' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Customer Groups
          </button>
          <button onClick={() => setActiveTab('customerMappings')} className={`${activeTab === 'customerMappings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Customer Mappings
          </button>
          <button onClick={() => setActiveTab('fabCost')} className={`${activeTab === 'fabCost' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Fab Cost
          </button>
          <button onClick={() => setActiveTab('standardPrices')} className={`${activeTab === 'standardPrices' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Standard Prices
          </button>
          <button onClick={() => setActiveTab('sellingFactors')} className={`${activeTab === 'sellingFactors' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Selling Factors
          </button>
          <button onClick={() => setActiveTab('lmePrices')} className={`${activeTab === 'lmePrices' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            LME Prices
          </button>
          <button onClick={() => setActiveTab('exchangeRates')} className={`${activeTab === 'exchangeRates' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Exchange Rates
          </button>
        </nav>
      </div>

      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default MasterData;

