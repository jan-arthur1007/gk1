# Kalender App (Godkendelsesopgave)

Dette er en enkel start på en kalender‑applikasjon i React Native (Expo) hvor du kan se en liste over avtaler, opprette nye, og se detaljer.

- 3 views/screens: Home, MakeAppointment, AppointmentDetails
- Bottom‑navigator mellom Home og MakeAppointment
- Listevisning på Home med navigasjon til detaljer
- Styling i egen fil `styles /styles.js`


## Demo‑video

Lenke til demo‑video: https://www.loom.com/share/80fddaffce304b1c92b9392136c69b1c?sid=f4edb31d-f466-4144-8051-a5c65d55bed2

## Struktur

- `App.js` – NavigationContainer, Stack + Tabs og delt state for avtaler
- `screens/HomeScreen.js` – Viser liste over avtaler
- `screens/MakeAppointemnt.js` – Skjema for å lage ny avtale
- `screens/Appointment_details.js` – Viser detaljer om valgt avtale
- `styles /styles.js` – Felles styling

## Notater

- Skjemaet i MakeAppointment lagrer avtalen i minne (state) og navigerer til Home.





