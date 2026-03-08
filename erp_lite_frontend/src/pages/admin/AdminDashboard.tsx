import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Grid, Typography, CircularProgress, Alert, Paper, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, IconButton, Tooltip as MuiTooltip,
} from '@mui/material';
import {
  Inventory, People, Warning, ShoppingCart, PictureAsPdf,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { RootState } from '../../store';
import apiClient from '../../api/client';

interface DashboardData {
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  prev_month: { orders: number; revenue: number };
  inventory: { total_products: number; low_stock_count: number; out_of_stock_count: number };
  pending: { sales_orders: number; purchases: number };
  total_customers: number;
  daily_sales: { date: string; revenue: number; orders: number }[];
  recent_activity: {
    id: number; invoice_number?: string; customer_id: number;
    status: string; total_amount: number; items_count: number; created_at: string;
  }[];
}

/* ---------- Stat card ---------- */
function StatCard({ title, value, icon, color, bg }: {
  title: string; value: string | number; icon: React.ReactNode;
  color: string; bg: string;
}) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: '12px', height: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>{title}</Typography>
          <Typography variant="h5" fontWeight={700}>{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
        </Box>
        <Box sx={{
          width: 44, height: 44, borderRadius: '10px', bgcolor: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}

/* ---------- Custom chart tooltip ---------- */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: '#3b82f6' }}>
        Revenue: ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Typography>
    </Paper>
  );
}

export default function AdminDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadInvoice = async (id: number) => {
    try {
      const res = await apiClient.get(`/api/v1/sales/${id}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `invoice-${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { setError('Invoice download failed'); }
  };

  useEffect(() => {
    apiClient.get('/api/v1/reports/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}><CircularProgress /></Box>;
  }

  const totalProducts = data?.inventory.total_products || 0;
  const lowStock = data?.inventory.low_stock_count || 0;
  const outOfStock = data?.inventory.out_of_stock_count || 0;
  const inStock = Math.max(0, totalProducts - lowStock - outOfStock);
  const totalCustomers = data?.total_customers || 0;

  // Format chart data with real dates
  const chartData = (data?.daily_sales || []).map(d => {
    const dt = new Date(d.date + 'T00:00:00');
    return {
      name: dt.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      revenue: d.revenue,
      orders: d.orders,
    };
  });

  // Format currency helper
  const fmtCurrency = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Welcome back, {user?.username}. Here's what's happening with your business.
      </Typography>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ---------- Stat cards ---------- */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Products" value={totalProducts} icon={<Inventory />}
            color="#3b82f6" bg="#eff6ff" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Customers" value={totalCustomers} icon={<People />}
            color="#8b5cf6" bg="#f5f3ff" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Low Stock Alerts" value={lowStock} icon={<Warning />}
            color="#f59e0b" bg="#fffbeb" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Today's Sales" value={fmtCurrency(data?.today.revenue || 0)} icon={<ShoppingCart />}
            color="#10b981" bg="#ecfdf5" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* ---------- Sales chart ---------- */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Sales Overview</Typography>
                <Typography variant="caption" color="text.secondary">Last 7 days (revenue)</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Chip label={`${fmtCurrency(data?.month.revenue || 0)} this month`}
                  size="small" sx={{ bgcolor: '#ecfdf5', color: '#16a34a', fontWeight: 600 }} />
                {(data?.prev_month.revenue ?? 0) > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Last month: {fmtCurrency(data?.prev_month.revenue || 0)}
                  </Typography>
                )}
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* ---------- Inventory Status ---------- */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Inventory Status</Typography>
            {[
              { label: 'In Stock', count: inStock, total: totalProducts, color: '#22c55e' },
              { label: 'Low Stock', count: lowStock, total: totalProducts, color: '#f59e0b' },
              { label: 'Out of Stock', count: outOfStock, total: totalProducts, color: '#ef4444' },
            ].map(s => (
              <Box key={s.label} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={500}>{s.label}</Typography>
                  <Typography variant="body2" fontWeight={600}>{s.count}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={totalProducts ? (s.count / totalProducts) * 100 : 0}
                  sx={{
                    height: 8, borderRadius: 4, bgcolor: '#f1f5f9',
                    '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: s.color },
                  }}
                />
              </Box>
            ))}

            <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: '8px' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Pending Actions</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Sales Orders</Typography>
                <Chip label={data?.pending.sales_orders || 0} size="small" color="primary" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2">Purchases</Typography>
                <Chip label={data?.pending.purchases || 0} size="small" color="info" />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* ---------- Monthly Comparison ---------- */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Monthly Comparison</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>This Month</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Last Month</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>Revenue</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#16a34a' }}>{fmtCurrency(data?.month.revenue || 0)}</TableCell>
                    <TableCell align="right" sx={{ color: '#64748b' }}>{fmtCurrency(data?.prev_month.revenue || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>Orders</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#3b82f6' }}>{data?.month.orders || 0}</TableCell>
                    <TableCell align="right" sx={{ color: '#64748b' }}>{data?.prev_month.orders || 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* ---------- Recent Activity ---------- */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight={700}>Recent Sales</Typography>
              <Chip label={`${data?.recent_activity?.length || 0} orders`} size="small" variant="outlined" />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Invoice</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Items</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Invoice</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.recent_activity || []).map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{s.invoice_number || `#${s.id}`}</TableCell>
                      <TableCell>
                        <Chip label={s.status} size="small"
                          sx={{
                            bgcolor: s.status === 'PAID' ? '#ecfdf5' : '#eff6ff',
                            color: s.status === 'PAID' ? '#16a34a' : '#3b82f6',
                            fontWeight: 600, fontSize: '0.72rem',
                          }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.85rem' }}>{s.items_count}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtCurrency(s.total_amount)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {new Date(s.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell align="center">
                        <MuiTooltip title="Download Invoice PDF">
                          <IconButton size="small" onClick={() => handleDownloadInvoice(s.id)}
                            sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                            <PictureAsPdf fontSize="small" />
                          </IconButton>
                        </MuiTooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.recent_activity || data.recent_activity.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>No recent sales activity</TableCell>
                    </TableRow>
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
