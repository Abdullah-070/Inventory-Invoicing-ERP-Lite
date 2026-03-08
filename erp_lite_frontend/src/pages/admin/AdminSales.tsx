import { useEffect, useState } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Typography, CircularProgress, Chip,
  MenuItem, Select, InputLabel, FormControl, IconButton, Grid,
  InputBase, TablePagination,
} from '@mui/material';
import { Add, Download, Search, AttachMoney, Receipt, CheckCircle, Cancel } from '@mui/icons-material';
import apiClient from '../../api/client';

interface SalesOrder {
  id: number; customer_id: number; invoice_number?: string; status: string;
  subtotal: number; tax_amount: number; discount_amount: number;
  total_amount: number; items: any[]; created_at: string;
}
interface Customer { id: number; name: string; }
interface Product { id: number; name: string; selling_price: number; stock_quantity: number; }

const statusChip = (status: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    DRAFT: { bg: '#f1f5f9', color: '#475569' },
    CONFIRMED: { bg: '#eff6ff', color: '#3b82f6' },
    PAID: { bg: '#ecfdf5', color: '#16a34a' },
    CANCELLED: { bg: '#fef2f2', color: '#ef4444' },
  };
  const c = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return <Chip label={status} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.75rem' }} />;
};

export default function AdminSales() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    customer_id: '', tax_amount: '0', discount_amount: '0',
    items: [{ product_id: '', quantity: '1', unit_price: '' }],
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [salesRes, custRes, prodRes] = await Promise.all([
        apiClient.get('/api/v1/sales'),
        apiClient.get('/api/v1/customers'),
        apiClient.get('/api/v1/products'),
      ]);
      setOrders(salesRes.data); setCustomers(custRes.data); setProducts(prodRes.data);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { product_id: '', quantity: '1', unit_price: '' }] });
  };
  const handleRemoveItem = (idx: number) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });
  };
  const handleItemChange = (idx: number, field: string, value: string) => {
    const items = [...formData.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'product_id') {
      const prod = products.find(p => p.id === parseInt(value));
      if (prod) items[idx].unit_price = prod.selling_price.toString();
    }
    setFormData({ ...formData, items });
  };

  const handleSave = async () => {
    try {
      setError(null);
      await apiClient.post('/api/v1/sales', {
        customer_id: parseInt(formData.customer_id),
        tax_amount: parseFloat(formData.tax_amount),
        discount_amount: parseFloat(formData.discount_amount),
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
        })),
      });
      setOpenDialog(false);
      setFormData({ customer_id: '', tax_amount: '0', discount_amount: '0', items: [{ product_id: '', quantity: '1', unit_price: '' }] });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to create order'); }
  };

  const handleConfirm = async (id: number) => {
    try { await apiClient.post(`/api/v1/sales/${id}/confirm`); fetchAll(); }
    catch (err: any) { setError(err.response?.data?.detail || 'Failed to confirm order'); }
  };

  const handleDownloadInvoice = async (id: number) => {
    try {
      const res = await apiClient.get(`/api/v1/sales/${id}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `invoice-${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { setError('Invoice generation not available'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const paidCount = orders.filter(o => o.status === 'PAID').length;
  const draftCount = orders.filter(o => o.status === 'DRAFT').length;

  const statCards = [
    { label: 'Total Orders', value: orders.length, icon: <Receipt />, bg: '#eff6ff', color: '#3b82f6' },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: <AttachMoney />, bg: '#ecfdf5', color: '#16a34a' },
    { label: 'Paid', value: paidCount, icon: <CheckCircle />, bg: '#ecfdf5', color: '#16a34a' },
    { label: 'Drafts', value: draftCount, icon: <Cancel />, bg: '#fffbeb', color: '#d97706' },
  ];

  const customerName = (id: number) => customers.find(c => c.id === id)?.name || `#${id}`;
  const filtered = orders.filter(o =>
    !search || customerName(o.customer_id).toLowerCase().includes(search.toLowerCase()) ||
    o.status.toLowerCase().includes(search.toLowerCase()) ||
    (o.invoice_number || '').toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>Sales Orders</Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpenDialog(true)}
          sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
          New Sale
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map(c => (
          <Grid item xs={6} md={3} key={c.label}>
            <Paper sx={{ p: 2, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>{c.icon}</Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{c.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, mb: 2, borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
        <InputBase placeholder="Search by customer, status, or invoice..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, fontSize: '0.875rem' }} />
      </Paper>

      <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Order #</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Invoice</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(o => (
                <TableRow key={o.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>#{o.id}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{customerName(o.customer_id)}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{o.invoice_number || '—'}</Typography></TableCell>
                  <TableCell>{statusChip(o.status)}</TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight={700}>${Number(o.total_amount).toFixed(2)}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{new Date(o.created_at).toLocaleDateString()}</Typography></TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      {o.status === 'DRAFT' && (
                        <Button size="small" onClick={() => handleConfirm(o.id)}
                          sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', bgcolor: '#eff6ff', color: '#3b82f6', '&:hover': { bgcolor: '#dbeafe' } }}>
                          Confirm
                        </Button>
                      )}
                      {(o.status === 'CONFIRMED' || o.status === 'PAID') && (
                        <IconButton size="small" sx={{ color: '#3b82f6' }} onClick={() => handleDownloadInvoice(o.id)}>
                          <Download fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>No sales orders found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filtered.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]} />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>New Sales Order</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <FormControl fullWidth size="small">
            <InputLabel>Customer</InputLabel>
            <Select value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })} label="Customer">
              {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>Order Items</Typography>
          {formData.items.map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl sx={{ flex: 2 }} size="small">
                <InputLabel>Product</InputLabel>
                <Select value={item.product_id} onChange={e => handleItemChange(idx, 'product_id', e.target.value)} label="Product">
                  {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Qty" type="number" size="small" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} sx={{ flex: 0.5 }} />
              <TextField label="Price" type="number" size="small" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} sx={{ flex: 1 }} />
              {formData.items.length > 1 && (
                <Button color="error" size="small" onClick={() => handleRemoveItem(idx)} sx={{ minWidth: 32 }}>X</Button>
              )}
            </Box>
          ))}
          <Button size="small" onClick={handleAddItem} sx={{ textTransform: 'none', alignSelf: 'flex-start' }}>+ Add Item</Button>

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField label="Tax Amount" type="number" size="small" value={formData.tax_amount} onChange={e => setFormData({ ...formData, tax_amount: e.target.value })} fullWidth />
            <TextField label="Discount" type="number" size="small" value={formData.discount_amount} onChange={e => setFormData({ ...formData, discount_amount: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained"
            sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>Create Order</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
