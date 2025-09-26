import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation resources
import enCommon from './locales/en/common.json'
import enDashboard from './locales/en/dashboard.json'
import enSuppliers from './locales/en/suppliers.json'
import enCustomers from './locales/en/customers.json'
import enInventory from './locales/en/inventory.json'
import enAuth from './locales/en/auth.json'
import enOrders from './locales/en/orders.json'

import idCommon from './locales/id/common.json'
import idDashboard from './locales/id/dashboard.json'
import idSuppliers from './locales/id/suppliers.json'
import idCustomers from './locales/id/customers.json'
import idInventory from './locales/id/inventory.json'
import idAuth from './locales/id/auth.json'
import idOrders from './locales/id/orders.json'

// Translation resources
const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    suppliers: enSuppliers,
    customers: enCustomers,
    inventory: enInventory,
    auth: enAuth,
    orders: enOrders,
  },
  id: {
    common: idCommon,
    dashboard: idDashboard,
    suppliers: idSuppliers,
    customers: idCustomers,
    inventory: idInventory,
    auth: idAuth,
    orders: idOrders,
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'id', // Default to Indonesian
    defaultNS: 'common',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    debug: import.meta.env.DEV,
  })

export default i18n