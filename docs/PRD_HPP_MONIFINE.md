# 📋 **PRD: HPP by Monifine - Enterprise PWA untuk UMKM Kuliner**

## 📊 **Executive Summary**

**HPP by Monifine** adalah Progressive Web App (PWA) enterprise-grade yang dirancang khusus untuk membantu UMKM kuliner Indonesia menghitung Harga Pokok Produksi (HPP) secara akurat dan efisien. Aplikasi ini menggabungkan teknologi offline-first dengan algoritma perhitungan HPP yang canggih untuk memberikan solusi komprehensif bagi bisnis kuliner.

**Version:** 2025.1.0
**Status:** Production Ready
**Platform:** Web (PWA), Desktop, Mobile
**Target Users:** UMKM Kuliner Indonesia

---

## 🎯 **Product Overview**

### **Mission Statement**
"Memberdayakan UMKM kuliner Indonesia dengan teknologi terdepan untuk menghitung HPP secara akurat, sehingga dapat menentukan harga jual yang kompetitif dan profit yang optimal."

### **Core Value Proposition**
- **🔄 Offline-First**: Bekerja tanpa internet dengan performa penuh
- **⚡ Enterprise-Grade**: Reliability 99% dengan error recovery otomatis
- **🧮 Kalkulasi Akurat**: Algoritma HPP yang scientifically proven
- **📱 User-Centric**: UX yang intuitif untuk non-technical users
- **🔒 Secure & Scalable**: Built untuk growth dan enterprise adoption

### **Market Opportunity**
- **Target Market**: 64 juta UMKM Indonesia (data BPS 2023)
- **Serviceable Market**: 4.2 juta UMKM Kuliner (estimasi)
- **Problem Solved**: 85% UMKM kesulitan menghitung HPP akurat
- **Market Gap**: Tidak ada PWA offline-first untuk kalkulasi HPP

---

## 🌟 **Core Features & Capabilities**

### **1. HPP Calculator Engine** 🧮
**Business Logic:**
- **Recipe-Based Calculation**: Hitung HPP berdasarkan resep yang disimpan
- **Multi-Ingredient Support**: Support bahan baku hingga 50+ item per resep
- **Portion Scaling**: Auto-calculate untuk berbagai ukuran porsi
- **Waste Factor**: Hitung faktor waste bahan baku
- **Seasonal Pricing**: Dynamic pricing berdasarkan musim

**Technical Implementation:**
- **Algorithm**: Cost-Plus Pricing dengan overhead allocation
- **Precision**: Floating point arithmetic dengan rounding rules
- **Validation**: Real-time input validation dengan business rules
- **Caching**: Intelligent caching untuk frequently used recipes

### **2. Operational Cost Management** 💰
**Business Logic:**
- **Monthly Cost Tracking**: Catat biaya operasional bulanan
- **Cost Categorization**: Tetap vs Variable costs classification
- **HPP Allocation**: Auto-allocate costs ke resep berdasarkan usage
- **Staff Cost Calculation**: Separate calculation untuk staf produksi/non-produksi

**Technical Implementation:**
- **Storage**: Thread-safe localStorage dengan safeStorage wrapper
- **Validation**: Schema validation untuk cost data integrity
- **Sync**: Background sync dengan conflict resolution
- **UI**: Fullpage forms dengan error boundaries

### **3. Offline-First Architecture** 📱
**Business Logic:**
- **Zero Downtime**: Aplikasi bekerja 100% tanpa internet
- **Data Persistence**: Semua data tersimpan lokal dengan backup
- **Smart Sync**: Intelligent sync saat koneksi kembali
- **Conflict Resolution**: User-guided conflict resolution

**Technical Implementation:**
- **Service Worker**: Advanced caching strategies (NetworkFirst, CacheFirst)
- **Background Sync**: Queue-based sync dengan retry mechanisms
- **Storage Management**: Automatic quota management (4MB limit)
- **Error Recovery**: Comprehensive error handling dengan user feedback

### **4. Progressive Web App (PWA)** ⚡
**Business Logic:**
- **Installable Experience**: Like native app installation
- **Push Notifications**: Update notifications (future feature)
- **App-like UX**: Native app feel dengan web technology
- **Cross-Platform**: Works on desktop, tablet, mobile

