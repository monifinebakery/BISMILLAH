// services/PromoCalculatorService.ts
import { toast } from 'sonner';

// 📊 Types
interface Recipe {
  id: string;
  namaResep: string;
  hppPerPorsi: number;
  hargaJualPorsi: number;
}

interface PromoEstimation {
  id?: string;
  promo_name: string;
  promo_type: string;
  base_recipe_id: string;
  base_recipe_name: string;
  promo_details: any;
  original_price: number;
  original_hpp: number;
  promo_price_effective: number;
  estimated_margin_percent: number;
  estimated_margin_rp: number;
  created_at?: string;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    duration: number;
    cacheHit?: boolean;
  };
}

// 🎯 Base Service Class
abstract class BaseService {
  protected apiUrl: string;
  protected timeout: number;
  protected retryAttempts: number;
  
  constructor(
    apiUrl: string = '/api',
    timeout: number = 10000,
    retryAttempts: number = 3
  ) {
    this.apiUrl = apiUrl;
    this.timeout = timeout;
    this.retryAttempts = retryAttempts;
  }

  protected async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<ServiceResponse<T>> {
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(`${this.apiUrl}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const duration = performance.now() - startTime;
      
      return {
        success: true,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          duration,
        },
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (attempt < this.retryAttempts && !error.name?.includes('AbortError')) {
        console.warn(`🔄 Retry attempt ${attempt}/${this.retryAttempts} for ${url}`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      
      return {
        success: false,
        error: error.message || 'Network error occurred',
        metadata: {
          timestamp: new Date().toISOString(),
          duration,
        },
      };
    }
  }

  protected handleError(error: string, context: string) {
    console.error(`❌ ${context}:`, error);
    toast.error(error);
  }
}

// 🍽️ Recipe Service
class RecipeService extends BaseService {
  private cache = new Map<string, { data: Recipe[]; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getAllRecipes(): Promise<Recipe[]> {
    const cacheKey = 'all_recipes';
    const cached = this.cache.get(cacheKey);
    
    // Check cache
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const response = await this.fetchWithRetry<Recipe[]>('/recipes');
    
    if (!response.success) {
      this.handleError(response.error!, 'Failed to load recipes');
      return cached?.data || []; // Return cached data as fallback
    }

    // Update cache
    this.cache.set(cacheKey, {
      data: response.data!,
      timestamp: Date.now()
    });

    return response.data!;
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    const cacheKey = `recipe_${id}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data[0] || null;
    }

    const response = await this.fetchWithRetry<Recipe>(`/recipes/${id}`);
    
    if (!response.success) {
      this.handleError(response.error!, `Failed to load recipe ${id}`);
      return null;
    }

    // Update cache
    this.cache.set(cacheKey, {
      data: [response.data!],
      timestamp: Date.now()
    });

    return response.data!;
  }

  clearCache() {
    this.cache.clear();
  }
}

// 🎯 Promo Estimation Service
class PromoEstimationService extends BaseService {
  private cache = new Map<string, { data: PromoEstimation[]; timestamp: number }>();
  private cacheTimeout = 2 * 60 * 1000; // 2 minutes (shorter for frequently changing data)

  async getAllPromoEstimations(): Promise<PromoEstimation[]> {
    const cacheKey = 'all_promo_estimations';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const response = await this.fetchWithRetry<PromoEstimation[]>('/promo-estimations');
    
    if (!response.success) {
      this.handleError(response.error!, 'Failed to load promo estimations');
      return cached?.data || [];
    }

    // Sort by creation date (newest first)
    const sortedData = response.data!.sort((a, b) => 
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );

    this.cache.set(cacheKey, {
      data: sortedData,
      timestamp: Date.now()
    });

    return sortedData;
  }

  async savePromoEstimation(data: Omit<PromoEstimation, 'id'>): Promise<PromoEstimation> {
    const response = await this.fetchWithRetry<PromoEstimation>('/promo-estimations', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        created_at: new Date().toISOString()
      }),
    });

    if (!response.success) {
      this.handleError(response.error!, 'Failed to save promo estimation');
      throw new Error(response.error);
    }

    // Invalidate cache
    this.cache.delete('all_promo_estimations');
    
    toast.success('Promo estimation saved successfully!');
    return response.data!;
  }

  async deletePromoEstimations(ids: string[]): Promise<void> {
    const response = await this.fetchWithRetry('/promo-estimations/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });

    if (!response.success) {
      this.handleError(response.error!, 'Failed to delete promo estimations');
      throw new Error(response.error);
    }

    // Invalidate cache
    this.cache.delete('all_promo_estimations');
    
    toast.success(`${ids.length} promo estimation(s) deleted successfully!`);
  }

  async getPromoEstimationById(id: string): Promise<PromoEstimation | null> {
    const response = await this.fetchWithRetry<PromoEstimation>(`/promo-estimations/${id}`);
    
    if (!response.success) {
      this.handleError(response.error!, `Failed to load promo estimation ${id}`);
      return null;
    }

    return response.data!;
  }

  clearCache() {
    this.cache.clear();
  }
}

