// src/services/ChartCaptureService.ts
import html2canvas from 'html2canvas';

export interface ChartConfig {
  selector: string;
  title: string;
  description: string;
  category: 'demographics' | 'trends' | 'safety' | 'traffic' | 'overview';
  priority: number;
  captureOptions?: {
    width?: number;
    height?: number;
    scale?: number;
    backgroundColor?: string;
  };
}

export interface CapturedChart {
  config: ChartConfig;
  imageData: string;
  dimensions: {
    width: number;
    height: number;
  };
  timestamp: number;
}

export interface ChartCaptureOptions {
  selectedCharts?: string[];
  quality?: 'standard' | 'high';
  timeout?: number;
  retryAttempts?: number;
}

export class ChartCaptureService {
  private static readonly DEFAULT_CHARTS: ChartConfig[] = [
    {
      selector: '[data-chart="demographic-overview"]',
      title: 'Demographic Overview',
      description: 'Complete demographic breakdown including ethnicity, age, gender, and income distributions',
      category: 'demographics',
      priority: 1,
      captureOptions: {
        scale: 2,
        backgroundColor: '#ffffff'
      }
    },
    {
      selector: '[data-chart="ethnicity-distribution"]',
      title: 'Ethnicity Distribution',
      description: 'Population ethnicity breakdown with target market alignment analysis',
      category: 'demographics',
      priority: 2,
      captureOptions: {
        scale: 2,
        backgroundColor: '#ffffff'
      }
    },
    {
      selector: '[data-chart="age-gender-distribution"]',
      title: 'Age & Gender Distribution',
      description: 'Age and gender demographics showing target market fit percentages',
      category: 'demographics',
      priority: 3,
      captureOptions: {
        scale: 2,
        backgroundColor: '#ffffff'
      }
    },
    {
      selector: '[data-chart="income-distribution"]',
      title: 'Income Distribution',
      description: 'Household income levels and target economic alignment analysis',
      category: 'demographics',
      priority: 4,
      captureOptions: {
        scale: 2,
        backgroundColor: '#ffffff'
      }
    },
    {
      selector: '[data-chart="foot-traffic-timeline"]',
      title: 'Foot Traffic Trends',
      description: 'Historical and projected pedestrian activity patterns over time',
      category: 'traffic',
      priority: 5,
      captureOptions: {
        scale: 2,
        backgroundColor: '#ffffff'
      }
    },
    {
      selector: '[data-chart="foot-traffic-periods"]',
      title: 'Foot Traffic by Time Period',
      description: 'Daily foot traffic patterns broken down by morning, afternoon, and evening',
      category: 'traffic',
      priority: 6,
      captureOptions: {
        scale: 2,
        backgroundColor: '#ffffff'
      }
    },
    {
      selector: '[data-chart="crime-trend"]',
      title: 'Safety Score Trends',
      description: 'Historical safety trends and future projections for the area',
      category: 'safety',
      priority: 7,
      captureOptions: {
        scale: 2,
        backgroundColor: '#ffffff'
      }
    },
    {
      selector: '[data-chart="trend-indicators"]',
      title: 'Key Performance Indicators',
      description: 'Summary of all key metrics with trend sparklines and performance indicators',
      category: 'overview',
      priority: 8,
      captureOptions: {
        scale: 2,
        backgroundColor: '#ffffff'
      }
    }
  ];

  private readonly charts: ChartConfig[];
  private readonly defaultOptions: Required<ChartCaptureOptions>;

  constructor(customCharts?: ChartConfig[]) {
    this.charts = customCharts || ChartCaptureService.DEFAULT_CHARTS;
    this.defaultOptions = {
      selectedCharts: [],
      quality: 'high',
      timeout: 5000,
      retryAttempts: 3
    };
  }

  /**
   * Get all available charts grouped by category
   */
  getAvailableCharts(): Record<string, ChartConfig[]> {
    return this.charts.reduce((acc, chart) => {
      if (!acc[chart.category]) {
        acc[chart.category] = [];
      }
      acc[chart.category].push(chart);
      return acc;
    }, {} as Record<string, ChartConfig[]>);
  }

  /**
   * Detect which charts are actually available in the DOM
   */
  async detectAvailableCharts(): Promise<ChartConfig[]> {
    const availableCharts: ChartConfig[] = [];

    for (const chart of this.charts) {
      const element = document.querySelector(chart.selector);
      if (element) {
        // Additional check to ensure the chart has actual content
        const hasContent = await this.validateChartContent(element as HTMLElement);
        if (hasContent) {
          availableCharts.push(chart);
        }
      }
    }

    return availableCharts.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Capture multiple charts based on options
   */
  async captureCharts(options: ChartCaptureOptions = {}): Promise<CapturedChart[]> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Add data attributes to elements first
    this.addChartDataAttributes();
    
    const availableCharts = await this.detectAvailableCharts();
    
    // Filter charts based on selection
    const chartsToCapture = opts.selectedCharts && opts.selectedCharts.length > 0
      ? availableCharts.filter(chart => opts.selectedCharts!.includes(chart.selector))
      : availableCharts;

    const capturedCharts: CapturedChart[] = [];

    for (const chart of chartsToCapture) {
      try {
        const captured = await this.captureChart(chart, opts);
        if (captured) {
          capturedCharts.push(captured);
        }
      } catch (error) {
        console.warn(`Failed to capture chart ${chart.selector}:`, error);
      }
    }

    return capturedCharts;
  }

