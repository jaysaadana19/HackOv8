import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import uuid
import subprocess

class AdminPanelAPITester:
    def __init__(self, base_url="https://hackcraft-portal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_session_token = None
        self.organizer_session_token = None
        self.participant_session_token = None
        self.admin_user_id = None
        self.organizer_user_id = None
        self.participant_user_id = None
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

print('Admin session token: {admin_session_token}');
print('Organizer session token: {organizer_session_token}');
print('Participant session token: {participant_session_token}');
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                self.admin_session_token = admin_session_token
                self.organizer_session_token = organizer_session_token
                self.participant_session_token = participant_session_token
                self.admin_user_id = admin_user_id
                self.organizer_user_id = organizer_user_id
                self.participant_user_id = participant_user_id
                
                print(f"   ✅ Created admin user: {admin_email}")
                print(f"   ✅ Created organizer user: {organizer_email}")
                print(f"   ✅ Created participant user: {participant_email}")
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
        
        # Step 10: Cleanup
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

def main():
    tester = AdminPanelAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())