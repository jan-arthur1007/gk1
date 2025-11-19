

import { Alert } from 'react-native';
import { AuthRequest } from 'expo-auth-session';
import sessionUrlProvider from 'expo-auth-session/build/SessionUrlProvider';
import Constants from 'expo-constants';
import { ref, set } from 'firebase/database';
import { database } from '../database/firebase';

const WEB_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const CALENDAR_ENDPOINT = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
const DEFAULT_SCOPE = 'https://www.googleapis.com/auth/calendar.freebusy';

const resolveClientId = () => {
  const candidates = [
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    Constants.expoConfig?.expoClient?.extra?.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    Constants.manifest?.extra?.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    Constants.manifest?.extra?.expoClient?.extra?.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length) {
      return value.trim();
    }
  }
  return '';
};

const CLIENT_ID = resolveClientId();

export const hasGoogleClientId = () => !!CLIENT_ID;

const resolveProjectFullName = () => {
  const manifest2 = Constants.manifest2;
  const explicit =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_EXPO_FULL_NAME ||
    manifest2?.extra?.EXPO_PUBLIC_EXPO_FULL_NAME;
  if (typeof explicit === 'string' && explicit.startsWith('@')) {
    return explicit;
  }
  const scopeKey = manifest2?.extra?.scopeKey;
  if (typeof scopeKey === 'string' && scopeKey.startsWith('@')) {
    const match = scopeKey.match(/^@[^/]+\/[^-]+/);
    if (match?.[0]) {
      return match[0];
    }
  }

  const expoConfig = Constants.expoConfig;
  const candidates = [
    expoConfig?.originalFullName,
    expoConfig?.owner && expoConfig.slug ? `@${expoConfig.owner}/${expoConfig.slug}` : null,
    manifest2?.extra?.expoClient?.originalFullName,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.startsWith('@')) {
      return value;
    }
  }

  return null;
};

async function exchangeCode(code, redirectUri) {
  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const json = await response.json();
  if (!response.ok || json.error) {
    const message = json.error_description || json.error || 'Kunne ikke hente Google-tilgang.';
    throw new Error(message);
  }
  return json;
}

async function fetchCalendarList(accessToken) {
  const response = await fetch(CALENDAR_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await response.json();
  if (!response.ok || json.error) {
    const message = json.error?.message || 'Kunne ikke hente Google-kalendere.';
    throw new Error(message);
  }
  return json.items || [];
}

export async function linkGoogleCalendar(user) {
  if (!CLIENT_ID) {
    console.warn('Google client ID ikke funnet. Kontroller EXPO_PUBLIC_GOOGLE_CLIENT_ID.');
    throw new Error('Mangler Google Client ID. Sett EXPO_PUBLIC_GOOGLE_CLIENT_ID i miljøvariabler.');
  }
  if (!user?.uid) {
    throw new Error('Ingen bruker tilgjengelig for kalenderkobling.');
  }

  let projectFullName = resolveProjectFullName();
  if (!projectFullName) {
    projectFullName =
      Constants.expoConfig?.owner && Constants.expoConfig?.slug
        ? `@${Constants.expoConfig.owner}/${Constants.expoConfig.slug}`
        : '@anonymous/G_opg_1';
  }

  const redirectUri = sessionUrlProvider.getRedirectUrl({ projectNameForProxy: projectFullName });

  const request = new AuthRequest({
    clientId: CLIENT_ID,
    responseType: 'code',
    scopes: [DEFAULT_SCOPE],
    redirectUri,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  });

  const authUrl = await request.makeAuthUrlAsync({
    authorizationEndpoint: WEB_ENDPOINT,
  });

  const startUrl = sessionUrlProvider.getStartUrl(authUrl, redirectUri, projectFullName);

  const response = await request.promptAsync(
    { authorizationEndpoint: WEB_ENDPOINT },
    { url: startUrl }
  );

  if (response.type !== 'success' || !response.params?.code) {
    throw new Error(
      response.type === 'cancel' || response.type === 'dismiss'
        ? 'Autentiseringen ble avbrutt før Google ga en kode.'
        : `Klarte ikke å fullføre Google-kobling (${response.type}).`
    );
  }

  const tokenData = await exchangeCode(response.params.code, redirectUri);
  const calendars = await fetchCalendarList(tokenData.access_token);

  if (!calendars.length) {
    throw new Error('Fant ingen Google-kalendere for denne kontoen.');
  }

  await set(ref(database, `calendarTokens/${user.uid}`), {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || null,
    expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null,
    grantedScopes: tokenData.scope,
    updatedAt: Date.now(),
  });

  return calendars;
}

export function promptMissingClientId() {
  Alert.alert(
    'Google-konfigurasjon mangler',
    'Sett EXPO_PUBLIC_GOOGLE_CLIENT_ID i app-konfigurasjonen og start Expo på nytt for å aktivere kalenderkobling.'
  );
}



