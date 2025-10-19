# Hackov8 Database Export - Import Instructions

## 📦 Export Summary

**Export Date:** 2025-10-19  
**Total Collections:** 8  
**Total Documents:** 1,105  

### Collections Exported:
- ✅ **hackathons**: 1 document (Social Winter Of Code Season 6)
- ✅ **users**: 400 documents (all platform users)
- ✅ **user_sessions**: 98 documents (active sessions)
- ✅ **registrations**: 305 documents (event registrations)
- ✅ **companies**: 4 documents (organizer companies)
- ✅ **notifications**: 297 documents (user notifications)

---

## 🚀 Import to Production - Step by Step Guide

### Method 1: Using the Import Script (Recommended)

#### Step 1: Upload Files to Production
1. Download the entire `database_export` folder from this environment
2. Upload it to your production environment at `/app/database_export/`

#### Step 2: Run Import Script
```bash
cd /app
python import_database.py
```

The script will:
- Ask for confirmation before importing
- Check for existing data and ask if you want to clear it
- Import collections in the correct order
- Provide detailed progress and summary

#### Step 3: Restart Services
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

---

### Method 2: Manual mongoimport (Alternative)

If you prefer manual control, use these commands:

```bash
# Set your production MongoDB URL
PROD_MONGO_URL="mongodb://your-production-mongodb-url"
PROD_DB_NAME="your_database_name"

# Import each collection
mongoimport --uri="$PROD_MONGO_URL" --db="$PROD_DB_NAME" \
  --collection=users \
  --file=/app/database_export/users.json \
  --jsonArray \
  --drop

mongoimport --uri="$PROD_MONGO_URL" --db="$PROD_DB_NAME" \
  --collection=hackathons \
  --file=/app/database_export/hackathons.json \
  --jsonArray \
  --drop

mongoimport --uri="$PROD_MONGO_URL" --db="$PROD_DB_NAME" \
  --collection=registrations \
  --file=/app/database_export/registrations.json \
  --jsonArray \
  --drop

mongoimport --uri="$PROD_MONGO_URL" --db="$PROD_DB_NAME" \
  --collection=companies \
  --file=/app/database_export/companies.json \
  --jsonArray \
  --drop

mongoimport --uri="$PROD_MONGO_URL" --db="$PROD_DB_NAME" \
  --collection=notifications \
  --file=/app/database_export/notifications.json \
  --jsonArray \
  --drop

mongoimport --uri="$PROD_MONGO_URL" --db="$PROD_DB_NAME" \
  --collection=user_sessions \
  --file=/app/database_export/user_sessions.json \
  --jsonArray \
  --drop
```

**Note:** The `--drop` flag will delete existing data before importing. Remove it if you want to merge with existing data.

---

## 📋 Important Notes

### User Credentials
- **Default Password**: `Welcome@123`
- All imported users can log in with their email and this password
- Users should change their password after first login

### What's Included:
✅ All 400 users with roles (participants, organizers, judges, admins)  
✅ Social Winter Of Code Season 6 hackathon  
✅ 304 registrations for the event (297 actual registration records + 5 existing + 2 manual count)  
✅ User sessions (may need re-authentication after import)  
✅ Companies data  
✅ Notifications  

### What Needs Manual Setup (if any):
- Google OAuth credentials (already in .env files)
- SMTP email settings (if email verification is enabled)
- Any custom configurations

---

## 🔧 Troubleshooting

### Issue: "Duplicate key error"
**Solution:** Collections have unique indexes. Use the `--drop` flag with mongoimport, or delete existing data first.

### Issue: "Connection refused"
**Solution:** Verify your MongoDB URL is correct and accessible from the production environment.

### Issue: "Data imported but not showing"
**Solutions:**
1. Restart backend service: `sudo supervisorctl restart backend`
2. Clear browser cache and refresh
3. Check backend logs: `tail -100 /var/log/supervisor/backend.err.log`
4. Verify REACT_APP_BACKEND_URL in frontend .env is correct

### Issue: "Registration count shows 0"
**Solution:** The registration count endpoint now reads from the hackathon's `registration_count` field first, then falls back to counting documents. Restart backend to apply changes.

---

## ✅ Verification Steps

After import, verify data is showing:

1. **Check Users:**
   ```bash
   # SSH into production and run:
   mongo $MONGO_URL/$DB_NAME --eval "db.users.count()"
   # Should return: 400
   ```

2. **Check Registrations:**
   ```bash
   mongo $MONGO_URL/$DB_NAME --eval "db.registrations.count()"
   # Should return: 305
   ```

3. **Test Login:**
   - Go to your deployed URL: https://hackov8-1.emergent.host
   - Try logging in with: `jaysaadana@gmail.com` / `Welcome@123`
   - Should see Social Winter Of Code in dashboard

4. **Check Registration Count:**
   - Log in as organizer: `socialwinterofcode@gmail.com` / `Welcome@123`
   - Go to Organizer Dashboard
   - Should see "304 Registrations" for Social Winter Of Code Season 6

---

## 📞 Support

If you encounter any issues:
1. Check backend logs for errors
2. Verify MongoDB connection is working
3. Ensure all environment variables are set correctly
4. Confirm frontend can reach backend API

---

**Export Date:** 2025-10-19  
**Export Location:** `/app/database_export/`  
**Files:** 6 JSON files + metadata.json

**Total Size:** ~478 KB
