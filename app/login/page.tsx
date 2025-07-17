"use client";
import { useState } from 'react';
import { Box, Button, Typography, Paper, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useRouter } from 'next/navigation';
import { auth, GoogleAuthProvider, signInWithPopup, db } from '../firebase';
import { setDoc, doc } from 'firebase/firestore';

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Add or update user in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        userName: user.displayName || user.email,
        email: user.email,
        photoURL: user.photoURL,
      }, { merge: true });
      router.push('/dashboard');
    } catch (error: any) {
      setError('Google Sign-In failed: ' + error.message);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)' }}>
      <Paper elevation={4} sx={{ borderRadius: 4, overflow: 'hidden', maxWidth: 800, width: '100%' }}>
        <Grid container>
          {/* Left: Illustration and text */}
          <Grid item xs={12} md={6} sx={{ background: '#f6fafd', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            {/* Logo */}
            <Box alignSelf="flex-start" mb={4}>
              <Typography variant="h6" color="primary" fontWeight={700}>Ontime.</Typography>
            </Box>
            {/* Illustration (placeholder SVG) */}
            <Box mb={3}>
              <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="60" width="20" height="30" rx="6" fill="#FFD600"/>
                <rect x="40" y="40" width="20" height="50" rx="6" fill="#00B8D9"/>
                <rect x="70" y="50" width="20" height="40" rx="6" fill="#FF5630"/>
                <rect x="100" y="30" width="20" height="60" rx="6" fill="#36B37E"/>
              </svg>
            </Box>
            <Typography variant="h5" fontWeight={700} mb={1} color="text.primary">
              Unlock Your Team Performance
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              Track, manage, and boost your QA team’s productivity with ease.
            </Typography>
          </Grid>
          {/* Right: Login form */}
          <Grid item xs={12} md={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Welcome to Ontime
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Unlock Your Team Performance
            </Typography>
            {error && <Typography color="error" variant="body2">{error}</Typography>}
            <Divider sx={{ my: 3 }} />
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              sx={{ py: 1.2, fontWeight: 600 }}
              onClick={handleGoogleSignIn}
            >
              Sign in with Google
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
} 