# Dialog UI Standards

Standar konsistensi untuk semua dialog di aplikasi berdasarkan pola OrderDialog yang telah terbukti baik.

## Template Struktur Dialog

### 1. Basic Structure
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="dialog-overlay-center">
    <div className="dialog-panel">
      <DialogHeader className="dialog-header">
        <DialogTitle>Dialog Title</DialogTitle>
      </DialogHeader>
      
      <div className="dialog-body">
        {/* Content goes here */}
      </div>
      
      <DialogFooter className="dialog-footer">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Save</Button>
      </DialogFooter>
    </div>
  </DialogContent>
</Dialog>
```

### 2. Size Variations
```tsx
{/* Default - good for most dialogs */}
<div className="dialog-panel">

{/* For larger content */}
<div className="dialog-panel max-w-4xl">

{/* For smaller dialogs */}
<div className="dialog-panel max-w-md">
```

## CSS Classes Hierarchy

### DialogContent
- **Primary**: `dialog-overlay-center`
- **Alternative**: Use DialogContent props instead of custom classes

### Dialog Panel
- **Primary**: `dialog-panel`
- **Large**: `dialog-panel max-w-4xl`
- **Small**: `dialog-panel max-w-md`

### Dialog Sections
- **Header**: `dialog-header`
- **Body**: `dialog-body`
- **Footer**: `dialog-footer`

## Z-Index Hierarchy

```
z-[100] - Dropdowns, Select, Popover (dapat berinteraksi)
z-75    - Dialog overlay
z-50    - Komponen lainnya
```

### Component Z-Index
- `DialogOverlay`: z-75
- `SelectContent`: z-[100]
- `PopoverContent`: z-[100]
- `DropdownMenuContent`: z-[100]

## Updated Components

### ✅ Sudah Distandarisasi:

#### Financial Dialogs:
1. **FinancialTransactionDialog**
   - ✅ `dialog-overlay-center`
   - ✅ `dialog-panel` → `dialog-header` → `dialog-body` → `dialog-footer`
   - ✅ Z-index sudah konsisten untuk dropdown

2. **CategoryManagementDialog (Financial)** 
   - ✅ `dialog-overlay-center` 
   - ✅ Struktur dialog panel standar
   - ✅ Max-width custom untuk content yang lebih luas

#### Warehouse/Inventory Dialogs:
3. **AddEditDialog (Warehouse)**
   - ✅ `dialog-overlay-center`
   - ✅ `dialog-panel max-w-4xl`
   - ✅ Responsive grid layout untuk form fields
   - ✅ Mobile-friendly input sizing

#### Purchase Management Dialogs:
4. **PurchaseDialog**
   - ✅ `dialog-overlay-center`
   - ✅ `dialog-panel max-w-5xl`
   - ✅ Complex responsive table layout
   - ✅ Consistent footer button styling

#### Recipe Management Dialogs:
5. **CategoryManagerDialog (Recipe)**
   - ✅ `dialog-overlay-center`
   - ✅ `dialog-panel max-w-5xl`
   - ✅ Responsive stats cards and forms

6. **DeleteRecipeDialog**
   - ✅ `dialog-overlay-center`
   - ✅ `dialog-panel` with warning styling
   - ✅ Responsive recipe details layout

#### Operational Costs Dialogs:
7. **CostFormDialog**
   - ✅ `dialog-overlay-center`
   - ✅ `dialog-panel` standard size
   - ✅ Responsive form with proper mobile spacing

8. **BulkEditDialog (Operational Costs)**
   - ✅ `dialog-overlay-center`
   - ✅ `dialog-panel max-w-md`
   - ✅ Responsive button layout

#### Supplier & Others:
9. **SupplierDialog**
   - ✅ `dialog-overlay-center`
   - ✅ Standard `dialog-panel`
   - ✅ Clean wrapper structure

10. **OrderDialog** (Template Reference)
    - ✅ Struktur standar yang dijadikan acuan
    - ✅ Perfect balance antara responsive dan functionality

### Dropdown/Select Z-Index Fix:
- `SelectContent`: z-50 → z-[100] ✅
- `PopoverContent`: z-50 → z-[100] ✅ 
- `DropdownMenuContent`: z-50 → z-[100] ✅
- `DropdownMenuSubContent`: z-50 → z-[100] ✅

## Benefits

1. **Konsistensi Visual**: Semua dialog memiliki tampilan yang seragam
2. **Responsive Design**: Otomatis menyesuaikan di berbagai ukuran layar
3. **Interaksi Lancar**: Z-index yang tepat untuk dropdown/select
4. **Maintainability**: Mudah dipelihara dan diupdate
5. **Accessibility**: Struktur HTML yang konsisten

## Testing Checklist

- [ ] Dialog dapat dibuka dan ditutup dengan baik
- [ ] Dropdown/select dapat diklik dan berinteraksi
- [ ] Layout responsive di mobile, tablet, desktop  
- [ ] Button spacing dan positioning konsisten
- [ ] Z-index tidak menimbulkan overlay issues
- [ ] Form submission berfungsi dengan baik
- [ ] Loading states ditampilkan dengan benar

## Next Steps

1. ✅ Standardisasi FinancialTransactionDialog 
2. ✅ Standardisasi CategoryManagementDialog
3. ✅ Fix z-index untuk dropdown components
4. ⏳ Testing dan validasi semua dialog
5. 🔄 Rollout template ke dialog lain jika diperlukan

---

**Template berdasarkan**: OrderDialog pattern
**Updated**: 2024-01-27
**Status**: ✅ Implemented