**Technical Implementation:**
- **Manifest**: PWA manifest dengan proper icons dan metadata
- **Service Worker**: Advanced service worker dengan caching
- **Install Prompts**: Smart install prompts berdasarkan engagement
- **Update System**: Automatic update detection dengan user notification

### **5. Advanced Analytics & Reporting** 📊
**Business Logic:**
- **Profit Margin Analysis**: Analisis margin keuntungan per resep
- **Cost Trend Analysis**: Tren biaya operasional bulanan
- **Recipe Performance**: Performance metrics per resep
- **Business Insights**: Actionable insights untuk business decisions

**Technical Implementation:**
- **Data Aggregation**: Real-time data aggregation dari multiple sources
- **Chart Generation**: Interactive charts dengan performance optimization
- **Export Features**: Excel/PDF export dengan formatting
- **Caching**: Result caching untuk improved performance

---

## 🏗️ **Technical Architecture**

### **Frontend Architecture**

#### **Technology Stack:**
```
React 18 + TypeScript          # Core framework
Vite                           # Build tool & dev server
Tailwind CSS                   # Styling framework
React Router                   # Client-side routing
Sonner                         # Toast notifications
Lucide React                   # Icon library
```

#### **State Management:**
```
Context API                     # Global state management
Custom Hooks                    # Business logic encapsulation
Local State (useState)          # Component-level state
Persistent State               # safeStorage for critical data
```

#### **Component Architecture:**
```
Atomic Design Pattern:
├── Atoms: Buttons, Inputs, Icons
├── Molecules: Form fields, Cards, Lists
├── Organisms: Forms, Tables, Navigation
├── Templates: Page layouts
└── Pages: Full page components
```

### **Backend Architecture**

#### **Data Storage Strategy:**
```
Primary Storage:    safeStorage (localStorage wrapper)
Backup Storage:     IndexedDB (future implementation)
Sync Strategy:      Background sync dengan queue
Conflict Resolution: Last-write-wins + manual resolution
Data Validation:    Schema validation + business rules
```

#### **API Architecture:**
```
RESTful Design:
├── Authentication: Supabase Auth
├── Database:       Supabase PostgreSQL
├── File Storage:   Supabase Storage
├── Real-time:      Supabase Realtime
└── Offline Sync:   Custom sync engine
```

### **PWA Architecture**

#### **Service Worker Strategy:**
```
Cache Strategies:
├── Static Assets:  CacheFirst (long-term)
├── API Data:       NetworkFirst (fresh data)
├── User Data:      NetworkFirst + Background Sync
└── Images:         CacheFirst with fallback
```

#### **Offline Capabilities:**
```
Core Features:
├── Calculator:     Full offline functionality
├── Draft Orders:   Auto-save dengan sync on reconnect
├── Cost Management: Local storage dengan sync
├── Settings:       Persistent local settings
└── History:        Local calculation history
```

---

## 🔄 **Business Logic & Algorithms**

### **HPP Calculation Algorithm**

#### **Formula Core:**
```
HPP = (Σ(Biaya Bahan Baku × Jumlah × Waste Factor) + Biaya Operasional Allocated) / Jumlah Porsi

Dimana:
- Biaya Bahan Baku: Cost per unit dari supplier
- Waste Factor: Persentase waste (default 5-10%)
- Biaya Operasional: Monthly costs allocated per recipe usage
- Jumlah Porsi: Target portion output
```

#### **Operational Cost Allocation:**
```
Allocation Methods:
├── Per Unit:       Total Cost / Monthly Units Produced
├── Percentage:     Cost as % of total production cost
├── Fixed Amount:   Fixed cost per recipe
└── Staff-Based:    Based on staff hours per recipe
```

#### **Profit Margin Calculation:**
```
Selling Price = HPP × (1 + Target Margin %)

Break-even Analysis:
- Fixed Costs: Monthly operational costs
- Variable Costs: Cost per unit produced
- Break-even Point: Fixed Costs / (Selling Price - Variable Cost per Unit)
```

### **Data Validation Rules**

#### **Recipe Validation:**
- Minimum 1 bahan baku required
- Portion size must be > 0
- Waste factor between 0-50%
- Cost per unit must be > 0

#### **Operational Cost Validation:**
- Monthly costs must be > 0
- Valid date ranges (not future dates)
- Required fields: name, amount, type
- Status validation (active/inactive)

### **Sync Logic & Conflict Resolution**

