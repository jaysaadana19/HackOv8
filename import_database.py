import asyncio
import json
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection - will use deployed environment variables
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

async def import_collection(db, collection_name, data_dir='/app/database_export'):
    """Import a MongoDB collection from JSON file"""
    json_file = os.path.join(data_dir, f"{collection_name}.json")
    
    if not os.path.exists(json_file):
        print(f"   ⚠️  File not found: {json_file} - skipping")
        return 0
    
    print(f"\n📥 Importing {collection_name}...")
    
    # Read JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        documents = json.load(f)
    
    if not documents:
        print(f"   ⚠️  No documents in file - skipping")
        return 0
    
    collection = db[collection_name]
    
    # Check if collection already has data
    existing_count = await collection.count_documents({})
    if existing_count > 0:
        print(f"   ⚠️  Collection already has {existing_count} documents")
        response = input(f"   ❓ Clear existing data before import? (yes/no): ").lower()
        if response == 'yes':
            await collection.delete_many({})
            print(f"   🗑️  Cleared {existing_count} existing documents")
        else:
            print(f"   ⏭️  Skipping import for {collection_name}")
            return 0
    
    # Insert documents
    try:
        result = await collection.insert_many(documents, ordered=False)
        inserted_count = len(result.inserted_ids)
        print(f"   ✅ Imported {inserted_count} documents")
        return inserted_count
    except Exception as e:
        # Handle duplicate key errors
        print(f"   ⚠️  Some documents may have failed due to duplicates: {str(e)[:100]}")
        # Count successfully inserted
        final_count = await collection.count_documents({})
        print(f"   ℹ️  Final document count: {final_count}")
        return final_count

async def import_database(data_dir='/app/database_export'):
    """Import entire MongoDB database from exported files"""
    print("="*80)
    print("HACKOV8 DATABASE IMPORT")
    print("="*80)
    print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
    print(f"Import Directory: {data_dir}")
    print(f"Time: {datetime.utcnow().isoformat()}")
    print("="*80)
    
    # Check if data directory exists
    if not os.path.exists(data_dir):
        print(f"\n❌ ERROR: Directory not found: {data_dir}")
        print("Please ensure the database_export folder is in the correct location.")
        return
    
    # Read metadata
    metadata_file = os.path.join(data_dir, 'export_metadata.json')
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        print(f"\n📋 Export Metadata:")
        print(f"   Export Date: {metadata.get('export_date')}")
        print(f"   Total Collections: {metadata.get('total_collections')}")
        print(f"   Total Documents: {metadata.get('total_documents')}")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get list of JSON files in directory
    json_files = [f for f in os.listdir(data_dir) if f.endswith('.json') and f != 'export_metadata.json']
    collections_to_import = [f.replace('.json', '') for f in json_files]
    
    print(f"\n📚 Found {len(collections_to_import)} collections to import:")
    for col in collections_to_import:
        print(f"   - {col}")
    
    print("\n" + "="*80)
    response = input("❓ Proceed with import? (yes/no): ").lower()
    if response != 'yes':
        print("❌ Import cancelled")
        client.close()
        return
    
    # Import each collection
    total_imported = 0
    import_summary = {}
    
    # Define import order (important collections first)
    priority_collections = ['users', 'hackathons', 'companies', 'registrations', 'teams', 'submissions', 'notifications', 'sessions']
    ordered_collections = [c for c in priority_collections if c in collections_to_import]
    ordered_collections += [c for c in collections_to_import if c not in priority_collections]
    
    for collection_name in ordered_collections:
        count = await import_collection(db, collection_name, data_dir)
        import_summary[collection_name] = count
        total_imported += count
    
    # Print summary
    print("\n" + "="*80)
    print("IMPORT SUMMARY")
    print("="*80)
    print(f"Total Collections Processed: {len(collections_to_import)}")
    print(f"Total Documents Imported: {total_imported}")
    print("\nCollection Details:")
    for collection, count in import_summary.items():
        if count > 0:
            print(f"  ✅ {collection}: {count} documents")
        else:
            print(f"  ⏭️  {collection}: skipped or 0 documents")
    print("\n" + "="*80)
    print("IMPORT COMPLETE!")
    print("="*80)
    print("\n✅ Database import finished successfully!")
    print("🔄 Please restart your backend service to ensure all data is loaded.")
    print("="*80 + "\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_database())
