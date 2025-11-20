#!/usr/bin/env python3
"""
Script to add slugs to hackathons that don't have them
"""
import asyncio
import os
import re
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

def generate_slug(title, existing_slugs):
    """Generate SEO-friendly slug from title"""
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    
    if slug not in existing_slugs:
        return slug
    
    # If slug exists, append number
    counter = 1
    while f"{slug}-{counter}" in existing_slugs:
        counter += 1
    return f"{slug}-{counter}"

async def fix_slugs():
    """Add slugs to hackathons that don't have them"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.hackov8
    
    try:
        # Find all hackathons
        hackathons = await db.hackathons.find({}).to_list(1000)
        print(f"Found {len(hackathons)} hackathons")
        
        # Get existing slugs
        existing_slugs = [h.get("slug") for h in hackathons if h.get("slug")]
        print(f"Existing slugs: {len(existing_slugs)}")
        
        # Find hackathons without slugs
        missing_slug = [h for h in hackathons if not h.get("slug")]
        print(f"Hackathons without slugs: {len(missing_slug)}")
        
        if not missing_slug:
            print("✅ All hackathons have slugs!")
            return
        
        # Add slugs to hackathons
        updated = 0
        for hackathon in missing_slug:
            title = hackathon.get("title", "untitled")
            slug = generate_slug(title, existing_slugs)
            existing_slugs.append(slug)
            
            result = await db.hackathons.update_one(
                {"_id": hackathon["_id"]},
                {"$set": {"slug": slug}}
            )
            
            if result.modified_count > 0:
                updated += 1
                print(f"✅ Added slug '{slug}' to '{title}'")
            else:
                print(f"❌ Failed to update '{title}'")
        
        print(f"\n✅ Updated {updated} hackathons with slugs!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_slugs())
