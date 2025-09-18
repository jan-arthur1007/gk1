// Hjem-skjermen: viser en liste over avtaler og lar brukeren
// trykke på en avtale for å se detaljer.
import React from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import styles from '../styles /styles';

export default function HomeScreen({ navigation, appointments = [] }) {
  // Renders ett listeelement (avtale-kort)
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      // Navigerer til detaljskjermen og sender med valgt avtale
      onPress={() => navigation.navigate('AppointmentDetails', { appointment: item })}
    >
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDate}>{item.date}</Text>
      </View>
      <Text style={styles.cardSubtitle} numberOfLines={1}>
        Deltakere: {(item.participants || []).join(', ')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Dine avtaler</Text>
      <FlatList
        // Selve data-listen
        data={appointments}
        // Stabil nøkkel hentet fra id
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        // Sentrerer tom visning dersom listen er tom
        contentContainerStyle={appointments.length ? null : { flex: 1, justifyContent: 'center' }}
        // Vises når listen er tom
        ListEmptyComponent={<Text style={styles.emptyText}>Ingen avtaler enda</Text>}
      />
    </View>
  );
}
