import { useEffect, useState } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Typography, CircularProgress, IconButton,
  Avatar, InputBase, TablePagination,
} from '@mui/material';
import { Add, Edit, Delete, Search, FileDownload } from '@mui/icons-material';
import apiClient from '../../api/client';

interface Customer {
  id: number; name: string; email?: string; phone?: string; address?: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
function avatarColor(id: number) { return COLORS[id % COLORS.length]; }
function initials(name: string) {
  const parts = name.split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try { const res = await apiClient.get('/api/v1/customers'); setCustomers(res.data); }
    catch { setError('Failed to load customers'); }
    finally { setLoading(false); }
  };

  const handleOpen = (c?: Customer) => {
    if (c) {
      setEditingId(c.id);
      setFormData({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '', address: '' });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) await apiClient.put(`/api/v1/customers/${editingId}`, formData);
      else await apiClient.post('/api/v1/customers', formData);
      setOpenDialog(false); fetchCustomers();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to save customer'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this customer?')) return;
    try { await apiClient.delete(`/api/v1/customers/${id}`); fetchCustomers(); }
    catch { setError('Failed to delete customer'); }
  };

  const set = (f: string) => (e: any) => setFormData({ ...formData, [f]: e.target.value });

  const handleExportCSV = async () => {
    try {
      const res = await apiClient.get('/api/v1/customers');
      const data = res.data;
      if (!Array.isArray(data) || data.length === 0) { setError('No data to export'); return; }
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map((row: any) =>
          headers.map(h => {
            const v = String(row[h] ?? '');
            return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
          }).join(',')
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'customers.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch { setError('Export failed'); }
  };

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>Customers</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<FileDownload />}
            onClick={handleExportCSV}
            sx={{ textTransform: 'none', borderRadius: '8px' }}>Export</Button>
          <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}
            sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
            Add Customer
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Search */}
      <Paper sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, mb: 2, borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
        <InputBase placeholder="Search customers..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, fontSize: '0.875rem' }} />
      </Paper>

      <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Address</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(c => (
                <TableRow key={c.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: avatarColor(c.id), fontSize: '0.8rem', fontWeight: 700 }}>
                        {initials(c.name)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{c.email || '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{c.phone || '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{c.address || '—'}</Typography></TableCell>
                  <TableCell align="center">
                    <IconButton size="small" sx={{ color: '#64748b' }} onClick={() => handleOpen(c)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => handleDelete(c.id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: '#94a3b8' }}>No customers found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filtered.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]} />
      </Paper>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Name" value={formData.name} onChange={set('name')} fullWidth required size="small" />
          <TextField label="Email" type="email" value={formData.email} onChange={set('email')} fullWidth size="small" />
          <TextField label="Phone" value={formData.phone} onChange={set('phone')} fullWidth size="small" />
          <TextField label="Address" value={formData.address} onChange={set('address')} fullWidth multiline rows={2} size="small" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained"
            sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
