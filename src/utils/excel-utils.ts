// Excel utilities with dynamic import
// This prevents Excel libraries from being included in main bundle

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  headers?: string[];
  data: any[];
}

export interface ExcelImportResult<T = any> {
  data: T[];
  headers: string[];
  errors?: string[];
}

/**
 * Dynamically import and export data to Excel
 * Only loads Excel library when actually needed
 */
export const exportToExcel = async (options: ExcelExportOptions) => {
  try {
    // Dynamic import Excel libraries
    const [{ utils, writeFile }, { saveAs }] = await Promise.all([
      import('xlsx'),
      import('file-saver')
    ]);

    const { filename = 'export.xlsx', sheetName = 'Sheet1', data } = options;

    // Create worksheet
    const worksheet = utils.json_to_sheet(data);
    
    // Create workbook
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate file
    const excelBuffer = writeFile(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Save file
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

/**
 * Dynamically import and read Excel file
 * Only loads Excel library when actually needed
 */
export const importFromExcel = async <T = any>(
  file: File,
  options?: { 
    sheetName?: string; 
    headerRow?: number;
    skipEmptyLines?: boolean;
  }
): Promise<ExcelImportResult<T>> => {
  try {
    // Dynamic import Excel library
    const { read, utils } = await import('xlsx');

    const { 
      sheetName, 
      headerRow = 0, 
      skipEmptyLines = true 
    } = options || {};

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = read(data, { type: 'array' });
          
          // Get worksheet
          const wsName = sheetName || workbook.SheetNames[0];
          const worksheet = workbook.Sheets[wsName];
          
          if (!worksheet) {
            throw new Error(`Sheet "${wsName}" not found`);
          }
          
          // Convert to JSON
          const jsonData = utils.sheet_to_json(worksheet, {
            header: headerRow,
            skipHidden: skipEmptyLines,
            defval: ''
          });
          
          // Extract headers
          const headers = Object.keys(jsonData[0] || {});
          
          resolve({
            data: jsonData as T[],
            headers
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    console.error('Error importing from Excel:', error);
    throw error;
  }
};

/**
 * Check if Excel functionality is available
 * Use this to conditionally show Excel features
 */
export const isExcelSupported = () => {
  return typeof window !== 'undefined' && 
         'FileReader' in window && 
         'Blob' in window;
};

/**
 * Preload Excel libraries for better UX
 * Call this when user is likely to need Excel functionality
 */
export const preloadExcelLibraries = () => {
  return Promise.all([
    import('xlsx'),
    import('file-saver')
  ]);
};
