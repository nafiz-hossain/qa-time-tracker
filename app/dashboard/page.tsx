"use client";
import { useState } from 'react';
import { Box, Typography, Paper, Button, TextField, List, ListItem, ListItemText, Divider, CircularProgress } from '@mui/material';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import Pagination from '@mui/material/Pagination';
import DeleteIcon from '@mui/icons-material/Delete';
import DialogContentText from '@mui/material/DialogContentText';

function getTodayDate() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function compareDateTime(a: any, b: any) {
  // Combine date and time into a Date object for accurate comparison
  const dateA = new Date(`${a.date} ${a.time}`);
  const dateB = new Date(`${b.date} ${b.time}`);
  return dateB.getTime() - dateA.getTime();
}

export default function DashboardPage() {
  const [task, setTask] = useState({ taskTitle: '', description: '' });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [editFields, setEditFields] = useState({ taskTitle: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [page, setPage] = useState(1);
  const tasksPerPage = 10;
  const sortedLogs = [...logs].sort(compareDateTime);
  const paginatedLogs = sortedLogs.slice((page - 1) * tasksPerPage, page * tasksPerPage);
  const totalPages = Math.ceil(sortedLogs.length / tasksPerPage);
  const handlePageChange = (_: any, value: number) => setPage(value);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTask, setDeleteTask] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Get current user
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchTodayTasks(u);
      } else router.push('/login');
    });
    return () => unsubscribe();
  }, []);

  // Fetch only today's tasks for this user
  const fetchTodayTasks = async (u: any) => {
    setLoading(true);
    try {
      const today = getTodayDate();
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', u.uid),
        where('date', '==', today)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      setError('Failed to fetch tasks');
    }
    setLoading(false);
  };

  // Add a new task
  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.taskTitle || !task.description || !user) return;
    setLoading(true);
    setError('');
    try {
      const userName = user.displayName || user.email || 'Unknown';
      // Check for duplicate
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        where('date', '==', getTodayDate()),
        where('taskTitle', '==', task.taskTitle)
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        setError('You already have a task with this title today.');
        setLoading(false);
        return;
      }
      const newTask = {
        userId: user.uid,
        userName,
        taskTitle: task.taskTitle,
        description: task.description,
        date: getTodayDate(),
        time: getCurrentTime(),
      };
      console.log(newTask);
      await addDoc(collection(db, 'tasks'), newTask);
      setTask({ taskTitle: '', description: '' });
      fetchTodayTasks(user);
    } catch (e) {
      setError('Failed to save task');
    }
    setLoading(false);
  };

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
      if (user) fetchTodayTasks(user);
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
      if (user) fetchTodayTasks(user);
    } catch (e) {
      setError('Failed to delete task');
    }
    setDeleteLoading(false);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setDeleteTask(null);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, minHeight: '100vh', background: '#f6f8fa' }}>
      <Typography variant="h4" mb={3} fontWeight={700} color="primary.main">User Dashboard</Typography>
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h6" mb={2} fontWeight={600}>Add a Task for Today</Typography>
        <form onSubmit={handleLogSubmit}>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ md: 'flex-end' }}>
            <TextField label="Project Name" value={task.taskTitle} onChange={e => setTask({ ...task, taskTitle: e.target.value })} required sx={{ background: '#fff' }} size="small" />
            <TextField label="Description" value={task.description} onChange={e => setTask({ ...task, description: e.target.value })} required sx={{ background: '#fff' }} size="small" />
            <Button type="submit" variant="contained" color="primary" disabled={loading || !user} sx={{ minWidth: 120, fontWeight: 600, height: 40, boxShadow: 2, borderRadius: 2, textTransform: 'none', letterSpacing: 0.5 }}>Add Task</Button>
          </Box>
        </form>
        {loading && <Box mt={2}><CircularProgress size={24} /></Box>}
        {error && <Typography color="error" mt={2}>{error}</Typography>}
      </Paper>
      <Paper sx={{ p: { xs: 1, md: 3 }, borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h6" mb={2} fontWeight={600}>Today's Tasks</Typography>
        <List>
          {paginatedLogs.length === 0 && <Typography color="text.secondary" sx={{ px: 2, py: 1 }}>No tasks for today yet.</Typography>}
          {paginatedLogs.map((log, idx) => (
            <div key={log.id}>
              <ListItem sx={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb', borderRadius: 2, mb: 1, '&:hover': { background: '#e3eafc' } }}
                secondaryAction={
                  <>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditClick(log)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" color="error" onClick={() => handleDeleteClick(log)} sx={{ ml: 1 }}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={<span style={{ fontWeight: 600 }}>{log.time} - {log.taskTitle}</span>}
                  secondary={<span style={{ color: '#555' }}>{log.description}</span>}
                />
              </ListItem>
              {idx < paginatedLogs.length - 1 && <Divider />}
            </div>
          ))}
        </List>
        {sortedLogs.length > tasksPerPage && (
          <Box width="100%" display="flex" justifyContent="flex-start" alignItems="center" mt={2} gap={2}>
            <Button
              variant="outlined"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Typography variant="body1" sx={{ mx: 2, display: 'inline-block', whiteSpace: 'nowrap' }}>
              Page {page} of {totalPages}
            </Typography>
            <Button
              variant="outlined"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </Box>
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