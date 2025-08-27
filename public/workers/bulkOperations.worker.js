// public/workers/bulkOperations.worker.js
// Web Worker untuk operasi bulk seperti import/export dan batch processing

self.onmessage = function(e) {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'IMPORT_CSV':
        const csvResult = processCSVImport(data);
        self.postMessage({ type: 'CSV_IMPORTED', result: csvResult });
        break;

      case 'EXPORT_DATA':
        const exportResult = processDataExport(data);
        self.postMessage({ type: 'DATA_EXPORTED', result: exportResult });
        break;

      case 'BATCH_UPDATE':
        const updateResult = processBatchUpdate(data);
        self.postMessage({ type: 'BATCH_UPDATED', result: updateResult });
        break;

      case 'VALIDATE_BULK_DATA':
        const validationResult = validateBulkData(data);
        self.postMessage({ type: 'BULK_DATA_VALIDATED', result: validationResult });
        break;

      case 'GENERATE_REPORTS':
        const reportResult = generateBulkReports(data);
        self.postMessage({ type: 'REPORTS_GENERATED', result: reportResult });
        break;

      default:
        self.postMessage({ type: 'ERROR', error: 'Unknown operation type' });
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
};

// Fungsi untuk memproses import CSV
function processCSVImport(importData) {
  const { csvContent, dataType, mapping } = importData;
  
  try {
    // Parse CSV content
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);
    
    const processedData = [];
    const errors = [];
    let processedCount = 0;
    
    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
        const rowData = {};
        
        // Map CSV columns to data fields
        headers.forEach((header, index) => {
          const mappedField = mapping[header];
          if (mappedField && row[index] !== undefined) {
            rowData[mappedField] = parseValue(row[index], mappedField);
          }
        });
        
        // Validate row data based on data type
        const validation = validateRowData(rowData, dataType);
        if (validation.isValid) {
          processedData.push({
            ...rowData,
            _rowIndex: i + 2, // +2 because of header and 0-based index
            _importId: generateImportId()
          });
        } else {
          errors.push({
            row: i + 2,
            data: rowData,
            errors: validation.errors
          });
        }
        
        processedCount++;
        
        // Send progress update every 100 rows
        if (processedCount % 100 === 0) {
          self.postMessage({
            type: 'IMPORT_PROGRESS',
            progress: {
              processed: processedCount,
              total: dataRows.length,
              percentage: Math.round((processedCount / dataRows.length) * 100)
            }
          });
        }
        
      } catch (rowError) {
        errors.push({
          row: i + 2,
          error: rowError.message
        });
      }
    }
    
    return {
      success: true,
      data: processedData,
      errors,
      summary: {
        total_rows: dataRows.length,
        successful: processedData.length,
        failed: errors.length,
        data_type: dataType
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Fungsi untuk export data
function processDataExport(exportData) {
  const { data, format, options = {} } = exportData;
  
  try {
    let exportContent = '';
    
    switch (format) {
      case 'csv':
        exportContent = generateCSV(data, options);
        break;
      case 'json':
        exportContent = JSON.stringify(data, null, 2);
        break;
      case 'excel':
        exportContent = generateExcelData(data, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    return {
      success: true,
      content: exportContent,
      filename: generateExportFilename(format, options),
      size: new Blob([exportContent]).size,
      recordCount: Array.isArray(data) ? data.length : Object.keys(data).length
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Fungsi untuk batch update
function processBatchUpdate(updateData) {
  const { updates, validationRules = {} } = updateData;
  
  const results = [];
  const errors = [];
  let processedCount = 0;
  
  for (const update of updates) {
    try {
      // Validate update data
      const validation = validateUpdateData(update, validationRules);
      
      if (validation.isValid) {
        results.push({
          id: update.id,
          status: 'success',
          data: update,
          timestamp: new Date().toISOString()
        });
      } else {
        errors.push({
          id: update.id,
          status: 'validation_failed',
          errors: validation.errors,
          data: update
        });
      }
      
      processedCount++;
      
      // Send progress update every 50 updates
      if (processedCount % 50 === 0) {
        self.postMessage({
          type: 'UPDATE_PROGRESS',
          progress: {
            processed: processedCount,
            total: updates.length,
            percentage: Math.round((processedCount / updates.length) * 100)
          }
        });
      }
      
    } catch (error) {
      errors.push({
        id: update.id,
        status: 'error',
        error: error.message,
        data: update
      });
    }
  }
  
  return {
    results,
    errors,
    summary: {
      total: updates.length,
      successful: results.length,
      failed: errors.length,
      processed_at: new Date().toISOString()
    }
  };
}

// Fungsi validasi bulk data
function validateBulkData(validationData) {
  const { data, schema, options = {} } = validationData;
  
  const validRecords = [];
  const invalidRecords = [];
  let processedCount = 0;
  
  for (const record of data) {
    try {
      const validation = validateRecord(record, schema, options);
      
      if (validation.isValid) {
        validRecords.push({
          ...record,
          _validationPassed: true
        });
      } else {
        invalidRecords.push({
          ...record,
          _validationErrors: validation.errors,
          _validationPassed: false
        });
      }
      
      processedCount++;
      
      // Send progress update every 100 records
      if (processedCount % 100 === 0) {
        self.postMessage({
          type: 'VALIDATION_PROGRESS',
          progress: {
            processed: processedCount,
            total: data.length,
            percentage: Math.round((processedCount / data.length) * 100)
          }
        });
      }
      
    } catch (error) {
      invalidRecords.push({
        ...record,
        _validationErrors: [error.message],
        _validationPassed: false
      });
    }
  }
  
  return {
    validRecords,
    invalidRecords,
    summary: {
      total: data.length,
      valid: validRecords.length,
      invalid: invalidRecords.length,
      validationRate: (validRecords.length / data.length) * 100
    }
  };
}

// Fungsi generate bulk reports
function generateBulkReports(reportData) {
  const { data, reportTypes, dateRange } = reportData;
  const reports = {};
  
  for (const reportType of reportTypes) {
    try {
      switch (reportType) {
        case 'sales_summary':
          reports[reportType] = generateSalesSummary(data, dateRange);
          break;
        case 'inventory_report':
          reports[reportType] = generateInventoryReport(data, dateRange);
          break;
        case 'financial_summary':
          reports[reportType] = generateFinancialSummary(data, dateRange);
          break;
        case 'performance_metrics':
          reports[reportType] = generatePerformanceMetrics(data, dateRange);
          break;
        default:
          reports[reportType] = { error: `Unknown report type: ${reportType}` };
      }
    } catch (error) {
      reports[reportType] = { error: error.message };
    }
  }
  
  return {
    reports,
    generatedAt: new Date().toISOString(),
    dateRange
  };
}

// Helper functions
function parseValue(value, fieldType) {
  if (!value || value === '') return null;
  
  switch (fieldType) {
    case 'number':
    case 'price':
    case 'quantity':
      return parseFloat(value.replace(/[^0-9.-]/g, ''));
    case 'integer':
      return parseInt(value.replace(/[^0-9-]/g, ''));
    case 'boolean':
      return ['true', '1', 'yes', 'ya'].includes(value.toLowerCase());
    case 'date':
      return new Date(value).toISOString();
    default:
      return value.toString().trim();
  }
}

function validateRowData(rowData, dataType) {
  const errors = [];
  
  // Basic validation rules based on data type
  const validationRules = getValidationRules(dataType);
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const value = rowData[field];
    
    if (rules.required && (value === null || value === undefined || value === '')) {
      errors.push(`Field '${field}' is required`);
    }
    
    if (value !== null && value !== undefined && value !== '') {
      if (rules.type === 'number' && isNaN(value)) {
        errors.push(`Field '${field}' must be a number`);
      }
      
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`Field '${field}' must be at least ${rules.min}`);
      }
      
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`Field '${field}' must be at most ${rules.max}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function getValidationRules(dataType) {
  const rules = {
    'ingredients': {
      nama_bahan: { required: true, type: 'string' },
      harga_per_satuan: { required: true, type: 'number', min: 0 },
      satuan: { required: true, type: 'string' }
    },
    'recipes': {
      nama_resep: { required: true, type: 'string' },
      porsi: { required: true, type: 'number', min: 1 }
    },
    'suppliers': {
      nama: { required: true, type: 'string' },
      kontak: { required: false, type: 'string' }
    }
  };
  
  return rules[dataType] || {};
}

function generateCSV(data, options) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  const headers = options.headers || Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

function generateImportId() {
  return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateExportFilename(format, options) {
  const timestamp = new Date().toISOString().split('T')[0];
  const prefix = options.prefix || 'export';
  return `${prefix}_${timestamp}.${format}`;
}

function validateRecord(record, schema, options) {
  // Simplified validation - in real implementation, use a proper schema validator
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = record[field];
    
    if (rules.required && !value) {
      errors.push(`${field} is required`);
    }
    
    if (value && rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateUpdateData(update, validationRules) {
  return validateRecord(update, validationRules);
}

// Report generation functions
function generateSalesSummary(data, dateRange) {
  // Simplified sales summary generation
  return {
    totalSales: data.length,
    dateRange,
    generatedAt: new Date().toISOString()
  };
}

function generateInventoryReport(data, dateRange) {
  return {
    totalItems: data.length,
    dateRange,
    generatedAt: new Date().toISOString()
  };
}

function generateFinancialSummary(data, dateRange) {
  return {
    totalTransactions: data.length,
    dateRange,
    generatedAt: new Date().toISOString()
  };
}

function generatePerformanceMetrics(data, dateRange) {
  return {
    metricsCount: data.length,
    dateRange,
    generatedAt: new Date().toISOString()
  };
}