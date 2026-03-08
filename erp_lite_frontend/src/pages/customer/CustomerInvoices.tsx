import { useEffect, useState } from 'react';
import {
  Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert, Box, Chip,
  InputBase, TablePagination, IconButton, Tooltip,
} from '@mui/material';
import { Receipt, Download, Search } from '@mui/icons-material';
import apiClient from '../../api/client';

export default function CustomerInvoices() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    try {
      const res = await apiClient.get('/api/v1/sales');
      const confirmed = res.data.filter((o: any) => o.status === 'CONFIRMED' && o.invoice_number);
      setOrders(confirmed);
    } catch {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (id: number) => {
    try {
      const res = await apiClient.get(`/api/v1/sales/${id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download invoice');
    }
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (o.invoice_number || '').toLowerCase().includes(q) ||
      (o.order_number || String(o.id)).toLowerCase().includes(q);
  });

  if (loading) return <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>My Invoices</Typography>
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f1f5f9', borderRadius: '10px', px: 1.5, py: 0.5, minWidth: 260 }}>
          <Search sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
          <InputBase placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, fontSize: '0.875rem' }} />
        </Paper>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError(null)}>{error}</Alert>}

      {orders.length === 0 ? (
        <Paper elevation={0} sx={{ textAlign: 'center', py: 8, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <Receipt sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#64748b' }}>No invoices yet</Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Invoices will appear here once your orders are confirmed.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Invoice #', 'Order #', 'Date', 'Amount', 'Status', 'Download'].map(h => (
                    <TableCell key={h} align={h === 'Amount' ? 'right' : h === 'Download' ? 'center' : 'left'}
                      sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748b' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((order) => (
                  <TableRow key={order.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.invoice_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#3b82f6' }}>
                        #{order.order_number || order.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>${Number(order.total_amount ?? 0).toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="Paid" size="small" sx={{ bgcolor: '#ecfdf5', color: '#16a34a', fontWeight: 600, fontSize: '0.75rem', height: 24 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Download PDF">
                        <IconButton size="small" onClick={() => downloadInvoice(order.id)} sx={{ color: '#3b82f6' }}>
                          <Download sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
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
    </Box>
  );
}
