
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import LoginForm from '../components/login';
import SignUpForm from '../components/signup';
import styles from '../styles /styles';
import { auth, database } from '../database/firebase';
import { linkGoogleCalendar, promptMissingClientId, hasGoogleClientId } from '../services/googleCalendar';

const errorMessages = {
  'auth/invalid-email': 'Ugyldig e-postadresse.',
  'auth/user-disabled': 'Denne brukeren er deaktivert.',
  'auth/user-not-found': 'Fant ingen bruker med denne e-posten.',
  'auth/wrong-password': 'Feil passord. Prøv igjen.',
  'auth/email-already-in-use': 'E-posten er allerede i bruk.',
  'auth/weak-password': 'Passordet må være minst 6 tegn.',
  'permission-denied': 'Mangler tilgang til Firestore. Sjekk sikkerhetsreglene.',
  'unavailable': 'Tilkobling til Firestore feilet. Sjekk nettverk eller prøv igjen.',
};

const mapAuthError = (code, fallback = 'Noe gikk galt. Prøv igjen senere.') =>
  errorMessages[code] || fallback;

const sanitizeUsernameInput = (value) =>
  (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_{2,}/g, '_');

export default function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => (mode === 'login' ? 'Velkommen tilbake' : 'Kom i gang'), [mode]);

  const resetErrorAndSwitch = (nextMode) => {
    setError('');
    setMode(nextMode);
  };

  const handleLogin = async ({ email, password }) => {
    try {
      setLoading(true);
      setError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async ({ email, username, password, confirmPassword }) => {
    if (password !== confirmPassword) {
      setError('Passordene må være like.');
      return;
    }
    try {
      setLoading(true);
      setError('');

      const trimmedUsername = (username || '').trim();
      const usernameLower = sanitizeUsernameInput(trimmedUsername);

      await createUserWithEmailAndPassword(auth, email, password);
      const current = auth.currentUser;
      if (!current) {
        throw new Error('Fant ikke bruker etter registrering.');
      }

      const emailFallback = sanitizeUsernameInput(email.split('@')[0]);
      const baseUsername = usernameLower || emailFallback || `bruker_${Date.now().toString(36)}`;

      let finalUsername = baseUsername;
      let attempt = 0;
      while (attempt < 5) {
        const snapshot = await get(ref(database, `usernameIndex/${finalUsername}`));
        if (!snapshot.exists()) {
          break;
        }
        attempt += 1;
        finalUsername = `${baseUsername}_${attempt + 1}`;
      }
      if (attempt >= 5) {
        finalUsername = `${baseUsername}_${Date.now().toString(36)}`;
      }

      const displayName = trimmedUsername || finalUsername;

      await Promise.all([
        updateProfile(current, { displayName }).catch(() => undefined),
        set(ref(database, `usernames/${current.uid}`), {
          uid: current.uid,
          username: displayName,
          username_lower: finalUsername,
          email,
          createdAt: Date.now(),
        }),
        set(ref(database, `usernameIndex/${finalUsername}`), current.uid),
      ]);

      const handleConnectGoogle = async () => {
        try {
          await linkGoogleCalendar(current);
          Alert.alert(
            'Google-kalender tilkoblet',
            'Vi har fått tilgang til Google-kalenderen din.'
          );
        } catch (e) {
          console.log('Google Calendar link failed:', e);
          Alert.alert('Feil', 'Klarte ikke å koble til Google-kalenderen. Prøv igjen.');
        }
      };

      if (hasGoogleClientId()) {
        Alert.alert(
          'Koble til Google-kalender',
          'Vil du knytte Google-kalenderen som hører til denne e-posten?',
          [
            { text: 'Ikke nå', style: 'cancel' },
            {
              text: 'Koble til',
              onPress: handleConnectGoogle,
            },
          ]
        );
      } else {
        promptMissingClientId();
      }
    } catch (err) {
      console.error('Sign up failed', err);
      setError(mapAuthError(err.code, err.message || 'Noe gikk galt.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screenContainer, authStyles.container]}>
      <Text style={authStyles.subtitle}>{title}</Text>

      {mode === 'login' ? (
        <LoginForm
          onSubmit={handleLogin}
          goToSignUp={() => resetErrorAndSwitch('signup')}
          loading={loading}
          error={error}
        />
      ) : (
        <SignUpForm
          onSubmit={handleSignUp}
          goToLogin={() => resetErrorAndSwitch('login')}
          loading={loading}
          error={error}
        />
      )}

      <Text style={authStyles.helperText}>
        Bruk e-post og passord for å logge inn. Du kan endre dette senere i Firebase.
      </Text>
    </View>
  );
}

const authStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 24,
  },
  helperText: {
    marginTop: 36,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
  },
});




