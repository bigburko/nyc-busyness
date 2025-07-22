// src/app/api/gemini/services/ValidationService.ts
import { BusinessContext } from './BusinessIntelligenceService';

interface WeightOption {
  id: string;
  value: number;
  label?: string;
  icon?: string;
  color?: string;
}

interface DemographicScoring {
  weights: {
    ethnicity: number;
    age: number;
    income: number;
    gender: number;
  };
  reasoning?: string;
}

interface AIResponse {
  weights?: WeightOption[];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: number[];
  incomeRange?: number[];
  selectedTimePeriods?: string[];
  rentRange?: number[];
  demographicScoring?: DemographicScoring;
}

export class ValidationService {
  static processAndValidateResponse(reply: string, businessContext: BusinessContext): AIResponse {
    try {
      const parsedReply: AIResponse = JSON.parse(reply);
      
      // Validate and fix age range
      if (parsedReply.ageRange && Array.isArray(parsedReply.ageRange)) {
        parsedReply.ageRange = this.validateAgeRange(parsedReply.ageRange, businessContext);
      }
      
      // Validate and fix income range
      if (parsedReply.incomeRange && Array.isArray(parsedReply.incomeRange)) {
        parsedReply.incomeRange = this.validateIncomeRange(parsedReply.incomeRange, businessContext);
      }
      
      // Validate and fix time periods
      if (parsedReply.selectedTimePeriods && Array.isArray(parsedReply.selectedTimePeriods)) {
        parsedReply.selectedTimePeriods = this.validateTimePeriods(
          parsedReply.selectedTimePeriods, 
          businessContext
        );
      }
      
      // Validate gender selection
      if (parsedReply.selectedGenders && Array.isArray(parsedReply.selectedGenders)) {
        parsedReply.selectedGenders = this.validateGenders(parsedReply.selectedGenders);
      }
      
      // Validate rent range
      if (parsedReply.rentRange && Array.isArray(parsedReply.rentRange)) {
        parsedReply.rentRange = this.validateRentRange(parsedReply.rentRange, businessContext);
      }

      // Validate ethnicities
      if (parsedReply.selectedEthnicities && Array.isArray(parsedReply.selectedEthnicities)) {
        parsedReply.selectedEthnicities = this.validateEthnicities(parsedReply.selectedEthnicities);
      }

      console.log('✅ [Validation] Response validation completed successfully');
      return parsedReply;
      
    } catch (parseError) {
      console.error('❌ [Validation] Failed to parse response:', parseError);
      throw new Error('Invalid JSON response from AI');
    }
  }

  private static validateAgeRange(ageRange: number[], businessContext: BusinessContext): number[] {
    let [min, max] = ageRange;
    
    // Apply business-specific age constraints
    const businessMinAge = businessContext.demographics.age[0];
    const businessMaxAge = businessContext.demographics.age[1];
    
    // Enforce minimum constraints
    if (min < 18) min = 18;
    if (max > 80) max = 80;
    if (min >= max) {
      min = businessMinAge;
      max = businessMaxAge;
    }
    
    // Apply business-specific suggestions if too broad
    if (max - min > 40 && businessContext.type !== 'general') {
      console.log(`🎯 [Validation] Narrowing age range for ${businessContext.type} business`);
      min = businessMinAge;
      max = businessMaxAge;
    }
    
    console.log(`📅 [Validation] Age range set: ${min}-${max} for ${businessContext.type}`);
    return [min, max];
  }

  private static validateIncomeRange(incomeRange: number[], businessContext: BusinessContext): number[] {
    let [min, max] = incomeRange;
    
    // Enforce absolute constraints
    if (min < 20000) min = 20000;
    if (max > 250000) max = 250000;
    if (min >= max) {
      // Use business-specific defaults
      if (businessContext.demographics.income) {
        min = businessContext.demographics.income[0];
        max = businessContext.demographics.income[1];
      } else {
        min = 30000;
        max = 100000;
      }
    }
    
    // Apply business-specific income logic
    if (businessContext.type === 'professional_services' && min < 50000) {
      console.log('💼 [Validation] Raising minimum income for professional services');
      min = 50000;
    }
    
    if (businessContext.type === 'heritage_food' && min > 60000) {
      console.log('🏮 [Validation] Lowering minimum income for accessible heritage food');
      min = 30000;
    }
    
    console.log(`💰 [Validation] Income range set: $${min}-$${max} for ${businessContext.type}`);
    return [min, max];
  }