#### **Sync Priority:**
```
Priority Order (High to Low):
1. User-initiated actions (save, delete)
2. Critical data (settings, auth)
3. Operational costs
4. Recipe calculations
5. History/logs
```

#### **Conflict Resolution:**
```
Strategies:
├── Server Wins:    For system-generated data
├── Client Wins:    For user-generated content
├── Manual Merge:   For conflicting user edits
└── Last Modified:  Timestamp-based resolution
```

---

## 👥 **User Journey & Experience**

### **Primary User Journey**

#### **New User Onboarding:**
1. **Discovery**: User menemukan app via search/social
2. **Installation**: PWA install prompt atau manual install
3. **Setup**: Quick setup wizard untuk initial data
4. **First Calculation**: Guided tutorial untuk first HPP calculation
5. **Ongoing Usage**: Daily usage dengan offline capabilities

#### **Daily Usage Flow:**
1. **Login**: Authentication dengan email/password
2. **Dashboard**: Overview costs dan recent calculations
3. **Recipe Management**: Add/edit recipes dengan bahan baku
4. **Cost Tracking**: Input monthly operational costs
5. **HPP Calculation**: Calculate prices dengan berbagai scenarios
6. **Reporting**: View profit margins dan cost trends

### **Offline User Experience**

#### **Offline Detection:**
- Visual indicator di header (mobile) atau overlay (desktop)
- Clear messaging: "Mode Offline - Data tersimpan lokal"
- Disabled online-only features dengan explanation

#### **Offline Capabilities:**
- Full calculator functionality
- Recipe creation/editing
- Cost management (local storage)
- Calculation history
- Settings persistence

#### **Reconnection Experience:**
- Automatic sync notification
- Progress indicator untuk sync operations
- Conflict resolution prompts jika needed
- Success confirmation dengan sync summary

---

## 📱 **Implementation Details**

### **Component Hierarchy**

#### **Page Components:**
```
App (Root)
├── AppLayout
│   ├── MobileLayout
│   │   ├── UpdateBanner (integrated)
│   │   ├── Header (HPP by Monifine + icons)
│   │   ├── Main Content (routed pages)
│   │   └── BottomTabBar
│   └── DesktopLayout
│       ├── Sidebar
│       ├── Main Content
│       └── UpdateBanner (overlay)
├── Auth Pages
├── Calculator Pages
├── Operational Cost Pages
├── Settings Pages
└── Error Boundaries
```

#### **Business Logic Components:**
```
Operational Costs:
├── OperationalCostPage (listing)
├── OperationalCostCreatePage (add form)
├── OperationalCostEditPage (edit form)
├── CostForm (reusable form component)
├── CostList (data table)
└── CostSummary (dashboard cards)

Calculator:
├── CalculatorPage
├── RecipeForm
├── IngredientList
├── CalculationResult
└── HistoryView
```

### **Routing Architecture**

#### **Route Structure:**
```
/                     → Dashboard
/auth                 → Authentication
/kalkulator          → HPP Calculator
/biaya-operasional   → Operational Costs
/biaya-operasional/tambah → Add Cost (fullpage)
/biaya-operasional/edit/:id → Edit Cost (fullpage)
/laporan             → Reports & Analytics
/pengaturan          → Settings
/offline             → Offline Features Debug
```

#### **Route Guards:**
```
Authentication Guard:     Redirect to /auth if not logged in
Payment Guard:           Show payment prompt for unpaid users
Offline Guard:           Graceful degradation for offline features
Admin Guard:             Role-based access for admin features
```

### **Error Handling Strategy**

#### **Error Boundaries:**
```
Component Level:     Catch React component errors
Page Level:          Catch routing and data loading errors
Global Level:        Catch unhandled errors with user feedback
Offline Level:       Handle network errors with retry logic
```

#### **Error Recovery:**
```
Automatic Recovery:
├── Network Retry:       Exponential backoff (3 attempts)
├── Data Re-fetch:       Automatic refresh on failure
├── Cache Fallback:      Use cached data when API fails
└── User Guidance:       Clear error messages with solutions

Manual Recovery:
├── Refresh Page:        Hard refresh for critical errors
├── Clear Cache:         Reset local data for corruption
├── Reinstall PWA:       Clean install for persistent issues
└── Contact Support:     Human assistance for complex issues
```

---

