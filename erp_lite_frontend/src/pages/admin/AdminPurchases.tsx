import { useEffect, useState } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Typography, CircularProgress, Chip,
  MenuItem, Select, InputLabel, FormControl, Grid, InputBase, TablePagination,
} from '@mui/material';
import { Add, Search, ShoppingCart, CheckCircle, Cancel, LocalShipping } from '@mui/icons-material';
import apiClient from '../../api/client';

interface Purchase {
  id: number; supplier_id: number; status: string;
  total_cost: number; items: any[]; created_at: string;
}
interface Supplier { id: number; name: string; }
interface Product { id: number; name: string; cost_price: number; }

const statusChip = (status: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    DRAFT: { bg: '#f1f5f9', color: '#475569' },
    RECEIVED: { bg: '#ecfdf5', color: '#16a34a' },
    CANCELLED: { bg: '#fef2f2', color: '#ef4444' },
  };
  const c = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return <Chip label={status} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.75rem' }} />;
};

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    supplier_id: '',
    items: [{ product_id: '', quantity: '1', unit_cost: '' }],
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [purchRes, suppRes, prodRes] = await Promise.all([
        apiClient.get('/api/v1/purchases'),
        apiClient.get('/api/v1/suppliers'),
        apiClient.get('/api/v1/products'),
      ]);
      setPurchases(purchRes.data); setSuppliers(suppRes.data); setProducts(prodRes.data);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { product_id: '', quantity: '1', unit_cost: '' }] });
  };
  const handleRemoveItem = (idx: number) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });
  };
  const handleItemChange = (idx: number, field: string, value: string) => {
    const items = [...formData.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'product_id') {
      const prod = products.find(p => p.id === parseInt(value));
      if (prod) items[idx].unit_cost = prod.cost_price.toString();
    }
    setFormData({ ...formData, items });
  };

  const handleSave = async () => {
    try {
      setError(null);
      await apiClient.post('/api/v1/purchases', {
        supplier_id: parseInt(formData.supplier_id),
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          unit_cost: parseFloat(item.unit_cost),
        })),
      });
      setOpenDialog(false);
      setFormData({ supplier_id: '', items: [{ product_id: '', quantity: '1', unit_cost: '' }] });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to create purchase'); }
  };

  const handleReceive = async (id: number) => {
    try { await apiClient.post(`/api/v1/purchases/${id}/receive`); fetchAll(); }
    catch (err: any) { setError(err.response?.data?.detail || 'Failed to receive purchase'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;

  const total = purchases.reduce((s, p) => s + Number(p.total_cost), 0);
  const draftCount = purchases.filter(p => p.status === 'DRAFT').length;
  const receivedCount = purchases.filter(p => p.status === 'RECEIVED').length;

  const statCards = [
    { label: 'Total Purchases', value: purchases.length, icon: <ShoppingCart />, bg: '#eff6ff', color: '#3b82f6' },
    { label: 'Total Cost', value: `$${total.toFixed(2)}`, icon: <LocalShipping />, bg: '#ecfdf5', color: '#16a34a' },
    { label: 'Pending (Draft)', value: draftCount, icon: <Cancel />, bg: '#fffbeb', color: '#d97706' },
    { label: 'Received', value: receivedCount, icon: <CheckCircle />, bg: '#ecfdf5', color: '#16a34a' },
  ];

  const supplierName = (id: number) => suppliers.find(s => s.id === id)?.name || `#${id}`;
  const filtered = purchases.filter(p =>
    !search || supplierName(p.supplier_id).toLowerCase().includes(search.toLowerCase()) || p.status.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>Purchases</Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpenDialog(true)}
          sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
          New Purchase
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
        <InputBase placeholder="Search by supplier or status..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, fontSize: '0.875rem' }} />
      </Paper>

      <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>PO #</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Total Cost</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Items</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(p => (
                <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>#{p.id}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{supplierName(p.supplier_id)}</Typography></TableCell>
                  <TableCell>{statusChip(p.status)}</TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight={700}>${Number(p.total_cost).toFixed(2)}</Typography></TableCell>
                  <TableCell align="center"><Typography variant="body2">{p.items.length}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{new Date(p.created_at).toLocaleDateString()}</Typography></TableCell>
                  <TableCell align="center">
                    {p.status === 'DRAFT' && (
                      <Button size="small" onClick={() => handleReceive(p.id)}
                        sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', bgcolor: '#ecfdf5', color: '#16a34a', '&:hover': { bgcolor: '#d1fae5' } }}>
                        Mark Received
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>No purchases found.</TableCell></TableRow>
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
        <DialogTitle sx={{ fontWeight: 700 }}>New Purchase Order</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <FormControl fullWidth size="small">
            <InputLabel>Supplier</InputLabel>
            <Select value={formData.supplier_id} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })} label="Supplier">
              {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>Purchase Items</Typography>
          {formData.items.map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl sx={{ flex: 2 }} size="small">
                <InputLabel>Product</InputLabel>
                <Select value={item.product_id} onChange={e => handleItemChange(idx, 'product_id', e.target.value)} label="Product">
                  {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Qty" type="number" size="small" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} sx={{ flex: 0.5 }} />
              <TextField label="Unit Cost" type="number" size="small" value={item.unit_cost} onChange={e => handleItemChange(idx, 'unit_cost', e.target.value)} sx={{ flex: 1 }} />
              {formData.items.length > 1 && (
                <Button color="error" size="small" onClick={() => handleRemoveItem(idx)} sx={{ minWidth: 32 }}>X</Button>
              )}
            </Box>
          ))}
          <Button size="small" onClick={handleAddItem} sx={{ textTransform: 'none', alignSelf: 'flex-start' }}>+ Add Item</Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained"
            sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>Create Purchase</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
