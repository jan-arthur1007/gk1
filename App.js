// Appens hovedfil: setter opp navigasjon (Stack + Tabs),
// håndterer autentisering og synkroniserer avtaler og grupper mot Realtime Database.
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { get, onValue, push, ref, update } from 'firebase/database';

// Skjermkomponenter
import HomeScreen from './screens/HomeScreen';
import MakeAppointemnt from './screens/MakeAppointemnt';
import AppointmentDetails from './screens/Appointment_details';
import AuthScreen from './screens/AuthScreen';
import FriendsScreen from './screens/FriendsScreen';
import ProfileScreen from './screens/ProfileScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import GroupDetailsScreen from './screens/GroupDetailsScreen';
// Felles styling (merk mellomrom i mappenavnet "styles ")
import styles from './styles /styles';
import { auth, database } from './database/firebase';

// Oppretter navigatorer: én stack (for overordnet navigasjon)
// og én bottom-tab (mellom Home og MakeAppointment)
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
// Tab-navigatoren som kobler sammen de fire hovedfanene
// Sender videre avtaler, lagre-funksjon og tilgjengelige grupper til skjermene som trenger det
function Tabs({ appointments, addAppointment, groups }) {
  return (
    <Tab.Navigator
      // Skjuler header på tabs og gir litt høyde/padding
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 60, paddingBottom: 6, paddingTop: 6 },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{ title: 'Hjem' }} // Tekst i tab-fanen
      >
        {(props) => (
          // Videresender avtaler som prop til HomeScreen
          <HomeScreen {...props} appointments={appointments} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="MakeAppointment"
        options={{ title: 'Ny avtale' }}
      >
        {(props) => (
          // Videresender funksjon for å legge til ny avtale
          <MakeAppointemnt {...props} addAppointment={addAppointment} groups={groups} />
        )}
      </Tab.Screen>
      <Tab.Screen name="Friends" component={FriendsScreen} options={{ title: 'Venner' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  // Aktiv bruker, brukt for å koble data mot korrekt database-node
  const [user, setUser] = useState(null);
  // Viser loader frem til vi vet om bruker er logget inn
  const [initializing, setInitializing] = useState(true);
  // Lokalt cachede grupper for brukeren
  const [groups, setGroups] = useState([]);
  // Delt liste over avtaler for hele appen (lagres i RTDB per bruker)
  const [appointments, setAppointments] = useState([]);

  // Funksjon som legger til en ny avtale på toppen av listen
  const addAppointment = async (newItem) => {
    const uid = user?.uid;
    if (!uid) {
      throw new Error('Ingen bruker logget inn');
    }

    // Genererer nøkkel i brukerens avtaleliste
    const ownerRef = ref(database, `appointments/${uid}`);
    const newRef = push(ownerRef);
    const appointmentId = newRef.key;
    const createdAt = Date.now();

    const payload = {
      ...newItem,
      id: appointmentId,
      createdAt,
      ownerUid: uid,
    };

    // Samler alle skriveoperasjoner før vi sender ett update()-kall
    const updates = {
      [`appointments/${uid}/${appointmentId}`]: payload,
    };

    if (newItem.groupId) {
      // Henter medlemmer i valgt gruppe slik at alle får kopien
      const membersSnap = await get(ref(database, `groups/${newItem.groupId}/members`));
      if (membersSnap.exists()) {
        const members = membersSnap.val() || {};
        Object.keys(members).forEach((memberUid) => {
          updates[`appointments/${memberUid}/${appointmentId}`] = {
            ...payload,
            sharedWithGroup: true,
          };
        });
      }
    }

    await update(ref(database), updates);
  };

  // Bruker useMemo for å unngå at tittelen beregnes unødvendig
  const headerTitle = useMemo(() => 'Kalender', []);

  useEffect(() => {
    // Abonnerer på auth-status slik at vi vet når bruker er innlogget
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe; // rydder opp når komponenten unmountes
  }, []);

  useEffect(() => {
    const uid = user?.uid; // autentisert brukers uid (kan være null)
    if (!uid) {
      setGroups([]);
      return () => undefined;
    }

    // Leser brukerens grupper for både group-selektoren og gruppelisten
    // Denne noden vedlikeholdes av gruppe-skjermene
    const groupsRef = ref(database, `userGroups/${uid}`);
    const unsubscribe = onValue(
      groupsRef,
      (snapshot) => {
        const raw = snapshot.val() || {};
        const list = Object.keys(raw).map((key) => ({ id: key, ...raw[key] }));
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setGroups(list);
      },
      () => setGroups([])
    );

    return unsubscribe; // sørger for å stoppe RTDB-lytting ved unmount/logg ut
  }, [user?.uid]);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setAppointments([]);
      return () => undefined;
    }

    // Leser alle avtalene for innlogget bruker (inkludert grupper-avtaler)
    const appointmentsRef = ref(database, `appointments/${uid}`);
    const unsubscribe = onValue(
      appointmentsRef,
      (snapshot) => {
        const raw = snapshot.val() || {};
        const list = Object.keys(raw).map((key) => raw[key]);
        // Sorterer slik at nyeste vises øverst
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setAppointments(list);
      },
      () => setAppointments([])
    );

    return unsubscribe;
  }, [user?.uid]);

  if (initializing) {
    return (
      <SafeAreaProvider>
        <View style={[styles.screenContainer, localStyles.loadingContainer]}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={localStyles.loadingText}>Laster...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    // SafeAreaProvider håndterer "notch"/insets på iOS og Android
    <SafeAreaProvider>
      {/* NavigationContainer er topp-nivå for React Navigation */}
      <NavigationContainer>
        {/* Mørk tekst i statuslinjen */}
        <StatusBar style="dark" />
        {user ? (
          <Stack.Navigator>
            <Stack.Screen
              name="Tabs"
              options={{
                headerTitle,
              }}
            >
              {() => (
                <Tabs appointments={appointments} addAppointment={addAppointment} groups={groups} />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="AppointmentDetails"
              component={AppointmentDetails}
              options={{ title: 'Avtaledetaljer' }}
            />
            <Stack.Screen
              name="CreateGroup"
              component={CreateGroupScreen}
              options={{ title: 'Ny gruppe' }}
            />
            <Stack.Screen
              name="GroupDetails"
              component={GroupDetailsScreen}
              options={{ title: 'Gruppe' }}
            />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const localStyles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
});