  /**
   * Capture a single chart with retries
   */
  private async captureChart(
    config: ChartConfig, 
    options: Required<ChartCaptureOptions>
  ): Promise<CapturedChart | null> {
    for (let attempt = 1; attempt <= options.retryAttempts; attempt++) {
      try {
        const element = document.querySelector(config.selector) as HTMLElement;
        
        if (!element) {
          console.warn(`Chart element not found: ${config.selector}`);
          return null;
        }

        // Wait for any animations or async content to complete
        await this.waitForChartReady(element);

        // Ensure element is visible and has dimensions
        if (!this.isElementVisible(element)) {
          console.warn(`Chart element not visible: ${config.selector}`);
          return null;
        }

        const captureOptions = {
          useCORS: true,
          allowTaint: false,
          backgroundColor: config.captureOptions?.backgroundColor || '#ffffff',
          scale: options.quality === 'high' ? 2 : 1,
          width: config.captureOptions?.width,
          height: config.captureOptions?.height,
          logging: false,
          ...config.captureOptions
        };

        const canvas = await html2canvas(element, captureOptions);
        
        // Validate captured canvas
        if (canvas.width === 0 || canvas.height === 0) {
          throw new Error(`Invalid canvas dimensions: ${canvas.width}x${canvas.height}`);
        }

        const imageData = canvas.toDataURL('image/png', 0.95);
        
        return {
          config,
          imageData,
          dimensions: {
            width: canvas.width,
            height: canvas.height
          },
          timestamp: Date.now()
        };

      } catch (error) {
        console.warn(`Chart capture attempt ${attempt} failed for ${config.selector}:`, error);
        
        if (attempt < options.retryAttempts) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    return null;
  }

  /**
   * Wait for chart to be ready (animations, data loading, etc.)
   */
  private async waitForChartReady(element: HTMLElement, timeout: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkReady = () => {
        // Check for common chart library indicators
        const hasRechart = element.querySelector('.recharts-wrapper, .recharts-surface');
        const hasCanvas = element.querySelector('canvas');
        const hasSvg = element.querySelector('svg');
        const hasChartContent = element.querySelector('[data-chart-content="true"]');
        
        // If we have chart content, wait a bit more for animations
        if (hasRechart || hasCanvas || hasSvg || hasChartContent) {
          setTimeout(resolve, 500); // Small delay for animations
          return;
        }

        // Timeout check
        if (Date.now() - startTime > timeout) {
          resolve();
          return;
        }

        // Check again in 100ms
        setTimeout(checkReady, 100);
      };

      checkReady();
    });
  }

  /**
   * Check if element is visible and has meaningful content
   */
  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 && 
      rect.height > 0 && 
      style.display !== 'none' && 
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  /**
   * Validate that chart element has actual content
   */
  private async validateChartContent(element: HTMLElement): Promise<boolean> {
    // Check for common chart indicators
    const indicators = [
      '.recharts-wrapper',
      '.recharts-surface', 
      'canvas',
      'svg',
      '[data-chart-content="true"]'
    ];

    for (const indicator of indicators) {
      if (element.querySelector(indicator)) {
        return true;
      }
    }

    // Check if element has meaningful text content (for text-based charts)
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length > 10) {
      return true;
    }

    return false;
  }

  /**
   * Get chart metadata for PDF inclusion
   */
  getChartMetadata(selector: string): ChartConfig | undefined {
    return this.charts.find(chart => chart.selector === selector);
  }

  /**
   * Add data attributes to chart elements for capture
   */
  private addChartDataAttributes(): void {
    const attributeMap = [
      { selector: '.demographic-charts-container, [data-testid="demographic-charts"]', attribute: 'demographic-overview' },
      { selector: '.ethnicity-chart-section', attribute: 'ethnicity-distribution' },
      { selector: '.age-gender-chart-section', attribute: 'age-gender-distribution' },
      { selector: '.income-chart-section', attribute: 'income-distribution' },
      { selector: '[data-testid="foot-traffic-chart"]', attribute: 'foot-traffic-timeline' },
      { selector: '.foot-traffic-periods-container', attribute: 'foot-traffic-periods' },
      { selector: '[data-testid="crime-trend-chart"]', attribute: 'crime-trend' },
      { selector: '.trend-indicators-container', attribute: 'trend-indicators' }
    ];

    attributeMap.forEach(({ selector, attribute }) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.setAttribute('data-chart', attribute);
        });
        if (elements.length > 0) {
          console.log(`📊 [Chart Capture] Added data-chart="${attribute}" to ${elements.length} elements`);
        }
      } catch (error) {
        console.warn(`⚠️ [Chart Capture] Failed to add attribute to ${selector}:`, error);
      }
    });
  }

  /**
   * Static method to add data attributes from anywhere in the app
   */
  static addChartDataAttributes(): void {
    const instance = new ChartCaptureService();
    instance.addChartDataAttributes();
  }
}