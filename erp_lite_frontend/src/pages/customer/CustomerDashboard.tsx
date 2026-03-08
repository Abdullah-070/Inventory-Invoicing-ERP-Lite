import { useEffect, useState } from 'react';
import {
  Grid, Typography, CircularProgress, Paper, Box, Chip, Divider, Alert, Avatar,
} from '@mui/material';
import { ShoppingCart, Receipt, Person, AttachMoney } from '@mui/icons-material';
import apiClient from '../../api/client';

const statusChip = (status: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    CONFIRMED: { bg: '#ecfdf5', color: '#16a34a' },
    PENDING: { bg: '#fffbeb', color: '#d97706' },
    DRAFT: { bg: '#f1f5f9', color: '#64748b' },
    CANCELLED: { bg: '#fef2f2', color: '#ef4444' },
  };
  const c = map[status] || map.DRAFT;
  return <Chip label={status} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.75rem', height: 24 }} />;
};

export default function CustomerDashboard() {
  const [stats, setStats] = useState({ orders: 0, totalSpent: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const salesRes = await apiClient.get('/api/v1/sales').catch(() => ({ data: [] }));
      const orders = salesRes.data;
      const totalSpent = orders
        .filter((o: any) => o.status === 'CONFIRMED' || o.status === 'PAID')
        .reduce((sum: number, o: any) => sum + Number(o.total_amount ?? 0), 0);
      setStats({
        orders: orders.length,
        totalSpent,
        pendingOrders: orders.filter((o: any) => o.status === 'PENDING' || o.status === 'DRAFT').length,
      });
      setRecentOrders(orders.slice(0, 5));
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>;

  const statCards = [
    { label: 'Total Spent', value: `$${stats.totalSpent.toFixed(2)}`, icon: <AttachMoney sx={{ fontSize: 22 }} />, color: '#10b981' },
    { label: 'My Orders', value: stats.orders, icon: <ShoppingCart sx={{ fontSize: 22 }} />, color: '#3b82f6' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: <Receipt sx={{ fontSize: 22 }} />, color: '#f59e0b' },
  ];

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Welcome{user?.username ? `, ${user.username}` : ''}!
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        Here's an overview of your account activity.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={4} key={card.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                {card.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>{card.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{card.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f1f5f9' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Orders</Typography>
            </Box>
            {recentOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <ShoppingCart sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  No orders yet. Browse products to get started!
                </Typography>
              </Box>
            ) : (
              <Box>
                {recentOrders.map((order: any, idx: number) => (
                  <Box key={order.id}>
                    {idx > 0 && <Divider />}
                    <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', '&:hover': { bgcolor: '#f8fafc' } }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          <span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>#{order.order_number || order.id}</span>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, mr: 2 }}>
                        ${Number(order.total_amount ?? 0).toFixed(2)}
                      </Typography>
                      {statusChip(order.status)}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f1f5f9' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                <Person sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom', color: '#64748b' }} />
                My Profile
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>
                  {(user?.username?.[0] || 'C').toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{user?.username || '-'}</Typography>
                  <Chip label="Customer" size="small" sx={{ bgcolor: '#eff6ff', color: '#3b82f6', fontWeight: 600, fontSize: '0.7rem', height: 22, mt: 0.3 }} />
                </Box>
              </Box>
              {[
                { label: 'Email', value: user?.email || '-' },
                { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-' },
              ].map((item) => (
                <Box key={item.label} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.value}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
