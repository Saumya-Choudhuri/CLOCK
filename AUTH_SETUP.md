# Auth & User Profile Setup Guide

This guide will help you set up authentication and user profiles for your Zoned app.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and enter a name (e.g., "Zoned-App")
3. Select your country and create the project
4. Wait for project creation to complete

## Step 2: Enable Authentication Methods

1. In Firebase Console, go to **Build → Authentication**
2. Click **Get Started**
3. Enable these sign-in methods:
   - **Google** (automatically available, just enable it)
   - **Phone Number**: Click "Phone" → Enable it
4. Add your domain to authorized domains (you'll see a warning)

## Step 3: Get Firebase Config

1. Go to **Project Settings** (gear icon, top left)
2. Open the **General** tab
3. Scroll down to "Your apps"
4. Click the web icon `</>` if no app exists, or select your web app
5. Copy the Firebase config object
6. Paste into `.env.local`:

```bash
# Copy-paste this from Firebase Console
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456...
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456...
```

## Step 4: Enable Firestore (Optional - for server-side storage)

1. Go to **Build → Firestore Database**
2. Click **Create Database**
3. Select **Start in test mode** (for development)
4. Choose your region (closest to you)
5. Create database

**Test Mode Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 5: Install Dependencies

```bash
cd my-clock
npm install
```

## Step 6: Test Locally

```bash
npm run dev
```

Open http://localhost:3000 and wait 15 minutes. The login modal should appear automatically.

## Testing the Flow

1. **First 15 minutes**: App works normally
2. **After 15 minutes of idle** (no mouse/keyboard/touch):
   - Login modal appears
   - User signs in with Google
   - User adds phone number
   - User receives OTP via SMS
   - User enters OTP → Profile created

## User Data Structure

User profiles are stored with:
- `uid`: Unique Firebase ID
- `email`: From Google login
- `phone`: From OTP verification
- `signupDate`: Timestamp when user first signed up
- `isPremium`: Boolean (false for first 21 days)
- `lastActivityDate`: Last app interaction
- `taskHistory`: Array of tasks (stored locally initially)

## Free Trial Logic

- **Days 0-21**: Full access (free trial)
- **Day 22+**: Upgrade prompt
- Check remaining days: `21 - (today - signupDate)`

## Next Steps

1. **Move to Firestore**: Update `AuthContext.tsx` to store userData in Firestore instead of localStorage
2. **Add Stripe**: Implement premium subscription (credit card payment)
3. **Task History**: Store and sync tasks from all panels
4. **Analytics**: Track user behavior within the free trial

## Currency Notes for GitHub Student Plan

- **Firebase**: 50 concurrent connections free
- **Stripe**: Use test mode before going live
- **GitHub Credits**: Can be applied to Firebase premium features if needed

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Firebase config is not defined" | Check `.env.local` has all 6 keys and they're not empty |
| "reCAPTCHA not initialized" | Add `<script src="https://www.gstatic.com/recaptcha/releases/latest/recaptcha.js"></script>` to `app/layout.tsx` head |
| "OTP never arrives" | Firebase SMS has daily quota; add real phone in Firebase console |
| Browser console errors | Check Firebase console → Authentication → Settings for domain whitelisting |

## File Structure Created

```
app/
├── context/
│   └── AuthContext.tsx          # Auth state & hooks
├── components/
│   ├── LoginSignupModal.tsx     # Login/signup UI
│   └── AuthGuard.tsx            # Idle timer + modal trigger
├── hooks/
│   └── useIdleTimer.ts          # Updated for 15 min (already existed)
├── utils/
│   └── firebase.ts              # Firebase initialization
└── layout.tsx                   # Updated with providers
```

## Security Notes

- Keys starting with `NEXT_PUBLIC_` are exposed to browser (Firebase rules handle security)
- Never commit `.env.local` to Git (already in `.gitignore`)
- Test rules on Firestore before deploying
- Enable reCAPTCHA v3 for production
