# Deployment URLs Updated

## ✅ URLs Corrected

All URLs have been updated to use the correct deployment domain:

### Frontend
- **Deployment URL**: `https://hackov8-1.emergent.host`
- **Backend API**: `https://hackov8-1.emergent.host/api`
- Updated in: `/app/frontend/.env`

### Backend
- **Frontend URL**: `https://hackov8-1.emergent.host`
- Updated in: `/app/backend/.env`

### Services Status
- ✅ Backend restarted and running
- ✅ Frontend restarted and running
- ✅ GitHub OAuth endpoint working (verified internally)
- ✅ Callback URL updated to: `https://hackov8-1.emergent.host/api/auth/github/callback`

## 🔧 Required Configuration

### GitHub OAuth App Settings
Go to: https://github.com/settings/developers

Find your app: Client ID `Iv23liWCyz4gr6q3M8tZ`

**Update these settings:**
- **Homepage URL**: `https://hackov8-1.emergent.host`
- **Authorization callback URL**: `https://hackov8-1.emergent.host/api/auth/github/callback`

Click "Update application"

### Google Cloud Console Settings
Go to: https://console.cloud.google.com/apis/credentials

Find OAuth client: `254236410039-vemtq5so6cq13s1a7mhscvron7kdgp5r`

**Add to "Authorized JavaScript origins":**
```
https://hackov8-1.emergent.host
```

**Add to "Authorized redirect URIs":**
```
https://hackov8-1.emergent.host
https://hackov8-1.emergent.host/dashboard
```

Click "Save"

## 🧪 Testing

Once you've updated both OAuth app configurations:

1. **Visit**: https://hackov8-1.emergent.host
2. **Click**: "Get Started"
3. **Try**: "Sign in with Google" or "Sign in with GitHub"
4. **Expected**: Successful authentication and redirect to dashboard

## 📝 OAuth URLs Generated

**GitHub OAuth URL:**
```
https://github.com/login/oauth/authorize?client_id=Iv23liWCyz4gr6q3M8tZ&redirect_uri=https://hackov8-1.emergent.host/api/auth/github/callback&scope=user:email
```

**Callback Endpoints:**
- GitHub: `https://hackov8-1.emergent.host/api/auth/github/callback`
- Google: `https://hackov8-1.emergent.host/api/auth/google/callback`

## ✅ All Systems Ready

Once you configure both OAuth apps with the correct URLs, both Google and GitHub sign-in will work perfectly!
