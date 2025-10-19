import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

async def verify_database():
    """Verify database import was successful"""
    print("="*80)
    print("HACKOV8 DATABASE VERIFICATION")
    print("="*80)
    print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
    print("="*80)
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Expected counts from export
    expected_counts = {
        'users': 400,
        'hackathons': 1,
        'registrations': 305,
        'companies': 4,
        'notifications': 297,
        'user_sessions': 98  # May vary
    }
    
    print("\n📊 Verifying Collection Counts:\n")
    
    all_good = True
    for collection, expected in expected_counts.items():
        actual = await db[collection].count_documents({})
        status = "✅" if actual >= expected else "❌"
        
        if collection == 'user_sessions':
            # Sessions may vary, just check it exists
            status = "✅" if actual > 0 else "⚠️"
            print(f"{status} {collection}: {actual} documents (sessions vary, expected ~{expected})")
        else:
            print(f"{status} {collection}: {actual} documents (expected: {expected})")
            if actual < expected:
                all_good = False
    
    # Verify specific data
    print("\n🔍 Verifying Specific Data:\n")
    
    # Check Social Winter Of Code hackathon
    swoc = await db.hackathons.find_one({"slug": "social-winter-of-code-season-6"})
    if swoc:
        print(f"✅ Social Winter Of Code Season 6 found")
        print(f"   Registration count: {swoc.get('registration_count', 0)}")
    else:
        print(f"❌ Social Winter Of Code Season 6 NOT FOUND")
        all_good = False
    
    # Check sample user
    sample_user = await db.users.find_one({"email": "jaysaadana@gmail.com"})
    if sample_user:
        print(f"✅ Sample user found: {sample_user.get('name')} ({sample_user.get('email')})")
    else:
        print(f"❌ Sample user NOT FOUND")
        all_good = False
    
    # Check sample registration
    sample_reg = await db.registrations.find_one({"user_email": "jaysaadana@gmail.com"})
    if sample_reg:
        print(f"✅ Sample registration found for user")
    else:
        print(f"⚠️  Sample registration not found (user may not be registered)")
    
    # Summary
    print("\n" + "="*80)
    if all_good:
        print("✅ DATABASE VERIFICATION PASSED!")
        print("All expected data is present and accessible.")
    else:
        print("⚠️  DATABASE VERIFICATION WARNINGS")
        print("Some collections have fewer documents than expected.")
        print("This may be normal if import was partial or selective.")
    print("="*80 + "\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_database())
