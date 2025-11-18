# Google OAuth Configuration Guide

## ✅ Completed Steps

1. **Credentials Updated**
   - Client ID: `254236410039-vemtq5so6cq13s1a7mhscvron7kdgp5r.apps.googleusercontent.com`
   - Client Secret: `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`
   - Updated in both `/app/backend/.env` and `/app/frontend/.env`

2. **Google Identity Services Integrated**
   - Added Google Sign In button to Login and Sign Up tabs
   - Using proper JWT-based authentication (not OAuth2 Token Client)
   - Backend endpoint already exists at `/api/auth/google/callback`

3. **Services Restarted**
   - Backend and Frontend restarted with new credentials
   - Both running successfully

## 🔧 Required: Google Cloud Console Configuration

You need to configure your Google OAuth application in Google Cloud Console:

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/apis/credentials

### Step 2: Select Your OAuth 2.0 Client ID
Find the client: `254236410039-vemtq5so6cq13s1a7mhscvron7kdgp5r.apps.googleusercontent.com`

### Step 3: Configure Authorized JavaScript Origins
Add these URLs:
- `https://badgeflow-1.preview.emergentagent.com`
- `http://localhost:3000` (for local testing)

### Step 4: Configure Authorized Redirect URIs
Add these URLs:
- `https://badgeflow-1.preview.emergentagent.com`
- `https://badgeflow-1.preview.emergentagent.com/dashboard`
- `http://localhost:3000` (for local testing)

### Step 5: Save Changes
Click "Save" at the bottom of the page.

## 🧪 Testing Google Sign In

After configuring Google Cloud Console:

1. Open: https://badgeflow-1.preview.emergentagent.com
2. Click "Get Started" button
3. Click "Sign in with Google" button
4. Complete Google authentication
5. You should be redirected to the dashboard

## ⚠️ Common Issues

**Issue: "redirect_uri_mismatch" error**
- Solution: Make sure you added `https://badgeflow-1.preview.emergentagent.com` to Authorized JavaScript origins in Google Cloud Console

**Issue: "idpiframe_initialization_failed" error**
- Solution: Make sure your domain is added to Authorized JavaScript origins (not just redirect URIs)

**Issue: Google button doesn't appear**
- Solution: Check browser console for errors. The button loads asynchronously from Google.

## 📝 What Happens During Sign In

1. User clicks "Sign in with Google"
2. Google Identity Services popup appears
3. User authenticates with Google
4. Google returns a JWT credential
5. Frontend sends JWT to `/api/auth/google/callback`
6. Backend verifies JWT and creates/updates user
7. Backend returns session token
8. User is redirected to dashboard

## 🎯 Next Steps

Once Google Sign In is working, you can optionally:
- Add GitHub OAuth (requires GitHub App setup)
- Customize the user profile with additional fields
- Add role-based access control
