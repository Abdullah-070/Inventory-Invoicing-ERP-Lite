/**
 * Orders page component
 */
import { useEffect, useState } from 'react';
import {
  Container,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import apiClient from '../api/client';

interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: number;
  customer_id?: number;
  supplier_id?: number;
  status: string;
  items: OrderItem[];
  total_amount: number;
  created_at: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch both sales and purchases
      const [salesRes, purchasesRes] = await Promise.all([
        apiClient.get('/api/v1/sales'),
        apiClient.get('/api/v1/purchases'),
      ]);
      const allOrders = [
        ...salesRes.data.map((o: any) => ({ ...o, type: 'sale' })),
        ...purchasesRes.data.map((o: any) => ({ ...o, type: 'purchase' })),
      ];
      setOrders(allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err: any) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' } = {
      DRAFT: 'default',
      CONFIRMED: 'info',
      RECEIVED: 'success',
      PAID: 'success',
      CANCELLED: 'error',
    };
    return colors[status] || 'default';
  };

  const filteredOrders = tabValue === 0 ? orders : tabValue === 1 ? orders.filter(o => o.customer_id !== undefined) : orders.filter(o => o.supplier_id !== undefined);

  if (loading) return <CircularProgress />;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <h1>Orders</h1>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="All Orders" />
          <Tab label="Sales" />
          <Tab label="Purchases" />
        </Tabs>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Order #</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Items</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={`${order.customer_id || order.supplier_id}-${order.id}`} hover>
                <TableCell>#{order.id}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{order.customer_id ? 'Sale' : 'Purchase'}</TableCell>
                <TableCell>
                  <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                </TableCell>
                <TableCell align="right">${Number(order.total_amount).toFixed(2)}</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                <TableCell align="center">{order.items.length}</TableCell>
                <TableCell align="center">
                  {order.status === 'PAID' && order.customer_id && (
                    <Button size="small" startIcon={<Download />}
                      onClick={async () => {
                        try {
                          const res = await apiClient.get(`/api/v1/sales/${order.id}/invoice`, { responseType: 'blob' });
                          const blob = new Blob([res.data], { type: 'application/pdf' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `invoice_${order.id}.pdf`;
                          link.click();
                          URL.revokeObjectURL(url);
                        } catch { alert('Failed to download invoice'); }
                      }}>
                      Invoice
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
