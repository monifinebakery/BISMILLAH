// Debug Production Error - Enhanced Error Tracking
// Run this in browser console to get detailed error information

console.log('🔍 Starting Enhanced Error Debug...');

// Override console.error to capture all errors
const originalConsoleError = console.error;
console.error = function(...args) {
    console.log('🚨 CAUGHT ERROR:', args);
    
    // Log stack traces if available
    args.forEach(arg => {
        if (arg instanceof Error) {
            console.log('📍 Stack:', arg.stack);
        }
        if (typeof arg === 'object' && arg !== null) {
            console.log('📝 Error object:', JSON.stringify(arg, null, 2));
        }
    });
    
    // Call original console.error
    originalConsoleError.apply(console, args);
};

// Global error handler
window.addEventListener('error', function(event) {
    console.log('🌐 Global Error Event:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
    });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.log('🔄 Unhandled Promise Rejection:', {
        reason: event.reason,
        promise: event.promise
    });
});

// Monitor React errors
const originalReactError = console.error;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};

// Check for boolean iteration specifically
const originalObjectValues = Object.values;
Object.values = function(obj) {
    console.log('🔍 Object.values called with:', typeof obj, obj);
    
    if (obj === false || obj === true) {
        console.error('🚨 BOOLEAN PASSED TO Object.values():', obj);
        console.trace('🔍 Stack trace for boolean iteration:');
        return [];
    }
    
    return originalObjectValues.call(this, obj);
};

// Check for boolean spread operations
const originalSymbolIterator = Symbol.iterator;
Object.defineProperty(Boolean.prototype, Symbol.iterator, {
    get: function() {
        console.error('🚨 ATTEMPTING TO ITERATE BOOLEAN:', this.valueOf());
        console.trace('🔍 Stack trace for boolean iteration:');
        throw new TypeError(`boolean ${this.valueOf()} is not iterable (cannot read property Symbol(Symbol.iterator))`);
    }
});

console.log('✅ Error debugging enabled. Refresh the page to catch errors.');
