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

    def test_hackathons(self):
        """Test hackathon endpoints"""
        print("\n🏆 Testing Hackathon Endpoints...")
        
        # Get all hackathons
        success, hackathons = self.run_test(
            "Get All Hackathons",
            "GET",
            "hackathons",
            200
        )
        
        if success and hackathons:
            hackathon_id = hackathons[0].get('id') or hackathons[0].get('_id')
            print(f"   Found {len(hackathons)} hackathons")
            
            # Get specific hackathon
            self.run_test(
                "Get Hackathon Details",
                "GET",
                f"hackathons/{hackathon_id}",
                200
            )
            
            # Get hackathon teams
            self.run_test(
                "Get Hackathon Teams",
                "GET",
                f"hackathons/{hackathon_id}/teams",
                200
            )
            
            # Get hackathon leaderboard
            self.run_test(
                "Get Hackathon Leaderboard",
                "GET",
                f"hackathons/{hackathon_id}/leaderboard",
                200
            )
            
            return hackathon_id
        return None

    def test_registrations(self, hackathon_id):
        """Test registration endpoints"""
        if not hackathon_id:
            return
            
        print("\n📝 Testing Registration Endpoints...")
        
        # Get my registrations
        self.run_test(
            "Get My Registrations",
            "GET",
            "registrations/my",
            200
        )
        
        # Try to register for hackathon (might fail if already registered)
        success, _ = self.run_test(
            "Register for Hackathon",
            "POST",
            "registrations",
            200,
            data={"hackathon_id": hackathon_id}
        )

    def test_teams(self, hackathon_id):
        """Test team endpoints"""
        if not hackathon_id:
            return
            
        print("\n👥 Testing Team Endpoints...")
        
        # Get my teams
        success, teams = self.run_test(
            "Get My Teams",
            "GET",
            "teams/my",
            200
        )
        
        # Create a test team
        team_name = f"Test Team {datetime.now().strftime('%H%M%S')}"
        success, team_data = self.run_test(
            "Create Team",
            "POST",
            "teams",
            200,
            data={
                "name": team_name,
                "hackathon_id": hackathon_id
            }
        )
        
        if success and 'invite_code' in team_data:
            invite_code = team_data['invite_code']
            team_id = team_data.get('id') or team_data.get('_id')
            print(f"   Created team with invite code: {invite_code}")
            return team_id, invite_code
        
        return None, None

    def test_submissions(self, team_id, hackathon_id):
        """Test submission endpoints"""
        if not team_id or not hackathon_id:
            return
            
        print("\n🚀 Testing Submission Endpoints...")
        
        # Create a test submission
        success, submission = self.run_test(
            "Create Submission",
            "POST",
            "submissions",
            200,
            data={
                "team_id": team_id,
                "hackathon_id": hackathon_id,
                "project_name": "Test Project",
                "description": "A test project submission",
                "repo_link": "https://github.com/test/project",
                "demo_link": "https://test-project.com"
            }
        )
        
        if success:
            # Get team submission
            self.run_test(
                "Get Team Submission",
                "GET",
                f"teams/{team_id}/submission?hackathon_id={hackathon_id}",
                200
            )

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        # Get admin stats
        self.run_test(
            "Get Admin Stats",
            "GET",
            "admin/stats",
            200
        )
        
        # Get all users
        self.run_test(
            "Get All Users",
            "GET",
            "admin/users",
            200
        )
        
        # Test CSV exports
        self.run_test(
            "Export Users CSV",
            "GET",
            "admin/export/users",
            200
        )
        
        self.run_test(
            "Export Hackathons CSV",
            "GET",
            "admin/export/hackathons",
            200
        )

    def test_notifications(self):
        """Test notification endpoints"""
        print("\n🔔 Testing Notification Endpoints...")
        
        self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Hackov8 API Testing...")
        print(f"Base URL: {self.base_url}")
        
        # Test authentication first
        if not self.test_auth_with_admin_token():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Test core endpoints
        hackathon_id = self.test_hackathons()
        self.test_registrations(hackathon_id)
        team_id, invite_code = self.test_teams(hackathon_id)
        self.test_submissions(team_id, hackathon_id)
        self.test_admin_endpoints()
        self.test_notifications()
        
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
        
        return self.tests_passed == self.tests_run

def main():
    tester = HackovAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())