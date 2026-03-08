import { useEffect, useState } from 'react';
import {
  Box, Grid, Paper, Typography, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
} from '@mui/material';
import { TrendingUp, Inventory, AccountBalance, ShoppingCart, LocalShipping } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../../api/client';

interface DashboardData {
  total_products: number; total_customers: number; total_suppliers: number;
  total_sales: number; total_purchases: number; total_revenue: number;
  total_cost: number; cogs: number; low_stock_products: any[]; recent_sales: any[];
}

export default function AdminReports() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => { fetchReports(); }, [period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [dashRes, prodRes] = await Promise.all([
        apiClient.get('/api/v1/reports/dashboard', { params: { period } }),
        apiClient.get('/api/v1/products'),
      ]);
      setData(dashRes.data);
      const sorted = [...prodRes.data].sort((a: any, b: any) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0));
      setTopProducts(sorted.slice(0, 10));
    } catch { setError('Failed to load reports'); }
    finally { setLoading(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;

  const cogs = data?.cogs ?? 0;
  const profit = (data?.total_revenue ?? 0) - cogs;

  const finCards = [
    { label: 'Total Revenue', value: `$${(data?.total_revenue ?? 0).toFixed(2)}`, icon: <TrendingUp />, bg: '#ecfdf5', color: '#16a34a' },
    { label: 'Cost of Goods Sold', value: `$${cogs.toFixed(2)}`, icon: <AccountBalance />, bg: '#fef2f2', color: '#ef4444' },
    { label: 'Gross Profit', value: `$${profit.toFixed(2)}`, icon: <TrendingUp />, bg: profit >= 0 ? '#eff6ff' : '#fef2f2', color: profit >= 0 ? '#3b82f6' : '#ef4444' },
    { label: 'Sales Orders', value: data?.total_sales ?? 0, icon: <ShoppingCart />, bg: '#fffbeb', color: '#d97706' },
    { label: 'Purchases', value: data?.total_purchases ?? 0, icon: <LocalShipping />, bg: '#faf5ff', color: '#8b5cf6' },
  ];

  const invCards = [
    { label: 'Total Products', value: data?.total_products ?? 0, bg: '#eff6ff', color: '#3b82f6' },
    { label: 'Total Customers', value: data?.total_customers ?? 0, bg: '#ecfdf5', color: '#16a34a' },
    { label: 'Total Suppliers', value: data?.total_suppliers ?? 0, bg: '#faf5ff', color: '#8b5cf6' },
  ];

  const chartData = topProducts.map(p => ({ name: p.name?.slice(0, 12) || 'N/A', stock: p.stock_quantity ?? 0 }));

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>Reports & Analytics</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} onChange={e => setPeriod(e.target.value)} label="Period"
            sx={{ borderRadius: '8px' }}>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Financial Summary */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Financial Summary</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {finCards.map(c => (
          <Grid item xs={6} sm={4} md key={c.label}>
            <Paper sx={{ p: 2, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>{c.icon}</Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem' }}>{c.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Inventory Overview */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Inventory Overview</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {invCards.map(c => (
          <Grid item xs={12} sm={4} key={c.label}>
            <Paper sx={{ p: 2.5, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: c.color, mt: 0.5 }}>{c.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Stock Levels Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Products by Stock Level</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Low Stock Alert */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Inventory sx={{ color: '#ef4444', fontSize: 20 }} /> Low Stock Alerts
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Product</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Stock</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Reorder</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.low_stock_products ?? []).map((p: any, i: number) => (
                    <TableRow key={i} hover>
                      <TableCell><Typography variant="body2">{p.name}</Typography></TableCell>
                      <TableCell align="right">
                        <Chip label={p.stock_quantity} size="small"
                          sx={{ bgcolor: p.stock_quantity === 0 ? '#fef2f2' : '#fffbeb',
                            color: p.stock_quantity === 0 ? '#ef4444' : '#d97706', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell align="right"><Typography variant="body2" color="text.secondary">{p.reorder_level}</Typography></TableCell>
                    </TableRow>
                  ))}
                  {(data?.low_stock_products ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: '#94a3b8' }}>All products well-stocked!</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
