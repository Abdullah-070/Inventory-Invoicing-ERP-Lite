import { useEffect, useState } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Typography, CircularProgress, Chip,
  MenuItem, Select, InputLabel, FormControl, Grid, InputBase, TablePagination,
} from '@mui/material';
import { Add, Search, Payment, AccountBalance, TrendingUp } from '@mui/icons-material';
import apiClient from '../../api/client';

interface PaymentRecord {
  id: number; entity_type: string; customer_id?: number; supplier_id?: number;
  amount: number; payment_method: string; reference_note?: string; created_at: string;
}

const methodChip = (method: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    CASH: { bg: '#ecfdf5', color: '#16a34a' },
    BANK: { bg: '#eff6ff', color: '#3b82f6' },
    ONLINE: { bg: '#faf5ff', color: '#8b5cf6' },
  };
  const c = map[method] || { bg: '#f1f5f9', color: '#475569' };
  return <Chip label={method} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.75rem' }} />;
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    entity_type: 'CUSTOMER', entity_id: '', amount: '', payment_method: 'CASH', reference_note: '',
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [payRes, custRes, suppRes] = await Promise.all([
        apiClient.get('/api/v1/payments'),
        apiClient.get('/api/v1/customers'),
        apiClient.get('/api/v1/suppliers'),
      ]);
      setPayments(payRes.data); setCustomers(custRes.data); setSuppliers(suppRes.data);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      setError(null);
      await apiClient.post('/api/v1/payments', {
        entity_type: formData.entity_type,
        entity_id: parseInt(formData.entity_id),
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        reference_note: formData.reference_note || undefined,
      });
      setOpenDialog(false);
      setFormData({ entity_type: 'CUSTOMER', entity_id: '', amount: '', payment_method: 'CASH', reference_note: '' });
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to create payment'); }
  };

  const entities = formData.entity_type === 'CUSTOMER' ? customers : suppliers;

  const getEntityName = (p: PaymentRecord) => {
    if (p.entity_type === 'CUSTOMER') return customers.find(c => c.id === p.customer_id)?.name || '—';
    return suppliers.find(s => s.id === p.supplier_id)?.name || '—';
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const custPay = payments.filter(p => p.entity_type === 'CUSTOMER').reduce((s, p) => s + Number(p.amount), 0);
  const suppPay = payments.filter(p => p.entity_type === 'SUPPLIER').reduce((s, p) => s + Number(p.amount), 0);

  const statCards = [
    { label: 'Total Payments', value: payments.length, icon: <Payment />, bg: '#eff6ff', color: '#3b82f6' },
    { label: 'Total Amount', value: `$${totalPaid.toFixed(2)}`, icon: <AccountBalance />, bg: '#ecfdf5', color: '#16a34a' },
    { label: 'Customer Payments', value: `$${custPay.toFixed(2)}`, icon: <TrendingUp />, bg: '#faf5ff', color: '#8b5cf6' },
    { label: 'Supplier Payments', value: `$${suppPay.toFixed(2)}`, icon: <TrendingUp />, bg: '#fffbeb', color: '#d97706' },
  ];

  const filtered = payments.filter(p =>
    !search || getEntityName(p).toLowerCase().includes(search.toLowerCase()) ||
    p.entity_type.toLowerCase().includes(search.toLowerCase()) ||
    p.payment_method.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>Payments & Ledger</Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpenDialog(true)}
          sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
          Record Payment
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
        <InputBase placeholder="Search by entity, type, or method..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, fontSize: '0.875rem' }} />
      </Paper>

      <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Entity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(p => (
                <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>#{p.id}</Typography></TableCell>
                  <TableCell>
                    <Chip label={p.entity_type} size="small"
                      sx={{ bgcolor: p.entity_type === 'CUSTOMER' ? '#eff6ff' : '#faf5ff',
                        color: p.entity_type === 'CUSTOMER' ? '#3b82f6' : '#8b5cf6',
                        fontWeight: 600, fontSize: '0.75rem' }} />
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{getEntityName(p)}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight={700}>${Number(p.amount).toFixed(2)}</Typography></TableCell>
                  <TableCell>{methodChip(p.payment_method)}</TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{p.reference_note || '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{new Date(p.created_at).toLocaleString()}</Typography></TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>No payments recorded.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filtered.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]} />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Payment</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <FormControl fullWidth size="small">
            <InputLabel>Entity Type</InputLabel>
            <Select value={formData.entity_type} onChange={e => setFormData({ ...formData, entity_type: e.target.value, entity_id: '' })} label="Entity Type">
              <MenuItem value="CUSTOMER">Customer</MenuItem>
              <MenuItem value="SUPPLIER">Supplier</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>{formData.entity_type === 'CUSTOMER' ? 'Customer' : 'Supplier'}</InputLabel>
            <Select value={formData.entity_id} onChange={e => setFormData({ ...formData, entity_id: e.target.value })} label={formData.entity_type === 'CUSTOMER' ? 'Customer' : 'Supplier'}>
              {entities.map((e: any) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Amount" type="number" size="small" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} fullWidth required />
          <FormControl fullWidth size="small">
            <InputLabel>Payment Method</InputLabel>
            <Select value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })} label="Payment Method">
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="BANK">Bank Transfer</MenuItem>
              <MenuItem value="ONLINE">Online</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Reference Note" size="small" value={formData.reference_note} onChange={e => setFormData({ ...formData, reference_note: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained"
            sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>Record</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
