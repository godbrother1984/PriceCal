import React, { useState, useEffect } from 'react';

// --- Main Component ---
const MasterData: React.FC = () => {
  type MasterDataTab = 'customerGroups' | 'customerMappings' | 'fabCost' | 'standardPrices' | 'sellingFactors' | 'lmePrices' | 'exchangeRates';
  const [activeTab, setActiveTab] = useState<MasterDataTab>('customerGroups');

  // --- Generic Table Component for DRY code ---
  const MasterDataTable = ({ title, endpoint, columns }: { title: string, endpoint: string, columns: { key: string, label: string }[] }) => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchData = async () => {
        setIsLoading(true);
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
      fetchData();
    }, [endpoint, title]);

    if (isLoading) return <div>Loading {title}...</div>;

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
          <button className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700">
            Add New
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                {columns.map(col => <th key={col.key} scope="col" className="px-6 py-3">{col.label}</th>)}
                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                  {columns.map(col => <td key={col.key} className="px-6 py-4">{item[col.key]}</td>)}
                  <td className="px-6 py-4 text-right">...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'customerGroups':
        return <MasterDataTable title="Customer Groups" endpoint="customer-groups" columns={[
          { key: 'name', label: 'Group Name' }, { key: 'type', label: 'Type' }, { key: 'description', label: 'Description' }
        ]} />;
      case 'customerMappings':
        return <MasterDataTable title="Customer Mappings" endpoint="customer-mappings" columns={[
          { key: 'customerName', label: 'Customer Name' }, { key: 'customerGroupId', label: 'Group ID' }
        ]} />;
      case 'fabCost':
        return <MasterDataTable title="Fab Cost" endpoint="fab-costs" columns={[
          { key: 'customerGroupId', label: 'Group ID' }, { key: 'costValue', label: 'Cost Value' }, { key: 'currency', label: 'Currency' }
        ]} />;
      case 'standardPrices':
        return <MasterDataTable title="Standard Prices" endpoint="standard-prices" columns={[
          { key: 'rmId', label: 'RM ID' }, { key: 'customerGroupId', label: 'Group ID' }, { key: 'price', label: 'Price' }, { key: 'currency', label: 'Currency' }
        ]} />;
      case 'sellingFactors':
        return <MasterDataTable title="Selling Factors" endpoint="selling-factors" columns={[
          { key: 'pattern', label: 'Pattern' }, { key: 'factor', label: 'Factor' }
        ]} />;
      case 'lmePrices':
        return <MasterDataTable title="LME Prices" endpoint="lme-prices" columns={[
          { key: 'itemGroupCode', label: 'Item Group' }, { key: 'price', label: 'Price' }, { key: 'currency', label: 'Currency' }
        ]} />;
      case 'exchangeRates':
        return <MasterDataTable title="Exchange Rates" endpoint="exchange-rates" columns={[
          { key: 'currencyPair', label: 'Currency Pair' }, { key: 'rate', label: 'Rate' }
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
