import { useState } from 'react';
import { TabType, ToolStatus, PerformanceState, SeoMetricsState, ActionPlanTask } from '../types';
import { extractDomainInfo, parseStoreHtml, runGooglePageSpeed, AuditLog } from '../auditEngine';
import { INITIAL_TASKS } from '../constants/planTasks';

export const useAudit = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAudited, setHasAudited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Стан результатів
  const [currentHost, setCurrentHost] = useState('');
  const [brandName, setBrandName] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Дані аудиту
  const [perfData, setPerfData] = useState<PerformanceState>({
    status: 'good',
    statusLabel: 'Очікує перевірки',
    summary: '',
    salesHook: '',
    pages: [],
    blockers: []
  });

  const [seoMetrics, setSeoMetrics] = useState<SeoMetricsState>({
    titleText: '',
    titleLength: 0,
    metaDescText: '',
    metaDescLength: 0,
    canonicalStatus: 'pass',
    canonicalDetails: '',
    h1Count: 0,
    h1Text: '',
    schemaTypes: [],
    hasOgImage: false,
    hreflangCount: 0,
    robotsDirectives: '',
    aiReadinessSummary: '',
    checks: []
  });

  const [analyticsTools, setAnalyticsTools] = useState<ToolStatus[]>([]);
  const [tasks] = useState<ActionPlanTask[]>(INITIAL_TASKS);
  const [planFilter, setPlanFilter] = useState<'all' | 'Dev Team' | 'SEO / Content' | 'Design / UX'>('all');

  const filteredTasks = tasks.filter(t => planFilter === 'all' || t.role === planFilter);

  const handleRunAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setLogs([]);

    const { host, brand } = extractDomainInfo(inputUrl);
    setCurrentHost(host);
    setBrandName(brand);

    const targetUrl = inputUrl.trim().startsWith('http') 
      ? inputUrl.trim() 
      : `https://${inputUrl.trim()}`;

    try {
      // 1. Аналіз публічного HTML та технічного SEO
      const htmlResult = await parseStoreHtml(targetUrl, host, brand);
      setSeoMetrics(htmlResult.seo);
      setAnalyticsTools(htmlResult.tools);
      setLogs(prev => [...prev, htmlResult.log]);

      // 2. Реальний аудит продуктивності Google PageSpeed
      const speedResult = await runGooglePageSpeed(targetUrl, host, brand, htmlResult.subpages);
      setPerfData(speedResult.perfData);
      setFinalScore(speedResult.finalScore);
      setLogs(prev => [...prev, speedResult.log]);

      setHasAudited(true);
    } catch (err: any) {
      const message = err?.message || 'Не вдалося виконати сканування домену.';
      setError(message);
      setLogs(prev => [
        ...prev,
        {
          source: 'HTML Proxy',
          status: 'error',
          message,
          timestamp: new Date().toLocaleTimeString('uk-UA')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    inputUrl,
    setInputUrl,
    isLoading,
    hasAudited,
    error,
    currentHost,
    brandName,
    finalScore,
    activeTab,
    setActiveTab,
    logs,
    perfData,
    seoMetrics,
    analyticsTools,
    planFilter,
    setPlanFilter,
    filteredTasks,
    handleRunAudit
  };
};
