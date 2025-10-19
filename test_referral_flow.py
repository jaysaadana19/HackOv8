#!/usr/bin/env python3

import requests
import json
import subprocess
from datetime import datetime, timezone, timedelta

def create_test_users():
    """Create test users for referral flow testing"""
    timestamp = int(datetime.now().timestamp())
    
    # User A (referrer) - participant
    user_a_id = f"referrer-user-{timestamp}"
    user_a_session = f"referrer_session_{timestamp}"
    user_a_email = f"referrer.{timestamp}@example.com"
    user_a_referral_code = f"REF{timestamp}"
    
    # User B (referee) - participant  
    user_b_id = f"referee-user-{timestamp}"
    user_b_session = f"referee_session_{timestamp}"
    user_b_email = f"referee.{timestamp}@example.com"
    
    # Admin user for creating hackathon
    admin_id = f"admin-user-{timestamp}"
    admin_session = f"admin_session_{timestamp}"
    admin_email = f"admin.{timestamp}@example.com"
    
    mongo_script = f"""
use('test_database');

// Create referrer user (User A)
db.users.insertOne({{
  _id: '{user_a_id}',
  email: '{user_a_email}',
  name: 'Referrer User A',
  role: 'participant',
  referral_code: '{user_a_referral_code}',
  created_at: new Date(),
  last_login: null
}});

db.user_sessions.insertOne({{
  user_id: '{user_a_id}',
  session_token: '{user_a_session}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});

// Create referee user (User B)
db.users.insertOne({{
  _id: '{user_b_id}',
  email: '{user_b_email}',
  name: 'Referee User B',
  role: 'participant',
  referral_code: 'REFB{timestamp}',
  created_at: new Date(),
  last_login: null
}});

db.user_sessions.insertOne({{
  user_id: '{user_b_id}',
  session_token: '{user_b_session}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});

// Create admin user
db.users.insertOne({{
  _id: '{admin_id}',
  email: '{admin_email}',
  name: 'Admin User',
  role: 'admin',
  referral_code: 'ADMIN{timestamp}',
  created_at: new Date(),
  last_login: null
}});

db.user_sessions.insertOne({{
  user_id: '{admin_id}',
  session_token: '{admin_session}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
"""
    
    try:
        result = subprocess.run(['mongosh', '--eval', mongo_script], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print(f"✅ Created test users")
            return {
                'user_a': {'id': user_a_id, 'session': user_a_session, 'email': user_a_email, 'referral_code': user_a_referral_code},
                'user_b': {'id': user_b_id, 'session': user_b_session, 'email': user_b_email},
                'admin': {'id': admin_id, 'session': admin_session, 'email': admin_email}
            }
        else:
            print(f"❌ Failed to create test users: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"❌ Exception creating test users: {str(e)}")
        return None

def create_hackathon(admin_session):
    """Create a test hackathon"""
    base_url = "https://hackov8-manage.preview.emergentagent.com/api"
    
    hackathon_data = {
        "title": f"Referral Flow Test Hackathon {datetime.now().strftime('%H%M%S')}",
        "description": "Test hackathon for complete referral flow testing",
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
        'Authorization': f'Bearer {admin_session}'
    }
    
    try:
        response = requests.post(f"{base_url}/hackathons", json=hackathon_data, headers=headers)
        
        if response.status_code == 200:
            hackathon = response.json()
            hackathon_id = hackathon.get('id') or hackathon.get('_id')
            print(f"✅ Created hackathon: {hackathon_id}")
            return hackathon_id, hackathon.get('slug')
        else:
            print(f"❌ Failed to create hackathon: {response.status_code} - {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Exception creating hackathon: {str(e)}")
        return None, None

def test_referral_link_generation(user_a_session, hackathon_id):
    """Test User A generating referral link"""
    base_url = "https://hackov8-manage.preview.emergentagent.com/api"
    
    headers = {'Authorization': f'Bearer {user_a_session}'}
    
    try:
        response = requests.get(f"{base_url}/referrals/link/{hackathon_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            referral_link = data.get('referral_link')
            print(f"✅ User A generated referral link")
            print(f"   Link: {referral_link}")
            return referral_link, data.get('referral_code')
        else:
            print(f"❌ Failed to generate referral link: {response.status_code} - {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Exception generating referral link: {str(e)}")
        return None, None

def test_referral_registration(user_b_session, hackathon_id, referral_code):
    """Test User B registering using referral link"""
    base_url = "https://hackov8-manage.preview.emergentagent.com/api"
    
    headers = {'Authorization': f'Bearer {user_b_session}'}
    
    # Register with referral parameters (simulating clicking the referral link)
    params = {
        'hackathon_id': hackathon_id,
        'ref': referral_code,
        'utm_source': 'referral',
        'utm_campaign': hackathon_id,
        'utm_medium': 'user_share'
    }
    
    try:
        response = requests.post(f"{base_url}/registrations", params=params, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ User B registered using referral link")
            print(f"   Referred by detected: {data.get('referred_by', False)}")
            return True
        else:
            print(f"❌ Failed to register with referral: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during referral registration: {str(e)}")
        return False

def test_referral_credit(user_a_session):
    """Test that User A gets referral credit"""
    base_url = "https://hackov8-manage.preview.emergentagent.com/api"
    
    headers = {'Authorization': f'Bearer {user_a_session}'}
    
    try:
        response = requests.get(f"{base_url}/referrals/my-stats", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            total_referrals = data.get('total_referrals', 0)
            referral_details = data.get('referral_details', [])
            
            print(f"✅ User A referral stats retrieved")
            print(f"   Total referrals: {total_referrals}")
            print(f"   Referral details count: {len(referral_details)}")
            
            if total_referrals > 0:
                print(f"✅ User A received referral credit!")
                if referral_details:
                    latest = referral_details[0]
                    print(f"   Latest referral: {latest.get('user_name')} for {latest.get('hackathon_name')}")
                return True
            else:
                print(f"❌ User A did not receive referral credit")
                return False
        else:
            print(f"❌ Failed to get referral stats: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception getting referral stats: {str(e)}")
        return False

def test_referral_analytics(admin_session, hackathon_id):
    """Test referral analytics endpoint for organizers"""
    base_url = "https://hackov8-manage.preview.emergentagent.com/api"
    
    headers = {'Authorization': f'Bearer {admin_session}'}
    
    try:
        response = requests.get(f"{base_url}/hackathons/{hackathon_id}/referral-analytics", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            total_referrals = data.get('total_referrals', 0)
            total_referrers = data.get('total_referrers', 0)
            top_referrers = data.get('top_referrers', [])
            recent_referrals = data.get('recent_referrals', [])
            
            print(f"✅ Referral analytics retrieved")
            print(f"   Total referrals: {total_referrals}")
            print(f"   Total referrers: {total_referrers}")
            print(f"   Top referrers count: {len(top_referrers)}")
            print(f"   Recent referrals count: {len(recent_referrals)}")
            
            if total_referrals > 0:
                print(f"✅ Analytics show referral activity!")
                if top_referrers:
                    top = top_referrers[0]
                    print(f"   Top referrer: {top.get('name')} ({top.get('count')} referrals)")
                return True
            else:
                print(f"⚠️  No referral activity in analytics")
                return False
        else:
            print(f"❌ Failed to get referral analytics: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception getting referral analytics: {str(e)}")
        return False

def cleanup_hackathon(admin_session, hackathon_id):
    """Clean up test hackathon"""
    if hackathon_id:
        base_url = "https://hackov8-manage.preview.emergentagent.com/api"
        headers = {'Authorization': f'Bearer {admin_session}'}
        
        try:
            response = requests.delete(f"{base_url}/hackathons/{hackathon_id}", headers=headers)
            if response.status_code == 200:
                print(f"✅ Cleaned up test hackathon")
            else:
                print(f"⚠️  Could not delete test hackathon: {response.status_code}")
        except:
            print(f"⚠️  Could not delete test hackathon")

def main():
    print("🔗 Testing Complete Referral Flow")
    print("=" * 50)
    
    # Step 1: Create test users
    print("\n1️⃣ Creating test users...")
    users = create_test_users()
    if not users:
        print("❌ Failed to create test users. Exiting.")
        return
    
    # Step 2: Create hackathon
    print("\n2️⃣ Creating test hackathon...")
    hackathon_id, slug = create_hackathon(users['admin']['session'])
    if not hackathon_id:
        print("❌ Failed to create hackathon. Exiting.")
        return
    
    # Step 3: User A generates referral link
    print("\n3️⃣ User A generates referral link...")
    referral_link, referral_code = test_referral_link_generation(
        users['user_a']['session'], hackathon_id
    )
    if not referral_link:
        print("❌ Failed to generate referral link. Exiting.")
        cleanup_hackathon(users['admin']['session'], hackathon_id)
        return
    
    # Step 4: User B registers using referral link
    print("\n4️⃣ User B registers using referral link...")
    registration_success = test_referral_registration(
        users['user_b']['session'], hackathon_id, referral_code
    )
    if not registration_success:
        print("❌ Failed referral registration.")
        cleanup_hackathon(users['admin']['session'], hackathon_id)
        return
    
    # Step 5: Verify User A gets referral credit
    print("\n5️⃣ Verifying User A gets referral credit...")
    credit_success = test_referral_credit(users['user_a']['session'])
    
    # Step 6: Test referral analytics
    print("\n6️⃣ Testing referral analytics...")
    analytics_success = test_referral_analytics(users['admin']['session'], hackathon_id)
    
    # Step 7: Cleanup
    print("\n7️⃣ Cleaning up...")
    cleanup_hackathon(users['admin']['session'], hackathon_id)
    
    # Summary
    print(f"\n{'='*50}")
    print(f"🎯 REFERRAL FLOW TEST RESULTS")
    print(f"{'='*50}")
    
    results = [
        ("Referral Link Generation", referral_link is not None),
        ("Referral Registration", registration_success),
        ("Referral Credit", credit_success),
        ("Referral Analytics", analytics_success)
    ]
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print(f"🎉 ALL REFERRAL FLOW TESTS PASSED!")
    else:
        print(f"⚠️  Some referral flow tests failed.")

if __name__ == "__main__":
    main()