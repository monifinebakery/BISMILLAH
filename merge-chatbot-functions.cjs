#!/usr/bin/env node

// Script to merge chatbot-action handlers into chatbot-query
// Run with: node merge-chatbot-functions.cjs

const fs = require('fs');
const path = require('path');

const queryFile = path.join(__dirname, 'supabase/functions/chatbot-query/index.ts');
const actionFile = path.join(__dirname, 'supabase/functions/chatbot-action/index.ts');

// Read both files
const queryContent = fs.readFileSync(queryFile, 'utf8');
const actionContent = fs.readFileSync(actionFile, 'utf8');

// Extract action handlers from chatbot-action
const actionHandlersRegex = /async function handle(PurchaseCreate|OrderCreate|OrderDelete|InventoryUpdate|RecipeCreate|PromoCreate)[^}]+}/gs;
const utilityFunctionsRegex = /(?:function extract\w+|function get\w+)[^}]+}/gs;

const actionHandlers = actionContent.match(actionHandlersRegex) || [];
const utilityFunctions = actionContent.match(utilityFunctionsRegex) || [];

// Add action cases to switch statement
let updatedContent = queryContent.replace(
  /(case 'rules':\s+result = await handleRulesQuery\(message\);\s+break;)/,
  `$1
      case 'purchase':
        result = await handlePurchaseCreate(supabase, user.id, message);
        break;
      case 'orderCreate':
        result = await handleOrderCreate(supabase, user.id, message);
        break;
      case 'orderDelete':
        result = await handleOrderDelete(supabase, user.id, message);
        break;
      case 'inventoryUpdate':
        result = await handleInventoryUpdate(supabase, user.id, message);
        break;
      case 'recipeCreate':
        result = await handleRecipeCreate(supabase, user.id, message);
        break;
      case 'promoCreate':
        result = await handlePromoCreate(supabase, user.id, message);
        break;`
);

// Add the handlers before the closing brace of the file
const handlersContent = '\n// Action handlers\n' + actionHandlers.join('\n\n') + '\n\n// Utility functions\n' + utilityFunctions.join('\n\n');

updatedContent = updatedContent.replace(/(function formatCurrency[^}]+}\s*)$/, handlersContent + '\n\n$1');

// Write back to file
fs.writeFileSync(queryFile, updatedContent);

console.log('✅ Successfully merged chatbot-action handlers into chatbot-query');
