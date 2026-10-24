export type TabType = 'summary' | 'analytics' | 'performance' | 'shopify' | 'seo' | 'ux' | 'plan';

export interface ToolStatus {
  name: string;
  installed: boolean;
  type: 'native_app' | 'hybrid' | 'hardcode' | 'not_detected';
  statusText: string;
  status: 'pass' | 'warn' | 'fail';
  channel: string;
}

export interface PerformancePage {
  name: string;
  type: 'Home' | 'Product' | 'Collection';
  mobileScore: number;
  desktopScore: number;
  lcp: string;
  tbt: string;
  a11y: number;
  share: string;
}

export interface PerformanceState {
  status: 'good' | 'warning' | 'critical';
  statusLabel: string;
  summary: string;
  salesHook: string;
  pages: PerformancePage[];
  blockers: string[];
}

export interface SeoCheckItem {
  id: string;
  name: string;
  detected: string;
  details: string;
  status: 'pass' | 'warn' | 'fail';
}

export interface SeoMetricsState {
  titleText: string;
  titleLength: number;
  metaDescText: string;
  metaDescLength: number;
  canonicalStatus: 'pass' | 'warn' | 'fail';
  canonicalDetails: string;
  // Нові поля аудиту
  h1Count: number;
  h1Text: string;
  schemaTypes: string[];
  hasOgImage: boolean;
  ogImageUrl?: string;
  hreflangCount: number;
  robotsDirectives: string;
  aiReadinessSummary: string;
  checks: SeoCheckItem[];
}

export interface ActionPlanTask {
  id: number;
  role: 'Dev Team' | 'SEO / Content' | 'Design / UX';
  task: string;
  why: string;
  estimate: string;
}
