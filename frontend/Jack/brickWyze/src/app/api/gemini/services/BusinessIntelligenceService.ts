// src/app/api/gemini/services/BusinessIntelligenceService.ts

export interface BusinessContext {
  type: 'nightlife' | 'heritage_food' | 'premium_food' | 'all_hours' | 'professional_services' | 'general';
  priority: 'cultural_fit' | 'foot_traffic' | 'affordability' | 'safety' | 'balanced';
  timePreference: string[];
  demographics: {
    age: [number, number];
    income?: [number, number];
  };
}

export class BusinessIntelligenceService {
  /**
   * Analyzes a business request message to determine the business context
   */
  static analyzeBusinessRequest(message: string): BusinessContext {
    const lowerMessage = message.toLowerCase();
    
    // Nightlife detection
    if (this.isNightlifeBusiness(lowerMessage)) {
      return {
        type: 'nightlife',
        priority: 'cultural_fit',
        timePreference: ['evening'],
        demographics: {
          age: [22, 38],
          income: [45000, 120000]
        }
      };
    }
    
    // Heritage food detection
    if (this.isHeritageFoodBusiness(lowerMessage)) {
      return {
        type: 'heritage_food',
        priority: 'cultural_fit',
        timePreference: ['afternoon', 'evening'],
        demographics: {
          age: [25, 55],
          income: [30000, 100000]
        }
      };
    }
    
    // Premium food detection
    if (this.isPremiumFoodBusiness(lowerMessage)) {
      return {
        type: 'premium_food',
        priority: 'cultural_fit',
        timePreference: ['morning', 'afternoon', 'evening'],
        demographics: {
          age: [22, 40],
          income: [50000, 130000]
        }
      };
    }
    
    // All hours business detection
    if (this.isAllHoursBusiness(lowerMessage)) {
      return {
        type: 'all_hours',
        priority: 'foot_traffic',
        timePreference: ['morning', 'afternoon', 'evening'],
        demographics: {
          age: [18, 65]
        }
      };
    }
    
    // Professional services detection
    if (this.isProfessionalServices(lowerMessage)) {
      return {
        type: 'professional_services',
        priority: 'foot_traffic',
        timePreference: ['morning', 'afternoon'],
        demographics: {
          age: [25, 45],
          income: [60000, 150000]
        }
      };
    }
    
    // Default to general business
    return {
      type: 'general',
      priority: 'balanced',
      timePreference: ['afternoon'],
      demographics: {
        age: [25, 45],
        income: [40000, 100000]
      }
    };
  }
  
  private static isNightlifeBusiness(message: string): boolean {
    const nightlifeKeywords = [
      'bar', 'club', 'nightclub', 'cocktail', 'lounge', 'speakeasy',
      'nightlife', 'drinks', 'alcohol', 'beer', 'wine', 'spirits',
      'late night', 'party', 'dance', 'dj', 'music venue'
    ];
    
    return nightlifeKeywords.some(keyword => message.includes(keyword));
  }
  
  private static isHeritageFoodBusiness(message: string): boolean {
    const heritageKeywords = [
      'traditional', 'authentic', 'heritage', 'ethnic', 'cultural',
      'family recipe', 'homemade', 'grandmother', 'old school',
      'chinese', 'korean', 'japanese', 'italian', 'mexican', 'indian',
      'thai', 'vietnamese', 'greek', 'lebanese', 'ethiopian', 'jamaican'
    ];
    
    const foodKeywords = ['restaurant', 'food', 'cuisine', 'kitchen', 'deli', 'bakery'];
    
    const hasHeritage = heritageKeywords.some(keyword => message.includes(keyword));
    const hasFood = foodKeywords.some(keyword => message.includes(keyword));
    
    return hasHeritage && hasFood;
  }
  
  private static isPremiumFoodBusiness(message: string): boolean {
    const premiumKeywords = [
      'artisan', 'craft', 'gourmet', 'premium', 'specialty', 'boutique',
      'farm to table', 'organic', 'locally sourced', 'fine dining',
      'coffee roaster', 'third wave', 'single origin', 'small batch'
    ];
    
    return premiumKeywords.some(keyword => message.includes(keyword));
  }
  
  private static isAllHoursBusiness(message: string): boolean {
    const allHoursKeywords = [
      '24 hour', '24/7', 'all hours', 'round the clock', 'always open',
      'convenience store', 'diner', 'late night', 'early morning'
    ];
    
    return allHoursKeywords.some(keyword => message.includes(keyword));
  }
  
  private static isProfessionalServices(message: string): boolean {
    const professionalKeywords = [
      'office', 'consulting', 'lawyer', 'attorney', 'accountant',
      'financial', 'medical', 'dental', 'clinic', 'therapy',
      'professional services', 'business services', 'corporate'
    ];
    
    return professionalKeywords.some(keyword => message.includes(keyword));
  }
}