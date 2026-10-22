import { ToolStatus } from './analyticsDetect';

export type { ToolStatus };

export interface PageMetric {
  name: string;
  type: string;
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
  pages: PageMetric[];
  blockers: string[];
}

export interface SeoMetricsState {
  titleText: string;
  titleLength: number;
  metaDescText: string;
  metaDescLength: number;
  canonicalStatus: 'pass' | 'warn' | 'fail';
  canonicalDetails: string;
}

export interface ActionPlanTask {
  id: number;
  role: 'Dev Team' | 'SEO / Content' | 'Design / UX';
  task: string;
  why: string;
  estimate: string;
}

export type TabType = 'summary' | 'analytics' | 'performance' | 'shopify' | 'seo' | 'ux' | 'plan';
