import { useState, useRef } from 'react';
import {
  Box, Grid, Paper, Typography, Button, Alert,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tab, Tabs, Chip,
} from '@mui/material';
import { Upload, Download, CheckCircle, Error as ErrorIcon, CloudUpload, CloudDownload } from '@mui/icons-material';
import apiClient from '../../api/client';

export default function AdminCSV() {
  const [tab, setTab] = useState(0);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportCSV = async (endpoint: string, filename: string) => {
    setExporting(true);
    setResult(null);
    try {
      const res = await apiClient.get(endpoint);
      const data = res.data;
      if (!Array.isArray(data) || data.length === 0) {
        setResult({ success: false, message: 'No data to export' });
        return;
      }
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map((row: any) =>
          headers.map(h => {
            const val = row[h] ?? '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"` : str;
          }).join(',')
        ),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setResult({ success: true, message: `Exported ${data.length} records to ${filename}` });
    } catch {
      setResult({ success: false, message: 'Export failed' });
    } finally {
      setExporting(false);
    }
  };

  const importCSV = async (endpoint: string) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) { setResult({ success: false, message: 'Please select a CSV file' }); return; }
    if (!file.name.endsWith('.csv')) { setResult({ success: false, message: 'Only .csv files are allowed' }); return; }

    setImporting(true);
    setResult(null);
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) { setResult({ success: false, message: 'CSV file is empty or has no data rows' }); return; }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const records: any[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length !== headers.length) { errors.push(`Row ${i}: column count mismatch`); continue; }
        const record: any = {};
        headers.forEach((h, j) => {
          const val = values[j];
          record[h] = isNaN(Number(val)) || val === '' ? val : Number(val);
        });
        records.push(record);
      }

      let successCount = 0;
      for (const record of records) {
        try {
          await apiClient.post(endpoint, record);
          successCount++;
        } catch (err: any) {
          errors.push(`Failed: ${JSON.stringify(record).slice(0, 80)} — ${err.response?.data?.detail || 'Error'}`);
        }
      }

      setResult({
        success: errors.length === 0,
        message: `Imported ${successCount} of ${records.length} records`,
        details: errors.length > 0 ? errors : undefined,
      });
    } catch {
      setResult({ success: false, message: 'Failed to parse CSV file' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportOptions = [
    { label: 'Products', endpoint: '/api/v1/products', filename: 'products.csv' },
    { label: 'Categories', endpoint: '/api/v1/categories', filename: 'categories.csv' },
    { label: 'Customers', endpoint: '/api/v1/customers', filename: 'customers.csv' },
    { label: 'Suppliers', endpoint: '/api/v1/suppliers', filename: 'suppliers.csv' },
  ];

  const importOptions = [
    { label: 'Products', endpoint: '/api/v1/products', fields: 'sku, name, description, category_id, cost_price, selling_price, reorder_level' },
    { label: 'Categories', endpoint: '/api/v1/categories', fields: 'name, description' },
    { label: 'Customers', endpoint: '/api/v1/customers', fields: 'name, email, phone, address' },
    { label: 'Suppliers', endpoint: '/api/v1/suppliers', fields: 'name, email, phone, address' },
  ];

  return (
    <Box sx={{ px: 3, py: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2.5 }}>CSV Import / Export</Typography>

      {result && (
        <Alert
          severity={result.success ? 'success' : 'error'}
          icon={result.success ? <CheckCircle /> : <ErrorIcon />}
          sx={{ mb: 3, borderRadius: '8px' }}
          onClose={() => setResult(null)}
        >
          <Typography>{result.message}</Typography>
          {result.details && (
            <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
              {result.details.map((d, i) => <Typography key={i} variant="body2" color="error">{d}</Typography>)}
            </Box>
          )}
        </Alert>
      )}

      <Paper sx={{ borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setResult(null); }}
          sx={{ borderBottom: '1px solid #e2e8f0', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
          <Tab label="Export Data" icon={<CloudDownload />} iconPosition="start" />
          <Tab label="Import Data" icon={<CloudUpload />} iconPosition="start" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Grid container spacing={2}>
          {exportOptions.map((opt) => (
            <Grid item xs={12} sm={6} md={3} key={opt.label}>
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Box sx={{ width: 52, height: 52, borderRadius: '12px', bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Download sx={{ fontSize: 28, color: '#3b82f6' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>{opt.label}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Export all {opt.label.toLowerCase()} to CSV
                </Typography>
                <Button
                  variant="contained" size="small"
                  startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <Download />}
                  onClick={() => exportCSV(opt.endpoint, opt.filename)}
                  disabled={exporting} fullWidth
                  sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >Export</Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Import CSV File</Typography>
          <Box sx={{ mb: 3, p: 3, border: '2px dashed #e2e8f0', borderRadius: '12px', textAlign: 'center', bgcolor: '#f8fafc' }}>
            <CloudUpload sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Select a CSV file to import</Typography>
            <input type="file" accept=".csv" ref={fileInputRef} />
          </Box>

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Select target:</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {importOptions.map((opt) => (
              <Grid item xs={12} sm={6} md={3} key={opt.label}>
                <Button variant="outlined" fullWidth
                  startIcon={importing ? <CircularProgress size={16} /> : <Upload />}
                  onClick={() => importCSV(opt.endpoint)}
                  disabled={importing}
                  sx={{ py: 1.5, textTransform: 'none', borderRadius: '8px' }}
                >Import {opt.label}</Button>
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Expected CSV Formats</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Entity</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Required Columns</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importOptions.map((opt) => (
                  <TableRow key={opt.label}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{opt.label}</Typography></TableCell>
                    <TableCell>
                      {opt.fields.split(', ').map((f) => (
                        <Chip key={f} label={f} size="small"
                          sx={{ mr: 0.5, mb: 0.5, bgcolor: '#f1f5f9', fontWeight: 500 }} />
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
