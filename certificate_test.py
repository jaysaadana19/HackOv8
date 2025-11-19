import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import uuid
import subprocess
import tempfile
import os
from PIL import Image
import io

class CertificateSystemTester:
    def __init__(self, base_url="https://hacktracker-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.organizer_session_token = None
        self.organizer_user_id = None
        self.hackathon_id = None
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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {}
        
        if self.organizer_session_token:
            test_headers['Authorization'] = f'Bearer {self.organizer_session_token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    # For file uploads, don't set Content-Type header
                    response = requests.post(url, data=data, files=files, headers=test_headers)
                else:
                    test_headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                test_headers['Content-Type'] = 'application/json'
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

    def create_test_organizer(self):
        """Create test organizer user using MongoDB"""
        print("\n🔧 Creating test organizer user...")
        
        timestamp = int(datetime.now().timestamp())
        
        # Create organizer user  
        organizer_user_id = f"cert-organizer-{timestamp}"
        organizer_session_token = f"cert_organizer_session_{timestamp}"
        organizer_email = f"cert.organizer.{timestamp}@example.com"
        
        mongo_script = f"""
use('test_database');

// Create organizer user
db.users.insertOne({{
  _id: '{organizer_user_id}',
  email: '{organizer_email}',
  name: 'Certificate Test Organizer',
  role: 'organizer',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date(),
  last_login: null,
  referral_code: 'CERT{timestamp}'
}});

db.user_sessions.insertOne({{
  user_id: '{organizer_user_id}',
  session_token: '{organizer_session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});

print('Organizer session token: {organizer_session_token}');
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                self.organizer_session_token = organizer_session_token
                self.organizer_user_id = organizer_user_id
                
                print(f"   ✅ Created organizer user: {organizer_email}")
                return True
            else:
                print(f"   ❌ MongoDB script failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"   ❌ Failed to create test organizer: {str(e)}")
            return False

    def create_test_hackathon(self):
        """Create a test hackathon for certificate testing"""
        print("\n🏗️ Creating test hackathon...")
        
        hackathon_data = {
            "title": f"Certificate Test Hackathon {datetime.now().strftime('%H%M%S')}",
            "description": "A hackathon for testing certificate functionality",
            "category": "Technology",
            "location": "online",
            "venue": "Virtual Platform",
            "registration_start": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "registration_end": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "event_start": (datetime.now(timezone.utc) + timedelta(days=8)).isoformat(),
            "event_end": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "submission_deadline": (datetime.now(timezone.utc) + timedelta(days=9)).isoformat(),
            "max_team_size": 4,
            "min_team_size": 1,
            "prizes": [{"position": "1st", "amount": "$1000"}],
            "rules": "Certificate test rules"
        }
        
        success, response = self.run_test(
            "Create Test Hackathon",
            "POST",
            "hackathons",
            200,
            data=hackathon_data
        )
        
        if success:
            self.hackathon_id = response.get('id') or response.get('_id')
            print(f"   ✅ Created hackathon: {response.get('title')} (ID: {self.hackathon_id[:8]}...)")
            return True
        else:
            print("   ❌ Failed to create test hackathon")
            return False

    def create_test_template_image(self):
        """Create a test certificate template image"""
        # Create a simple test image
        img = Image.new('RGB', (800, 600), color='white')
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
        img.save(temp_file.name, 'PNG')
        temp_file.close()
        
        return temp_file.name

    def test_certificate_template_upload(self):
        """Test POST /api/hackathons/{hackathon_id}/certificate-template"""
        print("\n📄 Testing Certificate Template Upload...")
        
        # Test 1: Upload valid template
        template_path = self.create_test_template_image()
        
        try:
            with open(template_path, 'rb') as f:
                files = {'file': ('test_template.png', f, 'image/png')}
                
                success, response = self.run_test(
                    "Upload Certificate Template (PNG)",
                    "POST",
                    f"hackathons/{self.hackathon_id}/certificate-template",
                    200,
                    files=files
                )
                
                if success:
                    template_url = response.get('template_url')
                    if template_url:
                        print(f"   ✅ Template uploaded successfully: {template_url}")
                    else:
                        print(f"   ⚠️ Template uploaded but no URL returned")
        finally:
            # Clean up temp file
            os.unlink(template_path)
        
        # Test 2: Test authorization - try without authentication
        template_path = self.create_test_template_image()
        
        try:
            with open(template_path, 'rb') as f:
                files = {'file': ('test_template.png', f, 'image/png')}
                
                # Temporarily remove auth token
                temp_token = self.organizer_session_token
                self.organizer_session_token = None
                
                success, response = self.run_test(
                    "Upload Template Without Auth (Should Fail)",
                    "POST",
                    f"hackathons/{self.hackathon_id}/certificate-template",
                    401,
                    files=files
                )
                
                # Restore auth token
                self.organizer_session_token = temp_token
                
                if success:
                    print(f"   ✅ Correctly blocked unauthorized template upload")
        finally:
            os.unlink(template_path)
        
        # Test 3: Test invalid file type
        # Create a text file instead of image
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.txt')
        temp_file.write(b"This is not an image")
        temp_file.close()
        
        try:
            with open(temp_file.name, 'rb') as f:
                files = {'file': ('test.txt', f, 'text/plain')}
                
                success, response = self.run_test(
                    "Upload Invalid File Type (Should Fail)",
                    "POST",
                    f"hackathons/{self.hackathon_id}/certificate-template",
                    400,
                    files=files
                )
                
                if success:
                    print(f"   ✅ Correctly rejected invalid file type")
        finally:
            os.unlink(temp_file.name)

    def test_certificate_positions_update(self):
        """Test PUT /api/hackathons/{hackathon_id}/certificate-template/positions"""
        print("\n📍 Testing Certificate Position Updates...")
        
        # Test 1: Update text positions
        positions = {
            "name": {"x": 400, "y": 300, "fontSize": 48, "color": "#000000"},
            "role": {"x": 400, "y": 400, "fontSize": 32, "color": "#333333"},
            "hackathon": {"x": 400, "y": 200, "fontSize": 36, "color": "#000000"},
            "date": {"x": 400, "y": 500, "fontSize": 24, "color": "#666666"},
            "qr": {"x": 50, "y": 50, "size": 100}
        }
        
        success, response = self.run_test(
            "Update Certificate Text Positions",
            "PUT",
            f"hackathons/{self.hackathon_id}/certificate-template/positions",
            200,
            data=positions
        )
        
        if success:
            print(f"   ✅ Text positions updated successfully")
        
        # Test 2: Test authorization
        temp_token = self.organizer_session_token
        self.organizer_session_token = None
        
        success, response = self.run_test(
            "Update Positions Without Auth (Should Fail)",
            "PUT",
            f"hackathons/{self.hackathon_id}/certificate-template/positions",
            401,
            data=positions
        )
        
        self.organizer_session_token = temp_token
        
        if success:
            print(f"   ✅ Correctly blocked unauthorized position update")

    def test_certificate_template_get(self):
        """Test GET /api/hackathons/{hackathon_id}/certificate-template"""
        print("\n📋 Testing Certificate Template Retrieval...")
        
        # Test 1: Get template (public endpoint - no auth required)
        temp_token = self.organizer_session_token
        self.organizer_session_token = None
        
        success, response = self.run_test(
            "Get Certificate Template (Public)",
            "GET",
            f"hackathons/{self.hackathon_id}/certificate-template",
            200
        )
        
        self.organizer_session_token = temp_token
        
        if success:
            if response.get('template_url') and response.get('text_positions'):
                print(f"   ✅ Template retrieved with URL and positions")
            else:
                print(f"   ⚠️ Template retrieved but missing data")
        
        # Test 2: Get template for non-existent hackathon
        fake_hackathon_id = str(uuid.uuid4())
        
        success, response = self.run_test(
            "Get Template for Non-existent Hackathon",
            "GET",
            f"hackathons/{fake_hackathon_id}/certificate-template",
            200  # Should return None/empty for non-existent
        )
        
        if success:
            print(f"   ✅ Handled non-existent hackathon gracefully")

    def test_bulk_certificate_generation(self):
        """Test POST /api/hackathons/{hackathon_id}/certificates/bulk-generate"""
        print("\n📜 Testing Bulk Certificate Generation...")
        
        # Create CSV content for testing
        csv_content = """Name,Email,Role
John Doe,john.doe@example.com,participation
Jane Smith,jane.smith@example.com,judge
Bob Wilson,bob.wilson@example.com,organizer
Alice Johnson,alice.johnson@example.com,participation"""
        
        # Test 1: Bulk generate certificates
        temp_csv = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv')
        temp_csv.write(csv_content)
        temp_csv.close()
        
        try:
            with open(temp_csv.name, 'rb') as f:
                files = {'file': ('certificates.csv', f, 'text/csv')}
                
                success, response = self.run_test(
                    "Bulk Generate Certificates from CSV",
                    "POST",
                    f"hackathons/{self.hackathon_id}/certificates/bulk-generate",
                    200,
                    files=files
                )
                
                if success:
                    certificates_generated = response.get('certificates_generated', 0)
                    errors = response.get('errors', [])
                    print(f"   ✅ Generated {certificates_generated} certificates")
                    if errors:
                        print(f"   ⚠️ {len(errors)} errors occurred")
                    
                    # Store for later tests
                    self.certificates_generated = certificates_generated
        finally:
            os.unlink(temp_csv.name)
        
        # Test 2: Test authorization
        temp_csv = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv')
        temp_csv.write("Name,Email,Role\nTest User,test@example.com,participation")
        temp_csv.close()
        
        try:
            with open(temp_csv.name, 'rb') as f:
                files = {'file': ('test.csv', f, 'text/csv')}
                
                temp_token = self.organizer_session_token
                self.organizer_session_token = None
                
                success, response = self.run_test(
                    "Bulk Generate Without Auth (Should Fail)",
                    "POST",
                    f"hackathons/{self.hackathon_id}/certificates/bulk-generate",
                    401,
                    files=files
                )
                
                self.organizer_session_token = temp_token
                
                if success:
                    print(f"   ✅ Correctly blocked unauthorized bulk generation")
        finally:
            os.unlink(temp_csv.name)
        
        # Test 3: Test invalid CSV format
        invalid_csv = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv')
        invalid_csv.write("Invalid,Headers\nTest,Data")
        invalid_csv.close()
        
        try:
            with open(invalid_csv.name, 'rb') as f:
                files = {'file': ('invalid.csv', f, 'text/csv')}
                
                success, response = self.run_test(
                    "Bulk Generate with Invalid CSV (Should Fail)",
                    "POST",
                    f"hackathons/{self.hackathon_id}/certificates/bulk-generate",
                    400,
                    files=files
                )
                
                if success:
                    print(f"   ✅ Correctly rejected invalid CSV format")
        finally:
            os.unlink(invalid_csv.name)

    def test_certificate_retrieval(self):
        """Test GET /api/certificates/retrieve"""
        print("\n🔍 Testing Certificate Retrieval...")
        
        # Test 1: Retrieve existing certificate (case-insensitive name)
        success, response = self.run_test(
            "Retrieve Certificate by Name and Email",
            "GET",
            f"certificates/retrieve?name=John Doe&email=john.doe@example.com&hackathon_id={self.hackathon_id}",
            200
        )
        
        if success:
            certificate_id = response.get('certificate_id')
            if certificate_id:
                print(f"   ✅ Certificate retrieved: {certificate_id}")
                self.test_certificate_id = certificate_id
            else:
                print(f"   ⚠️ Certificate retrieved but no ID")
        
        # Test 2: Case-insensitive name matching
        success, response = self.run_test(
            "Retrieve Certificate with Different Case",
            "GET",
            f"certificates/retrieve?name=JOHN DOE&email=john.doe@example.com&hackathon_id={self.hackathon_id}",
            200
        )
        
        if success:
            print(f"   ✅ Case-insensitive name matching works")
        
        # Test 3: Certificate not found
        success, response = self.run_test(
            "Retrieve Non-existent Certificate",
            "GET",
            f"certificates/retrieve?name=Non Existent&email=nonexistent@example.com&hackathon_id={self.hackathon_id}",
            404
        )
        
        if success:
            print(f"   ✅ Correctly returned 404 for non-existent certificate")
        
        # Test 4: No authentication required (public endpoint)
        temp_token = self.organizer_session_token
        self.organizer_session_token = None
        
        success, response = self.run_test(
            "Retrieve Certificate Without Auth (Should Work)",
            "GET",
            f"certificates/retrieve?name=Jane Smith&email=jane.smith@example.com&hackathon_id={self.hackathon_id}",
            200
        )
        
        self.organizer_session_token = temp_token
        
        if success:
            print(f"   ✅ Public endpoint works without authentication")

    def test_certificate_verification(self):
        """Test GET /api/certificates/verify/{certificate_id}"""
        print("\n✅ Testing Certificate Verification...")
        
        if not hasattr(self, 'test_certificate_id'):
            print("   ⚠️ No certificate ID available for verification test")
            return
        
        # Test 1: Verify valid certificate
        temp_token = self.organizer_session_token
        self.organizer_session_token = None
        
        success, response = self.run_test(
            "Verify Valid Certificate (Public)",
            "GET",
            f"certificates/verify/{self.test_certificate_id}",
            200
        )
        
        self.organizer_session_token = temp_token
        
        if success:
            hackathon_name = response.get('hackathon_name')
            user_name = response.get('user_name')
            role = response.get('role')
            
            if hackathon_name and user_name and role:
                print(f"   ✅ Certificate verified: {user_name} - {role} in {hackathon_name}")
            else:
                print(f"   ⚠️ Certificate verified but missing details")
        
        # Test 2: Verify invalid certificate ID
        fake_certificate_id = "INVALID12345"
        
        success, response = self.run_test(
            "Verify Invalid Certificate ID",
            "GET",
            f"certificates/verify/{fake_certificate_id}",
            404
        )
        
        if success:
            print(f"   ✅ Correctly returned 404 for invalid certificate ID")

    def test_hackathon_certificates_list(self):
        """Test GET /api/hackathons/{hackathon_id}/certificates"""
        print("\n📋 Testing Hackathon Certificates List...")
        
        # Test 1: Get certificates list (organizer only)
        success, response = self.run_test(
            "Get Hackathon Certificates List",
            "GET",
            f"hackathons/{self.hackathon_id}/certificates",
            200
        )
        
        if success:
            total = response.get('total', 0)
            certificates = response.get('certificates', [])
            
            if total > 0 and len(certificates) > 0:
                print(f"   ✅ Retrieved {total} certificates")
                
                # Verify certificate structure
                first_cert = certificates[0]
                if all(key in first_cert for key in ['certificate_id', 'user_name', 'user_email', 'role']):
                    print(f"   ✅ Certificate structure is correct")
                else:
                    print(f"   ⚠️ Certificate structure missing required fields")
            else:
                print(f"   ⚠️ No certificates found in list")
        
        # Test 2: Test authorization
        temp_token = self.organizer_session_token
        self.organizer_session_token = None
        
        success, response = self.run_test(
            "Get Certificates Without Auth (Should Fail)",
            "GET",
            f"hackathons/{self.hackathon_id}/certificates",
            401
        )
        
        self.organizer_session_token = temp_token
        
        if success:
            print(f"   ✅ Correctly blocked unauthorized access to certificates list")

    def run_all_tests(self):
        """Run all certificate system tests"""
        print("🎯 CERTIFICATE ISSUANCE SYSTEM - COMPREHENSIVE BACKEND TESTING")
        print("=" * 70)
        
        # Setup
        if not self.create_test_organizer():
            print("❌ Failed to create test organizer - aborting tests")
            return False
        
        if not self.create_test_hackathon():
            print("❌ Failed to create test hackathon - aborting tests")
            return False
        
        # Run all certificate tests
        self.test_certificate_template_upload()
        self.test_certificate_positions_update()
        self.test_certificate_template_get()
        self.test_bulk_certificate_generation()
        self.test_certificate_retrieval()
        self.test_certificate_verification()
        self.test_hackathon_certificates_list()
        
        # Summary
        print("\n" + "=" * 70)
        print(f"📊 CERTIFICATE SYSTEM TEST SUMMARY")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL CERTIFICATE SYSTEM TESTS PASSED!")
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            
            # Show failed tests
            failed_tests = [t for t in self.test_results if not t['success']]
            if failed_tests:
                print("\n❌ Failed Tests:")
                for test in failed_tests:
                    print(f"   - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = CertificateSystemTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)