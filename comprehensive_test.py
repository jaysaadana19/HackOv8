#!/usr/bin/env python3
"""
Comprehensive Backend Test
Tests all critical backend endpoints to ensure they're working properly
"""

import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import subprocess

class ComprehensiveBackendTester:
    def __init__(self, base_url="https://certificate-hub-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session_token = None
        self.user_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - FAILED: {details}")

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
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text[:500]}
                
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def create_test_user(self):
        """Create a test user for authenticated tests"""
        print("\n🔧 Creating test user...")
        
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
  created_at: new Date(),
  last_login: new Date()
}});

db.user_sessions.insertOne({{
  user_id: '{user_id}',
  session_token: '{session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});

print('Test user created');
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                self.session_token = session_token
                self.user_id = user_id
                print(f"   ✅ Created test user: {email}")
                return True
            else:
                print(f"   ❌ MongoDB script failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"   ❌ Failed to create test user: {str(e)}")
            return False

    def test_core_endpoints(self):
        """Test core backend endpoints"""
        print("\n🏗️ Testing Core Endpoints...")
        
        # Test hackathons endpoint
        success, response = self.run_test(
            "GET /api/hackathons",
            "GET",
            "hackathons",
            200
        )
        
        # Test certificates endpoint
        success, response = self.run_test(
            "GET /api/certificates/my?email=test@example.com",
            "GET",
            "certificates/my?email=test@example.com",
            200
        )
        
        # Test user check endpoint
        success, response = self.run_test(
            "GET /api/users/check-email?email=test@example.com",
            "GET",
            "users/check-email?email=test@example.com",
            200
        )

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        if not self.session_token:
            if not self.create_test_user():
                print("   ❌ Cannot test auth without valid session")
                return False
        
        # Test auth/me endpoint
        success, response = self.run_test(
            "GET /api/auth/me",
            "GET",
            "auth/me",
            200
        )
        
        # Test logout endpoint
        success, response = self.run_test(
            "POST /api/auth/logout",
            "POST",
            "auth/logout",
            200
        )
        
        return True

    def test_certificate_endpoints(self):
        """Test certificate-related endpoints"""
        print("\n📜 Testing Certificate Endpoints...")
        
        # Test certificate retrieval with various emails
        test_emails = [
            "test@example.com",
            "nonexistent@test.com",
            "user@domain.com"
        ]
        
        for email in test_emails:
            success, response = self.run_test(
                f"GET /api/certificates/my?email={email}",
                "GET",
                f"certificates/my?email={email}",
                200
            )
            
            if success:
                # Verify response structure
                if 'total' in response and 'certificates' in response:
                    print(f"      ✅ Correct structure for {email}")
                else:
                    print(f"      ⚠️  Incorrect structure for {email}: {response}")

    def test_error_handling(self):
        """Test error handling for various scenarios"""
        print("\n🚨 Testing Error Handling...")
        
        # Test non-existent endpoint
        success, response = self.run_test(
            "GET /api/nonexistent",
            "GET",
            "nonexistent",
            404
        )
        
        # Test unauthorized access
        old_token = self.session_token
        self.session_token = "invalid_token"
        
        success, response = self.run_test(
            "GET /api/auth/me (invalid token)",
            "GET",
            "auth/me",
            401
        )
        
        self.session_token = old_token

    def run_all_tests(self):
        """Run all comprehensive backend tests"""
        print("🚀 Starting Comprehensive Backend Tests")
        print("=" * 50)
        
        # Test core endpoints
        self.test_core_endpoints()
        
        # Test auth endpoints
        self.test_auth_endpoints()
        
        # Test certificate endpoints
        self.test_certificate_endpoints()
        
        # Test error handling
        self.test_error_handling()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 50)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print(f"\n🎉 ALL TESTS PASSED!")
            print(f"   ✅ Backend is running properly")
            print(f"   ✅ No import errors detected")
            print(f"   ✅ All endpoints responding correctly")
            print(f"   ✅ Error handling working properly")
        else:
            failed_tests = self.tests_run - self.tests_passed
            print(f"\n⚠️  {failed_tests} TEST(S) FAILED")
            print(f"   Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)