// Debug wrapper untuk menemukan object {isValid} yang di-render
// Tambahkan ini di file yang suspect

// src/components/debug/ObjectRenderDetector.tsx
import React from 'react';

export const ObjectRenderDetector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Recursive function to check for invalid objects
  const checkForInvalidObjects = (element: any, path = 'root'): any => {
    if (element === null || element === undefined) {
      return element;
    }

    // If it's a React element, it's valid
    if (React.isValidElement(element)) {
      return element;
    }

    // If it's an array, check each item
    if (Array.isArray(element)) {
      return element.map((item, index) => checkForInvalidObjects(item, `${path}[${index}]`));
    }

    // If it's an object (but not React element)
    if (typeof element === 'object') {
      // Check if it has isValid property (the culprit!)
      if ('isValid' in element) {
        console.error(`🚨 Found object with isValid at ${path}:`, element);
        
        // Return safe string representation instead
        return `[Object: ${JSON.stringify(element)}]`;
      }

      // Check for other common problematic objects
      if ('errors' in element && 'touched' in element) {
        console.error(`🚨 Found form state object at ${path}:`, element);
        return `[Form State: ${JSON.stringify(element)}]`;
      }

      // If it's a plain object with various keys, it might be invalid
      const keys = Object.keys(element);
      if (keys.length > 0 && !React.isValidElement(element)) {
        console.warn(`⚠️ Suspicious object at ${path}:`, element);
        return `[Object: {${keys.join(', ')}}]`;
      }
    }

    return element;
  };

  try {
    const safeChildren = checkForInvalidObjects(children);
    return <>{safeChildren}</>;
  } catch (error) {
    console.error('ObjectRenderDetector error:', error);
    return <div>Error detected in render tree</div>;
  }
};

// Usage: Wrap components yang dicurigai
// <ObjectRenderDetector>
//   <SuspiciousComponent />
// </ObjectRenderDetector>