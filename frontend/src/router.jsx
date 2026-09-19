import { createBrowserRouter } from 'react-router-dom';

import AppLayout, { appLayoutLoader } from './layouts/AppLayout';
import ErrorPage from './routes/ErrorPage';
import NotFound from './routes/NotFound';

import Login, { loginLoader, loginAction } from './routes/Login';
import Register, { registerAction } from './routes/Register';
import { logoutAction } from './routes/Logout';

import Dashboard, { dashboardLoader } from './routes/Dashboard';
import Customers, { customersLoader, customersAction } from './routes/Customers';
import Products, { productsLoader, productsAction } from './routes/Products';
import Opportunities, { opportunitiesLoader, opportunitiesAction } from './routes/Opportunities';
import OpportunityDetail, { opportunityDetailLoader, opportunityDetailAction } from './routes/OpportunityDetail';
import Invoices, { invoicesLoader } from './routes/Invoices';
import InvoiceNew, { invoiceNewLoader, invoiceNewAction } from './routes/InvoiceNew';
import InvoiceDetail, { invoiceDetailLoader } from './routes/InvoiceDetail';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    loader: loginLoader,
    action: loginAction,
  },
  {
    path: '/register',
    element: <Register />,
    action: registerAction,
  },
  {
    path: '/logout',
    action: logoutAction,
  },
  {
    path: '/',
    element: <AppLayout />,
    loader: appLayoutLoader,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Dashboard />, loader: dashboardLoader },
      { path: 'customers', element: <Customers />, loader: customersLoader, action: customersAction },
      { path: 'products', element: <Products />, loader: productsLoader, action: productsAction },
      { path: 'opportunities', element: <Opportunities />, loader: opportunitiesLoader, action: opportunitiesAction },
      { path: 'opportunities/:id', element: <OpportunityDetail />, loader: opportunityDetailLoader, action: opportunityDetailAction },
      { path: 'invoices', element: <Invoices />, loader: invoicesLoader },
      { path: 'invoices/new', element: <InvoiceNew />, loader: invoiceNewLoader, action: invoiceNewAction },
      { path: 'invoices/:id', element: <InvoiceDetail />, loader: invoiceDetailLoader },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
