import { useEffect, useState } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Typography, CircularProgress, IconButton,
  Avatar, InputBase, TablePagination,
} from '@mui/material';
import { Add, Edit, Delete, Search, Category } from '@mui/icons-material';
import apiClient from '../../api/client';

interface CategoryItem { id: number; name: string; description?: string; created_at: string; }

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function AdminCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try { const res = await apiClient.get('/api/v1/categories'); setCategories(res.data); }
    catch { setError('Failed to load categories'); }
    finally { setLoading(false); }
  };

  const handleOpen = (cat?: CategoryItem) => {
    if (cat) {
      setEditingId(cat.id);
      setFormData({ name: cat.name, description: cat.description || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '' });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) await apiClient.put(`/api/v1/categories/${editingId}`, formData);
      else await apiClient.post('/api/v1/categories', formData);
      setOpenDialog(false); fetchCategories();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to save category'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this category? Products under it may be affected.')) return;
    try { await apiClient.delete(`/api/v1/categories/${id}`); fetchCategories(); }
    catch { setError('Failed to delete category'); }
  };

  const filtered = categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ px: 3, py: 3, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>Categories</Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}
          sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
          Add Category
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, mb: 2, borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
        <InputBase placeholder="Search categories..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, fontSize: '0.875rem' }} />
      </Paper>

      <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Created</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(c => (
                <TableRow key={c.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS[c.id % COLORS.length], borderRadius: '8px' }}>
                        <Category sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{c.description || '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{new Date(c.created_at).toLocaleDateString()}</Typography></TableCell>
                  <TableCell align="center">
                    <IconButton size="small" sx={{ color: '#64748b' }} onClick={() => handleOpen(c)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => handleDelete(c.id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>No categories found.</TableCell></TableRow>
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
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} fullWidth required size="small" />
          <TextField label="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={2} size="small" />
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
