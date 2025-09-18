// Appens hovedfil: setter opp navigasjon (Stack + Tabs),
// holder delt state for avtaler, og definerer skjermene.
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Skjermkomponenter
import HomeScreen from './screens/HomeScreen';
import MakeAppointemnt from './screens/MakeAppointemnt';
import AppointmentDetails from './screens/Appointment_details';
// Felles styling (merk mellomrom i mappenavnet "styles ")
import styles from './styles /styles';

// Oppretter navigatorer: én stack (for overordnet navigasjon)
// og én bottom-tab (mellom Home og MakeAppointment)
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Egen komponent for tab-navigatoren slik at vi kan
// sende inn props (appointments og addAppointment)
function Tabs({ appointments, addAppointment }) {
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
          <MakeAppointemnt {...props} addAppointment={addAppointment} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  // Delt liste over avtaler for hele appen (lagres i minnet)
  const [appointments, setAppointments] = useState([
    {
      id: '1',
      title: 'Team-møte',
      date: '2025-09-20 10:00',
      participants: ['Anna', 'Jonas', 'Mia'],
      description: 'Sprintplanlegging og prioritering',
    },
    {
      id: '2',
      title: 'Kundekall',
      date: '2025-09-22 14:30',
      participants: ['Lars', 'Kari'],
      description: 'Status og neste steg',
    },
  ]);

  // Funksjon som legger til en ny avtale på toppen av listen
  const addAppointment = (newItem) => {
    setAppointments((prev) => [
      { ...newItem, id: String(Date.now()) },
      ...prev,
    ]);
  };

  // Bruker useMemo for å unngå at tittelen beregnes unødvendig
  const headerTitle = useMemo(() => 'Kalender', []);

  return (
    // SafeAreaProvider håndterer "notch"/insets på iOS og Android
    <SafeAreaProvider>
      {/* NavigationContainer er topp-nivå for React Navigation */}
      <NavigationContainer>
        {/* Mørk tekst i statuslinjen */}
        <StatusBar style="dark" />
        {/* Stack-navigator med to skjermer: Tabs + detaljer */}
        <Stack.Navigator>
          <Stack.Screen
            name="Tabs"
            options={{ headerTitle }} // Viser "Kalender" som tittel
          >
            {() => (
              <Tabs appointments={appointments} addAppointment={addAppointment} />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="AppointmentDetails"
            component={AppointmentDetails}
            options={{ title: 'Avtaledetaljer' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
