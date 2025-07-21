"use client";
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, CircularProgress, MenuItem } from '@mui/material';
import Papa from 'papaparse';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ user: '', from: '', to: '' });
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) router.push('/login');
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        // ignore user fetch errors for now
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const snap = await getDocs(collection(db, 'tasks'));
        setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        setError('Failed to fetch tasks');
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  // Filter logs by userId and date range
  const filteredLogsByUser = logs.filter(log => {
    const userMatch = selectedUser === '' || log.userId === selectedUser;
    const dateMatch =
      (!dateFrom || log.date >= dateFrom) &&
      (!dateTo || log.date <= dateTo);
    return userMatch && dateMatch;
  });

  // Apply filters only when 'Apply Filters' is clicked
  const handleApplyFilters = () => {
    setAppliedFilters({ user: selectedUser, from: dateFrom, to: dateTo });
    setFilteredLogs(filteredLogsByUser);
  };

  // Export only the filtered logs
  const handleExport = () => {
    const csv = Papa.unparse(filteredLogs.map(log => ({
      'User Name': log.userName,
      'Date': log.date,
      'Project Name': log.taskTitle,
      'Description': log.description,
      'Time': log.time,
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'time_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, minHeight: '100vh', background: '#f6f8fa' }}>
      <Typography variant="h4" mb={3} fontWeight={700} color="primary.main">Admin Dashboard</Typography>
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h6" mb={2} fontWeight={600}>Filters</Typography>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ md: 'flex-end' }}>
          <TextField
            select
            label="User Name"
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            sx={{ minWidth: 180, background: '#fff' }}
            size="small"
          >
            <MenuItem value="">All</MenuItem>
            {users.map(u => (
              <MenuItem key={u.id} value={u.userId}>{u.userName}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="From"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            sx={{ background: '#fff' }}
            size="small"
          />
          <TextField
            label="To"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            sx={{ background: '#fff' }}
            size="small"
          />
          <Button variant="contained" onClick={handleApplyFilters} sx={{ minWidth: 120, fontWeight: 600, height: 40, boxShadow: 2, borderRadius: 2, textTransform: 'none', letterSpacing: 0.5 }}>Apply Filters</Button>
          <Button variant="outlined" onClick={handleExport} disabled={filteredLogs.length === 0} sx={{ minWidth: 120, fontWeight: 600, height: 40, borderRadius: 2, textTransform: 'none', letterSpacing: 0.5 }}>Export CSV</Button>
        </Box>
      </Paper>
      <Paper sx={{ p: { xs: 1, md: 3 }, borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h6" mb={2} fontWeight={600}>Time Logs</Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ background: '#f0f4f8' }}>
                  <TableCell sx={{ fontWeight: 700 }}>User Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Project Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No logs found.</TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <TableRow key={log.id} sx={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb', '&:hover': { background: '#e3eafc' } }}>
                      <TableCell>{log.userName}</TableCell>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.taskTitle}</TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell>{log.time}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
} 