// src/app/api/gemini/services/WeightNormalizationService.ts

interface WeightOption {
  id: string;
  value: number;
  label?: string;
  icon?: string;
  color?: string;
}

interface NormalizedResponse {
  weights: WeightOption[];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: number[];
  incomeRange?: number[];
  selectedTimePeriods?: string[];
  rentRange?: number[];
  demographicScoring?: {
    weights: {
      ethnicity: number;
      age: number;
      income: number;
      gender: number;
    };
    reasoning?: string;
  };
}

interface AIResponse {
  weights?: WeightOption[];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: number[];
  incomeRange?: number[];
  selectedTimePeriods?: string[];
  rentRange?: number[];
  demographicScoring?: {
    weights: {
      ethnicity: number;
      age: number;
      income: number;
      gender: number;
    };
    reasoning?: string;
  };
}

export class WeightNormalizationService {
  /**
   * Normalizes and validates AI response weights to ensure they sum to 100%
   */
  static normalizeWeights(response: AIResponse): NormalizedResponse {
    // Ensure weights array exists
    if (!response.weights || !Array.isArray(response.weights)) {
      console.warn('⚠️ [WeightNormalization] No weights array found, using defaults');
      response.weights = this.getDefaultWeights();
    }

    // Validate weight structure
    const validatedWeights = response.weights.filter(weight => 
      weight && 
      typeof weight === 'object' && 
      typeof weight.id === 'string' && 
      typeof weight.value === 'number' &&
      weight.value >= 0
    );

    if (validatedWeights.length === 0) {
      console.warn('⚠️ [WeightNormalization] No valid weights found, using defaults');
      response.weights = this.getDefaultWeights();
      return response as NormalizedResponse;
    }

    // Calculate current total
    const currentTotal = validatedWeights.reduce((sum, weight) => sum + weight.value, 0);

    if (currentTotal === 0) {
      console.warn('⚠️ [WeightNormalization] All weights are zero, using defaults');
      response.weights = this.getDefaultWeights();
      return response as NormalizedResponse;
    }

    // Normalize to 100%
    if (Math.abs(currentTotal - 100) > 0.1) {
      console.log(`🔧 [WeightNormalization] Normalizing weights from ${currentTotal}% to 100%`);
      
      validatedWeights.forEach(weight => {
        const normalizedValue = (weight.value / currentTotal) * 100;
        weight.value = Math.round(normalizedValue * 10) / 10; // Round to 1 decimal
      });

      // Ensure exactly 100% by adjusting the largest weight if needed
      const newTotal = validatedWeights.reduce((sum, weight) => sum + weight.value, 0);
      if (Math.abs(newTotal - 100) > 0.1) {
        const largestWeight = validatedWeights.reduce((max, weight) => 
          weight.value > max.value ? weight : max
        );
        largestWeight.value += (100 - newTotal);
        largestWeight.value = Math.round(largestWeight.value * 10) / 10;
      }
    }

    // Fill in any missing standard weights with 0
    const standardWeightIds = ['demographic', 'foot_traffic', 'crime', 'flood_risk', 'rent_score', 'poi'];
    const existingIds = new Set(validatedWeights.map(w => w.id));
    
    for (const id of standardWeightIds) {
      if (!existingIds.has(id)) {
        validatedWeights.push({
          id,
          value: 0,
          label: this.getWeightLabel(id),
          icon: this.getWeightIcon(id),
          color: this.getWeightColor(id)
        });
      }
    }

    response.weights = validatedWeights;

    console.log('✅ [WeightNormalization] Weights normalized successfully:', 
      validatedWeights.map(w => `${w.id}: ${w.value}%`).join(', ')
    );

    return response as NormalizedResponse;
  }

  /**
   * Validates demographic scoring weights
   */
  static validateDemographicScoring(response: NormalizedResponse): NormalizedResponse {
    if (!response.demographicScoring?.weights) {
      console.log('⚠️ [WeightNormalization] No demographic scoring weights found');
      return response;
    }

    const demoWeights = response.demographicScoring.weights;
    const weightKeys: (keyof typeof demoWeights)[] = ['ethnicity', 'age', 'income', 'gender'];
    
    // Validate all weights exist and are numbers
    let isValid = true;
    for (const key of weightKeys) {
      if (typeof demoWeights[key] !== 'number' || demoWeights[key] < 0 || demoWeights[key] > 1) {
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      console.warn('⚠️ [WeightNormalization] Invalid demographic weights, applying defaults');
      response.demographicScoring.weights = {
        ethnicity: 0.4,
        age: 0.3,
        income: 0.2,
        gender: 0.1
      };
      return response;
    }

    // Normalize demographic weights to sum to 1.0
    const demoTotal = weightKeys.reduce((sum, key) => sum + demoWeights[key], 0);
    
    if (Math.abs(demoTotal - 1.0) > 0.01) {
      console.log(`🔧 [WeightNormalization] Normalizing demographic weights from ${demoTotal} to 1.0`);
      
      if (demoTotal > 0) {
        weightKeys.forEach(key => {
          demoWeights[key] = Math.round((demoWeights[key] / demoTotal) * 100) / 100;
        });
      } else {
        // All weights are zero, apply defaults
        demoWeights.ethnicity = 0.4;
        demoWeights.age = 0.3;
        demoWeights.income = 0.2;
        demoWeights.gender = 0.1;
      }
    }

    return response;
  }

  private static getDefaultWeights(): WeightOption[] {
    return [
      { id: 'demographic', value: 40, label: 'Demographic Match', icon: '👨‍👩‍👧‍👦', color: '#34A853' },
      { id: 'foot_traffic', value: 30, label: 'Foot Traffic', icon: '👥', color: '#4285F4' },
      { id: 'crime', value: 15, label: 'Safety', icon: '🛡️', color: '#EA4335' },
      { id: 'flood_risk', value: 10, label: 'Flood Risk', icon: '🌊', color: '#FBBC04' },
      { id: 'rent_score', value: 5, label: 'Rent', icon: '🏠', color: '#FF6D01' },
      { id: 'poi', value: 0, label: 'Points of Interest', icon: '📍', color: '#805AD5' }
    ];
  }

  private static getWeightLabel(id: string): string {
    const labels: Record<string, string> = {
      demographic: 'Demographic Match',
      foot_traffic: 'Foot Traffic',
      crime: 'Safety',
      flood_risk: 'Flood Risk',
      rent_score: 'Rent',
      poi: 'Points of Interest'
    };
    return labels[id] || id;
  }

  private static getWeightIcon(id: string): string {
    const icons: Record<string, string> = {
      demographic: '👨‍👩‍👧‍👦',
      foot_traffic: '👥',
      crime: '🛡️',
      flood_risk: '🌊',
      rent_score: '🏠',
      poi: '📍'
    };
    return icons[id] || '⚙️';
  }

  private static getWeightColor(id: string): string {
    const colors: Record<string, string> = {
      demographic: '#34A853',
      foot_traffic: '#4285F4',
      crime: '#EA4335',
      flood_risk: '#FBBC04',
      rent_score: '#FF6D01',
      poi: '#805AD5'
    };
    return colors[id] || '#666666';
  }
}