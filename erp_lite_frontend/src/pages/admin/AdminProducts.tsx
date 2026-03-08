import { useEffect, useState } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, IconButton, Avatar,
  MenuItem, Select, InputLabel, FormControl, Typography, InputBase,
  TablePagination,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, FileUpload, FileDownload, Inventory,
} from '@mui/icons-material';
import apiClient from '../../api/client';

interface Product {
  id: number; sku: string; name: string; description?: string;
  category_id: number; barcode?: string; cost_price: number;
  selling_price: number; stock_quantity: number; reorder_level: number; is_active: boolean;
}
interface Category { id: number; name: string; }

const emptyForm = {
  sku: '', name: '', description: '', category_id: '', barcode: '',
  cost_price: '', selling_price: '', reorder_level: '10',
};

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
function productColor(id: number) { return COLORS[id % COLORS.length]; }

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [filterStock, setFilterStock] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try { const res = await apiClient.get('/api/v1/products'); setProducts(res.data); }
    catch { setError('Failed to load products'); }
    finally { setLoading(false); }
  };
  const fetchCategories = async () => {
    try { const res = await apiClient.get('/api/v1/categories'); setCategories(res.data); }
    catch { /* ignore */ }
  };

  const handleOpen = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        sku: product.sku, name: product.name, description: product.description || '',
        category_id: product.category_id.toString(), barcode: product.barcode || '',
        cost_price: product.cost_price.toString(), selling_price: product.selling_price.toString(),
        reorder_level: product.reorder_level.toString(),
      });
    } else { setEditingId(null); setFormData(emptyForm); }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      setError(null);
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id) || 1,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        reorder_level: parseInt(formData.reorder_level),
        barcode: formData.barcode || undefined,
        description: formData.description || undefined,
      };
      if (editingId) await apiClient.put(`/api/v1/products/${editingId}`, payload);
      else await apiClient.post('/api/v1/products', payload);
      setOpenDialog(false); fetchProducts();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to save product'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this product?')) return;
    try { await apiClient.delete(`/api/v1/products/${id}`); fetchProducts(); }
    catch { setError('Failed to delete'); }
  };

  const set = (f: string) => (e: any) => setFormData({ ...formData, [f]: e.target.value });

  const handleExportCSV = async () => {
    try {
      const res = await apiClient.get('/api/v1/products');
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
      link.download = 'products.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch { setError('Export failed'); }
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) { setError('CSV file is empty'); return; }
      const headers = lines[0].split(',').map((h: string) => h.trim());
      const required = ['sku', 'name', 'category_id', 'cost_price', 'selling_price'];
      const missing = required.filter(r => !headers.includes(r));
      if (missing.length) { setError(`Missing CSV columns: ${missing.join(', ')}`); return; }
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map((v: string) => v.trim());
        const row: any = {};
        headers.forEach((h: string, idx: number) => { row[h] = vals[idx]; });
        try {
          await apiClient.post('/api/v1/products', {
            sku: row.sku, name: row.name,
            category_id: parseInt(row.category_id) || 1,
            cost_price: parseFloat(row.cost_price),
            selling_price: parseFloat(row.selling_price),
            reorder_level: parseInt(row.reorder_level) || 10,
            description: row.description || undefined,
            barcode: row.barcode || undefined,
          });
          imported++;
        } catch { /* skip duplicates / bad rows */ }
      }
      alert(`Imported ${imported} of ${lines.length - 1} products`);
      fetchProducts();
    };
    input.click();
  };

  // Filter logic
  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && filterCat !== 'all' && p.category_id.toString() !== filterCat) return false;
    if (filterStock === 'low' && p.stock_quantity > p.reorder_level) return false;
    if (filterStock === 'out' && p.stock_quantity > 0) return false;
    return true;
  });

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading && products.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ px: 3, py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>Products</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<FileUpload />}
            onClick={handleImportCSV}
            sx={{ textTransform: 'none', borderRadius: '8px' }}>Import CSV</Button>
          <Button variant="outlined" size="small" startIcon={<FileDownload />}
            onClick={handleExportCSV}
            sx={{ textTransform: 'none', borderRadius: '8px' }}>Export CSV</Button>
          <Button variant="contained" size="small" startIcon={<Add />}
            onClick={() => handleOpen()}
            sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
            Add Product
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Search & filter bar */}
      <Paper sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5, mb: 2, borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f1f5f9', borderRadius: '8px', px: 1.5, flex: 1, maxWidth: 360 }}>
          <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
          <InputBase placeholder="Search products..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            sx={{ flex: 1, fontSize: '0.875rem', py: 0.5 }} />
        </Box>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Category</InputLabel>
          <Select value={filterCat || 'all'} onChange={e => { setFilterCat(e.target.value === 'all' ? '' : e.target.value); setPage(0); }} label="Category"
            sx={{ borderRadius: '8px', fontSize: '0.85rem' }}>
            <MenuItem value="all">All</MenuItem>
            {categories.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Stock</InputLabel>
          <Select value={filterStock || 'all'} onChange={e => { setFilterStock(e.target.value === 'all' ? '' : e.target.value); setPage(0); }} label="Stock"
            sx={{ borderRadius: '8px', fontSize: '0.85rem' }}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="low">Low Stock</MenuItem>
            <MenuItem value="out">Out of Stock</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Category</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Cost</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Stock</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(p => (
                <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: productColor(p.id), borderRadius: '8px', fontSize: '0.8rem' }}>
                        <Inventory sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{p.name}</Typography>
                        {p.barcode && <Typography variant="caption" color="text.secondary">{p.barcode}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>{p.sku}</Typography></TableCell>
                  <TableCell><Chip label={categories.find(c => c.id === p.category_id)?.name || '-'} size="small" variant="outlined" sx={{ borderRadius: '6px', fontSize: '0.75rem' }} /></TableCell>
                  <TableCell align="right">${Number(p.cost_price).toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>${Number(p.selling_price).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Chip label={p.stock_quantity} size="small"
                      sx={{
                        fontWeight: 600, borderRadius: '6px', fontSize: '0.75rem', minWidth: 42,
                        bgcolor: p.stock_quantity <= 0 ? '#fef2f2' : p.stock_quantity <= p.reorder_level ? '#fffbeb' : '#ecfdf5',
                        color: p.stock_quantity <= 0 ? '#ef4444' : p.stock_quantity <= p.reorder_level ? '#d97706' : '#16a34a',
                      }} />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={p.is_active ? 'Active' : 'Inactive'} size="small" variant="outlined"
                      sx={{ borderRadius: '6px', fontSize: '0.7rem', color: p.is_active ? '#16a34a' : '#94a3b8', borderColor: p.is_active ? '#bbf7d0' : '#e2e8f0' }} />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpen(p)} sx={{ color: '#64748b' }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(p.id)} sx={{ color: '#ef4444' }}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>No products found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      {/* Add/Edit dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="SKU" value={formData.sku} onChange={set('sku')} fullWidth required size="small" />
            <TextField label="Barcode" value={formData.barcode} onChange={set('barcode')} fullWidth size="small" />
          </Box>
          <TextField label="Name" value={formData.name} onChange={set('name')} fullWidth required size="small" />
          <TextField label="Description" value={formData.description} onChange={set('description')} fullWidth multiline rows={2} size="small" />
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select value={formData.category_id} onChange={set('category_id')} label="Category">
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Cost Price" type="number" value={formData.cost_price} onChange={set('cost_price')} fullWidth required size="small" />
            <TextField label="Selling Price" type="number" value={formData.selling_price} onChange={set('selling_price')} fullWidth required size="small" />
          </Box>
          <TextField label="Reorder Level" type="number" value={formData.reorder_level} onChange={set('reorder_level')} fullWidth size="small" />
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