// 📊 Analytics Service
class AnalyticsService extends BaseService {
  async trackPromoCalculation(data: {
    promoType: string;
    originalPrice: number;
    discountValue: number;
    marginPercent: number;
    isNegativeMargin: boolean;
  }) {
    // Fire and forget - don't block UI
    this.fetchWithRetry('/analytics/promo-calculation', {
      method: 'POST',
      body: JSON.stringify({
        event: 'promo_calculated',
        timestamp: new Date().toISOString(),
        properties: data
      }),
    }).catch(error => {
      // Silent fail for analytics
      console.warn('📊 Analytics tracking failed:', error);
    });
  }

  async trackPromoSaved(data: {
    promoType: string;
    marginPercent: number;
    promoName: string;
  }) {
    this.fetchWithRetry('/analytics/promo-saved', {
      method: 'POST',
      body: JSON.stringify({
        event: 'promo_saved',
        timestamp: new Date().toISOString(),
        properties: data
      }),
    }).catch(error => {
      console.warn('📊 Analytics tracking failed:', error);
    });
  }

  async trackPerformanceMetrics(metrics: {
    componentName: string;
    renderTime: number;
    calculationTime: number;
    userAction: string;
  }) {
    this.fetchWithRetry('/analytics/performance', {
      method: 'POST',
      body: JSON.stringify({
        event: 'performance_metrics',
        timestamp: new Date().toISOString(),
        properties: metrics
      }),
    }).catch(error => {
      console.warn('📊 Performance tracking failed:', error);
    });
  }
}

// 🔧 Service Factory
class ServiceFactory {
  private static instances = new Map<string, any>();

  static getRecipeService(): RecipeService {
    if (!this.instances.has('recipe')) {
      this.instances.set('recipe', new RecipeService());
    }
    return this.instances.get('recipe');
  }

  static getPromoEstimationService(): PromoEstimationService {
    if (!this.instances.has('promo')) {
      this.instances.set('promo', new PromoEstimationService());
    }
    return this.instances.get('promo');
  }

  static getAnalyticsService(): AnalyticsService {
    if (!this.instances.has('analytics')) {
      this.instances.set('analytics', new AnalyticsService());
    }
    return this.instances.get('analytics');
  }

  static clearAllCaches() {
    const recipeService = this.instances.get('recipe');
    const promoService = this.instances.get('promo');
    
    if (recipeService) recipeService.clearCache();
    if (promoService) promoService.clearCache();
    
    toast.success('All caches cleared');
  }

  static getHealthStatus() {
    return {
      recipe: !!this.instances.get('recipe'),
      promo: !!this.instances.get('promo'),
      analytics: !!this.instances.get('analytics'),
      cacheSize: {
        recipe: this.instances.get('recipe')?.cache?.size || 0,
        promo: this.instances.get('promo')?.cache?.size || 0
      }
    };
  }
}

// 🎭 Mock Service Implementation (for development/testing)
class MockPromoCalculatorService {
  private mockRecipes: Recipe[] = [
    {
      id: '1',
      namaResep: 'Nasi Gudeg',
      hppPerPorsi: 8000,
      hargaJualPorsi: 15000
    },
    {
      id: '2', 
      namaResep: 'Ayam Bakar',
      hppPerPorsi: 12000,
      hargaJualPorsi: 25000
    },
    {
      id: '3',
      namaResep: 'Es Teh Manis',
      hppPerPorsi: 2000,
      hargaJualPorsi: 5000
    }
  ];

  private mockPromoEstimations: PromoEstimation[] = [];

  async getAllRecipes(): Promise<Recipe[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return [...this.mockRecipes];
  }

  async getAllPromoEstimations(): Promise<PromoEstimation[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...this.mockPromoEstimations];
  }

  async savePromoEstimation(data: Omit<PromoEstimation, 'id'>): Promise<PromoEstimation> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newEstimation: PromoEstimation = {
      ...data,
      id: `mock-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    
    this.mockPromoEstimations.unshift(newEstimation);
    return newEstimation;
  }

  async deletePromoEstimations(ids: string[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.mockPromoEstimations = this.mockPromoEstimations.filter(
      promo => !ids.includes(promo.id!)
    );
  }
}

// 🎯 Service Hook
export const useServices = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment && window.location.search.includes('mock=true')) {
    const mockService = new MockPromoCalculatorService();
    return {
      recipeService: mockService,
      promoService: mockService,
      analyticsService: ServiceFactory.getAnalyticsService(),
      isMock: true
    };
  }

  return {
    recipeService: ServiceFactory.getRecipeService(),
    promoService: ServiceFactory.getPromoEstimationService(),
    analyticsService: ServiceFactory.getAnalyticsService(),
    isMock: false
  };
};

// 🔍 Service Health Check Hook
export const useServiceHealth = () => {
  const [health, setHealth] = React.useState(ServiceFactory.getHealthStatus());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setHealth(ServiceFactory.getHealthStatus());
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const clearCaches = React.useCallback(() => {
    ServiceFactory.clearAllCaches();
    setHealth(ServiceFactory.getHealthStatus());
  }, []);
  
  return { health, clearCaches };
};

export {
  ServiceFactory,
  RecipeService,
  PromoEstimationService,
  AnalyticsService,
  MockPromoCalculatorService
};

export type {
  Recipe,
  PromoEstimation,
  ServiceResponse
};