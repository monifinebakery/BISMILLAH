import React from 'react';
import { Route } from 'react-router-dom';
import { SimpleCustomers } from '@/pages/simple-customers';

const customersRoutes = (
  <>
    <Route
      path="simple-customers"
      element={<SimpleCustomers />}
    />
    <Route
      path="customers/analytics"
      element={<div className="p-8 text-center">Customer Analytics - Coming Soon</div>}
    />
  </>
);

export default customersRoutes;