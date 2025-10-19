import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

async def update_hackathon_registrations():
    """Update registration count for Social Winter Of Code Season 6"""
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("="*80)
    print("HACKOV8 REGISTRATION COUNT UPDATE")
    print("="*80)
    print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
    print("="*80)
    print("\nSearching for hackathon...\n")
    
    # Find the hackathon by title or slug
    hackathon = await db.hackathons.find_one({
        "$or": [
            {"title": {"$regex": "Social Winter Of Code", "$options": "i"}},
            {"slug": {"$regex": "social-winter-of-code", "$options": "i"}}
        ]
    })
    
    if not hackathon:
        print("❌ ERROR: Could not find 'Social Winter Of Code Season 6' hackathon")
        print("\nSearching for all hackathons...")
        all_hackathons = await db.hackathons.find({}).to_list(length=100)
        print(f"\nFound {len(all_hackathons)} hackathons in database:")
        for h in all_hackathons:
            print(f"  - {h.get('title')} (slug: {h.get('slug')})")
        client.close()
        return
    
    hackathon_id = hackathon.get('_id')
    current_count = hackathon.get('registration_count', 0)
    
    print(f"✅ Found hackathon:")
    print(f"   Title: {hackathon.get('title')}")
    print(f"   Slug: {hackathon.get('slug')}")
    print(f"   Current registration count: {current_count}")
    print(f"\n📊 Updating to: 304 registrations")
    
    # Update the registration count
    result = await db.hackathons.update_one(
        {"_id": hackathon_id},
        {
            "$set": {
                "registration_count": 304,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        print(f"✅ Successfully updated registration count to 304")
    else:
        print(f"⚠️  No changes made (may already be at 304)")
    
    # Verify the update
    updated_hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    print(f"\n✓ Verified: Registration count is now {updated_hackathon.get('registration_count')}")
    
    print("\n" + "="*80)
    print("UPDATE COMPLETE")
    print("="*80)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_hackathon_registrations())
