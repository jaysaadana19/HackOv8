#!/usr/bin/env python3

import requests
import json
import subprocess
from datetime import datetime, timezone, timedelta

def create_test_user():
    """Create a test user and return session token"""
    timestamp = int(datetime.now().timestamp())
    user_id = f"test-user-{timestamp}"
    session_token = f"test_session_{timestamp}"
    email = f"test.{timestamp}@example.com"
    
    mongo_script = f"""
use('test_database');

// Create test user
db.users.insertOne({{
  _id: '{user_id}',
  email: '{email}',
  name: 'Test User',
  role: 'participant',
  referral_code: 'TEST123CODE',
  created_at: new Date(),
  last_login: null
}});

db.user_sessions.insertOne({{
  user_id: '{user_id}',
  session_token: '{session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
"""
    
    try:
        result = subprocess.run(['mongosh', '--eval', mongo_script], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print(f"✅ Created test user: {email}")
            return session_token, user_id
        else:
            print(f"❌ Failed to create test user: {result.stderr}")
            return None, None
            
    except Exception as e:
        print(f"❌ Exception creating test user: {str(e)}")
        return None, None

def create_test_hackathon(session_token):
    """Create a test hackathon and return its ID"""
    base_url = "https://hackov8-manage.preview.emergentagent.com/api"
    
    hackathon_data = {
        "title": f"Test Referral Hackathon {datetime.now().strftime('%H%M%S')}",
        "description": "Test hackathon for referral link testing",
        "category": "Technology",
        "location": "online",
        "registration_start": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "registration_end": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "event_start": (datetime.now(timezone.utc) + timedelta(days=8)).isoformat(),
        "event_end": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
        "submission_deadline": (datetime.now(timezone.utc) + timedelta(days=9)).isoformat(),
        "max_team_size": 4,
        "min_team_size": 1
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {session_token}'
    }
    
    try:
        response = requests.post(f"{base_url}/hackathons", json=hackathon_data, headers=headers)
        
        if response.status_code == 200:
            hackathon = response.json()
            hackathon_id = hackathon.get('id') or hackathon.get('_id')
            print(f"✅ Created test hackathon: {hackathon_id}")
            return hackathon_id, hackathon.get('slug')
        else:
            print(f"❌ Failed to create hackathon: {response.status_code} - {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Exception creating hackathon: {str(e)}")
        return None, None

def test_referral_link_generation(session_token, hackathon_id):
    """Test the referral link generation endpoint"""
    base_url = "https://hackov8-manage.preview.emergentagent.com/api"
    
    headers = {
        'Authorization': f'Bearer {session_token}'
    }
    
    try:
        response = requests.get(f"{base_url}/referrals/link/{hackathon_id}", headers=headers)
        
        print(f"\n🔗 Testing GET /api/referrals/link/{hackathon_id}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Referral link generation successful!")
            print(f"Response data:")
            print(json.dumps(data, indent=2))
            
            # Validate the response structure
            required_fields = ['referral_link', 'referral_code', 'hackathon_title', 'utm_params']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ Missing fields: {missing_fields}")
            else:
                print(f"✅ All required fields present")
                
            # Check the referral link format
            referral_link = data.get('referral_link')
            if referral_link:
                print(f"\n📋 Referral Link Analysis:")
                print(f"Full Link: {referral_link}")
                
                # Check if it contains expected components
                expected_components = [
                    'https://hackov8-manage.preview.emergentagent.com',
                    'utm_source=referral',
                    'utm_campaign=',
                    'utm_medium=user_share',
                    'ref='
                ]
                
                for component in expected_components:
                    if component in referral_link:
                        print(f"✅ Contains: {component}")
                    else:
                        print(f"❌ Missing: {component}")
                        
                # Check UTM parameters
                utm_params = data.get('utm_params', {})
                print(f"\n📊 UTM Parameters:")
                for key, value in utm_params.items():
                    print(f"  {key}: {value}")
                    
            return True
        else:
            print(f"❌ Request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception testing referral link: {str(e)}")
        return False

def cleanup_test_data(hackathon_id, session_token):
    """Clean up test data"""
    if hackathon_id:
        base_url = "https://hackov8-manage.preview.emergentagent.com/api"
        headers = {'Authorization': f'Bearer {session_token}'}
        
        try:
            response = requests.delete(f"{base_url}/hackathons/{hackathon_id}", headers=headers)
            if response.status_code == 200:
                print(f"✅ Cleaned up test hackathon")
            else:
                print(f"⚠️  Could not delete test hackathon: {response.status_code}")
        except:
            print(f"⚠️  Could not delete test hackathon")

def main():
    print("🔗 Testing Referral Link Generation Endpoint")
    print("=" * 50)
    
    # Step 1: Create test user
    session_token, user_id = create_test_user()
    if not session_token:
        print("❌ Failed to create test user. Exiting.")
        return
    
    # Step 2: Create test hackathon
    hackathon_id, slug = create_test_hackathon(session_token)
    if not hackathon_id:
        print("❌ Failed to create test hackathon. Exiting.")
        return
    
    # Step 3: Test referral link generation
    success = test_referral_link_generation(session_token, hackathon_id)
    
    # Step 4: Cleanup
    cleanup_test_data(hackathon_id, session_token)
    
    if success:
        print(f"\n🎉 Referral link generation test PASSED!")
    else:
        print(f"\n❌ Referral link generation test FAILED!")

if __name__ == "__main__":
    main()