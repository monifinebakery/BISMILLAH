// src/components/operational-costs/hooks/useCostClassification.ts
// 🔍 Automatic Cost Classification Hook (Revision 5)

import { useState, useCallback, useEffect } from 'react';
import { 
  classifyCostByKeywords, 
  getCostGroupLabel, 
  getCostGroupDescription 
} from '../constants/costClassification';
import { ClassificationSuggestion } from '../types/operationalCost.types';
import { toast } from 'sonner';

interface UseCostClassificationReturn {
  // State
  suggestion: ClassificationSuggestion | null;
  isClassifying: boolean;
  
  // Actions
  classifyCost: (costName: string) => ClassificationSuggestion;
  getSuggestionForCost: (costName: string) => void;
  clearSuggestion: () => void;
  applySuggestion: () => 'hpp' | 'operasional' | null;
  
  // Utilities
  getGroupLabel: (group: 'hpp' | 'operasional') => string;
  getGroupDescription: (group: 'hpp' | 'operasional') => string;
  showClassificationToast: (suggestion: ClassificationSuggestion) => void;
}

export const useCostClassification = (): UseCostClassificationReturn => {
  const [suggestion, setSuggestion] = useState<ClassificationSuggestion | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  /**
   * Classify a cost name and return the suggestion
   */
  const classifyCost = useCallback((costName: string): ClassificationSuggestion => {
    if (!costName || costName.trim().length < 2) {
      return {
        suggested_group: null,
        confidence: 'low',
        reason: 'Nama biaya terlalu pendek untuk diklasifikasi',
        matched_keywords: []
      };
    }

    const result = classifyCostByKeywords(costName.trim());
    
    return {
      suggested_group: result.suggested_group,
      confidence: result.confidence,
      reason: result.reason,
      matched_keywords: result.matched_keywords
    };
  }, []);

  /**
   * Get suggestion for a cost name and store it in state
   */
  const getSuggestionForCost = useCallback((costName: string) => {
    setIsClassifying(true);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      const result = classifyCost(costName);
      setSuggestion(result);
      setIsClassifying(false);
      
      // Auto-show toast for high confidence suggestions
      if (result.confidence === 'high' && result.suggested_group) {
        showClassificationToast(result);
      }
    }, 300);
  }, [classifyCost]);

  /**
   * Clear current suggestion
   */
  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
  }, []);

  /**
   * Apply the current suggestion and return the group
   */
  const applySuggestion = useCallback((): 'hpp' | 'operasional' | null => {
    if (!suggestion || !suggestion.suggested_group) {
      return null;
    }
    
    const group = suggestion.suggested_group;
    setSuggestion(null);
    
    // Show confirmation toast
    toast.success(`Biaya diklasifikasikan sebagai: ${getCostGroupLabel(group)}`, {
      description: `Berdasarkan kata kunci: ${suggestion.matched_keywords.join(', ')}`
    });
    
    return group;
  }, [suggestion]);

  /**
   * Get user-friendly group label
   */
  const getGroupLabel = useCallback((group: 'hpp' | 'operasional'): string => {
    return getCostGroupLabel(group);
  }, []);

  /**
   * Get group description for tooltips
   */
  const getGroupDescription = useCallback((group: 'hpp' | 'operasional'): string => {
    return getCostGroupDescription(group);
  }, []);

  /**
   * Show classification toast notification
   */
  const showClassificationToast = useCallback((suggestion: ClassificationSuggestion) => {
    if (!suggestion.suggested_group) {
      toast.info('Klasifikasi Otomatis', {
        description: suggestion.reason
      });
      return;
    }

    const group = suggestion.suggested_group;
    const confidenceEmoji = {
      'high': '✅',
      'medium': '⚡',
      'low': '❓'
    }[suggestion.confidence];

    const confidenceText = {
      'high': 'Tinggi',
      'medium': 'Sedang', 
      'low': 'Rendah'
    }[suggestion.confidence];

    toast.success(`${confidenceEmoji} Saran Klasifikasi (${confidenceText})`, {
      description: `${getCostGroupLabel(group)} - ${suggestion.reason}`,
      duration: 5000,
      action: {
        label: 'Gunakan',
        onClick: () => {
          // This would trigger the parent component to apply the suggestion
          // The parent component should handle this
        }
      }
    });
  }, []);

  return {
    // State
    suggestion,
    isClassifying,
    
    // Actions
    classifyCost,
    getSuggestionForCost,
    clearSuggestion,
    applySuggestion,
    
    // Utilities
    getGroupLabel,
    getGroupDescription,
    showClassificationToast
  };
};

// ====================================
// ADDITIONAL UTILITY HOOKS
// ====================================

/**
 * Hook for real-time classification as user types
 */
export const useRealTimeClassification = (
  costName: string,
  enabled: boolean = true,
  debounceMs: number = 500
) => {
  const [suggestion, setSuggestion] = useState<ClassificationSuggestion | null>(null);
  const { classifyCost } = useCostClassification();

  useEffect(() => {
    if (!enabled || !costName || costName.trim().length < 3) {
      setSuggestion(null);
      return;
    }

    const debounceTimer = setTimeout(() => {
      const result = classifyCost(costName);
      setSuggestion(result);
    }, debounceMs);

    return () => clearTimeout(debounceTimer);
  }, [costName, enabled, debounceMs, classifyCost]);

  return suggestion;
};

/**
 * Hook for batch classification of multiple costs
 */
export const useBatchClassification = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Array<{
    costName: string;
    suggestion: ClassificationSuggestion;
  }>>([]);
  const { classifyCost } = useCostClassification();

  const classifyBatch = useCallback(async (costNames: string[]) => {
    setIsProcessing(true);
    setResults([]);
    
    try {
      const batchResults = costNames.map(name => ({
        costName: name,
        suggestion: classifyCost(name)
      }));
      
      setResults(batchResults);
      
      // Summary toast
      const highConfidence = batchResults.filter(r => r.suggestion.confidence === 'high').length;
      const withSuggestions = batchResults.filter(r => r.suggestion.suggested_group).length;
      
      toast.success(`Klasifikasi Batch Selesai`, {
        description: `${withSuggestions}/${costNames.length} biaya berhasil diklasifikasikan (${highConfidence} dengan tingkat keyakinan tinggi)`
      });
      
    } catch (error) {
      toast.error('Gagal melakukan klasifikasi batch');
    } finally {
      setIsProcessing(false);
    }
  }, [classifyCost]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    isProcessing,
    results,
    classifyBatch,
    clearResults
  };
};