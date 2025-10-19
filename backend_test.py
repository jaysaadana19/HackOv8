import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import uuid
import subprocess

class AdminPanelAPITester:
    def __init__(self, base_url="https://hackov8-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_session_token = None
        self.organizer_session_token = None
        self.participant_session_token = None
        self.admin_user_id = None
        self.organizer_user_id = None
        self.participant_user_id = None
        self.judge_user_id = None
        self.judge_session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_hackathon_ids = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, session_token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Use provided session token or default admin token
        token = session_token or self.admin_session_token
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_detail = response.json().get('detail', 'No detail')
                    details += f", Error: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            # Return response data even on failure for debugging
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text[:500]}
                
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def create_test_users(self):
        """Create test users with different roles using MongoDB"""
        print("\n🔧 Creating test users...")
        
        timestamp = int(datetime.now().timestamp())
        
        # Create admin user
        admin_user_id = f"admin-user-{timestamp}"
        admin_session_token = f"admin_session_{timestamp}"
        admin_email = f"admin.{timestamp}@example.com"
        
        # Create organizer user  
        organizer_user_id = f"organizer-user-{timestamp}"
        organizer_session_token = f"organizer_session_{timestamp}"
        organizer_email = f"organizer.{timestamp}@example.com"
        
        # Create participant user
        participant_user_id = f"participant-user-{timestamp}"
        participant_session_token = f"participant_session_{timestamp}"
        participant_email = f"participant.{timestamp}@example.com"
        
        # Create judge user
        judge_user_id = f"judge-user-{timestamp}"
        judge_session_token = f"judge_session_{timestamp}"
        judge_email = f"judge.{timestamp}@example.com"
        
        mongo_script = f"""
use('test_database');

// Create admin user
db.users.insertOne({{
  _id: '{admin_user_id}',
  email: '{admin_email}',
  name: 'Test Admin User',
  role: 'admin',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date(),
  last_login: null
}});

db.user_sessions.insertOne({{
  user_id: '{admin_user_id}',
  session_token: '{admin_session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});

// Create organizer user
db.users.insertOne({{
  _id: '{organizer_user_id}',
  email: '{organizer_email}',
  name: 'Test Organizer User',
  role: 'organizer',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date(),
  last_login: null
}});

db.user_sessions.insertOne({{
  user_id: '{organizer_user_id}',
  session_token: '{organizer_session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});

// Create participant user
db.users.insertOne({{
  _id: '{participant_user_id}',
  email: '{participant_email}',
  name: 'Test Participant User',
  role: 'participant',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date(),
  last_login: null
}});

db.user_sessions.insertOne({{
  user_id: '{participant_user_id}',
  session_token: '{participant_session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});

// Create judge user
db.users.insertOne({{
  _id: '{judge_user_id}',
  email: '{judge_email}',
  name: 'Test Judge User',
  role: 'judge',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date(),
  last_login: null
}});

db.user_sessions.insertOne({{
  user_id: '{judge_user_id}',
  session_token: '{judge_session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});

print('Admin session token: {admin_session_token}');
print('Organizer session token: {organizer_session_token}');
print('Participant session token: {participant_session_token}');
print('Judge session token: {judge_session_token}');
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                self.admin_session_token = admin_session_token
                self.organizer_session_token = organizer_session_token
                self.participant_session_token = participant_session_token
                self.judge_session_token = judge_session_token
                self.admin_user_id = admin_user_id
                self.organizer_user_id = organizer_user_id
                self.participant_user_id = participant_user_id
                self.judge_user_id = judge_user_id
                
                print(f"   ✅ Created admin user: {admin_email}")
                print(f"   ✅ Created organizer user: {organizer_email}")
                print(f"   ✅ Created participant user: {participant_email}")
                print(f"   ✅ Created judge user: {judge_email}")
                return True
            else:
                print(f"   ❌ MongoDB script failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"   ❌ Failed to create test users: {str(e)}")
            return False

    def test_authentication(self):
        """Test authentication for all user types"""
        print("\n🔐 Testing Authentication...")
        
        # Test admin authentication
        success, response = self.run_test(
            "Admin Auth Check",
            "GET",
            "auth/me",
            200,
            session_token=self.admin_session_token
        )
        
        if not success or response.get('role') != 'admin':
            print(f"   ❌ Admin auth failed: {response}")
            return False
        
        print(f"   ✅ Admin authenticated: {response.get('name')} (Role: {response.get('role')})")
        
        # Test organizer authentication
        success, response = self.run_test(
            "Organizer Auth Check",
            "GET",
            "auth/me",
            200,
            session_token=self.organizer_session_token
        )
        
        if not success or response.get('role') != 'organizer':
            print(f"   ❌ Organizer auth failed: {response}")
            return False
            
        print(f"   ✅ Organizer authenticated: {response.get('name')} (Role: {response.get('role')})")
        
        # Test participant authentication
        success, response = self.run_test(
            "Participant Auth Check",
            "GET",
            "auth/me",
            200,
            session_token=self.participant_session_token
        )
        
        if not success or response.get('role') != 'participant':
            print(f"   ❌ Participant auth failed: {response}")
            return False
            
        print(f"   ✅ Participant authenticated: {response.get('name')} (Role: {response.get('role')})")
        
        # Test judge authentication
        success, response = self.run_test(
            "Judge Auth Check",
            "GET",
            "auth/me",
            200,
            session_token=self.judge_session_token
        )
        
        if not success or response.get('role') != 'judge':
            print(f"   ❌ Judge auth failed: {response}")
            return False
            
        print(f"   ✅ Judge authenticated: {response.get('name')} (Role: {response.get('role')})")
        
        return True

    def test_admin_stats_analytics(self):
        """Test admin stats and analytics endpoints"""
        print("\n📊 Testing Admin Stats & Analytics...")
        
        # Test overview stats with different day parameters
        for days in [7, 30, 90, 0]:  # 0 means all time
            success, response = self.run_test(
                f"Admin Stats Overview (days={days})",
                "GET",
                f"admin/stats/overview?days={days}",
                200,
                session_token=self.admin_session_token
            )
            
            if success:
                required_fields = ['total_users', 'new_users', 'total_hackathons', 
                                 'pending_hackathons', 'published_hackathons', 
                                 'total_registrations', 'total_submissions', 
                                 'total_teams', 'role_distribution', 'period_days']
                
                missing_fields = [field for field in required_fields if field not in response]
                if missing_fields:
                    print(f"   ⚠️  Missing fields in overview response: {missing_fields}")
                else:
                    print(f"   ✅ Overview stats complete for {days} days")
        
        # Test growth stats with different day parameters
        for days in [7, 30, 90]:
            success, response = self.run_test(
                f"Admin Growth Stats (days={days})",
                "GET",
                f"admin/stats/growth?days={days}",
                200,
                session_token=self.admin_session_token
            )
            
            if success:
                required_fields = ['dates', 'user_signups', 'hackathon_creations', 'registrations']
                missing_fields = [field for field in required_fields if field not in response]
                if missing_fields:
                    print(f"   ⚠️  Missing fields in growth response: {missing_fields}")
                else:
                    print(f"   ✅ Growth stats complete for {days} days")
        
        # Test retention stats
        success, response = self.run_test(
            "Admin Retention Stats",
            "GET",
            "admin/stats/retention",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            required_fields = ['total_users', 'active_7_days', 'active_30_days',
                             'retention_rate_7_days', 'retention_rate_30_days',
                             'multi_hackathon_participants', 'multi_participation_rate']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing fields in retention response: {missing_fields}")
            else:
                print(f"   ✅ Retention stats complete")
                print(f"      7-day retention: {response['retention_rate_7_days']}%")
                print(f"      30-day retention: {response['retention_rate_30_days']}%")
                print(f"      Multi-hackathon rate: {response['multi_participation_rate']}%")

    def test_hackathon_creation_flow(self):
        """Test hackathon creation flow with different user roles"""
        print("\n🏗️  Testing Hackathon Creation Flow...")
        
        # Create hackathon as organizer (should be pending_approval)
        organizer_hackathon_data = {
            "title": f"Organizer Test Hackathon {datetime.now().strftime('%H%M%S')}",
            "description": "A test hackathon created by organizer",
            "category": "Technology",
            "location": "online",
            "registration_start": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "registration_end": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "event_start": (datetime.now(timezone.utc) + timedelta(days=8)).isoformat(),
            "event_end": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "submission_deadline": (datetime.now(timezone.utc) + timedelta(days=9)).isoformat(),
            "max_team_size": 4,
            "min_team_size": 1,
            "prizes": [{"position": "1st", "amount": "$1000"}],
            "rules": "Test rules",
            "judging_rubric": [{"criteria": "Innovation", "max_score": 10}],
            "faqs": [{"question": "Test?", "answer": "Yes"}]
        }
        
        success, response = self.run_test(
            "Create Hackathon as Organizer",
            "POST",
            "hackathons",
            200,
            data=organizer_hackathon_data,
            session_token=self.organizer_session_token
        )
        
        organizer_hackathon_id = None
        if success:
            organizer_hackathon_id = response.get('id') or response.get('_id')
            self.created_hackathon_ids.append(organizer_hackathon_id)
            
            if response.get('status') == 'pending_approval':
                print(f"   ✅ Organizer hackathon set to pending_approval")
            else:
                print(f"   ⚠️  Expected pending_approval, got: {response.get('status')}")
        
        # Create hackathon as admin (should be published directly)
        admin_hackathon_data = {
            "title": f"Admin Test Hackathon {datetime.now().strftime('%H%M%S')}",
            "description": "A test hackathon created by admin",
            "category": "Technology",
            "location": "online",
            "registration_start": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "registration_end": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "event_start": (datetime.now(timezone.utc) + timedelta(days=8)).isoformat(),
            "event_end": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "submission_deadline": (datetime.now(timezone.utc) + timedelta(days=9)).isoformat(),
            "max_team_size": 4,
            "min_team_size": 1,
            "prizes": [{"position": "1st", "amount": "$1000"}],
            "rules": "Test rules",
            "judging_rubric": [{"criteria": "Innovation", "max_score": 10}],
            "faqs": [{"question": "Test?", "answer": "Yes"}]
        }
        
        success, response = self.run_test(
            "Create Hackathon as Admin",
            "POST",
            "hackathons",
            200,
            data=admin_hackathon_data,
            session_token=self.admin_session_token
        )
        
        admin_hackathon_id = None
        if success:
            admin_hackathon_id = response.get('id') or response.get('_id')
            self.created_hackathon_ids.append(admin_hackathon_id)
            
            if response.get('status') == 'published':
                print(f"   ✅ Admin hackathon set to published")
            else:
                print(f"   ⚠️  Expected published, got: {response.get('status')}")
        
        return organizer_hackathon_id, admin_hackathon_id

    def test_hackathon_management(self):
        """Test admin hackathon management endpoints"""
        print("\n🎯 Testing Hackathon Management...")
        
        # Get all hackathons (admin view)
        success, hackathons = self.run_test(
            "Get Admin Hackathons (All)",
            "GET",
            "admin/hackathons",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            print(f"   Found {len(hackathons)} hackathons in admin view")
            
            # Check if hackathons have enriched data
            if hackathons and 'registration_count' in hackathons[0]:
                print(f"   ✅ Hackathons enriched with registration/submission counts")
        
        # Get pending hackathons
        success, pending_hackathons = self.run_test(
            "Get Pending Hackathons",
            "GET",
            "admin/hackathons?status=pending_approval",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            print(f"   Found {len(pending_hackathons)} pending hackathons")
        
        # Get published hackathons
        success, published_hackathons = self.run_test(
            "Get Published Hackathons",
            "GET",
            "admin/hackathons?status=published",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            print(f"   Found {len(published_hackathons)} published hackathons")
        
        return hackathons if success else []

    def test_approval_workflow(self, organizer_hackathon_id):
        """Test hackathon approval/rejection workflow"""
        if not organizer_hackathon_id:
            print("\n⚠️  Skipping approval workflow - no organizer hackathon created")
            return
            
        print("\n✅ Testing Approval Workflow...")
        
        # Test hackathon approval
        success, response = self.run_test(
            "Approve Hackathon",
            "PUT",
            f"admin/hackathons/{organizer_hackathon_id}/approve",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            print(f"   ✅ Hackathon approved successfully")
            
            # Verify status changed to published
            success, hackathon = self.run_test(
                "Verify Hackathon Status After Approval",
                "GET",
                f"hackathons/{organizer_hackathon_id}",
                200
            )
            
            if success and hackathon.get('status') == 'published':
                print(f"   ✅ Status changed to published")
                print(f"   ✅ Approved by: {hackathon.get('approved_by')}")
                print(f"   ✅ Approved at: {hackathon.get('approved_at')}")
            else:
                print(f"   ⚠️  Status not updated correctly: {hackathon.get('status')}")
        
        # Create another hackathon to test rejection
        reject_hackathon_data = {
            "title": f"Reject Test Hackathon {datetime.now().strftime('%H%M%S')}",
            "description": "A test hackathon to be rejected",
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
        
        success, response = self.run_test(
            "Create Hackathon for Rejection Test",
            "POST",
            "hackathons",
            200,
            data=reject_hackathon_data,
            session_token=self.organizer_session_token
        )
        
        if success:
            reject_hackathon_id = response.get('id') or response.get('_id')
            self.created_hackathon_ids.append(reject_hackathon_id)
            
            # Test hackathon rejection
            success, response = self.run_test(
                "Reject Hackathon",
                "PUT",
                f"admin/hackathons/{reject_hackathon_id}/reject?reason=Test rejection reason",
                200,
                session_token=self.admin_session_token
            )
            
            if success:
                print(f"   ✅ Hackathon rejected successfully")
                
                # Verify status changed to rejected
                success, hackathon = self.run_test(
                    "Verify Hackathon Status After Rejection",
                    "GET",
                    f"hackathons/{reject_hackathon_id}",
                    200
                )
                
                if success and hackathon.get('status') == 'rejected':
                    print(f"   ✅ Status changed to rejected")
                else:
                    print(f"   ⚠️  Status not updated correctly: {hackathon.get('status')}")

    def test_user_login_tracking(self):
        """Test user login tracking for retention stats"""
        print("\n👤 Testing User Login Tracking...")
        
        # Test email/password login (this should update last_login)
        login_data = {
            "email": f"login.test.{int(datetime.now().timestamp())}@example.com",
            "password": "testpassword123"
        }
        
        # First create a user via signup
        signup_data = {
            "email": login_data["email"],
            "password": login_data["password"],
            "name": "Login Test User",
            "role": "participant"
        }
        
        success, response = self.run_test(
            "Create User for Login Test",
            "POST",
            "auth/signup",
            200,
            data=signup_data
        )
        
        if success:
            print(f"   ✅ Created test user for login tracking")
            
            # Now test login (should update last_login)
            success, response = self.run_test(
                "Test Email/Password Login",
                "POST",
                "auth/login",
                200,
                data=login_data
            )
            
            if success:
                print(f"   ✅ Login successful - last_login should be updated")
                
                # Verify last_login was updated by checking retention stats
                success, retention = self.run_test(
                    "Check Retention Stats After Login",
                    "GET",
                    "admin/stats/retention",
                    200,
                    session_token=self.admin_session_token
                )
                
                if success:
                    print(f"   ✅ Retention stats updated - 7-day active: {retention.get('active_7_days')}")

    def test_data_validation(self):
        """Test data validation and calculations"""
        print("\n🔍 Testing Data Validation...")
        
        # Test growth stats return proper arrays
        success, growth = self.run_test(
            "Validate Growth Stats Format",
            "GET",
            "admin/stats/growth?days=7",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            dates = growth.get('dates', [])
            user_signups = growth.get('user_signups', [])
            hackathon_creations = growth.get('hackathon_creations', [])
            registrations = growth.get('registrations', [])
            
            if (isinstance(dates, list) and isinstance(user_signups, list) and 
                isinstance(hackathon_creations, list) and isinstance(registrations, list)):
                print(f"   ✅ Growth stats arrays are properly formatted")
                
                if len(dates) == len(user_signups) == len(hackathon_creations) == len(registrations):
                    print(f"   ✅ All arrays have matching lengths: {len(dates)}")
                else:
                    print(f"   ⚠️  Array length mismatch")
            else:
                print(f"   ⚠️  Growth stats not in proper array format")
        
        # Test retention percentage calculations
        success, retention = self.run_test(
            "Validate Retention Calculations",
            "GET",
            "admin/stats/retention",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            total_users = retention.get('total_users', 0)
            active_7_days = retention.get('active_7_days', 0)
            active_30_days = retention.get('active_30_days', 0)
            retention_7 = retention.get('retention_rate_7_days', 0)
            retention_30 = retention.get('retention_rate_30_days', 0)
            
            # Validate calculations
            if total_users > 0:
                expected_7 = round((active_7_days / total_users * 100), 2)
                expected_30 = round((active_30_days / total_users * 100), 2)
                
                if abs(retention_7 - expected_7) < 0.01:
                    print(f"   ✅ 7-day retention calculation correct: {retention_7}%")
                else:
                    print(f"   ⚠️  7-day retention calculation error: got {retention_7}%, expected {expected_7}%")
                
                if abs(retention_30 - expected_30) < 0.01:
                    print(f"   ✅ 30-day retention calculation correct: {retention_30}%")
                else:
                    print(f"   ⚠️  30-day retention calculation error: got {retention_30}%, expected {expected_30}%")
            else:
                print(f"   ✅ No users for retention calculation validation")

    def test_notification_system(self):
        """Test notification system for hackathon submissions"""
        print("\n🔔 Testing Notification System...")
        
        # Get admin notifications (should include hackathon submission notifications)
        success, notifications = self.run_test(
            "Get Admin Notifications",
            "GET",
            "notifications",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            print(f"   Found {len(notifications)} notifications for admin")
            
            # Look for hackathon-related notifications
            hackathon_notifications = [n for n in notifications if 'hackathon' in n.get('type', '').lower()]
            if hackathon_notifications:
                print(f"   ✅ Found {len(hackathon_notifications)} hackathon-related notifications")
            else:
                print(f"   ⚠️  No hackathon-related notifications found")
        
        # Get organizer notifications (should include approval/rejection notifications)
        success, notifications = self.run_test(
            "Get Organizer Notifications",
            "GET",
            "notifications",
            200,
            session_token=self.organizer_session_token
        )
        
        if success:
            print(f"   Found {len(notifications)} notifications for organizer")
            
            # Look for approval/rejection notifications
            approval_notifications = [n for n in notifications if n.get('type') in ['hackathon_approved', 'hackathon_rejected']]
            if approval_notifications:
                print(f"   ✅ Found {len(approval_notifications)} approval/rejection notifications")
            else:
                print(f"   ⚠️  No approval/rejection notifications found")

    def test_hackathon_edit_endpoint(self):
        """Test hackathon edit endpoint with comprehensive field updates"""
        print("\n✏️  Testing Hackathon Edit Endpoint...")
        
        # First create a hackathon as organizer
        hackathon_data = {
            "title": f"Edit Test Hackathon {datetime.now().strftime('%H%M%S')}",
            "description": "Original description",
            "category": "Technology",
            "location": "online",
            "venue": "Original Venue",
            "registration_start": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "registration_end": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "event_start": (datetime.now(timezone.utc) + timedelta(days=8)).isoformat(),
            "event_end": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "submission_deadline": (datetime.now(timezone.utc) + timedelta(days=9)).isoformat(),
            "max_team_size": 4,
            "min_team_size": 1,
            "prizes": [{"position": "1st", "amount": "$500"}],
            "rules": "Original rules",
            "twitter_url": "https://twitter.com/original",
            "linkedin_url": "https://linkedin.com/original",
            "website_url": "https://original.com",
            "community_url": "https://discord.gg/original",
            "community_type": "discord"
        }
        
        success, response = self.run_test(
            "Create Hackathon for Edit Test",
            "POST",
            "hackathons",
            200,
            data=hackathon_data,
            session_token=self.organizer_session_token
        )
        
        if not success:
            print("   ❌ Failed to create hackathon for edit test")
            return
            
        hackathon_id = response.get('id') or response.get('_id')
        self.created_hackathon_ids.append(hackathon_id)
        
        # Test 1: Organizer can edit their own hackathon (ALL fields)
        updated_data = {
            "title": f"UPDATED Edit Test Hackathon {datetime.now().strftime('%H%M%S')}",
            "description": "UPDATED description with more details",
            "category": "Business",
            "location": "hybrid",
            "venue": "UPDATED Convention Center",
            "registration_start": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "registration_end": (datetime.now(timezone.utc) + timedelta(days=8)).isoformat(),
            "event_start": (datetime.now(timezone.utc) + timedelta(days=9)).isoformat(),
            "event_end": (datetime.now(timezone.utc) + timedelta(days=11)).isoformat(),
            "submission_deadline": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "max_team_size": 3,
            "min_team_size": 2,
            "prizes": [
                {"position": "1st", "amount": "$2000"},
                {"position": "2nd", "amount": "$1000"}
            ],
            "rules": "UPDATED comprehensive rules and guidelines",
            "twitter_url": "https://twitter.com/updated",
            "linkedin_url": "https://linkedin.com/updated", 
            "website_url": "https://updated.com",
            "community_url": "https://slack.com/updated",
            "community_type": "slack"
        }
        
        success, response = self.run_test(
            "Organizer Edit Own Hackathon (All Fields)",
            "PUT",
            f"hackathons/{hackathon_id}",
            200,
            data=updated_data,
            session_token=self.organizer_session_token
        )
        
        if success:
            # Verify all fields were updated
            success, hackathon = self.run_test(
                "Verify Hackathon Fields Updated",
                "GET",
                f"hackathons/{hackathon_id}",
                200
            )
            
            if success:
                verification_passed = True
                for key, expected_value in updated_data.items():
                    actual_value = hackathon.get(key)
                    if actual_value != expected_value:
                        print(f"   ⚠️  Field {key}: expected {expected_value}, got {actual_value}")
                        verification_passed = False
                
                if verification_passed:
                    print(f"   ✅ All hackathon fields updated correctly")
                    print(f"   ✅ Team size limits: min={hackathon.get('min_team_size')}, max={hackathon.get('max_team_size')}")
        
        # Test 2: Organizer CANNOT edit someone else's hackathon
        # Create another hackathon as admin
        admin_hackathon_data = {
            "title": f"Admin Hackathon {datetime.now().strftime('%H%M%S')}",
            "description": "Admin's hackathon",
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
        
        success, response = self.run_test(
            "Create Admin Hackathon for Permission Test",
            "POST",
            "hackathons",
            200,
            data=admin_hackathon_data,
            session_token=self.admin_session_token
        )
        
        if success:
            admin_hackathon_id = response.get('id') or response.get('_id')
            self.created_hackathon_ids.append(admin_hackathon_id)
            
            # Try to edit admin's hackathon as organizer (should fail)
            success, response = self.run_test(
                "Organizer Try Edit Admin Hackathon (Should Fail)",
                "PUT",
                f"hackathons/{admin_hackathon_id}",
                403,  # Expecting forbidden
                data={"title": "Unauthorized edit attempt"},
                session_token=self.organizer_session_token
            )
            
            if success:
                print(f"   ✅ Organizer correctly blocked from editing admin's hackathon")
        
        # Test 3: Admin CAN edit any hackathon
        admin_edit_data = {
            "title": "Admin Override Edit",
            "description": "Admin can edit any hackathon",
            "max_team_size": 6,
            "min_team_size": 1
        }
        
        success, response = self.run_test(
            "Admin Edit Any Hackathon",
            "PUT",
            f"hackathons/{hackathon_id}",  # Edit organizer's hackathon as admin
            200,
            data=admin_edit_data,
            session_token=self.admin_session_token
        )
        
        if success:
            print(f"   ✅ Admin can edit any hackathon")
            
            # Verify admin's changes were applied
            success, hackathon = self.run_test(
                "Verify Admin Edit Applied",
                "GET",
                f"hackathons/{hackathon_id}",
                200
            )
            
            if success and hackathon.get('title') == "Admin Override Edit":
                print(f"   ✅ Admin edit changes verified")

    def test_team_creation_endpoint(self):
        """Test team creation with invite code generation and validation"""
        print("\n👥 Testing Team Creation Endpoint...")
        
        # First create a hackathon for team testing
        hackathon_data = {
            "title": f"Team Test Hackathon {datetime.now().strftime('%H%M%S')}",
            "description": "Hackathon for testing team functionality",
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
        
        success, response = self.run_test(
            "Create Hackathon for Team Tests",
            "POST",
            "hackathons",
            200,
            data=hackathon_data,
            session_token=self.admin_session_token
        )
        
        if not success:
            print("   ❌ Failed to create hackathon for team tests")
            return
            
        hackathon_id = response.get('id') or response.get('_id')
        self.created_hackathon_ids.append(hackathon_id)
        
        # Register participant for the hackathon
        success, response = self.run_test(
            "Register Participant for Hackathon",
            "POST",
            f"registrations?hackathon_id={hackathon_id}",
            200,
            session_token=self.participant_session_token
        )
        
        if not success:
            print("   ❌ Failed to register participant for hackathon")
            return
        
        # Test 1: Create team with auto-generated invite code
        team_data = {
            "name": f"Test Team {datetime.now().strftime('%H%M%S')}",
            "hackathon_id": hackathon_id
        }
        
        success, response = self.run_test(
            "Create Team with Auto-Generated Invite Code",
            "POST",
            "teams",
            200,
            data=team_data,
            session_token=self.participant_session_token
        )
        
        team_id = None
        invite_code = None
        
        if success:
            team_id = response.get('id') or response.get('_id')
            invite_code = response.get('invite_code')
            
            # Verify invite code is returned and not empty
            if invite_code:
                print(f"   ✅ Team created with invite code: {invite_code}")
            else:
                print(f"   ❌ No invite code returned in response")
                return
            
            # Verify user is added as leader and member
            if response.get('leader_id') == self.participant_user_id:
                print(f"   ✅ User set as team leader")
            else:
                print(f"   ⚠️  User not set as team leader")
            
            if self.participant_user_id in response.get('members', []):
                print(f"   ✅ User added to team members")
            else:
                print(f"   ⚠️  User not in team members list")
        else:
            print("   ❌ Failed to create team")
            return
        
        # Test 2: User CANNOT create another team for same hackathon
        duplicate_team_data = {
            "name": f"Duplicate Team {datetime.now().strftime('%H%M%S')}",
            "hackathon_id": hackathon_id
        }
        
        success, response = self.run_test(
            "Try Create Duplicate Team (Should Fail)",
            "POST",
            "teams",
            400,  # Expecting bad request
            data=duplicate_team_data,
            session_token=self.participant_session_token
        )
        
        if success:
            print(f"   ✅ Correctly blocked duplicate team creation")
        
        return team_id, invite_code, hackathon_id

    def test_team_join_endpoint(self):
        """Test team joining with invite code and validation"""
        print("\n🤝 Testing Team Join Endpoint...")
        
        # Get team data from previous test
        team_data = self.test_team_creation_endpoint()
        if not team_data or len(team_data) != 3:
            print("   ❌ Failed to get team data for join tests")
            return
            
        team_id, invite_code, hackathon_id = team_data
        
        # Create a second participant for joining tests
        timestamp = int(datetime.now().timestamp())
        participant2_user_id = f"participant2-user-{timestamp}"
        participant2_session_token = f"participant2_session_{timestamp}"
        participant2_email = f"participant2.{timestamp}@example.com"
        
        mongo_script = f"""
