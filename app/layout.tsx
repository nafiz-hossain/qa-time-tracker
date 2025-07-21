"use client";
import "./globals.css";
import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, Arial, sans-serif' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              QA Time Tracker
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Button color="inherit" component={Link} href="/bucket">Bucket</Button>
              <Button color="inherit" component={Link} href="/dashboard">My Tasks</Button>
              <Button color="inherit" component={Link} href="/team-overview">Team Overview</Button>
              {loading ? (
                <CircularProgress color="inherit" size={24} />
              ) : user ? (
                <Box display="flex" alignItems="center" gap={1}>
                  {user.photoURL && <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 32, height: 32 }} />}
                  <Typography variant="body1" color="inherit">{user.displayName || user.email}</Typography>
                  <Button color="inherit" onClick={handleLogout}>Logout</Button>
                </Box>
              ) : (
                <Button color="inherit" component={Link} href="/login">Login</Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>
        <main>{children}</main>
      </body>
    </html>
  );
}
