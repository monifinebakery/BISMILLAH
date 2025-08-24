// src/components/operational-costs/__tests__/dualModeSystem.test.ts
// 🧪 Comprehensive Dual-Mode System Tests (Revision 9)
// Tests using example data to verify all calculations work correctly

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateDualModeCosts,
  calculateCostPerUnit,
  calculateHPPWithDualMode,
  calculateSellingPrice,
  verifyExampleCalculations,
  roundCurrency
} from '../utils/dualModeCalculations';
import {
  classifyCostByKeywords,
  getCostGroupLabel
} from '../constants/costClassification';
import {
  validateCostForm,
  validateTargetOutput,
  validateMonthlyAmount,
  roundCurrencyWithRule
} from '../utils/validationAndMicrocopy';
import {
  calculateEnhancedHPP,
  updateIngredientsWithWAC
} from '../utils/enhancedHppCalculations';
import type { OperationalCost } from '../types/operationalCost.types';

// ====================================
// TEST DATA FROM REVISION 9
// ====================================

const EXAMPLE_DATA = {
  // Overhead costs (HPP group)
  overheadCosts: [
    {
      id: '1',
      user_id: 'test-user',
      nama_biaya: 'Gas Oven',
      jumlah_per_bulan: 690000,
      jenis: 'tetap' as const,
      status: 'aktif' as const,
      group: 'HPP' as const,
      cost_category: 'fixed' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'test-user',
      nama_biaya: 'Sewa Dapur',
      jumlah_per_bulan: 1500000,
      jenis: 'tetap' as const,
      status: 'aktif' as const,
      group: 'HPP' as const,
      cost_category: 'fixed' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ] as OperationalCost[],
  
  // Operational costs (non-HPP group)
  operasionalCosts: [
    {
      id: '3',
      user_id: 'test-user',
      nama_biaya: 'Marketing',
      jumlah_per_bulan: 4000000,
      jenis: 'variabel' as const,
      status: 'aktif' as const,
      group: 'OPERASIONAL' as const,
      cost_category: 'variable' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ] as OperationalCost[],
  
  // Target production
  targetOutput: 3000,
  
  // Recipe example data
  recipeExample: {
    bahan: 4200, // per pcs
    tkl: 3000,   // per pcs
    expectedOverhead: 730, // from calculation
    expectedHPP: 7930, // 4200 + 3000 + 730
    markup35: 10706,   // 7930 × 1.35
    margin35: 12200    // 7930 ÷ 0.65
  }
};

// ====================================
// DUAL-MODE CALCULATION TESTS
// ====================================

describe('Dual-Mode Cost Calculations', () => {
  
  describe('calculateCostPerUnit', () => {
    it('should calculate HPP group cost per unit correctly', () => {
      const result = calculateCostPerUnit(
        EXAMPLE_DATA.overheadCosts,
        'HPP',
        EXAMPLE_DATA.targetOutput
      );
      
      expect(result.group).toBe('HPP');
      expect(result.totalCosts).toBe(2190000); // 690000 + 1500000
      expect(result.targetOutput).toBe(3000);
      expect(result.costPerUnit).toBe(730); // 2190000 / 3000
      expect(result.isValid).toBe(true);
      expect(result.validationErrors).toHaveLength(0);
    });
    
    it('should calculate Operasional group cost per unit correctly', () => {
      const result = calculateCostPerUnit(
        EXAMPLE_DATA.operasionalCosts,
        'OPERASIONAL',
        EXAMPLE_DATA.targetOutput
      );
      
      expect(result.group).toBe('OPERASIONAL');
      expect(result.totalCosts).toBe(4000000);
      expect(result.targetOutput).toBe(3000);
      expect(result.costPerUnit).toBe(1333); // 4000000 / 3000, rounded
      expect(result.isValid).toBe(true);
    });
    
    it('should handle invalid target output', () => {
      const result = calculateCostPerUnit(
        EXAMPLE_DATA.overheadCosts,
        'HPP',
        0 // Invalid target output
      );
      
      expect(result.isValid).toBe(false);
      expect(result.validationErrors).toContain('Target produksi harus lebih dari 0');
      expect(result.costPerUnit).toBe(0);
    });
    
    it('should handle empty cost list', () => {
      const result = calculateCostPerUnit(
        [],
        'HPP',
        EXAMPLE_DATA.targetOutput
      );
      
      expect(result.totalCosts).toBe(0);
      expect(result.costPerUnit).toBe(0);
    });
  });
  
  describe('calculateDualModeCosts', () => {
    it('should calculate both HPP and Operasional costs', () => {
      const allCosts = [
        ...EXAMPLE_DATA.overheadCosts,
        ...EXAMPLE_DATA.operasionalCosts
      ];
      
      const result = calculateDualModeCosts(allCosts, EXAMPLE_DATA.targetOutput);
      
      expect(result.hpp.costPerUnit).toBe(730);
      expect(result.operasional.costPerUnit).toBe(1333);
      expect(result.hpp.isValid).toBe(true);
      expect(result.operasional.isValid).toBe(true);
    });
  });
});

// ====================================
// HPP INTEGRATION TESTS
// ====================================

describe('HPP Integration with Dual-Mode', () => {
  
  describe('calculateHPPWithDualMode', () => {
    it('should calculate HPP correctly using Revision 4 formula', () => {
      const result = calculateHPPWithDualMode(
        EXAMPLE_DATA.recipeExample.bahan,
        EXAMPLE_DATA.recipeExample.tkl,
        EXAMPLE_DATA.recipeExample.expectedOverhead
      );
      
      expect(result).toBe(EXAMPLE_DATA.recipeExample.expectedHPP);
    });
  });
  
  describe('calculateSellingPrice', () => {
    it('should calculate markup price correctly', () => {
      const result = calculateSellingPrice(
        EXAMPLE_DATA.recipeExample.expectedHPP,
        'markup',
        35
      );
      
      expect(result).toBe(EXAMPLE_DATA.recipeExample.markup35);
    });
    
    it('should calculate margin price correctly', () => {
      const result = calculateSellingPrice(
        EXAMPLE_DATA.recipeExample.expectedHPP,
        'margin',
        35
      );
      
      expect(result).toBe(EXAMPLE_DATA.recipeExample.margin35);
    });
    
    it('should throw error for margin >= 100%', () => {
      expect(() => {
        calculateSellingPrice(
          EXAMPLE_DATA.recipeExample.expectedHPP,
          'margin',
          100
        );
      }).toThrow('Margin tidak boleh >= 100%');
    });
  });
});

// ====================================
// CLASSIFICATION TESTS
// ====================================

describe('Cost Classification', () => {
  
  describe('classifyCostByKeywords', () => {
    it('should classify overhead costs correctly', () => {
      const gasOvenResult = classifyCostByKeywords('Gas Oven');
      expect(gasOvenResult.suggested_group).toBe('HPP');
      expect(gasOvenResult.confidence).toBe('medium');
      expect(gasOvenResult.matched_keywords).toContain('oven');
      
      const sewaDapurResult = classifyCostByKeywords('Sewa Dapur');
      expect(sewaDapurResult.suggested_group).toBe('HPP');
      expect(sewaDapurResult.matched_keywords).toContain('sewa dapur');
    });
    
    it('should classify operational costs correctly', () => {
      const marketingResult = classifyCostByKeywords('Marketing');
      expect(marketingResult.suggested_group).toBe('OPERASIONAL');
      expect(marketingResult.confidence).toBe('medium');
      expect(marketingResult.matched_keywords).toContain('marketing');
    });
    
    it('should handle ambiguous cost names', () => {
      const ambiguousResult = classifyCostByKeywords('Listrik Oven Toko');
      // This contains both 'oven' (HPP) and 'toko' (Operasional)
      expect(ambiguousResult.confidence).toBe('low');
    });
    
    it('should handle unknown cost names', () => {
      const unknownResult = classifyCostByKeywords('Biaya Tidak Dikenal');
      expect(unknownResult.suggested_group).toBe(null);
      expect(unknownResult.confidence).toBe('low');
      expect(unknownResult.matched_keywords).toHaveLength(0);
    });
  });
  
  describe('getCostGroupLabel', () => {
    it('should return correct Indonesian labels', () => {
      expect(getCostGroupLabel('HPP')).toBe('Overhead Pabrik (masuk HPP)');
      expect(getCostGroupLabel('OPERASIONAL')).toBe('Biaya Operasional (di luar HPP)');
    });
  });
});

// ====================================
// VALIDATION TESTS
// ====================================

describe('Validation System', () => {
  
  describe('validateTargetOutput', () => {
    it('should validate valid target output', () => {
      const result = validateTargetOutput(3000);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject zero or negative values', () => {
      const zeroResult = validateTargetOutput(0);
      expect(zeroResult.isValid).toBe(false);
      expect(zeroResult.errors[0]).toContain('Target produksi harus lebih dari 0');
      
      const negativeResult = validateTargetOutput(-100);
      expect(negativeResult.isValid).toBe(false);
    });
    
    it('should warn for very low production targets', () => {
      const lowResult = validateTargetOutput(50);
      expect(lowResult.warnings.length).toBeGreaterThan(0);
    });
  });
  
  describe('validateMonthlyAmount', () => {
    it('should validate valid amounts', () => {
      const result = validateMonthlyAmount(500000);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject amounts below minimum', () => {
      const result = validateMonthlyAmount(500);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('minimal Rp 1.000');
    });
  });
  
  describe('validateCostForm', () => {
    it('should validate complete form data', () => {
      const validData = {
        nama_biaya: 'Gas Oven',
        jumlah_per_bulan: 500000,
        jenis: 'tetap',
        group: 'HPP'
      };
      
      const result = validateCostForm(validData);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject incomplete form data', () => {
      const invalidData = {
        nama_biaya: '',
        jumlah_per_bulan: 0,
        jenis: '',
        group: ''
      };
      
      const result = validateCostForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

// ====================================
// CURRENCY ROUNDING TESTS
// ====================================

describe('Currency Rounding', () => {
  
  describe('roundCurrency', () => {
    it('should round to nearest rupiah by default', () => {
      expect(roundCurrency(1234.56)).toBe(1235);
      expect(roundCurrency(1234.44)).toBe(1234);
    });
  });
  
  describe('roundCurrencyWithRule', () => {
    it('should round to nearest 50', () => {
      expect(roundCurrencyWithRule(1234, 'FIFTY')).toBe(1250);
      expect(roundCurrencyWithRule(1224, 'FIFTY')).toBe(1200);
    });
    
    it('should round to nearest 100', () => {
      expect(roundCurrencyWithRule(1234, 'HUNDRED')).toBe(1200);
      expect(roundCurrencyWithRule(1274, 'HUNDRED')).toBe(1300);
    });
  });
});

// ====================================
// EXAMPLE VERIFICATION TEST
// ====================================

describe('Example Verification (Revision 9)', () => {
  
  it('should verify all example calculations match expected results', () => {
    const verification = verifyExampleCalculations();
    
    // Check overhead calculation
    expect(verification.overhead.totalCosts).toBe(2190000);
    expect(verification.overhead.costPerUnit).toBe(730);
    
    // Check operational calculation  
    expect(verification.operasional.totalCosts).toBe(4000000);
    expect(verification.operasional.costPerUnit).toBe(1333);
    
    // Check expected results match
    expect(verification.expectedResults.overheadPerPcs).toBe(730);
    expect(verification.expectedResults.operasionalPerPcs).toBe(1333);
    expect(verification.expectedResults.hppExample.totalHPP).toBe(7930);
    expect(verification.expectedResults.hppExample.markup35).toBe(10706);
    expect(verification.expectedResults.hppExample.margin35).toBe(12200);
  });
});

// ====================================
// INTEGRATION TESTS
// ====================================

describe('System Integration', () => {
  
  it('should integrate all components in a complete workflow', () => {
    // 1. Classify costs
    const gasClassification = classifyCostByKeywords('Gas Oven');
    const marketingClassification = classifyCostByKeywords('Marketing');
    
    expect(gasClassification.suggested_group).toBe('HPP');
    expect(marketingClassification.suggested_group).toBe('OPERASIONAL');
    
    // 2. Validate costs
    const gasValidation = validateCostForm({
      nama_biaya: 'Gas Oven',
      jumlah_per_bulan: 690000,
      jenis: 'tetap',
      group: 'HPP'
    });
    
    expect(gasValidation.isValid).toBe(true);
    
    // 3. Calculate dual-mode costs
    const allCosts = [...EXAMPLE_DATA.overheadCosts, ...EXAMPLE_DATA.operasionalCosts];
    const calculations = calculateDualModeCosts(allCosts, 3000);
    
    expect(calculations.hpp.costPerUnit).toBe(730);
    expect(calculations.operasional.costPerUnit).toBe(1333);
    
    // 4. Calculate HPP with overhead
    const hppResult = calculateHPPWithDualMode(4200, 3000, 730);
    expect(hppResult).toBe(7930);
    
    // 5. Calculate selling prices
    const markupPrice = calculateSellingPrice(7930, 'markup', 35);
    const marginPrice = calculateSellingPrice(7930, 'margin', 35);
    
    expect(markupPrice).toBe(10706);
    expect(marginPrice).toBe(12200);
  });
});

// ====================================
// ERROR HANDLING TESTS
// ====================================

describe('Error Handling', () => {
  
  it('should handle division by zero gracefully', () => {
    const result = calculateCostPerUnit(EXAMPLE_DATA.overheadCosts, 'HPP', 0);
    expect(result.isValid).toBe(false);
    expect(result.costPerUnit).toBe(0);
  });
  
  it('should handle empty cost arrays', () => {
    const result = calculateCostPerUnit([], 'HPP', 3000);
    expect(result.totalCosts).toBe(0);
    expect(result.costPerUnit).toBe(0);
  });
  
  it('should handle invalid cost data', () => {
    const invalidCosts = [{
      ...EXAMPLE_DATA.overheadCosts[0],
      jumlah_per_bulan: -1000 // Invalid negative amount
    }];
    
    // Should filter out invalid costs or handle gracefully
    const result = calculateCostPerUnit(invalidCosts, 'HPP', 3000);
    expect(result.totalCosts).toBe(0); // Should exclude negative amounts
  });
});