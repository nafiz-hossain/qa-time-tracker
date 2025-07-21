"use client";
import { useState } from 'react';
import { Box, Typography, Paper, Button, TextField, List, ListItem, ListItemText, Divider, CircularProgress } from '@mui/material';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import React from 'react';
import { useRouter } from 'next/navigation';

function getTodayDate() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const [task, setTask] = useState({ taskTitle: '', description: '' });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  // Get current user
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) fetchTodayTasks(u);
      else router.push('/login');
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
          {logs.length === 0 && <Typography color="text.secondary" sx={{ px: 2, py: 1 }}>No tasks for today yet.</Typography>}
          {logs.map((log, idx) => (
            <div key={log.id}>
              <ListItem sx={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb', borderRadius: 2, mb: 1, '&:hover': { background: '#e3eafc' } }}>
                <ListItemText
                  primary={<span style={{ fontWeight: 600 }}>{log.time} - {log.taskTitle}</span>}
                  secondary={<span style={{ color: '#555' }}>{log.description}</span>}
                />
              </ListItem>
              {idx < logs.length - 1 && <Divider />}
            </div>
          ))}
        </List>
      </Paper>
    </Box>
  );
} 