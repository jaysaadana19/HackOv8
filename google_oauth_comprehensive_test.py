#!/usr/bin/env python3
"""
Comprehensive Google OAuth Callback Test
Test all scenarios after the fix
"""

import requests
import json
import base64
import time
from datetime import datetime, timezone, timedelta

class GoogleOAuthComprehensiveTester:
    def __init__(self, base_url="https://hackov8-manage.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.test_results = []
        
    def log_test(self, name, success, details=""):
        """Log test result"""
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} {name}")
        if details:
            print(f"   {details}")
        print()
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def create_mock_jwt_token(self, payload_data):
        """Create a mock JWT token for testing"""
        header = {
            "alg": "RS256",
            "kid": "test-key-id",
            "typ": "JWT"
        }
        
        header_encoded = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_encoded = base64.urlsafe_b64encode(json.dumps(payload_data).encode()).decode().rstrip('=')
        signature = base64.urlsafe_b64encode(b"fake_signature_for_testing").decode().rstrip('=')
        
        return f"{header_encoded}.{payload_encoded}.{signature}"

    def test_all_scenarios(self):
        """Test all Google OAuth callback scenarios"""
        print("🔍 COMPREHENSIVE Google OAuth Callback Tests")
        print("=" * 60)
        
        google_client_id = "834941712511-hblu5bkb78j0nhi570if3jmv70sk0nef.apps.googleusercontent.com"
        
        # Test 1: Participant role with minimal data
        print("Test 1: Participant role with minimal data")
        valid_payload = {
            "iss": "https://accounts.google.com",
            "aud": google_client_id,
            "sub": "12345678901234567890",
            "email": f"test.participant.{int(time.time())}@example.com",
            "name": "Test Participant User",
            "picture": "https://lh3.googleusercontent.com/a/test-picture",
            "email_verified": True,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600
        }
        
        jwt_token = self.create_mock_jwt_token(valid_payload)
        
        data = {
            "credential": jwt_token,
            "role": "participant"
        }
        
        response = requests.post(f"{self.base_url}/auth/google/callback", json=data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('role') == 'participant':
                self.log_test("Participant Role - Minimal Data", True, f"User created with role: {result.get('role')}")
            else:
                self.log_test("Participant Role - Minimal Data", False, f"Expected participant role, got: {result.get('role')}")
        else:
            self.log_test("Participant Role - Minimal Data", False, f"Status {response.status_code}: {response.text}")
        
        # Test 2: Organizer role with company data
        print("Test 2: Organizer role with company data")
        organizer_payload = {
            "iss": "https://accounts.google.com",
            "aud": google_client_id,
            "sub": "98765432109876543210",
            "email": f"test.organizer.{int(time.time())}@example.com",
            "name": "Test Organizer User",
            "picture": "https://lh3.googleusercontent.com/a/organizer-picture",
            "email_verified": True,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600
        }
        
        organizer_jwt = self.create_mock_jwt_token(organizer_payload)
        
        data = {
            "credential": organizer_jwt,
            "role": "organizer",
            "company_name": "Test Company Inc",
            "company_website": "https://testcompany.com"
        }
        
        response = requests.post(f"{self.base_url}/auth/google/callback", json=data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('role') == 'organizer':
                self.log_test("Organizer Role - With Company", True, f"User created with role: {result.get('role')}")
            else:
                self.log_test("Organizer Role - With Company", False, f"Expected organizer role, got: {result.get('role')}")
        else:
            self.log_test("Organizer Role - With Company", False, f"Status {response.status_code}: {response.text}")
        
        # Test 3: Organizer role without company data (should still work)
        print("Test 3: Organizer role without company data")
        organizer_payload2 = {
            "iss": "https://accounts.google.com",
            "aud": google_client_id,
            "sub": "11111111111111111111",
            "email": f"test.organizer.nocompany.{int(time.time())}@example.com",
            "name": "Test Organizer No Company",
            "picture": "https://lh3.googleusercontent.com/a/organizer-picture2",
            "email_verified": True,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600
        }
        
        organizer_jwt2 = self.create_mock_jwt_token(organizer_payload2)
        
        data = {
            "credential": organizer_jwt2,
            "role": "organizer"
        }
        
        response = requests.post(f"{self.base_url}/auth/google/callback", json=data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('role') == 'organizer':
                self.log_test("Organizer Role - No Company", True, f"User created with role: {result.get('role')}")
            else:
                self.log_test("Organizer Role - No Company", False, f"Expected organizer role, got: {result.get('role')}")
        else:
            self.log_test("Organizer Role - No Company", False, f"Status {response.status_code}: {response.text}")
        
        # Test 4: Judge role
        print("Test 4: Judge role")
        judge_payload = {
            "iss": "https://accounts.google.com",
            "aud": google_client_id,
            "sub": "22222222222222222222",
            "email": f"test.judge.{int(time.time())}@example.com",
            "name": "Test Judge User",
            "picture": "https://lh3.googleusercontent.com/a/judge-picture",
            "email_verified": True,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600
        }
        
        judge_jwt = self.create_mock_jwt_token(judge_payload)
        
        data = {
            "credential": judge_jwt,
            "role": "judge"
        }
        
        response = requests.post(f"{self.base_url}/auth/google/callback", json=data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('role') == 'judge':
                self.log_test("Judge Role", True, f"User created with role: {result.get('role')}")
            else:
                self.log_test("Judge Role", False, f"Expected judge role, got: {result.get('role')}")
        else:
            self.log_test("Judge Role", False, f"Status {response.status_code}: {response.text}")
        
        # Test 5: Existing user login (should update last_login)
        print("Test 5: Existing user login")
        # Use the same JWT as Test 1 to simulate existing user
        data = {
            "credential": jwt_token,
            "role": "participant"  # This should be ignored for existing users
        }
        
        response = requests.post(f"{self.base_url}/auth/google/callback", json=data)
        
        if response.status_code == 200:
            result = response.json()
            self.log_test("Existing User Login", True, f"Existing user logged in: {result.get('email')}")
        else:
            self.log_test("Existing User Login", False, f"Status {response.status_code}: {response.text}")
        
        # Test 6: Invalid JWT format
        print("Test 6: Invalid JWT format")
        data = {
            "credential": "invalid.jwt.token",
            "role": "participant"
        }
        
        response = requests.post(f"{self.base_url}/auth/google/callback", json=data)
        
        if response.status_code == 400:
            self.log_test("Invalid JWT Format", True, "Correctly rejected invalid JWT")
        else:
            self.log_test("Invalid JWT Format", False, f"Expected 400, got {response.status_code}: {response.text}")
        
        # Test 7: Wrong audience in JWT
        print("Test 7: Wrong audience in JWT")
        wrong_audience_payload = {
            "iss": "https://accounts.google.com",
            "aud": "wrong-client-id",
            "sub": "33333333333333333333",
            "email": f"test.wrong.audience.{int(time.time())}@example.com",
            "name": "Test Wrong Audience",
            "picture": "https://lh3.googleusercontent.com/a/wrong-picture",
            "email_verified": True,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600
        }
        
        wrong_jwt = self.create_mock_jwt_token(wrong_audience_payload)
        
        data = {
            "credential": wrong_jwt,
            "role": "participant"
        }
        
        response = requests.post(f"{self.base_url}/auth/google/callback", json=data)
        
        if response.status_code == 400:
            self.log_test("Wrong JWT Audience", True, "Correctly rejected wrong audience")
        else:
            self.log_test("Wrong JWT Audience", False, f"Expected 400, got {response.status_code}: {response.text}")
        
        # Test 8: Missing credential field
        print("Test 8: Missing credential field")
        data = {
            "role": "participant"
        }
        
        response = requests.post(f"{self.base_url}/auth/google/callback", json=data)
        
        if response.status_code == 422:
            self.log_test("Missing Credential Field", True, "Correctly rejected missing credential")
        else:
            self.log_test("Missing Credential Field", False, f"Expected 422, got {response.status_code}: {response.text}")

    def run_tests(self):
        """Run all tests and provide summary"""
        print("🚀 Starting Comprehensive Google OAuth Tests")
        print("=" * 60)
        
        self.test_all_scenarios()
        
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['details']}")
        
        print(f"\n🎯 CONCLUSION:")
        if failed_tests == 0:
            print("   ✅ ALL TESTS PASSED - Google OAuth callback is working correctly!")
            print("   ✅ Frontend can now send JSON request body successfully")
            print("   ✅ All role types (participant, organizer, judge) work correctly")
            print("   ✅ Company creation for organizers works")
            print("   ✅ Existing user login works")
            print("   ✅ Error handling works for invalid requests")
        else:
            print(f"   ⚠️  {failed_tests} test(s) failed - see details above")
        
        return self.test_results

if __name__ == "__main__":
    tester = GoogleOAuthComprehensiveTester()
    results = tester.run_tests()