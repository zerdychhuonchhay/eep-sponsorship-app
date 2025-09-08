import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  initialTabId?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, initialTabId }) => {
  const [activeTabId, setActiveTabId] = useState(initialTabId || (tabs.length > 0 ? tabs[0].id : ''));

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-stroke dark:border-strokedark -mb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTabId(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTabId === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-black dark:text-white hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.map(tab => (
          <div key={tab.id} className={activeTabId === tab.id ? 'block' : 'hidden'}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