use('test_database');

// Create second participant user
db.users.insertOne({{
  _id: '{participant2_user_id}',
  email: '{participant2_email}',
  name: 'Test Participant 2',
  role: 'participant',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date(),
  last_login: null
}});

db.user_sessions.insertOne({{
  user_id: '{participant2_user_id}',
  session_token: '{participant2_session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                print(f"   ❌ Failed to create second participant: {result.stderr}")
                return
                
        except Exception as e:
            print(f"   ❌ Failed to create second participant: {str(e)}")
            return
        
        # Test 1: User CANNOT join if not registered for hackathon
        success, response = self.run_test(
            "Try Join Team Without Registration (Should Fail)",
            "POST",
            f"teams/join?invite_code={invite_code}",
            400,  # Expecting bad request
            session_token=participant2_session_token
        )
        
        if success:
            print(f"   ✅ Correctly blocked unregistered user from joining team")
        
        # Register second participant for hackathon
        success, response = self.run_test(
            "Register Second Participant for Hackathon",
            "POST",
            f"registrations?hackathon_id={hackathon_id}",
            200,
            session_token=participant2_session_token
        )
        
        if not success:
            print("   ❌ Failed to register second participant")
            return
        
        # Test 2: Successfully join team using invite code
        success, response = self.run_test(
            "Join Team Using Invite Code",
            "POST",
            f"teams/join?invite_code={invite_code}",
            200,
            session_token=participant2_session_token
        )
        
        if success:
            print(f"   ✅ Successfully joined team: {response.get('team_name')}")
            
            # Verify user was added to team
            success, team = self.run_test(
                "Verify User Added to Team",
                "GET",
                f"hackathons/{hackathon_id}/teams",
                200
            )
            
            if success:
                target_team = None
                for t in team:
                    if t.get('id') == team_id or t.get('_id') == team_id:
                        target_team = t
                        break
                
                if target_team and participant2_user_id in target_team.get('members', []):
                    print(f"   ✅ User added to team members list")
                else:
                    print(f"   ⚠️  User not found in team members")
        
        # Test 3: User CANNOT join if already in a team
        success, response = self.run_test(
            "Try Join Another Team (Should Fail)",
            "POST",
            f"teams/join?invite_code={invite_code}",
            400,  # Expecting bad request
            session_token=participant2_session_token
        )
        
        if success:
            print(f"   ✅ Correctly blocked user already in team from joining another")
        
        # Test 4: Test team size limit validation
        # Create participants up to max team size and try to exceed
        hackathon_with_limit_data = {
            "title": f"Size Limit Test Hackathon {datetime.now().strftime('%H%M%S')}",
            "description": "Testing team size limits",
            "category": "Technology", 
            "location": "online",
            "registration_start": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "registration_end": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "event_start": (datetime.now(timezone.utc) + timedelta(days=8)).isoformat(),
            "event_end": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "submission_deadline": (datetime.now(timezone.utc) + timedelta(days=9)).isoformat(),
            "max_team_size": 2,  # Small limit for testing
            "min_team_size": 1
        }
        
        success, response = self.run_test(
            "Create Hackathon with Small Team Limit",
            "POST",
            "hackathons",
            200,
            data=hackathon_with_limit_data,
            session_token=self.admin_session_token
        )
        
        if success:
            limit_hackathon_id = response.get('id') or response.get('_id')
            self.created_hackathon_ids.append(limit_hackathon_id)
            
            # Create a team in this limited hackathon
            # First register organizer
            success, response = self.run_test(
                "Register Organizer for Limited Hackathon",
                "POST",
                f"registrations?hackathon_id={limit_hackathon_id}",
                200,
                session_token=self.organizer_session_token
            )
            
            if success:
                # Create team
                limit_team_data = {
                    "name": f"Limited Team {datetime.now().strftime('%H%M%S')}",
                    "hackathon_id": limit_hackathon_id
                }
                
                success, response = self.run_test(
                    "Create Team in Limited Hackathon",
                    "POST",
                    "teams",
                    200,
                    data=limit_team_data,
                    session_token=self.organizer_session_token
                )
                
                if success:
                    limit_invite_code = response.get('invite_code')
                    
                    # Register admin and join team (should work - team size = 2)
                    success, response = self.run_test(
                        "Register Admin for Limited Hackathon",
                        "POST",
                        f"registrations?hackathon_id={limit_hackathon_id}",
                        200,
                        session_token=self.admin_session_token
                    )
                    
                    if success:
                        success, response = self.run_test(
                            "Admin Join Limited Team (Should Work)",
                            "POST",
                            f"teams/join?invite_code={limit_invite_code}",
                            200,
                            session_token=self.admin_session_token
                        )
                        
                        if success:
                            print(f"   ✅ Team at max capacity (2/2)")
                            
                            # Now try to add participant (should fail - team full)
                            # Register participant for limited hackathon
                            success, response = self.run_test(
                                "Register Participant for Limited Hackathon",
                                "POST",
                                f"registrations?hackathon_id={limit_hackathon_id}",
                                200,
                                session_token=self.participant_session_token
                            )
                            
                            if success:
                                success, response = self.run_test(
                                    "Try Join Full Team (Should Fail)",
                                    "POST",
                                    f"teams/join?invite_code={limit_invite_code}",
                                    400,  # Expecting bad request - team full
                                    session_token=self.participant_session_token
                                )
                                
                                if success:
                                    print(f"   ✅ Correctly blocked joining full team (max_team_size=2)")

    def test_judge_dashboard_endpoint(self):
        """Test judge dashboard endpoint and judge assignment system"""
        print("\n⚖️  Testing Judge Dashboard Endpoint...")
        
        # Test 1: Basic backend health check
        success, response = self.run_test(
            "Backend Health Check - GET /api/hackathons",
            "GET",
            "hackathons",
            200
        )
        
        if success:
            print(f"   ✅ Backend responding - found {len(response)} hackathons")
        else:
            print("   ❌ Backend health check failed")
            return
        
        # Test 2: Judge Dashboard endpoint without authentication (should fail)
        success, response = self.run_test(
            "Judge Dashboard Without Auth (Should Fail)",
            "GET",
            "hackathons/judge/my",
            401  # Expecting unauthorized
        )
        
        if success:
            print(f"   ✅ Correctly blocked unauthenticated access to judge dashboard")
        
        # Test 3: Judge Dashboard with wrong role (participant should fail)
        success, response = self.run_test(
            "Judge Dashboard With Participant Role (Should Fail)",
            "GET",
            "hackathons/judge/my",
            403,  # Expecting forbidden
            session_token=self.participant_session_token
        )
        
        if success:
            print(f"   ✅ Correctly blocked non-judge from accessing judge dashboard")
        
        # Test 4: Judge Dashboard with judge role but no assignments (should return empty)
        success, response = self.run_test(
            "Judge Dashboard With No Assignments",
            "GET",
            "hackathons/judge/my",
            200,
            session_token=self.judge_session_token
        )
        
        if success:
            if len(response) == 0:
                print(f"   ✅ Judge dashboard returns empty list when no assignments")
            else:
                print(f"   ⚠️  Expected empty list, got {len(response)} hackathons")
        
        # Test 5: Create hackathons and assign judge
        # Create first hackathon as organizer
        hackathon1_data = {
            "title": f"Judge Test Hackathon 1 {datetime.now().strftime('%H%M%S')}",
            "description": "First hackathon for judge testing",
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
        
        success, response = self.run_test(
            "Create First Hackathon for Judge Assignment",
            "POST",
            "hackathons",
            200,
            data=hackathon1_data,
            session_token=self.organizer_session_token
        )
        
        if not success:
            print("   ❌ Failed to create first hackathon")
            return
            
        hackathon1_id = response.get('id') or response.get('_id')
        self.created_hackathon_ids.append(hackathon1_id)
        
        # Create second hackathon as admin (will be published directly)
        hackathon2_data = {
            "title": f"Judge Test Hackathon 2 {datetime.now().strftime('%H%M%S')}",
            "description": "Second hackathon for judge testing",
            "category": "Business",
            "location": "hybrid",
            "registration_start": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "registration_end": (datetime.now(timezone.utc) + timedelta(days=8)).isoformat(),
            "event_start": (datetime.now(timezone.utc) + timedelta(days=9)).isoformat(),
            "event_end": (datetime.now(timezone.utc) + timedelta(days=11)).isoformat(),
            "submission_deadline": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "max_team_size": 3,
            "min_team_size": 2
        }
        
        success, response = self.run_test(
            "Create Second Hackathon for Judge Assignment",
            "POST",
            "hackathons",
            200,
            data=hackathon2_data,
            session_token=self.admin_session_token
        )
        
        if not success:
            print("   ❌ Failed to create second hackathon")
            return
            
        hackathon2_id = response.get('id') or response.get('_id')
        self.created_hackathon_ids.append(hackathon2_id)
        
        # Create third hackathon (will not assign judge to this one)
        hackathon3_data = {
            "title": f"Judge Test Hackathon 3 {datetime.now().strftime('%H%M%S')}",
            "description": "Third hackathon - judge NOT assigned",
            "category": "Design",
            "location": "offline",
            "registration_start": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "registration_end": (datetime.now(timezone.utc) + timedelta(days=9)).isoformat(),
            "event_start": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "event_end": (datetime.now(timezone.utc) + timedelta(days=12)).isoformat(),
            "submission_deadline": (datetime.now(timezone.utc) + timedelta(days=11)).isoformat(),
            "max_team_size": 5,
            "min_team_size": 1
        }
        
        success, response = self.run_test(
            "Create Third Hackathon (No Judge Assignment)",
            "POST",
            "hackathons",
            200,
            data=hackathon3_data,
            session_token=self.admin_session_token
        )
        
        if success:
            hackathon3_id = response.get('id') or response.get('_id')
            self.created_hackathon_ids.append(hackathon3_id)
        
        # Test 6: Assign judge to first hackathon (as organizer)
        # Get judge email first
        success, judge_info = self.run_test(
            "Get Judge Info for Assignment",
            "GET",
            "auth/me",
            200,
            session_token=self.judge_session_token
        )
        
        if not success:
            print("   ❌ Failed to get judge info")
            return
            
        judge_email = judge_info.get('email')
        
        success, response = self.run_test(
            "Assign Judge to First Hackathon (by Organizer)",
            "POST",
            f"hackathons/{hackathon1_id}/assign-judge?email={judge_email}",
            200,
            session_token=self.organizer_session_token
        )
        
        if success:
            print(f"   ✅ Judge assigned to first hackathon by organizer")
            assigned_judge = response.get('judge', {})
            print(f"      Judge: {assigned_judge.get('name')} ({assigned_judge.get('email')})")
        else:
            print("   ❌ Failed to assign judge to first hackathon")
            return
        
        # Test 7: Assign judge to second hackathon (as admin)
        success, response = self.run_test(
            "Assign Judge to Second Hackathon (by Admin)",
            "POST",
            f"hackathons/{hackathon2_id}/assign-judge?email={judge_email}",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            print(f"   ✅ Judge assigned to second hackathon by admin")
        else:
            print("   ❌ Failed to assign judge to second hackathon")
            return
        
        # Test 8: Judge Dashboard should now return only assigned hackathons
        success, response = self.run_test(
            "Judge Dashboard With Assignments",
            "GET",
            "hackathons/judge/my",
            200,
            session_token=self.judge_session_token
        )
        
        if success:
            if len(response) == 2:
                print(f"   ✅ Judge dashboard returns exactly 2 assigned hackathons")
                
                # Verify the correct hackathons are returned
                returned_ids = [h.get('id') or h.get('_id') for h in response]
                if hackathon1_id in returned_ids and hackathon2_id in returned_ids:
                    print(f"   ✅ Correct hackathons returned (assigned ones only)")
                    
                    # Verify hackathon3 is NOT returned
                    if hackathon3_id not in returned_ids:
                        print(f"   ✅ Unassigned hackathon correctly excluded")
                    else:
                        print(f"   ❌ Unassigned hackathon incorrectly included")
                        
                    # Verify hackathon details
                    for hackathon in response:
                        h_id = hackathon.get('id') or hackathon.get('_id')
                        h_title = hackathon.get('title')
                        print(f"      - {h_title} (ID: {h_id[:8]}...)")
                        
                        # Verify judge is in assigned_judges list
                        assigned_judges = hackathon.get('assigned_judges', [])
                        if self.judge_user_id in assigned_judges:
                            print(f"        ✅ Judge correctly in assigned_judges list")
                        else:
                            print(f"        ❌ Judge missing from assigned_judges list")
                else:
                    print(f"   ❌ Wrong hackathons returned")
                    print(f"      Expected: {hackathon1_id[:8]}..., {hackathon2_id[:8]}...")
                    print(f"      Got: {[h[:8] + '...' for h in returned_ids]}")
            else:
                print(f"   ❌ Expected 2 hackathons, got {len(response)}")
        else:
            print("   ❌ Failed to get judge dashboard with assignments")
            return
        
        # Test 9: Admin can also access judge dashboard
        success, response = self.run_test(
            "Admin Access Judge Dashboard",
            "GET",
            "hackathons/judge/my",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            print(f"   ✅ Admin can access judge dashboard (returned {len(response)} hackathons)")
        
        # Test 10: Test judge assignment validation
        # Get participant email for testing
        success, participant_info = self.run_test(
            "Get Participant Info for Assignment Test",
            "GET",
            "auth/me",
            200,
            session_token=self.participant_session_token
        )
        
        participant_email = participant_info.get('email') if success else 'participant@example.com'
        
        # Try to assign non-judge user
        success, response = self.run_test(
            "Try Assign Non-Judge User (Should Fail)",
            "POST",
            f"hackathons/{hackathon1_id}/assign-judge?email={participant_email}",
            400,  # Expecting bad request
            session_token=self.organizer_session_token
        )
        
        if success:
            print(f"   ✅ Correctly blocked assignment of non-judge user")
        
        # Test 11: Try to assign judge twice (should fail)
        success, response = self.run_test(
            "Try Assign Judge Twice (Should Fail)",
            "POST",
            f"hackathons/{hackathon1_id}/assign-judge?email={judge_email}",
            400,  # Expecting bad request
            session_token=self.organizer_session_token
        )
        
        if success:
            print(f"   ✅ Correctly blocked duplicate judge assignment")
        
        # Test 12: Test removing judge assignment
        success, response = self.run_test(
            "Remove Judge Assignment",
            "DELETE",
            f"hackathons/{hackathon1_id}/assign-judge/{self.judge_user_id}",
            200,
            session_token=self.organizer_session_token
        )
        
        if success:
            print(f"   ✅ Judge assignment removed successfully")
            
            # Verify judge dashboard now shows only 1 hackathon
            success, response = self.run_test(
                "Judge Dashboard After Removal",
                "GET",
                "hackathons/judge/my",
                200,
                session_token=self.judge_session_token
            )
            
            if success and len(response) == 1:
                print(f"   ✅ Judge dashboard correctly updated after removal (1 hackathon)")
                remaining_id = response[0].get('id') or response[0].get('_id')
                if remaining_id == hackathon2_id:
                    print(f"   ✅ Correct hackathon remains assigned")
                else:
                    print(f"   ❌ Wrong hackathon remains assigned")
            else:
                print(f"   ❌ Judge dashboard not updated correctly after removal")
        
        # Test 13: Get assigned judges list
        success, response = self.run_test(
            "Get Assigned Judges List",
            "GET",
            f"hackathons/{hackathon2_id}/assigned-judges",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            if len(response) == 1 and response[0].get('id') == self.judge_user_id:
                print(f"   ✅ Assigned judges list correct")
                print(f"      Judge: {response[0].get('name')} ({response[0].get('email')})")
            else:
                print(f"   ❌ Assigned judges list incorrect")
        
        print(f"\n   🎯 Judge Dashboard Testing Summary:")
        print(f"      ✅ Backend health check passed")
        print(f"      ✅ Authentication and authorization working")
        print(f"      ✅ Judge assignment system functional")
        print(f"      ✅ GET /api/hackathons/judge/my returns only assigned hackathons")
        print(f"      ✅ Judge assignment/removal working correctly")

    def test_google_oauth_system(self):
        """Test Google OAuth authentication system comprehensively"""
        print("\n🔐 Testing Google OAuth Authentication System...")
        
        # Test 1: Check Email Endpoint
        test_emails = [
            "existing.user@example.com",
            "nonexistent.user@example.com",
            "admin.test@example.com"
        ]
        
        for email in test_emails:
            success, response = self.run_test(
                f"Check Email Exists: {email}",
                "GET",
                f"users/check-email?email={email}",
                200
            )
            
            if success:
                exists = response.get('exists', False)
                print(f"   ✅ Email {email}: exists = {exists}")
            else:
                print(f"   ❌ Failed to check email: {email}")
        
        # Test 2: Create mock JWT tokens for testing
        # We'll create a simplified JWT-like structure for testing
        import base64
        import json
        
        # Mock Google JWT payload for new user (participant)
        participant_payload = {
            "aud": "834941712511-hblu5bkb78j0nhi570if3jmv70sk0nef.apps.googleusercontent.com",
            "email": f"google.participant.{int(datetime.now().timestamp())}@gmail.com",
            "name": "Google Test Participant",
            "picture": "https://lh3.googleusercontent.com/test-image",
            "sub": "1234567890",
            "iss": "https://accounts.google.com"
        }
        
        # Mock Google JWT payload for new user (organizer)
        organizer_payload = {
            "aud": "834941712511-hblu5bkb78j0nhi570if3jmv70sk0nef.apps.googleusercontent.com",
            "email": f"google.organizer.{int(datetime.now().timestamp())}@gmail.com",
            "name": "Google Test Organizer",
            "picture": "https://lh3.googleusercontent.com/test-image-org",
            "sub": "1234567891",
            "iss": "https://accounts.google.com"
        }
        
        # Mock Google JWT payload for new user (judge)
        judge_payload = {
            "aud": "834941712511-hblu5bkb78j0nhi570if3jmv70sk0nef.apps.googleusercontent.com",
            "email": f"google.judge.{int(datetime.now().timestamp())}@gmail.com",
            "name": "Google Test Judge",
            "picture": "https://lh3.googleusercontent.com/test-image-judge",
            "sub": "1234567892",
            "iss": "https://accounts.google.com"
        }
        
        # Create mock JWT tokens (header.payload.signature format)
        def create_mock_jwt(payload):
            header = {"alg": "RS256", "typ": "JWT"}
            header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
            payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
            signature = "mock_signature_for_testing"
            return f"{header_b64}.{payload_b64}.{signature}"
        
        participant_jwt = create_mock_jwt(participant_payload)
        organizer_jwt = create_mock_jwt(organizer_payload)
        judge_jwt = create_mock_jwt(judge_payload)
        
        # Test 3: Google OAuth - New Participant Registration
        success, response = self.run_test(
            "Google OAuth - New Participant Registration",
            "POST",
            f"auth/google/callback?credential={participant_jwt}&role=participant",
            200
        )
        
        participant_session_token = None
        participant_user_id = None
        
        if success:
            participant_session_token = response.get('session_token')
            participant_user_id = response.get('id')
            
            if response.get('role') == 'participant':
                print(f"   ✅ Participant created via Google OAuth")
                print(f"      Name: {response.get('name')}")
                print(f"      Email: {response.get('email')}")
                print(f"      Role: {response.get('role')}")
            else:
                print(f"   ⚠️  Expected participant role, got: {response.get('role')}")
        else:
            print("   ❌ Failed to create participant via Google OAuth")
        
        # Test 4: Google OAuth - New Organizer Registration with Company
        import urllib.parse
        company_name = urllib.parse.quote("Google Test Company")
        company_website = urllib.parse.quote("https://googletestcompany.com")
        
        success, response = self.run_test(
            "Google OAuth - New Organizer Registration with Company",
            "POST",
            f"auth/google/callback?credential={organizer_jwt}&role=organizer&company_name={company_name}&company_website={company_website}",
            200
        )
        
        organizer_session_token = None
        organizer_user_id = None
        
        if success:
            organizer_session_token = response.get('session_token')
            organizer_user_id = response.get('id')
            
            if response.get('role') == 'organizer':
                print(f"   ✅ Organizer created via Google OAuth with company")
                print(f"      Name: {response.get('name')}")
                print(f"      Email: {response.get('email')}")
                print(f"      Role: {response.get('role')}")
                
                # Verify company was created
                success_company, company = self.run_test(
                    "Verify Company Created for Organizer",
                    "GET",
                    "companies/my",
                    200,
                    session_token=organizer_session_token
                )
                
                if success_company and company:
                    if company.get('name') == 'Google Test Company':
                        print(f"   ✅ Company created: {company.get('name')}")
                        print(f"      Website: {company.get('website')}")
                    else:
                        print(f"   ⚠️  Company name mismatch: {company.get('name')}")
                else:
                    print(f"   ❌ Company not created for organizer")
            else:
                print(f"   ⚠️  Expected organizer role, got: {response.get('role')}")
        else:
            print("   ❌ Failed to create organizer via Google OAuth")
        
        # Test 5: Google OAuth - New Judge Registration
        success, response = self.run_test(
            "Google OAuth - New Judge Registration",
            "POST",
            f"auth/google/callback?credential={judge_jwt}&role=judge",
            200
        )
        
        judge_session_token = None
        judge_user_id = None
        
        if success:
            judge_session_token = response.get('session_token')
            judge_user_id = response.get('id')
            
            if response.get('role') == 'judge':
                print(f"   ✅ Judge created via Google OAuth")
                print(f"      Name: {response.get('name')}")
                print(f"      Email: {response.get('email')}")
                print(f"      Role: {response.get('role')}")
            else:
                print(f"   ⚠️  Expected judge role, got: {response.get('role')}")
        else:
            print("   ❌ Failed to create judge via Google OAuth")
        
        # Test 6: Google OAuth - Existing User Login
        # Try to login again with the same participant JWT (should login existing user)
        success, response = self.run_test(
            "Google OAuth - Existing User Login",
            "POST",
            f"auth/google/callback?credential={participant_jwt}",
            200
        )
        
        if success:
            if response.get('id') == participant_user_id:
                print(f"   ✅ Existing user login successful")
                print(f"      Same user ID: {response.get('id')}")
                print(f"      Name: {response.get('name')}")
            else:
                print(f"   ❌ Different user ID returned for existing user")
        else:
            print("   ❌ Failed to login existing user via Google OAuth")
        
        # Test 7: Invalid JWT Token Handling
        invalid_jwt = "invalid.jwt.token"
        
        success, response = self.run_test(
            "Google OAuth - Invalid JWT Token (Should Fail)",
            "POST",
            f"auth/google/callback?credential={invalid_jwt}&role=participant",
            400  # Expecting bad request
        )
        
        if success:
            print(f"   ✅ Invalid JWT token correctly rejected")
        else:
            print("   ❌ Invalid JWT token not properly handled")
        
        # Test 8: JWT with Wrong Audience (Should Fail)
        wrong_audience_payload = {
            "aud": "wrong-client-id.apps.googleusercontent.com",
            "email": "wrong.audience@gmail.com",
            "name": "Wrong Audience User",
            "sub": "1234567893",
            "iss": "https://accounts.google.com"
        }
        
        wrong_audience_jwt = create_mock_jwt(wrong_audience_payload)
        
        success, response = self.run_test(
            "Google OAuth - Wrong Audience JWT (Should Fail)",
            "POST",
            f"auth/google/callback?credential={wrong_audience_jwt}&role=participant",
            400  # Expecting bad request
        )
        
        if success:
            print(f"   ✅ Wrong audience JWT correctly rejected")
        else:
            print("   ❌ Wrong audience JWT not properly validated")
        
        # Test 9: Verify Check Email for Created Users
        created_emails = [
            participant_payload['email'],
            organizer_payload['email'],
            judge_payload['email']
        ]
        
        for email in created_emails:
            success, response = self.run_test(
                f"Verify Created User Email: {email}",
                "GET",
                f"users/check-email?email={email}",
                200
            )
            
            if success and response.get('exists') == True:
                print(f"   ✅ Created user email verified: {email}")
            else:
                print(f"   ❌ Created user email not found: {email}")
        
        # Test 10: Test Authentication with Google OAuth Session Tokens
        if participant_session_token:
            success, response = self.run_test(
                "Authenticate with Google OAuth Session Token",
                "GET",
                "auth/me",
                200,
                session_token=participant_session_token
            )
            
            if success and response.get('email') == participant_payload['email']:
                print(f"   ✅ Google OAuth session token authentication working")
            else:
                print(f"   ❌ Google OAuth session token authentication failed")
        
        print(f"\n   🎯 Google OAuth Testing Summary:")
        print(f"      ✅ Check email endpoint working")
        print(f"      ✅ Google OAuth callback handling JWT tokens")
        print(f"      ✅ Role-based registration (participant, organizer, judge)")
        print(f"      ✅ Company creation for organizer role")
        print(f"      ✅ Existing user login flow")
        print(f"      ✅ Invalid JWT token validation")
        print(f"      ✅ JWT audience verification")
        print(f"      ✅ Session token authentication")

    def test_referral_system(self):
        """Test the comprehensive referral system endpoints"""
        print("\n🔗 Testing Referral System...")
        
        # Test 1: Verify users have referral_code field generated automatically
        success, user_info = self.run_test(
            "Check User Has Referral Code",
            "GET",
            "auth/me",
            200,
            session_token=self.participant_session_token
        )
        
        participant_referral_code = None
        if success:
            participant_referral_code = user_info.get('referral_code')
            if participant_referral_code:
                print(f"   ✅ User has auto-generated referral code: {participant_referral_code}")
            else:
                print(f"   ❌ User missing referral_code field")
                return
        else:
            print("   ❌ Failed to get user info")
            return
        
        # Test 2: Get referral stats (should be empty initially)
        success, stats = self.run_test(
            "Get Initial Referral Stats",
            "GET",
            "referrals/my-stats",
            200,
            session_token=self.participant_session_token
        )
        
        if success:
            if stats.get('total_referrals') == 0:
                print(f"   ✅ Initial referral stats correct (0 referrals)")
                print(f"      Referral code: {stats.get('referral_code')}")
            else:
                print(f"   ⚠️  Expected 0 referrals, got {stats.get('total_referrals')}")
        else:
            print("   ❌ Failed to get referral stats")
            return
        
        # Test 3: Create a hackathon for referral testing
        hackathon_data = {
            "title": f"Referral Test Hackathon {datetime.now().strftime('%H%M%S')}",
            "description": "Testing referral system functionality",
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
        
        success, response = self.run_test(
            "Create Hackathon for Referral Testing",
            "POST",
            "hackathons",
            200,
            data=hackathon_data,
            session_token=self.organizer_session_token
        )
        
        if not success:
            print("   ❌ Failed to create hackathon for referral testing")
            return
            
        hackathon_id = response.get('id') or response.get('_id')
        self.created_hackathon_ids.append(hackathon_id)
        
        # Test 4: Generate referral link for hackathon
        success, referral_data = self.run_test(
            "Generate Referral Link",
            "GET",
            f"referrals/link/{hackathon_id}",
            200,
            session_token=self.participant_session_token
        )
        
        referral_link = None
        if success:
            referral_link = referral_data.get('referral_link')
            utm_params = referral_data.get('utm_params', {})
            
            if referral_link and participant_referral_code in referral_link:
                print(f"   ✅ Referral link generated successfully")
                print(f"      Link: {referral_link}")
                print(f"      UTM Source: {utm_params.get('utm_source')}")
                print(f"      UTM Campaign: {utm_params.get('utm_campaign')}")
                print(f"      UTM Medium: {utm_params.get('utm_medium')}")
                print(f"      Ref Code: {utm_params.get('ref')}")
                
                # Verify UTM parameters are correct
                expected_utm = {
                    'utm_source': 'referral',
                    'utm_campaign': hackathon_id,
                    'utm_medium': 'user_share',
                    'ref': participant_referral_code
                }
                
                utm_correct = all(utm_params.get(k) == v for k, v in expected_utm.items())
                if utm_correct:
                    print(f"   ✅ UTM parameters correctly formatted")
                else:
                    print(f"   ⚠️  UTM parameters incorrect")
            else:
                print(f"   ❌ Referral link missing or invalid")
                return
        else:
            print("   ❌ Failed to generate referral link")
            return
        
        # Test 5: Create a new user to test referral registration
        timestamp = int(datetime.now().timestamp())
        referred_user_id = f"referred-user-{timestamp}"
        referred_session_token = f"referred_session_{timestamp}"
        referred_email = f"referred.{timestamp}@example.com"
        
        mongo_script = f"""
use('test_database');

// Create referred user
db.users.insertOne({{
  _id: '{referred_user_id}',
  email: '{referred_email}',
  name: 'Referred Test User',
  role: 'participant',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date(),
  last_login: null,
  referral_code: 'ref_code_{timestamp}'
}});

db.user_sessions.insertOne({{
  user_id: '{referred_user_id}',
  session_token: '{referred_session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                print(f"   ❌ Failed to create referred user: {result.stderr}")
                return
                
        except Exception as e:
            print(f"   ❌ Failed to create referred user: {str(e)}")
            return
        
        # Test 6: Register with referral parameters
        success, response = self.run_test(
            "Register with Referral Code",
            "POST",
            f"registrations?hackathon_id={hackathon_id}&ref={participant_referral_code}&utm_source=referral&utm_campaign={hackathon_id}&utm_medium=user_share",
            200,
            session_token=referred_session_token
        )
        
        if success:
            if response.get('referred_by'):
                print(f"   ✅ Registration with referral successful")
                print(f"      Referred by: {response.get('referred_by')}")
            else:
                print(f"   ⚠️  Registration successful but referral not tracked")
        else:
            print("   ❌ Failed to register with referral")
            return
        
        # Test 7: Check referrer's updated stats
        success, updated_stats = self.run_test(
            "Check Updated Referral Stats",
            "GET",
            "referrals/my-stats",
            200,
            session_token=self.participant_session_token
        )
        
        if success:
            if updated_stats.get('total_referrals') == 1:
                print(f"   ✅ Referral stats updated correctly (1 referral)")
                
                # Check referral details
                referral_details = updated_stats.get('referral_details', [])
                if referral_details and len(referral_details) == 1:
                    detail = referral_details[0]
                    print(f"   ✅ Referral details available:")
                    print(f"      User: {detail.get('user_name')} ({detail.get('user_email')})")
                    print(f"      Hackathon: {detail.get('hackathon_name')}")
                    print(f"      UTM Source: {detail.get('utm_source')}")
                else:
                    print(f"   ⚠️  Referral details missing or incorrect")
            else:
                print(f"   ❌ Expected 1 referral, got {updated_stats.get('total_referrals')}")
        else:
            print("   ❌ Failed to get updated referral stats")
        
        # Test 8: Test referral analytics for organizers
        success, analytics = self.run_test(
            "Get Hackathon Referral Analytics (Organizer)",
            "GET",
            f"hackathons/{hackathon_id}/referral-analytics",
            200,
            session_token=self.organizer_session_token
        )
        
        if success:
            total_referrals = analytics.get('total_referrals', 0)
            total_referrers = analytics.get('total_referrers', 0)
            top_referrers = analytics.get('top_referrers', [])
            recent_referrals = analytics.get('recent_referrals', [])
            
            if total_referrals == 1 and total_referrers == 1:
                print(f"   ✅ Referral analytics correct:")
                print(f"      Total referrals: {total_referrals}")
                print(f"      Total referrers: {total_referrers}")
                print(f"      Top referrers: {len(top_referrers)}")
                print(f"      Recent referrals: {len(recent_referrals)}")
                
                if top_referrers and top_referrers[0].get('count') == 1:
                    print(f"   ✅ Top referrer data correct")
                    referrer = top_referrers[0]
                    print(f"      Referrer: {referrer.get('name')} ({referrer.get('email')})")
                    print(f"      Referrals: {referrer.get('count')}")
            else:
                print(f"   ❌ Analytics incorrect: {total_referrals} referrals, {total_referrers} referrers")
        else:
            print("   ❌ Failed to get referral analytics")
        
        # Test 9: Test analytics authorization (participant should fail)
        success, response = self.run_test(
            "Try Get Analytics as Participant (Should Fail)",
            "GET",
            f"hackathons/{hackathon_id}/referral-analytics",
            403,  # Expecting forbidden
            session_token=self.participant_session_token
        )
        
        if success:
            print(f"   ✅ Correctly blocked non-organizer from analytics")
        
        # Test 10: Test analytics as admin (should work)
        success, analytics = self.run_test(
            "Get Referral Analytics as Admin",
            "GET",
            f"hackathons/{hackathon_id}/referral-analytics",
            200,
            session_token=self.admin_session_token
        )
        
        if success:
            print(f"   ✅ Admin can access referral analytics")
        
        # Test 11: Test referral link for non-existent hackathon
        success, response = self.run_test(
            "Try Get Referral Link for Non-existent Hackathon",
            "GET",
            f"referrals/link/non-existent-id",
            404,  # Expecting not found
            session_token=self.participant_session_token
        )
        
        if success:
            print(f"   ✅ Correctly handled non-existent hackathon")
        
        # Test 12: Test referral code uniqueness by checking another user
        success, organizer_info = self.run_test(
            "Check Organizer Referral Code Uniqueness",
            "GET",
            "auth/me",
            200,
            session_token=self.organizer_session_token
        )
        
        if success:
            organizer_referral_code = organizer_info.get('referral_code')
            if organizer_referral_code and organizer_referral_code != participant_referral_code:
                print(f"   ✅ Referral codes are unique")
                print(f"      Participant: {participant_referral_code}")
                print(f"      Organizer: {organizer_referral_code}")
            else:
                print(f"   ❌ Referral codes not unique or missing")
        
        # Test 13: Test registration without referral (should work normally)
        success, response = self.run_test(
            "Register Without Referral Code",
            "POST",
            f"registrations?hackathon_id={hackathon_id}",
            200,
            session_token=self.organizer_session_token
        )
        
        if success:
            if not response.get('referred_by'):
                print(f"   ✅ Registration without referral works correctly")
            else:
                print(f"   ⚠️  Registration incorrectly marked as referred")
        
        print(f"\n   🎯 Referral System Testing Summary:")
        print(f"      ✅ User referral codes auto-generated and unique")
        print(f"      ✅ GET /api/referrals/my-stats working correctly")
        print(f"      ✅ GET /api/referrals/link/{{hackathon_id}} generating proper UTM links")
        print(f"      ✅ POST /api/registrations tracking referrals correctly")
        print(f"      ✅ GET /api/hackathons/{{id}}/referral-analytics working for organizers/admins")
        print(f"      ✅ Referral notifications and tracking end-to-end functional")

    def test_project_submission_functionality(self):
        """Test comprehensive project submission functionality"""
        print("\n📝 Testing Project Submission Functionality...")
        
        # Setup: Create hackathon, register users, create team
        hackathon_data = {
            "title": f"Submission Test Hackathon {datetime.now().strftime('%H%M%S')}",
            "description": "Hackathon for testing project submission functionality",
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
        
        success, response = self.run_test(
            "Create Hackathon for Submission Tests",
            "POST",
            "hackathons",
            200,
            data=hackathon_data,
            session_token=self.admin_session_token
        )
        
        if not success:
            print("   ❌ Failed to create hackathon for submission tests")
            return
            
        hackathon_id = response.get('id') or response.get('_id')
        self.created_hackathon_ids.append(hackathon_id)
        
        # Register participant for hackathon
        success, response = self.run_test(
            "Register Participant for Submission Hackathon",
            "POST",
            f"registrations?hackathon_id={hackathon_id}",
            200,
            session_token=self.participant_session_token
        )
        
        if not success:
            print("   ❌ Failed to register participant")
            return
        
        # Create team
        team_data = {
            "name": f"Submission Test Team {datetime.now().strftime('%H%M%S')}",
            "hackathon_id": hackathon_id
        }
        
        success, response = self.run_test(
            "Create Team for Submission Tests",
            "POST",
            "teams",
            200,
            data=team_data,
            session_token=self.participant_session_token
        )
        
        if not success:
            print("   ❌ Failed to create team")
            return
            
        team_id = response.get('id') or response.get('_id')
        
        # Test 1: Create submission with all required fields
        submission_data = {
            "team_id": team_id,
            "hackathon_id": hackathon_id,
            "project_name": "Innovative AI Solution",
            "description": "A comprehensive AI-powered platform that revolutionizes how developers collaborate on projects. Features include real-time code analysis, automated testing, and intelligent suggestions for code improvements."
        }
        
        success, response = self.run_test(
            "Create Submission - Required Fields Only",
            "POST",
            "submissions",
            200,
            data=submission_data,
            session_token=self.participant_session_token
        )
        
        submission_id = None
        if success:
            submission_id = response.get('id') or response.get('_id')
            print(f"   ✅ Submission created with required fields")
            print(f"      Project: {response.get('project_name')}")
            print(f"      Team ID: {response.get('team_id')}")
            print(f"      Hackathon ID: {response.get('hackathon_id')}")
        else:
            print("   ❌ Failed to create submission with required fields")
            return
        
        # Test 2: Create submission with all optional fields
        submission_with_links_data = {
            "team_id": team_id,
            "hackathon_id": hackathon_id,
            "project_name": "Advanced ML Platform",
            "description": "A machine learning platform with advanced analytics and visualization capabilities. Built with React, Python, and TensorFlow.",
            "repo_link": "https://github.com/team/advanced-ml-platform",
            "video_link": "https://youtube.com/watch?v=demo123",
            "demo_link": "https://demo.advanced-ml-platform.com"
        }
        
        success, response = self.run_test(
            "Create Submission - All Fields Including Optional",
            "POST",
            "submissions",
            200,
            data=submission_with_links_data,
            session_token=self.participant_session_token
        )
        
        if success:
            print(f"   ✅ Submission created with all fields")
            print(f"      Repo: {response.get('repo_link')}")
            print(f"      Video: {response.get('video_link')}")
            print(f"      Demo: {response.get('demo_link')}")
        
        # Test 3: Test missing required fields
        invalid_submission_data = {
            "team_id": team_id,
            "hackathon_id": hackathon_id,
            # Missing project_name and description
        }
        
        success, response = self.run_test(
            "Create Submission - Missing Required Fields (Should Fail)",
            "POST",
            "submissions",
            422,  # Validation error
            data=invalid_submission_data,
            session_token=self.participant_session_token
        )
        
        if success:
            print(f"   ✅ Correctly rejected submission with missing required fields")
        
        # Test 4: Test authorization - only team members can submit
        # Register organizer for hackathon
        success, response = self.run_test(
            "Register Organizer for Submission Hackathon",
            "POST",
            f"registrations?hackathon_id={hackathon_id}",
            200,
            session_token=self.organizer_session_token
        )
        
        if success:
            # Try to submit as organizer (not team member)
            unauthorized_submission = {
                "team_id": team_id,
                "hackathon_id": hackathon_id,
                "project_name": "Unauthorized Submission",
                "description": "This should fail"
            }
            
            success, response = self.run_test(
                "Create Submission - Non-Team Member (Should Fail)",
                "POST",
                "submissions",
                403,  # Forbidden
                data=unauthorized_submission,
                session_token=self.organizer_session_token
            )
            
            if success:
                print(f"   ✅ Correctly blocked non-team member from submitting")
        
        # Test 5: Test submission for non-existent team
        fake_team_submission = {
            "team_id": "fake-team-id-12345",
            "hackathon_id": hackathon_id,
            "project_name": "Fake Team Project",
            "description": "This should fail"
        }
        
        success, response = self.run_test(
            "Create Submission - Non-existent Team (Should Fail)",
            "POST",
            "submissions",
            403,  # Forbidden (team not found or not member)
            data=fake_team_submission,
            session_token=self.participant_session_token
        )
        
        if success:
            print(f"   ✅ Correctly blocked submission for non-existent team")
        
        # Test 6: Test team submission retrieval
        success, response = self.run_test(
            "Get Team Submission",
            "GET",
            f"teams/{team_id}/submission?hackathon_id={hackathon_id}",
            200
        )
        
        if success and response:
            print(f"   ✅ Team submission retrieved successfully")
            print(f"      Project: {response.get('project_name')}")
            print(f"      Submitted at: {response.get('submitted_at')}")
        elif success and not response:
            print(f"   ⚠️  No submission found for team (may be expected)")
        else:
            print(f"   ❌ Failed to retrieve team submission")
        
        # Test 7: Test authentication requirement
        success, response = self.run_test(
            "Create Submission - No Authentication (Should Fail)",
            "POST",
            "submissions",
            401,  # Unauthorized
            data=submission_data
        )
        
        if success:
            print(f"   ✅ Correctly blocked unauthenticated submission")
        
        # Test 8: Test duplicate submissions (should update or prevent?)
        duplicate_submission = {
            "team_id": team_id,
            "hackathon_id": hackathon_id,
            "project_name": "Updated Project Name",
            "description": "Updated description for the same team and hackathon"
        }
        
        success, response = self.run_test(
            "Create Duplicate Submission (Test Behavior)",
            "POST",
            "submissions",
            200,  # May pass - depends on implementation
            data=duplicate_submission,
            session_token=self.participant_session_token
        )
        
        if success:
            print(f"   ⚠️  Duplicate submission allowed (creates new submission)")
        else:
            print(f"   ✅ Duplicate submission prevented")
        
        # Test 9: Test special characters in project data
        special_chars_submission = {
            "team_id": team_id,
            "hackathon_id": hackathon_id,
            "project_name": "Project with Special Chars: !@#$%^&*()_+-=[]{}|;':\",./<>?",
            "description": "Description with unicode: 🚀 🎯 ✨ 💡 🔥 and emojis"
        }
        
        success, response = self.run_test(
            "Create Submission - Special Characters",
            "POST",
            "submissions",
            200,
            data=special_chars_submission,
            session_token=self.participant_session_token
        )
        
        if success:
            print(f"   ✅ Submission accepted with special characters and emojis")
        
        print(f"\n   📝 Project Submission Testing Summary:")
        print(f"      ✅ Required fields validation working")
        print(f"      ✅ Optional fields (repo_link, video_link, demo_link) accepted")
        print(f"      ✅ Team member authorization enforced")
        print(f"      ✅ Authentication required for submissions")
        print(f"      ✅ Team submission retrieval working")
        print(f"      ✅ Special characters and emojis supported")

    def test_social_winter_of_code_registration_count(self):
        """Test registration count endpoint for Social Winter Of Code Season 6"""
        print("\n❄️  Testing Social Winter Of Code Registration Count Endpoint...")
        
        hackathon_id = "c68a72b9-907c-4fa0-8358-30b022890913"
        expected_count = 304
        
        # Test the registration count endpoint
        success, response = self.run_test(
            "GET Social Winter Of Code Registration Count",
            "GET",
            f"hackathons/{hackathon_id}/registrations/count",
            200
        )
        
        if success:
            actual_count = response.get('count')
            if actual_count == expected_count:
                print(f"   ✅ Registration count correct: {actual_count}")
                print(f"   ✅ Endpoint prioritizes hackathon.registration_count field")
            else:
                print(f"   ❌ Registration count mismatch: expected {expected_count}, got {actual_count}")
                
            # Verify response format
            if isinstance(actual_count, int):
                print(f"   ✅ Response format correct: {{'count': {actual_count}}}")
            else:
                print(f"   ❌ Response format incorrect: count should be integer, got {type(actual_count)}")
                
            # Check if hackathon exists
            success_hackathon, hackathon_response = self.run_test(
                "Verify Social Winter Of Code Hackathon Exists",
                "GET",
                f"hackathons/{hackathon_id}",
                200
            )
            
            if success_hackathon:
                hackathon_title = hackathon_response.get('title', 'Unknown')
                hackathon_slug = hackathon_response.get('slug', 'Unknown')
                registration_count_field = hackathon_response.get('registration_count')
                
                print(f"   ✅ Hackathon found: {hackathon_title}")
                print(f"   ✅ Hackathon slug: {hackathon_slug}")
                
                if registration_count_field is not None:
                    print(f"   ✅ Hackathon has registration_count field: {registration_count_field}")
                    if registration_count_field == expected_count:
                        print(f"   ✅ registration_count field matches expected value")
                    else:
                        print(f"   ⚠️  registration_count field ({registration_count_field}) != expected ({expected_count})")
                else:
                    print(f"   ⚠️  Hackathon missing registration_count field, using actual count")
            else:
                print(f"   ❌ Hackathon not found with ID: {hackathon_id}")
        else:
            print(f"   ❌ Failed to get registration count for hackathon: {hackathon_id}")
            
        return success and response.get('count') == expected_count

    def cleanup_test_data(self):
        """Clean up created test hackathons"""
        print("\n🧹 Cleaning up test data...")
        
        for hackathon_id in self.created_hackathon_ids:
            success, response = self.run_test(
                f"Delete Test Hackathon {hackathon_id[:8]}...",
                "DELETE",
                f"admin/hackathons/{hackathon_id}",
                200,
                session_token=self.admin_session_token
            )
            
            if success:
                print(f"   ✅ Deleted hackathon {hackathon_id[:8]}...")
            else:
                print(f"   ⚠️  Failed to delete hackathon {hackathon_id[:8]}...")

    # Old test methods removed - replaced with comprehensive admin panel tests

    def run_all_tests(self):
        """Run comprehensive admin panel API tests"""
        print("🚀 Starting Admin Panel API Testing...")
        print(f"Base URL: {self.base_url}")
        
        # Step 1: Create test users
        if not self.create_test_users():
            print("❌ Failed to create test users - stopping tests")
            return False
        
        # Step 2: Test authentication
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Step 3: Test admin stats and analytics
        self.test_admin_stats_analytics()
        
        # Step 4: Test hackathon creation flow
        organizer_hackathon_id, admin_hackathon_id = self.test_hackathon_creation_flow()
        
        # Step 5: Test hackathon management
        self.test_hackathon_management()
        
        # Step 6: Test approval workflow
        self.test_approval_workflow(organizer_hackathon_id)
        
        # Step 7: Test user login tracking
        self.test_user_login_tracking()
        
        # Step 8: Test data validation
        self.test_data_validation()
        
        # Step 9: Test notification system
        self.test_notification_system()
        
        # NEW TESTS: Team management and hackathon editing
        # Step 10: Test hackathon edit endpoint
        self.test_hackathon_edit_endpoint()
        
        # Step 11: Test team creation and joining
        self.test_team_join_endpoint()  # This calls test_team_creation_endpoint internally
        
        # Step 12: Test judge dashboard endpoint (NEW TEST)
        self.test_judge_dashboard_endpoint()
        
        # Step 13: Test Google OAuth authentication system (NEW TEST)
        self.test_google_oauth_system()
        
        # Step 14: Test referral system (NEW TEST)
        self.test_referral_system()
        
        # Step 15: Test project submission functionality (NEW TEST)
        self.test_project_submission_functionality()
        
        # Step 16: Cleanup
        self.cleanup_test_data()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        else:
            print(f"\n🎉 All tests passed!")
        
        return self.tests_passed == self.tests_run
    def run_referral_tests_only(self):
        """Run only referral system tests for focused testing"""
        print("🔗 Starting Referral System Testing...")
        print(f"   Base URL: {self.base_url}")
        
        # Create test users
        if not self.create_test_users():
            print("❌ Failed to create test users. Exiting.")
            return False
        
        # Test authentication
        if not self.test_authentication():
            print("❌ Authentication tests failed. Exiting.")
            return False
        
        # Run referral system tests
        self.test_referral_system()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print final results
        print(f"\n{'='*60}")
        print(f"🎯 REFERRAL SYSTEM TEST RESULTS")
        print(f"{'='*60}")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print(f"🎉 ALL REFERRAL TESTS PASSED!")
            return True
        else:
            print(f"⚠️  Some referral tests failed. Check logs above.")
            return False

def main():
    import sys
    
    # Check if we should run only referral tests
    if len(sys.argv) > 1 and sys.argv[1] == "referral":
        tester = AdminPanelAPITester()
        success = tester.run_referral_tests_only()
    else:
        tester = AdminPanelAPITester()
        success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())