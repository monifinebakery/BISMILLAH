# Dialog Accessibility and Responsiveness Guide

This guide ensures all dialogs in the application meet accessibility standards and work properly across all device sizes.

## ✅ Required Accessibility Features

### 1. DialogTitle (MANDATORY)
Every `DialogContent` MUST include a `DialogTitle` for screen reader accessibility.

```tsx
// ❌ BAD - Missing DialogTitle
<DialogContent>
  <div>Content without title</div>
</DialogContent>

// ✅ GOOD - Has DialogTitle
<DialogContent>
  <DialogHeader>
    <DialogTitle>My Dialog Title</DialogTitle>
  </DialogHeader>
  <div>Content</div>
</DialogContent>

// ✅ GOOD - Hidden title (still accessible)
import { VisuallyHidden } from '@/components/ui/visually-hidden';

<DialogContent>
  <DialogHeader>
    <VisuallyHidden>
      <DialogTitle>Hidden But Accessible Title</DialogTitle>
    </VisuallyHidden>
  </DialogHeader>
  <div>Content</div>
</DialogContent>
```

### 2. DialogDescription (Recommended)
Provide additional context for screen readers:

```tsx
<DialogHeader>
  <DialogTitle>Delete Item</DialogTitle>
  <DialogDescription>
    This action cannot be undone. This will permanently delete the item.
  </DialogDescription>
</DialogHeader>
```

## 📱 Responsive Design Requirements

### 1. Mobile-First Approach
All dialogs must work on mobile devices (320px width minimum):

```tsx
<DialogContent className="mx-4 sm:mx-auto w-full sm:w-auto max-w-[95vw] sm:max-w-lg">
  {/* Content */}
</DialogContent>
```

### 2. Responsive Sizing
Use responsive classes for different screen sizes:

```tsx
// Small dialog
<DialogContent className="sm:max-w-sm">

// Medium dialog (default)
<DialogContent className="sm:max-w-md">

// Large dialog
<DialogContent className="sm:max-w-lg lg:max-w-2xl">

// Extra large dialog
<DialogContent className="sm:max-w-xl lg:max-w-4xl xl:max-w-6xl">
```

### 3. Content Layout
Ensure content adapts to different screen sizes:

```tsx
// ✅ Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <div key={item.id} className="p-4 border rounded">
      {item.name}
    </div>
  ))}
</div>

// ✅ Responsive flex layout
<div className="flex flex-col sm:flex-row gap-4">
  <div className="flex-1">{/* Content */}</div>
  <div className="flex-1">{/* Content */}</div>
</div>
```

### 4. Button Layout
Stack buttons vertically on mobile, horizontally on larger screens:

```tsx
<DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
  <Button variant="outline" className="w-full sm:w-auto">
    Cancel
  </Button>
  <Button className="w-full sm:w-auto">
    Confirm
  </Button>
</DialogFooter>
```

## 🎯 Using the AccessibleDialogTemplate

For new dialogs, use the pre-built template:

```tsx
import { AccessibleDialogTemplate } from '@/components/ui/accessible-dialog-template';

const MyDialog = ({ isOpen, onClose }) => {
  return (
    <AccessibleDialogTemplate
      isOpen={isOpen}
      onClose={onClose}
      title="My Dialog Title"
      description="Optional description"
      size="lg" // sm, md, lg, xl
      primaryAction={{
        label: "Save Changes",
        onClick: handleSave,
        isLoading: saving
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: onClose
      }}
    >
      {/* Your dialog content here */}
      <div className="space-y-4">
        <p>Your content goes here</p>
      </div>
    </AccessibleDialogTemplate>
  );
};
```

## ⚡ Performance Considerations

### 1. Conditional Rendering
Don't render dialog content when closed:

```tsx
// ✅ Good
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  {isOpen && (
    <DialogContent>
      {/* Heavy content only renders when open */}
    </DialogContent>
  )}
</Dialog>
```

### 2. Lazy Loading
For complex dialogs with heavy components:

```tsx
const HeavyDialogContent = lazy(() => import('./HeavyDialogContent'));

// In render
{isOpen && (
  <Suspense fallback={<div>Loading...</div>}>
    <HeavyDialogContent />
  </Suspense>
)}
```

## 🧪 Testing Checklist

### Accessibility Testing
- [ ] Dialog has DialogTitle (visible or hidden)
- [ ] DialogDescription provides context
- [ ] Keyboard navigation works (Tab, Escape)
- [ ] Screen reader announces dialog properly
- [ ] Focus is trapped within dialog
- [ ] Focus returns to trigger element on close

### Responsive Testing
- [ ] Works on 320px width (iPhone SE)
- [ ] Works on tablet portrait (768px)
- [ ] Works on tablet landscape (1024px)
- [ ] Works on desktop (1280px+)
- [ ] Content doesn't overflow horizontally
- [ ] Buttons stack appropriately
- [ ] Scrolling works when content is tall

### Device Testing
Test on:
- [ ] iPhone (various sizes)
- [ ] iPad (portrait and landscape)
- [ ] Android phones
- [ ] Desktop browsers

## 🔍 Common Issues and Fixes

### Issue: Dialog content overflows on mobile
```tsx
// ✅ Fix with proper sizing
<DialogContent className="mx-4 max-w-[95vw] max-h-[90vh] overflow-y-auto">
```

### Issue: Buttons too small on mobile
```tsx
// ✅ Full width buttons on mobile
<Button className="w-full sm:w-auto min-h-[44px]">
  Action
</Button>
```

### Issue: Text too small on mobile
```tsx
// ✅ Responsive text sizes
<h2 className="text-lg sm:text-xl lg:text-2xl">
  Title
</h2>
```

## 📋 Audit Script

Run this to find dialogs that might need attention:

```bash
# Find DialogContent without DialogTitle
grep -r "DialogContent" src/ | grep -v "DialogTitle"

# Find non-responsive dialog classes
grep -r "max-w-" src/ | grep -v "sm:"
```

## 🎨 Design System Integration

All dialogs should follow the design system:
- Consistent spacing (4, 8, 16, 24px units)
- Standard color palette
- Typography scale
- Animation timing
- Border radius consistency

Remember: A good dialog should be accessible, responsive, and performant!
