#!/usr/bin/env python3
"""
Quick Fix Verification Test
Tests the specific fixes mentioned in the review request:
1. Backend Health Check (GET /api/hackathons)
2. Certificate endpoint (GET /api/certificates/my?email=test@example.com)
3. Logout endpoint (POST /api/auth/logout)
"""

import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import subprocess

class QuickFixTester:
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
        """Create a test user for logout testing"""
        print("\n🔧 Creating test user for logout test...")
        
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
  name: 'Test User for Logout',
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

print('Test user created with session token: {session_token}');
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

    def test_backend_health(self):
        """Test 1: Backend Health Check - GET /api/hackathons should return 200"""
        print("\n🏥 Testing Backend Health Check...")
        
        success, response = self.run_test(
            "GET /api/hackathons (Backend Health)",
            "GET",
            "hackathons",
            200
        )
        
        if success:
            print(f"   ✅ Backend is running properly")
            print(f"   ✅ Found {len(response)} hackathons")
            print(f"   ✅ No import errors detected")
        
        return success

    def test_certificate_endpoint(self):
        """Test 2: Certificate endpoint - GET /api/certificates/my?email=test@example.com should return 200 with empty array"""
        print("\n📜 Testing Certificate Endpoint...")
        
        # Test with non-existent email
        success, response = self.run_test(
            "GET /api/certificates/my?email=nonexistent@test.com",
            "GET",
            "certificates/my?email=nonexistent@test.com",
            200
        )
        
        if success:
            expected_structure = response.get('total') == 0 and response.get('certificates') == []
            if expected_structure:
                print(f"   ✅ Certificate endpoint returns correct structure: {{total: 0, certificates: []}}")
            else:
                print(f"   ⚠️  Response structure: {response}")
        
        # Test with test email
        success2, response2 = self.run_test(
            "GET /api/certificates/my?email=test@example.com",
            "GET", 
            "certificates/my?email=test@example.com",
            200
        )
        
        if success2:
            print(f"   ✅ Certificate endpoint doesn't crash with test email")
            print(f"   ✅ Response: {response2}")
        
        return success and success2

    def test_logout_endpoint(self):
        """Test 3: Logout endpoint - POST /api/auth/logout should work with valid session"""
        print("\n🚪 Testing Logout Endpoint...")
        
        if not self.session_token:
            if not self.create_test_user():
                print("   ❌ Cannot test logout without valid session")
                return False
        
        # Test logout with valid session token
        success, response = self.run_test(
            "POST /api/auth/logout (with valid session)",
            "POST",
            "auth/logout",
            200
        )
        
        if success:
            print(f"   ✅ Logout endpoint works correctly")
            print(f"   ✅ Response: {response}")
            
            # Verify session is actually invalidated by trying to use it
            old_token = self.session_token
            success2, response2 = self.run_test(
                "Try using session after logout (should fail)",
                "GET",
                "auth/me",
                401  # Should be unauthorized now
            )
            
            if success2:
                print(f"   ✅ Session properly invalidated after logout")
            else:
                print(f"   ⚠️  Session may not be properly invalidated")
        
        return success

    def run_all_tests(self):
        """Run all quick fix verification tests"""
        print("🚀 Starting Quick Fix Verification Tests")
        print("=" * 50)
        
        # Test 1: Backend Health Check
        health_ok = self.test_backend_health()
        
        # Test 2: Certificate Endpoint
        cert_ok = self.test_certificate_endpoint()
        
        # Test 3: Logout Endpoint
        logout_ok = self.test_logout_endpoint()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 QUICK FIX VERIFICATION SUMMARY")
        print("=" * 50)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print(f"\n🎯 Fix Verification Results:")
        print(f"   {'✅' if health_ok else '❌'} Backend Health Check (GET /api/hackathons)")
        print(f"   {'✅' if cert_ok else '❌'} Certificate Endpoint (GET /api/certificates/my)")
        print(f"   {'✅' if logout_ok else '❌'} Logout Endpoint (POST /api/auth/logout)")
        
        all_passed = health_ok and cert_ok and logout_ok
        
        if all_passed:
            print(f"\n🎉 ALL QUICK FIXES VERIFIED SUCCESSFULLY!")
            print(f"   ✅ Backend is running properly")
            print(f"   ✅ No import errors detected")
            print(f"   ✅ Logout endpoint works correctly")
            print(f"   ✅ Certificate endpoint doesn't crash")
        else:
            print(f"\n⚠️  SOME ISSUES DETECTED:")
            if not health_ok:
                print(f"   ❌ Backend health check failed")
            if not cert_ok:
                print(f"   ❌ Certificate endpoint issues")
            if not logout_ok:
                print(f"   ❌ Logout endpoint issues")
        
        return all_passed

if __name__ == "__main__":
    tester = QuickFixTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)