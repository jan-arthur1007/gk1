// Skjerm for å opprette en ny avtale.
// Viser et enkelt skjema og kaller addAppointment fra App.js.
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import styles from '../styles /styles';

export default function MakeAppointemnt({ navigation, addAppointment }) {
  // Lokale felter for skjemaet
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [participants, setParticipants] = useState('');
  const [description, setDescription] = useState('');

  // Validerer og lagrer ny avtale
  const onSave = () => {
    if (!title.trim() || !date.trim()) {
      Alert.alert('Manglende felt', 'Tittel og dato må fylles ut.');
      return;
    }

    const item = {
      title: title.trim(),
      date: date.trim(),
      // Deltakere registreres som kommaseparert tekst og gjøres om til array
      participants: participants
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      description: description.trim(),
    };

    if (typeof addAppointment === 'function') {
      // Legg til avtale og gå tilbake til Home-tab
      addAppointment(item);
      navigation.navigate('Home');
    } else {
      Alert.alert('Kunne ikke lagre', 'addAppointment er ikke tilgjengelig.');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Lag ny avtale</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Tittel</Text>
        <TextInput
          placeholder="F.eks. Prosjektmøte"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Dato & tid</Text>
        <TextInput
          placeholder="YYYY-MM-DD HH:MM"
          value={date}
          onChangeText={setDate}
          style={styles.input}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Deltakere (kommaseparert)</Text>
        <TextInput
          placeholder="Anna, Jonas, ..."
          value={participants}
          onChangeText={setParticipants}
          style={styles.input}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Beskrivelse</Text>
        <TextInput
          placeholder="Kort beskrivelse"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 90 }]}
          multiline
        />
      </View>

      <Button title="Lagre avtale" onPress={onSave} />
    </View>
  );
}
