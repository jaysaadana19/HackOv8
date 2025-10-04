import requests
import sys
import json
from datetime import datetime

class HackovAPITester:
    def __init__(self, base_url="https://hackcraft-portal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
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
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_auth_with_admin_token(self):
        """Test authentication with admin session token"""
        print("\n🔐 Testing Authentication...")
        
        # Use the created test session token
        self.session_token = "test_session_1759566855900"
        
        success, response = self.run_test(
            "Admin Auth Check",
            "GET",
            "auth/me",
            200
        )
        
        if success and ('id' in response or '_id' in response):
            self.user_id = response.get('id') or response.get('_id')
            print(f"   Authenticated as: {response.get('name', 'Unknown')} (Role: {response.get('role', 'Unknown')})")
            return True
        else:
            print(f"   Auth response: {response}")
            return False

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