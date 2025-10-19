import asyncio
import csv
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import secrets
import string

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

def generate_referral_code(length=10):
    """Generate a unique referral code"""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def import_users_from_csv():
    """Import users from CSV file into MongoDB"""
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # CSV data (extracted from the file)
    csv_data = """ID,Name,Email,Role,Created At
745429c0-789e-4069-8657-0ff86f9b7401,Test,test@gmail.com,participant,2025-10-04 09:02:57.082000
aee74875-e6be-406f-94a1-638a1095c93e,Test,testing1@gmail.com,organizer,2025-10-04 09:04:37.524000
admin-user-1759571765,Test Admin User,admin.1759571765@example.com,admin,2025-10-04 09:56:05.908000
f394f0ea-a429-4bbf-a61e-bf7ea400cf23,Login Test User,login.test.1759571766@example.com,participant,2025-10-04 09:56:07.225000"""
    
    # Parse CSV data
    csv_reader = csv.DictReader(csv_data.strip().split('\n'))
    
    imported_count = 0
    skipped_count = 0
    updated_count = 0
    
    print("Starting user import...")
    print(f"Connected to MongoDB: {MONGO_URL}/{DB_NAME}")
    
    for row in csv_reader:
        user_id = row['ID'].strip()
        name = row['Name'].strip()
        email = row['Email'].strip().lower()
        role = row['Role'].strip().lower()
        created_at_str = row['Created At'].strip()
        
        # Parse created_at
        try:
            created_at = datetime.strptime(created_at_str, '%Y-%m-%d %H:%M:%S.%f')
        except:
            created_at = datetime.utcnow()
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        
        if existing_user:
            # Update role if different
            if existing_user.get('role') != role:
                await db.users.update_one(
                    {"email": email},
                    {"$set": {"role": role, "updated_at": datetime.utcnow()}}
                )
                print(f"✅ Updated role for: {email} ({existing_user.get('role')} → {role})")
                updated_count += 1
            else:
                print(f"⏭️  Skipped (exists): {email}")
                skipped_count += 1
            continue
        
        # Create new user document
        user_doc = {
            "_id": user_id,
            "name": name,
            "email": email,
            "password_hash": hash_password("Welcome@123"),  # Default password
            "role": role,
            "profile_image": None,
            "bio": None,
            "linkedin_url": None,
            "github_url": None,
            "twitter_url": None,
            "website_url": None,
            "company_id": None,
            "is_email_verified": False,
            "referral_code": generate_referral_code(),
            "referred_by": None,
            "created_at": created_at,
            "updated_at": datetime.utcnow(),
            "last_login": None
        }
        
        # Insert user
        try:
            await db.users.insert_one(user_doc)
            print(f"✅ Imported: {name} ({email}) - Role: {role}")
            imported_count += 1
        except Exception as e:
            print(f"❌ Error importing {email}: {str(e)}")
            skipped_count += 1
    
    print("\n" + "="*60)
    print(f"Import Summary:")
    print(f"  ✅ Newly imported: {imported_count}")
    print(f"  🔄 Updated roles: {updated_count}")
    print(f"  ⏭️  Skipped (already exist): {skipped_count}")
    print(f"  📊 Total processed: {imported_count + updated_count + skipped_count}")
    print("="*60)
    print("\n⚠️  Default Password for all new users: Welcome@123")
    print("   Users should change their password after first login.\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_users_from_csv())
