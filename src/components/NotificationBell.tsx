// src/components/NotificationBell.tsx
// ✅ CLEAN COMPONENT - Simple, focused, no complex logic

import React, { useState } from 'react';
import { 
  Bell, MoreHorizontal, Check, Trash2, Archive, RefreshCw,
  AlertCircle, AlertTriangle, Info, CheckCircle, ShoppingCart, 
  Package, User, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {