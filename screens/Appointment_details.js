// Detaljskjerm: viser informasjon om én valgt avtale.
import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles /styles';

export default function AppointmentDetails({ route }) {
  // Henter avtalen som ble sendt via navigate(..., { appointment })
  const { appointment } = route.params || {};

  // Hvis noe gikk galt med navigasjonen og vi mangler data
  if (!appointment) {
    return (
      <View style={styles.screenContainer}>
        <Text style={styles.emptyText}>Fant ikke avtaledetaljer.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>{appointment.title}</Text>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Dato:</Text>
        <Text style={styles.detailValue}>{appointment.date}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Deltakere:</Text>
        <Text style={styles.detailValue}>{(appointment.participants || []).join(', ') || '—'}</Text>
      </View>
      <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
        <Text style={styles.detailLabel}>Beskrivelse:</Text>
        <Text style={styles.detailValue}>{appointment.description || '—'}</Text>
      </View>
    </View>
  );
}
