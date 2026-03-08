import { useEffect, useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, CircularProgress, Alert, Chip,
  InputBase, TablePagination, Grid,
} from '@mui/material';
import { Search, Inventory, TrendingDown, RemoveShoppingCart } from '@mui/icons-material';
import apiClient from '../../api/client';

interface StockTransaction {
  id: number; product_id: number; type: string; quantity: number;
  reference_type: string; reference_id?: number; notes?: string; created_at: string;
}

const typeChip = (type: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    IN: { bg: '#ecfdf5', color: '#16a34a' },
    OUT: { bg: '#fef2f2', color: '#ef4444' },
    ADJUSTMENT: { bg: '#fffbeb', color: '#d97706' },
  };
  const c = map[type] || { bg: '#f1f5f9', color: '#475569' };
  return <Chip label={type} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.75rem' }} />;
};

export default function AdminStock() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get('/api/v1/stock-transactions');
        setTransactions(res.data);
      } catch { setError('Failed to load stock history'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;

  const inCount = transactions.filter(t => t.type === 'IN').reduce((s, t) => s + t.quantity, 0);
  const outCount = transactions.filter(t => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0);
  const adjCount = transactions.filter(t => t.type === 'ADJUSTMENT').length;

  const statCards = [
    { label: 'Total Transactions', value: transactions.length, icon: <Inventory />, bg: '#eff6ff', color: '#3b82f6' },
    { label: 'Total Stock In', value: inCount, icon: <Inventory />, bg: '#ecfdf5', color: '#16a34a' },
    { label: 'Total Stock Out', value: outCount, icon: <TrendingDown />, bg: '#fef2f2', color: '#ef4444' },
    { label: 'Adjustments', value: adjCount, icon: <RemoveShoppingCart />, bg: '#fffbeb', color: '#d97706' },
  ];

  const filtered = transactions.filter(t =>
    !search || t.type.toLowerCase().includes(search.toLowerCase()) ||
    t.reference_type.toLowerCase().includes(search.toLowerCase()) ||
    (t.notes || '').toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2.5 }}>Stock Transactions</Typography>

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

      <Paper sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, mb: 2, borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
        <InputBase placeholder="Search by type, reference, notes..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, fontSize: '0.875rem' }} />
      </Paper>

      <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Product ID</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Notes</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(t => (
                <TableRow key={t.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>#{t.id}</Typography></TableCell>
                  <TableCell><Typography variant="body2">#{t.product_id}</Typography></TableCell>
                  <TableCell>{typeChip(t.type)}</TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight={600}>{t.quantity}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{t.reference_type}{t.reference_id ? ` #${t.reference_id}` : ''}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>{t.notes || '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{new Date(t.created_at).toLocaleString()}</Typography></TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>No stock transactions found.</TableCell></TableRow>
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
