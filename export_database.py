import asyncio
import json
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

def convert_to_json_serializable(obj):
    """Convert MongoDB objects to JSON serializable format"""
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: convert_to_json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_to_json_serializable(item) for item in obj]
    return obj

async def export_collection(db, collection_name, output_dir='/app/database_export'):
    """Export a MongoDB collection to JSON file"""
    print(f"\n📦 Exporting {collection_name}...")
    
    collection = db[collection_name]
    documents = await collection.find({}).to_list(length=None)
    
    if not documents:
        print(f"   ⚠️  Collection '{collection_name}' is empty - skipping")
        return 0
    
    # Convert to JSON serializable
    json_documents = [convert_to_json_serializable(doc) for doc in documents]
    
    # Write to file
    output_file = os.path.join(output_dir, f"{collection_name}.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(json_documents, f, indent=2, ensure_ascii=False)
    
    file_size = os.path.getsize(output_file) / 1024  # KB
    print(f"   ✅ Exported {len(documents)} documents ({file_size:.2f} KB)")
    print(f"   📄 File: {output_file}")
    
    return len(documents)

async def export_database():
    """Export entire MongoDB database"""
    # Create output directory
    output_dir = '/app/database_export'
    os.makedirs(output_dir, exist_ok=True)
    
    print("="*80)
    print("HACKOV8 DATABASE EXPORT")
    print("="*80)
    print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
    print(f"Export Directory: {output_dir}")
    print(f"Time: {datetime.now().isoformat()}")
    print("="*80)
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get all collection names
    collections = await db.list_collection_names()
    print(f"\n📚 Found {len(collections)} collections: {', '.join(collections)}")
    
    # Export each collection
    total_documents = 0
    export_summary = {}
    
    for collection_name in collections:
        count = await export_collection(db, collection_name, output_dir)
        export_summary[collection_name] = count
        total_documents += count
    
    # Create metadata file
    metadata = {
        "export_date": datetime.now().isoformat(),
        "database_name": DB_NAME,
        "mongo_url": MONGO_URL,
        "total_collections": len(collections),
        "total_documents": total_documents,
        "collections": export_summary,
        "instructions": {
            "import_command": "mongoimport --uri='YOUR_DEPLOYED_MONGO_URL' --db=YOUR_DB_NAME --collection=COLLECTION_NAME --file=COLLECTION_NAME.json --jsonArray",
            "note": "Replace YOUR_DEPLOYED_MONGO_URL and YOUR_DB_NAME with your production values"
        }
    }
    
    metadata_file = os.path.join(output_dir, 'export_metadata.json')
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("\n" + "="*80)
    print("EXPORT SUMMARY")
    print("="*80)
    print(f"Total Collections: {len(collections)}")
    print(f"Total Documents: {total_documents}")
    print("\nCollection Details:")
    for collection, count in export_summary.items():
        if count > 0:
            print(f"  ✅ {collection}: {count} documents")
    print("\n" + "="*80)
    print("EXPORT COMPLETE!")
    print("="*80)
    print(f"\n📁 All files saved to: {output_dir}/")
    print(f"📋 Metadata file: {metadata_file}")
    print("\n🚀 Next Steps:")
    print("1. Download the database_export folder")
    print("2. Use the import script to load data into production")
    print("3. Or manually import using mongoimport commands")
    print("="*80 + "\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(export_database())
