# GitHub OAuth Configuration Guide

## ✅ Completed Steps

1. **Credentials Added**
   - Client ID: `Iv23liWCyz4gr6q3M8tZ`
   - Client Secret: `f76e1e1dc1c03243eee81133bf5b096477b4cc96`
   - Added to `/app/backend/.env`

2. **Backend Implementation**
   - `/api/auth/github/login` - Initiates OAuth flow
   - `/api/auth/github/callback` - Handles GitHub callback
   - User model updated with `github_id` and `github_login` fields
   - Automatic user creation on first login

3. **Frontend Integration**
   - GitHub Sign In button added to Login and Sign Up tabs
   - Callback handling in LandingEnhanced page
   - Automatic redirect to dashboard after successful auth

4. **Services Status**
   - Backend restarted and running
   - Frontend compiled successfully
   - Both OAuth systems ready

## 🔧 Required: GitHub OAuth App Configuration

You need to configure your GitHub OAuth application:

### Step 1: Go to GitHub Settings
Visit: https://github.com/settings/developers

### Step 2: Select Your OAuth App
Find the app with Client ID: `Iv23liWCyz4gr6q3M8tZ`

### Step 3: Configure Authorization Callback URL
Set the callback URL to:
```
https://badgeflow-1.preview.emergentagent.com/api/auth/github/callback
```

### Step 4: Configure Homepage URL
Set to:
```
https://badgeflow-1.preview.emergentagent.com
```

### Step 5: Save Changes
Click "Update application"

## 🧪 Testing GitHub Sign In

After configuring GitHub OAuth App:

1. Open: https://badgeflow-1.preview.emergentagent.com
2. Click "Get Started" button
3. Click "Sign in with GitHub" button
4. Authorize the application on GitHub
5. You should be redirected back to the platform dashboard

## 📊 OAuth Flow Details

### Login Flow
1. User clicks "Sign in with GitHub"
2. Frontend calls `/api/auth/github/login`
3. Backend returns GitHub authorization URL
4. User is redirected to GitHub
5. User authorizes the application
6. GitHub redirects to `/api/auth/github/callback?code=...`
7. Backend exchanges code for access token
8. Backend fetches user profile from GitHub API
9. Backend creates/updates user in database
10. Backend creates session token
11. User is redirected to frontend with token
12. Frontend saves token and navigates to dashboard

### User Data Collected
From GitHub API:
- `id` (GitHub user ID)
- `login` (GitHub username)
- `name` (Display name)
- `email` (Primary email)
- `avatar_url` (Profile picture)
- `bio` (User bio)

### Email Handling
- Primary email is preferred
- If no public email, uses verified email from emails endpoint
- If still no email, uses `{username}@github.user` as fallback

## ⚠️ Common Issues

**Issue: "Bad verification code" error**
- Solution: Make sure the callback URL in GitHub matches exactly: `https://badgeflow-1.preview.emergentagent.com/api/auth/github/callback`

**Issue: "Redirect URI mismatch" error**
- Solution: Check that Homepage URL is set correctly in GitHub OAuth App settings

**Issue: User not redirected after auth**
- Solution: Check browser console for errors. Ensure frontend can access the `github_auth` and `token` URL parameters

**Issue: "Failed to obtain access token"**
- Solution: Verify Client ID and Secret are correct in backend .env file

## 🎯 Features

✅ **Automatic Account Creation**
- First-time users automatically get accounts created
- Default role: participant
- Profile picture synced from GitHub

✅ **Existing Account Linking**
- Users with existing accounts (by GitHub ID) get logged in
- Profile updated with latest GitHub data

✅ **Session Management**
- 7-day session tokens
- Automatic renewal on activity
- Secure token storage

## 🔐 Security

- OAuth 2.0 standard flow
- Access tokens never stored in database
- Session tokens are cryptographically secure (32 bytes)
- GitHub user ID used for account linking (immutable)

## 📝 Database Schema

New fields added to `users` collection:
```javascript
{
  github_id: 12345678,        // GitHub user ID (unique)
  github_login: "username",   // GitHub username
  picture: "https://...",     // Avatar URL
  bio: "User bio",            // From GitHub profile
  // ... other fields
}
```