  private static validateTimePeriods(timePeriods: string[], businessContext: BusinessContext): string[] {
    const validPeriods = ['morning', 'afternoon', 'evening'];
    let filteredPeriods = timePeriods.filter(p => validPeriods.includes(p));
    
    // Apply business-specific time logic
    if (businessContext.type === 'nightlife') {
      console.log('🍸 [Validation] Enforcing evening-only for nightlife');
      filteredPeriods = ['evening'];
    }
    
    if (businessContext.type === 'professional_services') {
      console.log('💼 [Validation] Enforcing business hours for professional services');
      filteredPeriods = filteredPeriods.filter(p => p !== 'evening');
      if (filteredPeriods.length === 0) {
        filteredPeriods = ['morning', 'afternoon'];
      }
    }
    
    if (businessContext.type === 'all_hours') {
      console.log('🕐 [Validation] Enforcing all periods for 24-hour business');
      filteredPeriods = ['morning', 'afternoon', 'evening'];
    }
    
    // Ensure at least one period
    if (filteredPeriods.length === 0) {
      filteredPeriods = businessContext.timePreference || ['afternoon'];
    }
    
    console.log(`🕐 [Validation] Time periods set: ${filteredPeriods.join(', ')} for ${businessContext.type}`);
    return filteredPeriods;
  }

  private static validateGenders(genders: string[]): string[] {
    const validGenders = ['male', 'female'];
    const filteredGenders = genders.filter(g => validGenders.includes(g));
    
    // Default to inclusive if empty
    if (filteredGenders.length === 0) {
      console.log('⚠️ [Validation] Empty gender selection, defaulting to inclusive');
      return ['male', 'female'];
    }
    
    return filteredGenders;
  }

  private static validateRentRange(rentRange: number[], businessContext: BusinessContext): number[] {
    let [min, max] = rentRange;
    
    // Enforce NYC rent constraints
    if (min < 26) min = 26;   // Minimum realistic rent per sqft in NYC
    if (max > 160) max = 160; // Maximum realistic rent per sqft
    if (min >= max) {
      // Business-specific rent defaults
      if (businessContext.type === 'professional_services') {
        min = 80;
        max = 150;
      } else if (businessContext.type === 'heritage_food') {
        min = 40;
        max = 90;
      } else {
        min = 60;
        max = 120;
      }
    }
    
    console.log(`🏠 [Validation] Rent range set: $${min}-$${max}/sqft for ${businessContext.type}`);
    return [min, max];
  }

  private static validateEthnicities(ethnicities: string[]): string[] {
    // List of valid ethnicity options that exist in your system
    const validEthnicities = [
      'asian', 'east_asian', 'south_asian', 'southeast_asian', 'central_asian',
      'korean', 'chinese', 'japanese', 'taiwanese', 'filipino', 'vietnamese', 
      'thai', 'cambodian', 'indonesian', 'malaysian', 'burmese', 'singaporean',
      'indian', 'pakistani', 'bangladeshi', 'sri_lankan', 'nepalese', 'afghan', 'uzbek',
      'hispanic', 'latino', 'latinx', 'mexican', 'central_american', 'south_american', 
      'caribbean_hispanic', 'puerto_rican', 'cuban', 'dominican', 'costa_rican',
      'guatemalan', 'honduran', 'nicaraguan', 'salvadoran', 'argentinean', 'bolivian',
      'chilean', 'colombian', 'ecuadorian', 'peruvian', 'venezuelan',
      'white', 'european', 'middle_eastern', 'north_african', 'italian', 'irish',
      'german', 'polish', 'russian', 'french', 'british', 'english', 'scottish',
      'greek', 'portuguese', 'dutch', 'swedish', 'norwegian', 'turkish', 'armenian',
      'arab', 'lebanese', 'palestinian', 'syrian', 'egyptian', 'iraqi', 'iranian', 'israeli',
      'black', 'african_american', 'sub_saharan_african', 'caribbean_black',
      'nigerian', 'ghanaian', 'ethiopian', 'kenyan', 'south_african', 'jamaican',
      'haitian', 'barbadian', 'trinidadian', 'native_american', 'american_indian',
      'alaska_native', 'pacific_islander', 'native_hawaiian', 'samoan', 'some_other_race',
      'brazilian', 'belizean', 'guyanese'
    ];

    const filteredEthnicities = ethnicities.filter(e => 
      validEthnicities.includes(e.toLowerCase().replace(/[^a-z]/g, '_'))
    );

    if (filteredEthnicities.length !== ethnicities.length) {
      const invalid = ethnicities.filter(e => !filteredEthnicities.includes(e));
      console.warn(`⚠️ [Validation] Invalid ethnicities filtered out: ${invalid.join(', ')}`);
    }

    return filteredEthnicities;
  }
}