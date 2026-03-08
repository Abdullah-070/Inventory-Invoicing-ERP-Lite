import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { RootState } from './store'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Signup from './pages/Signup'

// Admin layout & pages
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminStock from './pages/admin/AdminStock'
import AdminInventory from './pages/admin/AdminInventory'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminSuppliers from './pages/admin/AdminSuppliers'
import AdminSales from './pages/admin/AdminSales'
import AdminPurchases from './pages/admin/AdminPurchases'
import AdminPayments from './pages/admin/AdminPayments'
import AdminReports from './pages/admin/AdminReports'
import AdminCSV from './pages/admin/AdminCSV'

// Customer layout & pages
import CustomerLayout from './layouts/CustomerLayout'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import CustomerProducts from './pages/customer/CustomerProducts'
import CustomerOrders from './pages/customer/CustomerOrders'
import CustomerInvoices from './pages/customer/CustomerInvoices'
import CustomerProfile from './pages/customer/CustomerProfile'
import CustomerCart from './pages/customer/CustomerCart'

import './App.css'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1f4788' },
    secondary: { main: '#ff6b35' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
})

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  if (!isAuthenticated) return <Navigate to="/" />
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard if role doesn't match
    if (user.role === 'ADMIN' || user.role === 'STAFF') return <Navigate to="/admin/dashboard" />
    return <Navigate to="/customer/dashboard" />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  if (!isAuthenticated) return <>{children}</>
  if (user?.role === 'ADMIN' || user?.role === 'STAFF') return <Navigate to="/admin/dashboard" />
  return <Navigate to="/customer/dashboard" />
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="stock" element={<AdminStock />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="suppliers" element={<AdminSuppliers />} />
            <Route path="sales" element={<AdminSales />} />
            <Route path="purchases" element={<AdminPurchases />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="csv" element={<AdminCSV />} />
          </Route>

          {/* Customer routes */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'VIEWER']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="products" element={<CustomerProducts />} />
            <Route path="cart" element={<CustomerCart />} />
            <Route path="orders" element={<CustomerOrders />} />
            <Route path="invoices" element={<CustomerInvoices />} />
            <Route path="profile" element={<CustomerProfile />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
