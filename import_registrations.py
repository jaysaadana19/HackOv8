import asyncio
import csv
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Hackathon details
HACKATHON_ID = "c68a72b9-907c-4fa0-8358-30b022890913"
HACKATHON_SLUG = "social-winter-of-code-season-6"

async def import_registrations(csv_file_path='/app/registrations_actual.csv'):
    """Import registrations from CSV file into MongoDB"""
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Verify hackathon exists
    hackathon = await db.hackathons.find_one({"_id": HACKATHON_ID})
    if not hackathon:
        print(f"❌ ERROR: Hackathon with ID {HACKATHON_ID} not found!")
        client.close()
        return
    
    print("="*80)
    print("SOCIAL WINTER OF CODE SEASON 6 - REGISTRATION IMPORT")
    print("="*80)
    print(f"Hackathon: {hackathon.get('title')}")
    print(f"Slug: {hackathon.get('slug')}")
    print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
    print(f"CSV File: {csv_file_path}")
    print("="*80)
    print("\nProcessing registrations...\n")
    
    imported_count = 0
    skipped_count = 0
    user_not_found_count = 0
    error_count = 0
    users_not_found = []
    
    # Read and process CSV file
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        csv_reader = csv.DictReader(csvfile)
        
        for row in csv_reader:
            try:
                name = row['Name'].strip()
                email = row['Email'].strip().lower()
                registration_date_str = row['Registration Date'].strip()
                status = row['Status'].strip().lower()
                
                # Parse registration date (format: DD/MM/YYYY)
                try:
                    registration_date = datetime.strptime(registration_date_str, '%d/%m/%Y')
                except:
                    registration_date = datetime.utcnow()
                
                # Find user by email
                user = await db.users.find_one({"email": email})
                
                if not user:
                    print(f"⚠️  User not found: {name} ({email})")
                    users_not_found.append({"name": name, "email": email})
                    user_not_found_count += 1
                    continue
                
                user_id = user.get('_id')
                
                # Check if registration already exists
                existing_registration = await db.registrations.find_one({
                    "user_id": user_id,
                    "hackathon_id": HACKATHON_ID
                })
                
                if existing_registration:
                    print(f"⏭️  Already registered: {name} ({email})")
                    skipped_count += 1
                    continue
                
                # Create registration document
                registration_doc = {
                    "_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "hackathon_id": HACKATHON_ID,
                    "user_name": user.get('name'),
                    "user_email": user.get('email'),
                    "status": status if status in ["registered", "cancelled", "waitlisted"] else "registered",
                    "team_id": None,
                    "registration_date": registration_date,
                    "created_at": registration_date,
                    "updated_at": datetime.utcnow()
                }
                
                # Insert registration
                await db.registrations.insert_one(registration_doc)
                print(f"✅ Registered: {name} ({email})")
                imported_count += 1
                
            except Exception as e:
                print(f"❌ Error processing {email if 'email' in locals() else 'unknown'}: {str(e)}")
                error_count += 1
    
    # Update hackathon registration count
    total_registrations = await db.registrations.count_documents({"hackathon_id": HACKATHON_ID})
    await db.hackathons.update_one(
        {"_id": HACKATHON_ID},
        {"$set": {"registration_count": total_registrations}}
    )
    
    # Print summary
    print("\n" + "="*80)
    print("IMPORT SUMMARY")
    print("="*80)
    print(f"✅ Successfully registered:      {imported_count}")
    print(f"⏭️  Skipped (already registered): {skipped_count}")
    print(f"⚠️  Users not found in DB:       {user_not_found_count}")
    print(f"❌ Errors:                       {error_count}")
    print(f"📊 Total processed:              {imported_count + skipped_count + user_not_found_count + error_count}")
    print(f"\n🎯 Final registration count in hackathon: {total_registrations}")
    print("="*80)
    
    if users_not_found:
        print(f"\n⚠️  USERS NOT FOUND ({len(users_not_found)}):")
        print("These emails were in the CSV but not in the user database:")
        for u in users_not_found[:20]:  # Show first 20
            print(f"  - {u['name']} ({u['email']})")
        if len(users_not_found) > 20:
            print(f"  ... and {len(users_not_found) - 20} more")
        print("\nTo add these users, you can:")
        print("1. Create them in the user database with default password 'Welcome@123'")
        print("2. Or they can sign up themselves on the platform")
        print("="*80)
    
    print("\n✅ Users who registered can now see this hackathon in their dashboard!")
    print("="*80 + "\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_registrations())
