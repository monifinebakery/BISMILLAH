# Applied_at Field Debug Guide

## How to Debug and Fix the Applied_at Error

The error `Error: record "new" has no field "applied_at"` occurs when trying to update purchase status. This guide helps you debug and fix the issue.

## Step 1: Open Browser Console

1. Open your browser and navigate to http://localhost:5173
2. Open Developer Tools (F12 or right-click → Inspect)
3. Go to the Console tab

## Step 2: Run Diagnostics

In the console, run:

```javascript
// Run complete diagnostics
await debugAppliedAt.runDiagnostics()
```

This will check:
- Current user information
- Database schema (if accessible)
- Test a purchase update to see if the error occurs

## Step 3: Test the Issue

To specifically test if the applied_at error still occurs:

```javascript
// Test purchase update
await debugAppliedAt.testPurchaseUpdate()
```

If this returns `isAppliedAtError: true`, the issue still exists.

## Step 4: Try Direct Fix (if permissions allow)

```javascript
// Attempt direct database fix
await debugAppliedAt.tryDirectFix()
```

## Step 5: Alternative - Manual Test

You can also manually test by:

1. Go to the purchase management page
2. Try to change a purchase status from "pending" to "completed"
3. Check the browser console for errors

## Expected Results

### If Fixed
- `debugAppliedAt.testPurchaseUpdate()` returns `{ success: true }`
- No console errors when updating purchase status
- Purchase status updates work normally

### If Still Broken
- `debugAppliedAt.testPurchaseUpdate()` returns `{ isAppliedAtError: true }`
- Console shows: `Error: record "new" has no field "applied_at"`
- Purchase status updates fail

## Database Migration Required

If the issue persists, the database migration needs to be applied manually:

1. The `applied_at` column needs to be removed from the `purchases` table
2. Any database triggers or functions referencing this field need to be dropped
3. The application uses manual warehouse synchronization instead

## Files for Reference

- `/database_fixes/fix_applied_at_error.sql` - Database fix script
- `/supabase/migrations/20250822150000_remove_applied_at_field.sql` - Migration
- `/src/utils/debugAppliedAt.ts` - Debug utility
- `/APPLIED_AT_FIX_SUMMARY.md` - Detailed fix documentation