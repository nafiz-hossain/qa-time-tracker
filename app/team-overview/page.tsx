"use client";
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, CircularProgress, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import Papa from 'papaparse';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import EditIcon from '@mui/icons-material/Edit';
import TablePagination from '@mui/material/TablePagination';
import DeleteIcon from '@mui/icons-material/Delete';
import DialogContentText from '@mui/material/DialogContentText';

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
  const [editOpen, setEditOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [editFields, setEditFields] = useState({ taskTitle: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const handleChangePage = (_: any, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTask, setDeleteTask] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    // Sort filteredLogs before exporting
    const sortedExportLogs = [...filteredLogs].sort(compareDateTime);
    const csv = Papa.unparse(sortedExportLogs.map(log => ({
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

  // After fetching logs, apply filters by default
  useEffect(() => {
    if (logs.length > 0 || users.length > 0) {
      setFilteredLogs(filteredLogsByUser);
      setAppliedFilters({ user: selectedUser, from: dateFrom, to: dateTo });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, users]);

  const handleEditClick = (log: any) => {
    setEditTask(log);
    setEditFields({ taskTitle: log.taskTitle, description: log.description });
    setEditOpen(true);
  };

  const handleEditFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    if (!editTask) return;
    setEditLoading(true);
    try {
      const ref = doc(db, 'tasks', editTask.id);
      await updateDoc(ref, {
        taskTitle: editFields.taskTitle,
        description: editFields.description,
      });
      setEditOpen(false);
      setEditTask(null);
      setEditFields({ taskTitle: '', description: '' });
      // Refresh logs
      const snap = await getDocs(collection(db, 'tasks'));
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Re-apply filters after edit
      setFilteredLogs(filteredLogsByUser);
      setAppliedFilters({ user: selectedUser, from: dateFrom, to: dateTo });
    } catch (e) {
      setError('Failed to update task');
    }
    setEditLoading(false);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditTask(null);
    setEditFields({ taskTitle: '', description: '' });
  };

  const handleDeleteClick = (log: any) => {
    setDeleteTask(log);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTask) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'tasks', deleteTask.id));
      setDeleteOpen(false);
      setDeleteTask(null);
      // Refresh logs
      const snap = await getDocs(collection(db, 'tasks'));
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setFilteredLogs([]); // force re-filter
    } catch (e) {
      setError('Failed to delete task');
    }
    setDeleteLoading(false);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setDeleteTask(null);
  };

  function compareDateTime(a: any, b: any) {
    // Combine date and time into a Date object for accurate comparison
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateB.getTime() - dateA.getTime();
  }

  const sortedLogs = [...filteredLogs].sort(compareDateTime);
  const paginatedLogs = sortedLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No logs found.</TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log, idx) => (
                    <TableRow key={log.id} sx={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb', '&:hover': { background: '#e3eafc' } }}>
                      <TableCell>{log.userName}</TableCell>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.taskTitle}</TableCell>
                      <TableCell>
                        {log.description}
                        <IconButton edge="end" aria-label="edit" size="small" onClick={() => handleEditClick(log)} sx={{ ml: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {user && log.userId === user.uid && (
                          <IconButton edge="end" aria-label="delete" color="error" size="small" onClick={() => handleDeleteClick(log)} sx={{ ml: 1 }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>{log.time}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={filteredLogs.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Table>
          </TableContainer>
        )}
      </Paper>
      <Dialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="xs">
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <TextField
            label="Project Name"
            name="taskTitle"
            value={editFields.taskTitle}
            onChange={handleEditFieldChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Description"
            name="description"
            value={editFields.description}
            onChange={handleEditFieldChange}
            fullWidth
            margin="normal"
            required
            multiline
            minRows={4}
            sx={{ width: '100%', fontSize: '1.1rem' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={editLoading}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={editLoading}>
            {editLoading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteOpen} onClose={handleDeleteClose} fullWidth maxWidth="xs">
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this task? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} disabled={deleteLoading}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 