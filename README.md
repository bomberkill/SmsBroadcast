# App Documentation

## Overview
Complete contacts and groups management app with SMS messaging integration.

## Features
- **Contacts**: Load from JSON, search, add/edit/delete, Google Sheets sync
- **Groups**: Create groups, manage members, group details
- **Group Chat**: Send messages via SMS to all group members
- **Offline-First**: AsyncStorage persistence
- **Beautiful UI**: Modern design with animations

## Google Sheets Sync
1. Create Google Sheet with columns: id, fullName, phoneNumber, profession, city, email, createdAt
2. Publish to web or use Apps Script for JSON
3. Paste URL in Contacts screen sync field
4. Tap sync button - new contacts merge automatically

## SMS Integration
- Uses \`expo-sms\` - works in Expo Go
- Opens native SMS app with recipients and message
- User confirms sending manually (platform requirement)
- For auto-send: requires custom native module + development build

### Auto-Send SMS (Advanced)
Not available in Expo Go. Requires:
- Custom Android native module (Kotlin/Java)
- SEND_SMS permission
- iOS: Not possible due to Apple restrictions
- Development build with EAS

## Data Storage
- Initial: \`assets/data/contacts.json\`
- Runtime: AsyncStorage
- Sync: Google Sheets API

## Tech Stack
- Expo SDK 54 + React Native
- TypeScript (strict mode)
- Expo Router (file-based navigation)
- React Query + Context API
- AsyncStorage for persistence
- expo-sms for messaging

## Project Structure
- \`app/(tabs)/\`: Main tabs (Contacts, Groups)
- \`app/*.tsx\`: Modal screens (add/edit)
- \`contexts/\`: State management
- \`types/\`: TypeScript definitions
- \`constants/\`: Theme & colors

## Running
\`\`\`bash
npm install
npm start
\`\`\`
Scan QR with Expo Go app

## Notes
- SMS works on real devices (not simulators)
- Google Sheets URL must be publicly accessible
- All data persists locally
- No backend required.
