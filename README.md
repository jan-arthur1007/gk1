# Kalender App (Godkendelsesopgave)

Dette er en enkel start på en kalender‑applikasjon i React Native (Expo) hvor du kan se en liste over avtaler, opprette nye, og se detaljer.

- 3 views/screens: Home, MakeAppointment, AppointmentDetails
- Bottom‑navigator mellom Home og MakeAppointment
- Listevisning på Home med navigasjon til detaljer
- Styling i egen fil `styles /styles.js`

## Kom i gang

- Installer avhengigheter: `npm install`
- Start appen: `npm run start`

## Demo‑video

Lenke til demo‑video: https://example.com  
(Erstatt med egen lenke når video er lastet opp.)

## Struktur

- `App.js` – NavigationContainer, Stack + Tabs og delt state for avtaler
- `screens/HomeScreen.js` – Viser liste over avtaler
- `screens/MakeAppointemnt.js` – Skjema for å lage ny avtale
- `screens/Appointment_details.js` – Viser detaljer om valgt avtale
- `styles /styles.js` – Felles styling

## Notater

- Skjemaet i MakeAppointment lagrer avtalen i minne (state) og navigerer til Home.
- Du kan senere koble til persistent lagring eller backend.

