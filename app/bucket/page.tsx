"use client";
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, List, ListItem, ListItemText, Divider, IconButton, CircularProgress } from '@mui/material';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import DeleteIcon from '@mui/icons-material/Delete';

function getTodayDate() {
  // Get date in Bangladesh time zone (Asia/Dhaka)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA gives YYYY-MM-DD
  return formatter.format(now);
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function BucketPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [newTodo, setNewTodo] = useState({ projectName: '', description: '' });
  const [todoLoading, setTodoLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const todosPerPage = 10;
  const totalPages = Math.ceil(todos.length / todosPerPage);
  // Sort todos by createdAt descending before paginating
  const sortedTodos = [...todos].sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return b.createdAt.seconds - a.createdAt.seconds;
  });
  const paginatedTodos = sortedTodos.slice((page - 1) * todosPerPage, page * todosPerPage);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) fetchTodos(u);
    });
    return () => unsubscribe();
  }, []);

  const fetchTodos = async (u: any) => {
    try {
      const q = query(collection(db, 'todos'), where('userId', '==', u.uid));
      const snap = await getDocs(q);
      setTodos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      setError('Failed to fetch todos');
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.projectName || !newTodo.description || !user) return;
    setTodoLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'todos'), {
        userId: user.uid,
        projectName: newTodo.projectName,
        description: newTodo.description,
        createdAt: serverTimestamp(),
      });
      setNewTodo({ projectName: '', description: '' });
      fetchTodos(user);
    } catch (e) {
      setError('Failed to add todo');
    }
    setTodoLoading(false);
  };

  const handleMarkTodoDone = async (todo: any) => {
    setTodoLoading(true);
    setError('');
    try {
      // Add to today's tasks
      const today = getTodayDate();
      const now = getCurrentTime();
      const userName = user.displayName || user.email || 'Unknown';
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        userName,
        taskTitle: todo.projectName,
        description: todo.description,
        date: today,
        time: now,
      });
      // Remove from todos
      await deleteDoc(doc(db, 'todos', todo.id));
      fetchTodos(user);
    } catch (e) {
      setError('Failed to mark todo as done');
    }
    setTodoLoading(false);
  };

  const handleDeleteTodo = async (todo: any) => {
    setTodoLoading(true);
    setError('');
    try {
      await deleteDoc(doc(db, 'todos', todo.id));
      fetchTodos(user);
    } catch (e) {
      setError('Failed to delete todo');
    }
    setTodoLoading(false);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, minHeight: '100vh', background: '#f6f8fa' }}>
      <Typography variant="h4" mb={3} fontWeight={700} color="primary.main">My Bucket List</Typography>
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 3, boxShadow: 3 }}>
        <form onSubmit={handleAddTodo} style={{ marginBottom: 16 }}>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ md: 'flex-end' }}>
            <TextField label="Project Name" value={newTodo.projectName} onChange={e => setNewTodo({ ...newTodo, projectName: e.target.value })} required sx={{ background: '#fff' }} size="small" />
            <TextField label="Description" value={newTodo.description} onChange={e => setNewTodo({ ...newTodo, description: e.target.value })} sx={{ background: '#fff' }} size="small" required />
            <Button type="submit" variant="contained" color="primary" disabled={todoLoading || !user} sx={{ minWidth: 120, fontWeight: 600, height: 40, boxShadow: 2, borderRadius: 2, textTransform: 'none', letterSpacing: 0.5 }}>Add Todo</Button>
          </Box>
        </form>
        {error && <Typography color="error" mb={2}>{error}</Typography>}
        <List>
          {paginatedTodos.length === 0 && <Typography color="text.secondary" sx={{ px: 2, py: 1 }}>No todos in your bucket list.</Typography>}
          {paginatedTodos.map((todo, idx) => (
            <div key={todo.id}>
              <ListItem sx={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb', borderRadius: 2, mb: 1, '&:hover': { background: '#e3eafc' } }}
                secondaryAction={
                  <>
                    <Button variant="outlined" color="success" size="small" onClick={() => handleMarkTodoDone(todo)} disabled={todoLoading} sx={{ mr: 1 }}>Mark as Done</Button>
                    <IconButton edge="end" aria-label="delete" color="error" onClick={() => handleDeleteTodo(todo)} disabled={todoLoading}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={<span style={{ fontWeight: 600 }}>{todo.projectName}</span>}
                  secondary={<span style={{ color: '#555' }}>{todo.description}</span>}
                />
              </ListItem>
              {idx < paginatedTodos.length - 1 && <Divider />}
            </div>
          ))}
        </List>
        {todos.length > todosPerPage && (
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
        {todoLoading && <Box mt={2}><CircularProgress size={24} /></Box>}
      </Paper>
    </Box>
  );
} 