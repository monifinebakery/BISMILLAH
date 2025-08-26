// Test script to manually add custom categories for testing
// Run this in browser console to test category deletion

// Function to add test categories
function addTestCategories() {
  const testCategories = [
    'Makanan Pembuka',
    'Makanan Utama', 
    'Dessert',
    'Minuman Segar',
    'Kategori Test'
  ];
  
  localStorage.setItem('recipe_custom_categories', JSON.stringify(testCategories));
  console.log('✅ Added test categories:', testCategories);
  
  // Verify they were saved
  const saved = JSON.parse(localStorage.getItem('recipe_custom_categories') || '[]');
  console.log('🔍 Verified saved categories:', saved);
}

// Function to check current categories
function checkCurrentCategories() {
  const saved = JSON.parse(localStorage.getItem('recipe_custom_categories') || '[]');
  console.log('🏷️ Current custom categories:', saved);
  return saved;
}

// Function to clear all categories
function clearAllCategories() {
  localStorage.removeItem('recipe_custom_categories');
  console.log('🗑️ Cleared all custom categories');
}

// Auto-run when script is loaded
console.log('📋 Category Test Script Loaded');
console.log('Run addTestCategories() to add test data');
console.log('Run checkCurrentCategories() to view current data');
console.log('Run clearAllCategories() to clear all data');

// Check current state
checkCurrentCategories();
