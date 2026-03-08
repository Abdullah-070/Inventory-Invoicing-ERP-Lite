import { useEffect, useState } from 'react';
import {
  Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert, Chip, Box,
  InputBase, TablePagination, Button, Snackbar,
} from '@mui/material';
import { ShoppingCart, Search, Payment } from '@mui/icons-material';
import apiClient from '../../api/client';

const statusChip = (s: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    PAID: { bg: '#ecfdf5', color: '#16a34a' },
    CONFIRMED: { bg: '#dbeafe', color: '#2563eb' },
    PENDING: { bg: '#fffbeb', color: '#d97706' },
    DRAFT: { bg: '#f1f5f9', color: '#64748b' },
    CANCELLED: { bg: '#fef2f2', color: '#ef4444' },
  };
  const c = map[s] || { bg: '#f1f5f9', color: '#64748b' };
  return <Chip label={s} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.75rem', height: 24 }} />;
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('/api/v1/sales');
      setOrders(res.data);
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (orderId: number) => {
    setPayingId(orderId);
    try {
      await apiClient.post(`/api/v1/sales/${orderId}/pay`);
      setSnack('Payment successful! Order marked as paid.');
      fetchOrders();
    } catch {
      setSnack('Payment failed. Please try again.');
    } finally {
      setPayingId(null);
    }
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (o.order_number || String(o.id)).toLowerCase().includes(q) || o.status?.toLowerCase().includes(q);
  });

  if (loading) return <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>My Orders</Typography>
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f1f5f9', borderRadius: '10px', px: 1.5, py: 0.5, minWidth: 260 }}>
          <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
          <InputBase placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, fontSize: '0.875rem' }} />
        </Paper>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}

      {orders.length === 0 ? (
        <Paper elevation={0} sx={{ textAlign: 'center', py: 8, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <ShoppingCart sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#64748b' }}>No orders yet</Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Your order history will appear here once you make a purchase.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Order #', 'Date', 'Status', 'Items', 'Total', 'Action'].map(h => (
                    <TableCell key={h} align={h === 'Total' || h === 'Action' ? 'right' : 'left'}
                      sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748b' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((order) => (
                  <TableRow key={order.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', color: '#3b82f6' }}>
                        #{order.order_number || order.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{statusChip(order.status)}</TableCell>
                    <TableCell>{order.items?.length ?? '-'}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>${Number(order.total_amount ?? 0).toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      {order.status === 'CONFIRMED' && (
                        <Button size="small" variant="contained" startIcon={<Payment />}
                          disabled={payingId === order.id}
                          onClick={() => handlePay(order.id)}
                          sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
                          {payingId === order.id ? 'Processing...' : 'Pay'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]} />
        </Paper>
      )}

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}
        message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
