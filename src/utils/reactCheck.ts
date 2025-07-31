// src/utils/reactCheck.ts
import React from 'react';

// Debug React instance
console.log('React version:', React.version);
console.log('React.forwardRef exists:', !!React.forwardRef);

if (!React.forwardRef) {
  console.error('❌ React.forwardRef is undefined - React import issue!');
} else {
  console.log('✅ React.forwardRef is available');
}

export default React;