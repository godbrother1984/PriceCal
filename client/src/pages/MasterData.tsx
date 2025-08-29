import React, { useState, useEffect } from 'react';

// --- Interfaces ---
interface Customer { id: string; name: string; }
interface CustomerGroup { id: string; name: string; type: string; description: string; }
interface CustomerMapping { id: string; customerId: string; customerName: string; customerGroupId: string; }

// --- Reusable Searchable Select Component ---
const SearchableSelect = ({ endpoint, value, onChange, displayField = 'name' }: { endpoint: string, value: string, onChange: (id: string) => void, displayField?: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`http://localhost:3000/mock-data/${endpoint}`);
        const data = await res.json();
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
    ? items.filter(item => item[displayField] && item[displayField].toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleSelect = (item: any) => {
    onChange(item.id);
    setSearchTerm(item[displayField]);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange('');
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        className="w-full p-2 border border-slate-300 rounded mt-1"
        autoComplete="off"
      />
      {showDropdown && searchTerm && filteredItems.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredItems.map(item => (
            <li key={item.id} onMouseDown={() => handleSelect(item)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer">
              {item[displayField]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// --- Generic Modal for Simple Masters ---
const ItemModal = ({ isOpen, onClose, onSave, initialData, title, fields }: any) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || fields.reduce((acc: any, field: any) => ({ ...acc, [field.key]: '' }), {}));
    }
  }, [isOpen, initialData, fields]);

  if (!isOpen) return null;

  const handleChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSave = () => {
    if (fields.some((field: any) => !formData[field.key])) {
      alert('Please fill in all fields.');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="space-y-4">
          {fields.map((field: any) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700">{field.label}</label>
              {field.type === 'lookup' ? (
                <SearchableSelect
                  endpoint={field.endpoint}
                  value={formData[field.key] || ''}
                  onChange={(id) => handleChange(field.key, id)}
                  displayField={field.displayField || 'name'}
                />
              ) : field.type === 'select' ? (
                <select
                  name={field.key}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(e.target.name, e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded mt-1 bg-white"
                >
                  <option value="" disabled>Select an option</option>
                  {field.options.map((option: string) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type={field.type || 'text'}
                  name={field.key}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(e.target.name, e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded mt-1" 
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300">Cancel</button>
          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

// --- Specialized Modal for Customer Mappings (One-to-Many) ---
const CustomerMappingModal = ({ isOpen, onClose, onSave, groupToEdit, allMappings }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void, groupToEdit: CustomerGroup | null, allMappings: CustomerMapping[] }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchCustomers = async () => {
        try {
          const custRes = await fetch('http://localhost:3000/mock-data/customers');
          setCustomers(await custRes.json());
          
          if (groupToEdit) {
            const existingMappedIds = allMappings
              .filter(m => m.customerGroupId === groupToEdit.id)
              .map(m => m.customerId);
            setSelectedCustomerIds(new Set(existingMappedIds));
          } else {
            setSelectedCustomerIds(new Set());
          }
          setCustomerSearch('');

        } catch (error) {
          console.error("Failed to fetch customers for mapping", error);
        }
      };
      fetchCustomers();
    }
  }, [isOpen, groupToEdit, allMappings]);

  if (!isOpen || !groupToEdit) return null;

  const handleCustomerSelect = (customerId: string) => {
    const newSelection = new Set(selectedCustomerIds);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomerIds(newSelection);
  };

  const handleSave = () => {
    onSave({
      customerIds: Array.from(selectedCustomerIds),
      customerGroupId: groupToEdit.id,
    });
    onClose();
  };

  const filteredCustomers = customerSearch
    ? customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
    : customers;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-1">Edit Mapping for Group</h2>
        <p className="text-blue-600 font-semibold mb-6">{groupToEdit.name}</p>
        <div>
            <h3 className="font-semibold text-slate-800 mb-2">Select Customers</h3>
            <input 
              type="text"
              placeholder="Search customers..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg mb-2"
            />
            <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-2">
              {filteredCustomers.map(customer => (
                <label key={customer.id} className={`flex items-center p-3 rounded-lg cursor-pointer ${selectedCustomerIds.has(customer.id) ? 'bg-green-100' : 'hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    checked={selectedCustomerIds.has(customer.id)}
                    onChange={() => handleCustomerSelect(customer.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-slate-700">{customer.name}</span>
                </label>
              ))}
            </div>
          </div>
        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300">Cancel</button>
          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save Mapping</button>
        </div>
      </div>
    </div>
  );
};

// --- Specialized Component for Customer Mappings View ---
const CustomerMappingView = () => {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [mappings, setMappings] = useState<CustomerMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [groupRes, mappingRes] = await Promise.all([
        fetch('http://localhost:3000/mock-data/customer-groups'),
        fetch('http://localhost:3000/mock-data/customer-mappings')
      ]);
      setGroups(await groupRes.json());
      setMappings(await mappingRes.json());
    } catch (error) {
      console.error("Failed to fetch mapping data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (group: CustomerGroup) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleSaveMapping = async (mappingData: { customerIds: string[], customerGroupId: string }) => {
    try {
        await fetch(`http://localhost:3000/mock-data/customer-mappings/${mappingData.customerGroupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerIds: mappingData.customerIds }),
        });
        fetchData(); // Refresh data
    } catch (error) {
        console.error("Failed to save mapping:", error);
    }
  };

  if (isLoading) return <div>Loading Customer Mappings...</div>;

  return (
    <div>
      <CustomerMappingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMapping}
        groupToEdit={editingGroup}
        allMappings={mappings}
      />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Customer Mappings (Grouped View)</h2>
      </div>
      <div className="space-y-6">
        {groups.filter(g => g.type === 'Standard').map(group => {
          const mappedCustomers = mappings.filter(m => m.customerGroupId === group.id);
          return (
            <div key={group.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{group.name} <span className="text-sm font-normal text-slate-500">({group.id})</span></h3>
                    <p className="text-sm text-slate-500 mt-1">{group.description}</p>
                  </div>
                  <button onClick={() => handleOpenModal(group)} className="bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-200 text-sm">
                    Edit
                  </button>
              </div>
              <div className="mt-4 pl-4 border-l-2 border-slate-200">
                {mappedCustomers.length > 0 ? (
                  <ul className="space-y-2">
                    {mappedCustomers.map(mapping => (
                      <li key={mapping.id} className="text-sm text-slate-700">{mapping.customerName}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 italic">No customers mapped to this group.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Generic Table Component (for other masters) ---
const MasterDataTable = ({ title, endpoint, columns }: { title: string, endpoint: string, columns: { key: string, label: string, type?: string, endpoint?: string, displayField?: string, options?: string[] }[] }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/mock-data/${endpoint}`);
      if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(`Failed to fetch ${title}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [endpoint]);

  const handleSaveItem = async (item: any) => {
    const isEditing = !!editingItem;
    const url = `http://localhost:3000/mock-data/${endpoint}${isEditing ? `/${editingItem.id}` : ''}`;
    const method = isEditing ? 'PUT' : 'POST';
    try {
      await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { ...item, id: editingItem.id } : item),
      });
      fetchData();
    } catch (error) {
      console.error(`Failed to save ${title}:`, error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
        try {
            await fetch(`http://localhost:3000/mock-data/${endpoint}/${itemId}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            console.error(`Failed to delete ${title}:`, error);
        }
    }
  };

  const openModalToAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openModalToEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (isLoading) return <div>Loading {title}...</div>;

  return (
    <div>
      <ItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        initialData={editingItem}
        title={`${editingItem ? 'Edit' : 'Add New'} ${title}`}
        fields={columns}
      />
      
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
        <div className="w-full md:w-auto flex items-center gap-4">
          <input 
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 p-2 border border-slate-300 rounded-lg"
          />
          <button onClick={openModalToAdd} className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 flex-shrink-0">
            Add New
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
            <tr>
              {columns.map(col => <th key={col.key} scope="col" className="px-6 py-3">{col.label}</th>)}
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                {columns.map(col => <td key={`${item.id}-${col.key}`} className="px-6 py-4">{item[col.key]}</td>)}
                <td className="px-6 py-4 text-right space-x-4">
                  <button onClick={() => openModalToEdit(item)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main MasterData Component ---
const MasterData: React.FC = () => {
  type MasterDataTab = 'customerGroups' | 'customerMappings' | 'fabCost' | 'standardPrices' | 'sellingFactors' | 'lmePrices' | 'exchangeRates';
  const [activeTab, setActiveTab] = useState<MasterDataTab>('customerGroups');
  const currencyOptions = ['THB', 'USD', 'JPY'];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'customerGroups':
        return <MasterDataTable title="Customer Groups" endpoint="customer-groups" columns={[
          { key: 'name', label: 'Group Name' }, 
          { key: 'type', label: 'Type', type: 'select', options: ['Standard', 'Default', 'All'] }, 
          { key: 'description', label: 'Description' }
        ]} />;
      case 'customerMappings':
        return <CustomerMappingView />;
      case 'fabCost':
        return <MasterDataTable title="Fab Cost" endpoint="fab-costs" columns={[
          { key: 'customerGroupId', label: 'Group ID', type: 'lookup', endpoint: 'customer-groups' }, 
          { key: 'costValue', label: 'Cost Value', type: 'number' }, 
          { key: 'currency', label: 'Currency', type: 'select', options: currencyOptions }
        ]} />;
      case 'standardPrices':
        return <MasterDataTable title="Standard Prices" endpoint="standard-prices" columns={[
          { key: 'rmId', label: 'RM ID', type: 'lookup', endpoint: 'raw-materials' }, 
          { key: 'price', label: 'Price', type: 'number' }, 
          { key: 'currency', label: 'Currency', type: 'select', options: currencyOptions }
        ]} />;
      case 'sellingFactors':
        return <MasterDataTable title="Selling Factors" endpoint="selling-factors" columns={[
          { key: 'pattern', label: 'Pattern' }, 
          { key: 'factor', label: 'Factor', type: 'number' }
        ]} />;
      case 'lmePrices':
        return <MasterDataTable title="LME Prices" endpoint="lme-prices" columns={[
          { key: 'customerGroupId', label: 'Group ID', type: 'lookup', endpoint: 'customer-groups' }, 
          { key: 'itemGroupCode', label: 'Item Group' }, 
          { key: 'price', label: 'Price', type: 'number' }, 
          { key: 'currency', label: 'Currency', type: 'select', options: currencyOptions }
        ]} />;
      case 'exchangeRates':
        return <MasterDataTable title="Exchange Rates" endpoint="exchange-rates" columns={[
          { key: 'customerGroupId', label: 'Group ID', type: 'lookup', endpoint: 'customer-groups' }, 
          { key: 'sourceCurrency', label: 'Source Currency' },
          { key: 'destinationCurrency', label: 'Destination Currency' },
          { key: 'rate', label: 'Rate', type: 'number' }
        ]} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Master Data Management</h1>
        <p className="text-slate-500">จัดการข้อมูลหลักทั้งหมดของระบบ</p>
      </div>

      <div className="border-b border-slate-200 mb-8">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
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

      <div>
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default MasterData;
