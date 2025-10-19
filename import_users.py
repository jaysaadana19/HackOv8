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

async def import_users_from_csv(csv_file_path='/app/users_import.csv'):
    """Import users from CSV file into MongoDB"""
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    imported_count = 0
    skipped_count = 0
    updated_count = 0
    error_count = 0
    
    print("="*80)
    print("HACKOV8 USER IMPORT SCRIPT")
    print("="*80)
    print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
    print(f"CSV File: {csv_file_path}")
    print(f"Default Password: Welcome@123")
    print("="*80)
    print("\nStarting import...\n")
    
    # Read and process CSV file
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        csv_reader = csv.DictReader(csvfile)
        
        for row in csv_reader:
            try:
                user_id = row['ID'].strip()
                name = row['Name'].strip()
                email = row['Email'].strip().lower()
                role = row['Role'].strip().lower()
                created_at_str = row['Created At'].strip()
                
                # Parse created_at
                try:
                    created_at = datetime.strptime(created_at_str, '%Y-%m-%d %H:%M:%S.%f')
                except:
                    try:
                        created_at = datetime.strptime(created_at_str, '%Y-%m-%d %H:%M:%S')
                    except:
                        created_at = datetime.utcnow()
                
                # Check if user already exists by email
                existing_user = await db.users.find_one({"email": email})
                
                if existing_user:
                    # Update role if different
                    if existing_user.get('role') != role:
                        await db.users.update_one(
                            {"email": email},
                            {"$set": {"role": role, "updated_at": datetime.utcnow()}}
                        )
                        print(f"🔄 Updated: {email} (role: {existing_user.get('role')} → {role})")
                        updated_count += 1
                    else:
                        print(f"⏭️  Skipped: {email} (already exists)")
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
                await db.users.insert_one(user_doc)
                print(f"✅ Imported: {name} ({email}) - {role}")
                imported_count += 1
                
            except Exception as e:
                print(f"❌ Error: {email if 'email' in locals() else 'Unknown'} - {str(e)}")
                error_count += 1
    
    # Print summary
    print("\n" + "="*80)
    print("IMPORT SUMMARY")
    print("="*80)
    print(f"✅ Newly imported:         {imported_count}")
    print(f"🔄 Updated (role changed): {updated_count}")
    print(f"⏭️  Skipped (exists):       {skipped_count}")
    print(f"❌ Errors:                 {error_count}")
    print(f"📊 Total processed:        {imported_count + updated_count + skipped_count + error_count}")
    print("="*80)
    
    # Role breakdown
    print("\nROLE BREAKDOWN:")
    role_counts = {}
    async for user in db.users.find({}):
        role = user.get('role', 'unknown')
        role_counts[role] = role_counts.get(role, 0) + 1
    
    for role, count in sorted(role_counts.items()):
        print(f"  {role.capitalize()}: {count}")
    
    print("\n" + "="*80)
    print("⚠️  IMPORTANT: Default password for all new users is 'Welcome@123'")
    print("   Users should change their password after first login.")
    print("="*80 + "\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_users_from_csv())
