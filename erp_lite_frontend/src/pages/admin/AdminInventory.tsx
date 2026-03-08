import { useEffect, useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, CircularProgress, Alert, Chip,
  InputBase, TablePagination, Grid, Avatar, MenuItem, Select,
  FormControl, InputLabel,
} from '@mui/material';
import {
  Search, Inventory, Warning, CheckCircle, ErrorOutline,
} from '@mui/icons-material';
import apiClient from '../../api/client';

interface Product {
  id: number; sku: string; name: string; description?: string;
  category_id: number; cost_price: number; selling_price: number;
  stock_quantity: number; reorder_level: number; is_active: boolean;
}
interface Category { id: number; name: string; }

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
function productColor(id: number) { return COLORS[id % COLORS.length]; }

function stockStatus(qty: number, reorder: number) {
  if (qty === 0) return { label: 'Out of Stock', bg: '#fef2f2', color: '#ef4444', icon: <ErrorOutline sx={{ fontSize: 14 }} /> };
  if (qty <= reorder) return { label: 'Low Stock', bg: '#fffbeb', color: '#d97706', icon: <Warning sx={{ fontSize: 14 }} /> };
  return { label: 'In Stock', bg: '#ecfdf5', color: '#16a34a', icon: <CheckCircle sx={{ fontSize: 14 }} /> };
}

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          apiClient.get('/api/v1/products'),
          apiClient.get('/api/v1/categories'),
        ]);
        setProducts(pRes.data);
        setCategories(cRes.data);
      } catch { setError('Failed to load inventory data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

  const totalItems = products.length;
  const totalStock = products.reduce((s, p) => s + p.stock_quantity, 0);
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;
  const totalValue = products.reduce((s, p) => s + p.stock_quantity * Number(p.cost_price), 0);

  const statCards = [
    { label: 'Total Products', value: totalItems, icon: <Inventory />, bg: '#eff6ff', color: '#3b82f6' },
    { label: 'Total Stock', value: totalStock.toLocaleString(), icon: <CheckCircle />, bg: '#ecfdf5', color: '#16a34a' },
    { label: 'Low Stock', value: lowStockCount, icon: <Warning />, bg: '#fffbeb', color: '#d97706' },
    { label: 'Out of Stock', value: outOfStockCount, icon: <ErrorOutline />, bg: '#fef2f2', color: '#ef4444' },
  ];

  let filtered = products.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    if (filterCat && p.category_id !== Number(filterCat)) return false;
    if (filterStatus === 'in_stock' && (p.stock_quantity === 0 || p.stock_quantity <= p.reorder_level)) return false;
    if (filterStatus === 'low' && (p.stock_quantity === 0 || p.stock_quantity > p.reorder_level)) return false;
    if (filterStatus === 'out' && p.stock_quantity !== 0) return false;
    return true;
  });

  // Sort: out of stock first, then low stock, then in stock
  filtered = filtered.sort((a, b) => {
    const priority = (p: Product) => p.stock_quantity === 0 ? 0 : p.stock_quantity <= p.reorder_level ? 1 : 2;
    return priority(a) - priority(b);
  });

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>Inventory</Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Total Value: <strong>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map(c => (
          <Grid item xs={6} md={3} key={c.label}>
            <Paper sx={{ p: 2, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>
                {c.icon}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{c.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Paper sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flex: 1, minWidth: 200 }}>
          <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
          <InputBase placeholder="Search by name or SKU..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            sx={{ flex: 1, fontSize: '0.875rem' }} />
        </Paper>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Category</InputLabel>
          <Select value={filterCat} label="Category"
            onChange={e => { setFilterCat(e.target.value); setPage(0); }}
            sx={{ borderRadius: '10px', fontSize: '0.875rem' }}>
            <MenuItem value="">All</MenuItem>
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status"
            onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
            sx={{ borderRadius: '10px', fontSize: '0.875rem' }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="in_stock">In Stock</MenuItem>
            <MenuItem value="low">Low Stock</MenuItem>
            <MenuItem value="out">Out of Stock</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Category</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>In Stock</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Reorder Level</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Cost Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Stock Value</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(p => {
                const st = stockStatus(p.stock_quantity, p.reorder_level);
                const value = p.stock_quantity * Number(p.cost_price);
                return (
                  <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: productColor(p.id), width: 32, height: 32, fontSize: '0.8rem', fontWeight: 600 }}>
                          {p.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#64748b' }}>{p.sku}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{catMap[p.category_id] || '—'}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}
                        sx={{ color: p.stock_quantity === 0 ? '#ef4444' : p.stock_quantity <= p.reorder_level ? '#d97706' : 'inherit' }}>
                        {p.stock_quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="right"><Typography variant="body2" color="text.secondary">{p.reorder_level}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">${Number(p.cost_price).toFixed(2)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography></TableCell>
                    <TableCell>
                      <Chip
                        icon={st.icon}
                        label={st.label}
                        size="small"
                        sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600, fontSize: '0.72rem', '& .MuiChip-icon': { color: st.color } }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>No products found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filtered.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]} />
      </Paper>
    </Box>
  );
}