## 🔮 **Future Roadmap**

### **Phase 1: Enhanced PWA (Q1 2025)**
- ✅ **Push Notifications**: Order updates dan reminders
- ✅ **Advanced Background Sync**: Better conflict resolution
- ✅ **Offline Analytics**: Usage tracking tanpa internet
- ✅ **Multi-device Sync**: Cross-device data synchronization

### **Phase 2: Advanced Features (Q2 2025)**
- **Voice Commands**: Voice input untuk calculator
- **AR Features**: AR untuk inventory management
- **Advanced Reporting**: Offline report generation
- **Team Collaboration**: Multi-user offline editing

### **Phase 3: Enterprise Features (Q3 2025)**
- **API Integration**: Third-party integrations (POS, accounting)
- **Advanced Analytics**: Business intelligence dashboard
- **Mobile App**: Native mobile apps (React Native)
- **Multi-tenancy**: White-label solution untuk resellers

### **Phase 4: AI & Automation (Q4 2025)**
- **AI Recipe Suggestions**: ML-based recipe optimization
- **Automated Pricing**: Dynamic pricing dengan market data
- **Predictive Analytics**: Demand forecasting dan inventory
- **Smart Cost Optimization**: AI-driven cost reduction suggestions

---

## 📊 **Technical Specifications**

### **Performance Targets:**
- **First Load**: < 3 seconds (cold start)
- **Subsequent Loads**: < 1 second (warm cache)
- **Time to Interactive**: < 2 seconds
- **Lighthouse Score**: > 95 (Performance, Accessibility, SEO)
- **Storage Usage**: < 50MB typical, < 100MB maximum

### **Compatibility Matrix:**

| Feature | Chrome | Firefox | Safari | Edge | Mobile |
|---------|--------|---------|--------|------|--------|
| PWA Install | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| Offline Mode | ✅ | ✅ | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ |
| Push Notifications | ✅ | ❌ | ⚠️ | ✅ | ✅ |
| safeStorage | ✅ | ✅ | ✅ | ✅ | ✅ |

### **Security Measures:**
- **Data Encryption**: End-to-end encryption untuk sensitive data
- **Secure Storage**: safeStorage dengan access controls
- **Input Validation**: Comprehensive input sanitization
- **XSS Protection**: Content Security Policy (CSP)
- **CSRF Protection**: Token-based request validation

---

## 🎯 **Success Metrics**

### **User Engagement:**
- **Daily Active Users**: Target 1,000 DAU dalam 6 bulan
- **Session Duration**: Average 15+ minutes per session
- **Feature Adoption**: 80% users menggunakan offline features
- **PWA Install Rate**: 40% of mobile users install PWA

### **Business Impact:**
- **Cost Accuracy**: 95% improvement in HPP calculation accuracy
- **Time Savings**: 70% reduction in manual calculation time
- **Profit Optimization**: Average 15% profit margin improvement
- **Business Growth**: 25% increase in customer acquisition

### **Technical Performance:**
- **Uptime**: 99.9% availability
- **Error Rate**: < 0.1% critical errors
- **Sync Success Rate**: > 98% background sync completion
- **Load Performance**: < 2 second average page load

---

## 📞 **Support & Maintenance**

### **Support Channels:**
- **In-App Help**: Contextual help dan tooltips
- **Documentation**: Comprehensive docs di `/docs`
- **Email Support**: support@monifine.my.id
- **WhatsApp**: +62-xxx-xxxx-xxxx
- **GitHub Issues**: Bug reports dan feature requests

### **Maintenance Schedule:**
- **Daily**: Automated monitoring dan error alerting
- **Weekly**: Performance reviews dan optimization
- **Monthly**: Security updates dan dependency updates
- **Quarterly**: Major feature releases dan architecture reviews

### **Backup & Recovery:**
- **Automated Backups**: Daily database backups
- **Data Retention**: 7 years for financial data, 1 year for logs
- **Disaster Recovery**: < 4 hour RTO, < 24 hour RPO
- **User Data Export**: Full data export capability

---

**🎊 PRD Lengkap HPP by Monifine - Enterprise PWA untuk UMKM Kuliner**

*Dokumen ini mencakup semua aspek teknis, bisnis, dan implementasi untuk memastikan kesuksesan produk dalam mendukung pertumbuhan UMKM kuliner Indonesia.*
