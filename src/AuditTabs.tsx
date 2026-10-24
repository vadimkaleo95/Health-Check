import React from 'react';
import { TabType, ToolStatus, PerformanceState, SeoMetricsState, ActionPlanTask } from './types';
import { SummaryTab } from './components/tabs/SummaryTab';
import { AnalyticsTab } from './components/tabs/AnalyticsTab';
import { PerformanceTab } from './components/tabs/PerformanceTab';
import { ShopifyTab } from './components/tabs/ShopifyTab';
import { SeoTab } from './components/tabs/SeoTab';
import { UxTab } from './components/tabs/UxTab';
import { PlanTab } from './components/tabs/PlanTab';

interface AuditTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  brandName: string;
  currentHost: string;
  perfData: PerformanceState;
  seoMetrics: SeoMetricsState;
  analyticsTools: ToolStatus[];
  filteredTasks: ActionPlanTask[];
  planFilter: 'all' | 'Dev Team' | 'SEO / Content' | 'Design / UX';
  setPlanFilter: (filter: 'all' | 'Dev Team' | 'SEO / Content' | 'Design / UX') => void;
}

export const AuditTabs: React.FC<AuditTabsProps> = ({
  activeTab,
  setActiveTab,
  brandName,
  currentHost,
  perfData,
  seoMetrics,
  analyticsTools,
  filteredTasks,
  planFilter,
  setPlanFilter
}) => {
  return (
    <div className="space-y-4">
      {activeTab === 'summary' && (
        <SummaryTab
          brandName={brandName}
          perfData={perfData}
          seoMetrics={seoMetrics}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab
          analyticsTools={analyticsTools}
          currentHost={currentHost}
        />
      )}

      {activeTab === 'performance' && (
        <PerformanceTab
          perfData={perfData}
          currentHost={currentHost}
        />
      )}

      {activeTab === 'shopify' && (
        <ShopifyTab
          seoMetrics={seoMetrics}
          currentHost={currentHost}
        />
      )}

      {activeTab === 'seo' && (
        <SeoTab
          seoMetrics={seoMetrics}
          currentHost={currentHost}
        />
      )}

      {activeTab === 'ux' && (
        <UxTab
          brandName={brandName}
        />
      )}

      {activeTab === 'plan' && (
        <PlanTab
          filteredTasks={filteredTasks}
          planFilter={planFilter}
          setPlanFilter={setPlanFilter}
        />
      )}
    </div>
  );
};
