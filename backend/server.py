from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from passlib.context import CryptContext
import secrets
import json
import shutil
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==================== MODELS ====================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    email: EmailStr
    name: str
    password_hash: Optional[str] = None  # For email/password auth
    role: str = "participant"  # admin, organizer, judge, participant
    picture: Optional[str] = None
    bio: Optional[str] = None
    github_link: Optional[str] = None
    linkedin_link: Optional[str] = None
    company_id: Optional[str] = None  # Link to company if organizer
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None  # Track user logins for retention
    email_verified: bool = False
    verification_token: Optional[str] = None
    
    class Config:
        populate_by_name = True

class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    name: str
    email: EmailStr
    website: Optional[str] = None
    logo: Optional[str] = None
    description: Optional[str] = None
    admin_user_id: str  # User who owns this company
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Hackathon(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    title: str
    slug: str  # SEO-friendly URL slug
    description: str
    cover_image: Optional[str] = None
    organizer_id: str
    organizer_name: str
    category: str
    location: str  # online/offline/hybrid
    venue: Optional[str] = None
    registration_start: datetime
    registration_end: datetime
    event_start: datetime
    event_end: datetime
    submission_deadline: datetime
    max_team_size: int = 4
    min_team_size: int = 1
    prizes: List[Dict[str, Any]] = []
    rules: str = ""
    judging_rubric: List[Dict[str, Any]] = []  # [{"criteria": "Innovation", "max_score": 10}]
    faqs: List[Dict[str, str]] = []
    status: str = "pending_approval"  # pending_approval, draft, published, ongoing, completed, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None  # Admin user ID who approved
    featured: bool = False  # Admin can feature good hackathons
    featured_at: Optional[datetime] = None
    # Social profiles and community
    twitter_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    community_url: Optional[str] = None  # Slack/Discord
    community_type: Optional[str] = None  # slack, discord, other
    co_organizers: List[str] = []  # List of user IDs who can co-manage this hackathon
    
    class Config:
        populate_by_name = True

class Team(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    name: str
    hackathon_id: str
    leader_id: str
    members: List[str] = []  # user IDs
    invite_code: str = Field(default_factory=lambda: secrets.token_urlsafe(8))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True

class Registration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str
    hackathon_id: str
    team_id: Optional[str] = None
    status: str = "registered"  # registered, cancelled
    registered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True

class Submission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    team_id: str
    hackathon_id: str
    project_name: str
    description: str
    repo_link: Optional[str] = None
    video_link: Optional[str] = None
    demo_link: Optional[str] = None
    files: List[str] = []  # file paths
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    winner_position: Optional[int] = None  # 1 for 1st place, 2 for 2nd, 3 for 3rd
    
    class Config:
        populate_by_name = True

class JudgeAssignment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str
    hackathon_id: str
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True

class Score(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    submission_id: str
    judge_id: str
    hackathon_id: str
    rubric_scores: Dict[str, float] = {}  # {"Innovation": 8.5, "Technical": 9.0}
    feedback: Optional[str] = None
    total_score: float = 0.0
    scored_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str
    type: str  # registration, submission, result, team_invite
    title: str
    message: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True

# Request/Response Models
class SessionResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    picture: Optional[str]
    session_token: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "participant"  # participant or organizer
    company_name: Optional[str] = None  # For organizers
    company_website: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class HackathonCreate(BaseModel):
    title: str
    description: str
    cover_image: Optional[str] = None
    category: str
    location: str
    venue: Optional[str] = None
    registration_start: datetime
    registration_end: datetime
    event_start: datetime
    event_end: datetime
    submission_deadline: datetime
    max_team_size: int = 4
    min_team_size: int = 1
    prizes: List[Dict[str, Any]] = []
    rules: str = ""
    judging_rubric: List[Dict[str, Any]] = []
    faqs: List[Dict[str, str]] = []
    # Social profiles and community
    twitter_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    community_url: Optional[str] = None
    community_type: Optional[str] = None

class TeamCreate(BaseModel):
    name: str
    hackathon_id: str

class SubmissionCreate(BaseModel):
    team_id: str
    hackathon_id: str
    project_name: str
    description: str
    repo_link: Optional[str] = None
    video_link: Optional[str] = None
    demo_link: Optional[str] = None

class ScoreCreate(BaseModel):
    submission_id: str
    rubric_scores: Dict[str, float]
    feedback: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    github_link: Optional[str] = None
    linkedin_link: Optional[str] = None

# ==================== AUTH HELPER ====================

async def get_current_user(request: Request) -> User:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": session_token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    # Handle timezone-aware comparison
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    # Find user
    user_doc = await db.users.find_one({"_id": session["user_id"]})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_doc["id"] = user_doc.pop("_id")
    return User(**user_doc)

async def require_role(user: User, allowed_roles: List[str]):
    if user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

# ==================== HELPER FUNCTIONS ====================

def generate_slug(title: str, existing_slugs: List[str] = []) -> str:
    """Generate a URL-friendly slug from title"""
    # Convert to lowercase and replace spaces with hyphens
    slug = title.lower().strip()
    # Remove special characters, keep only alphanumeric and hyphens
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    
    # Ensure uniqueness by appending number if needed
    original_slug = slug
    counter = 1
    while slug in existing_slugs:
        slug = f"{original_slug}-{counter}"
        counter += 1
    
    return slug

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def process_session(request: Request):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session ID")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to validate session: {str(e)}")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": data["email"]})
    
    if existing_user:
        user_id = existing_user["_id"]
        # Update last login for retention tracking
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
    else:
        # Create new user
        user = User(
            email=data["email"],
            name=data["name"],
            picture=data.get("picture"),
            role="participant",
            last_login=datetime.now(timezone.utc)
        )
        user_dict = user.dict(by_alias=True)
        await db.users.insert_one(user_dict)
        user_id = user_dict["_id"]
    
    # Create session
    session = UserSession(
        user_id=user_id,
        session_token=data["session_token"],
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    await db.user_sessions.insert_one(session.dict())
    
    return SessionResponse(
        id=user_id,
        email=data["email"],
        name=data["name"],
        picture=data.get("picture"),
        session_token=data["session_token"]
    )

@api_router.post("/auth/google/callback")
async def google_callback(code: str, redirect_uri: str):
    """Handle Google OAuth callback"""
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    
    if not client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'code': code,
                    'client_id': client_id,
                    'redirect_uri': redirect_uri,
                    'grant_type': 'authorization_code'
                }
            )
            token_response.raise_for_status()
            tokens = token_response.json()
            
            # Get user info from Google
            user_info_response = await client.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {tokens["access_token"]}'}
            )
            user_info_response.raise_for_status()
            user_info = user_info_response.json()
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Google OAuth failed: {str(e)}")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_info["email"]})
    
    if existing_user:
        user_id = existing_user["_id"]
        # Update last login
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
    else:
        # Create new user
        user = User(
            email=user_info["email"],
            name=user_info.get("name", user_info["email"].split("@")[0]),
            picture=user_info.get("picture"),
            role="participant",
            last_login=datetime.now(timezone.utc)
        )
        user_dict = user.dict(by_alias=True)
        await db.users.insert_one(user_dict)
        user_id = user_dict["_id"]
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    await db.user_sessions.insert_one(session.dict())
    
    # Get user data
    user_doc = await db.users.find_one({"_id": user_id})
    
    return SessionResponse(
        id=user_id,
        email=user_doc["email"],
        name=user_doc["name"],
        picture=user_doc.get("picture"),
        session_token=session_token
    )

@api_router.get("/auth/me")
async def get_current_user_info(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.post("/auth/signup")
async def signup(signup_data: SignupRequest):
    # Check if user exists
    existing_user = await db.users.find_one({"email": signup_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_hash = pwd_context.hash(signup_data.password)
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Create user
    user = User(
        email=signup_data.email,
        name=signup_data.name,
        password_hash=password_hash,
        role=signup_data.role,
        email_verified=False,
        verification_token=verification_token
    )
    user_dict = user.dict(by_alias=True)
    await db.users.insert_one(user_dict)
    user_id = user_dict["_id"]
    
    # Send verification email (simulated - in production use actual email service)
    print(f"[EMAIL VERIFICATION] Send to {signup_data.email}")
    print(f"[VERIFICATION LINK] /api/auth/verify-email?token={verification_token}")
    # TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    
    # If organizer with company, create company
    company_id = None
    if signup_data.role == "organizer" and signup_data.company_name:
        company = Company(
            name=signup_data.company_name,
            email=signup_data.email,
            website=signup_data.company_website,
            admin_user_id=user_id
        )
        company_dict = company.dict(by_alias=True)
        await db.companies.insert_one(company_dict)
        company_id = company_dict["_id"]
        
        # Update user with company_id
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"company_id": company_id}}
        )
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    await db.user_sessions.insert_one(session.dict())
    
    return SessionResponse(
        id=user_id,
        email=signup_data.email,
        name=signup_data.name,
        role=signup_data.role,
        picture=None,
        session_token=session_token
    )

@api_router.post("/auth/login")
async def login(login_data: LoginRequest):
    # Find user
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Please use Google login for this account")
    
    if not pwd_context.verify(login_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login for retention tracking
    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    session = UserSession(
        user_id=user_doc["_id"],
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    await db.user_sessions.insert_one(session.dict())
    
    return SessionResponse(
        id=user_doc["_id"],
        email=user_doc["email"],
        name=user_doc["name"],
        picture=user_doc.get("picture"),
        session_token=session_token
    )

@api_router.post("/auth/change-password")
async def change_password(old_password: str, new_password: str, request: Request):
    user = await get_current_user(request)
    
    # Get user from database
    user_doc = await db.users.find_one({"_id": user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify old password
    if not pwd_context.verify(old_password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    # Hash new password
    hashed_password = pwd_context.hash(new_password)
    
    # Update password
    await db.users.update_one(
        {"_id": user.id},
        {"$set": {"password_hash": hashed_password}}
    )
    
    return {"message": "Password changed successfully"}

@api_router.get("/auth/verify-email")
async def verify_email(token: str):
    # Find user by verification token
    user = await db.users.find_one({"verification_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    if user.get("email_verified"):
        return {"message": "Email already verified"}
    
    # Update user as verified
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"email_verified": True, "verification_token": None}}
    )
    
    return {"message": "Email verified successfully"}

@api_router.post("/auth/resend-verification")
async def resend_verification(request: Request):
    user = await get_current_user(request)
    
    user_doc = await db.users.find_one({"_id": user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_doc.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate new token
    verification_token = secrets.token_urlsafe(32)
    await db.users.update_one(
        {"_id": user.id},
        {"$set": {"verification_token": verification_token}}
    )
    
    # Send verification email
    print(f"[EMAIL VERIFICATION] Resend to {user_doc['email']}")
    print(f"[VERIFICATION LINK] /api/auth/verify-email?token={verification_token}")
    
    return {"message": "Verification email sent"}

# ==================== COMPANY ROUTES ====================

@api_router.get("/companies/my")
async def get_my_company(request: Request):
    user = await get_current_user(request)
    if not user.company_id:
        return None
    
    company_doc = await db.companies.find_one({"_id": user.company_id})
    if not company_doc:
        return None
    
    company_doc["id"] = company_doc.pop("_id")
    return company_doc

@api_router.put("/companies/my")
async def update_company(company_data: Dict[str, Any], request: Request):
    user = await get_current_user(request)
    if not user.company_id:
        raise HTTPException(status_code=404, detail="No company found")
    
    await db.companies.update_one(
        {"_id": user.company_id},
        {"$set": company_data}
    )
    
    return {"message": "Company updated successfully"}

# ==================== USER ROUTES ====================

@api_router.put("/users/profile")
async def update_profile(update: UserUpdate, request: Request):
    user = await get_current_user(request)
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        await db.users.update_one(
            {"_id": user.id},
            {"$set": update_data}
        )
    
    return {"message": "Profile updated successfully"}

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user_doc = await db.users.find_one({"_id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    user_doc["id"] = user_doc.pop("_id")
    return User(**user_doc)

# ==================== HACKATHON ROUTES ====================

@api_router.get("/hackathons")
async def get_hackathons(
    status: Optional[str] = None,
    category: Optional[str] = None,
    location: Optional[str] = None,
    featured_only: bool = False
):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if location:
        query["location"] = location
    if featured_only:
        query["featured"] = True
    
    # Sort: featured first, then by creation date
    hackathons = await db.hackathons.find(query).sort([("featured", -1), ("created_at", -1)]).to_list(100)
    return [{**h, "id": h.pop("_id")} for h in hackathons]

@api_router.get("/hackathons/slug/{slug}")
async def get_hackathon_by_slug(slug: str):
    """Get hackathon by SEO-friendly slug"""
    hackathon = await db.hackathons.find_one({"slug": slug})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return {**hackathon, "id": hackathon.pop("_id")}

@api_router.get("/hackathons/{hackathon_id}")
async def get_hackathon(hackathon_id: str):
    """Get hackathon by ID (for backward compatibility)"""
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    hackathon["id"] = hackathon.pop("_id")
    return hackathon

@api_router.post("/hackathons", response_model=Hackathon)
async def create_hackathon(hackathon_data: HackathonCreate, request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin", "organizer"])
    
    # Set status to pending_approval for organizers, published for admins
    initial_status = "published" if user.role == "admin" else "pending_approval"
    
    # Generate unique slug from title
    existing_hackathons = await db.hackathons.find({}, {"slug": 1}).to_list(1000)
    existing_slugs = [h.get("slug", "") for h in existing_hackathons if h.get("slug")]
    slug = generate_slug(hackathon_data.title, existing_slugs)
    
    hackathon = Hackathon(
        **hackathon_data.dict(),
        slug=slug,
        organizer_id=user.id,
        organizer_name=user.name,
        status=initial_status
    )
    hackathon_dict = hackathon.dict(by_alias=True)
    await db.hackathons.insert_one(hackathon_dict)
    
    # Send notification to all admins when hackathon is submitted for approval
    if initial_status == "pending_approval":
        admins = await db.users.find({"role": "admin"}).to_list(100)
        for admin in admins:
            await db.notifications.insert_one({
                "_id": str(uuid.uuid4()),
                "user_id": admin["_id"],
                "title": "New Hackathon Pending Approval",
                "message": f"'{hackathon.title}' by {user.name} is awaiting your approval.",
                "type": "hackathon_pending",
                "read": False,
                "created_at": datetime.now(timezone.utc)
            })
    
    return hackathon

@api_router.put("/hackathons/{hackathon_id}")
async def update_hackathon(hackathon_id: str, update_data: Dict[str, Any], request: Request):
    user = await get_current_user(request)
    
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Check if user is organizer, co-organizer, or admin
    is_organizer = hackathon["organizer_id"] == user.id
    is_co_organizer = user.id in hackathon.get("co_organizers", [])
    is_admin = user.role == "admin"
    
    if not (is_organizer or is_co_organizer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.hackathons.update_one(
        {"_id": hackathon_id},
        {"$set": update_data}
    )
    
    return {"message": "Hackathon updated successfully"}

@api_router.delete("/hackathons/{hackathon_id}")
async def delete_hackathon(hackathon_id: str, request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    await db.hackathons.delete_one({"_id": hackathon_id})
    return {"message": "Hackathon deleted successfully"}

@api_router.get("/hackathons/organizer/my")
async def get_my_hackathons(request: Request):
    user = await get_current_user(request)
    await require_role(user, ["organizer", "admin"])
    
    # Get hackathons where user is organizer OR co-organizer
    hackathons = await db.hackathons.find({
        "$or": [
            {"organizer_id": user.id},
            {"co_organizers": user.id}
        ]
    }).sort("created_at", -1).to_list(100)
    return [{**h, "id": h.pop("_id")} for h in hackathons]


@api_router.post("/hackathons/{hackathon_id}/co-organizers")
async def add_co_organizer(hackathon_id: str, email: str, request: Request):
    """Add a co-organizer to a hackathon by email"""
    user = await get_current_user(request)
    
    # Get hackathon
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Check if user is organizer, co-organizer, or admin
    is_organizer = hackathon["organizer_id"] == user.id
    is_co_organizer = user.id in hackathon.get("co_organizers", [])
    is_admin = user.role == "admin"
    
    if not (is_organizer or is_co_organizer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to add co-organizers")
    
    # Find user by email
    co_organizer = await db.users.find_one({"email": email})
    if not co_organizer:
        raise HTTPException(status_code=404, detail="User not found with this email")
    
    co_organizer_id = co_organizer["_id"]
    
    # Check if already a co-organizer
    if co_organizer_id in hackathon.get("co_organizers", []):
        raise HTTPException(status_code=400, detail="User is already a co-organizer")
    
    # Check if it's the main organizer
    if co_organizer_id == hackathon["organizer_id"]:
        raise HTTPException(status_code=400, detail="Cannot add main organizer as co-organizer")
    
    # Add co-organizer
    await db.hackathons.update_one(
        {"_id": hackathon_id},
        {"$addToSet": {"co_organizers": co_organizer_id}}
    )
    
    return {"message": f"Co-organizer {co_organizer['name']} added successfully", "user": {
        "id": co_organizer_id,
        "name": co_organizer["name"],
        "email": co_organizer["email"]
    }}

@api_router.delete("/hackathons/{hackathon_id}/co-organizers/{user_id}")
async def remove_co_organizer(hackathon_id: str, user_id: str, request: Request):
    """Remove a co-organizer from a hackathon"""
    user = await get_current_user(request)
    
    # Get hackathon
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Check if user is organizer, co-organizer, or admin
    is_organizer = hackathon["organizer_id"] == user.id
    is_co_organizer = user.id in hackathon.get("co_organizers", [])
    is_admin = user.role == "admin"
    
    if not (is_organizer or is_co_organizer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to remove co-organizers")
    
    # Remove co-organizer
    await db.hackathons.update_one(
        {"_id": hackathon_id},
        {"$pull": {"co_organizers": user_id}}
    )
    
    return {"message": "Co-organizer removed successfully"}

@api_router.get("/hackathons/{hackathon_id}/co-organizers")
async def get_co_organizers(hackathon_id: str, request: Request):
    """Get list of co-organizers for a hackathon"""
    user = await get_current_user(request)
    
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Check if user has access
    is_organizer = hackathon["organizer_id"] == user.id
    is_co_organizer = user.id in hackathon.get("co_organizers", [])
    is_admin = user.role == "admin"
    
    if not (is_organizer or is_co_organizer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get co-organizer details
    co_organizer_ids = hackathon.get("co_organizers", [])
    co_organizers = []
    
    for org_id in co_organizer_ids:
        org_user = await db.users.find_one({"_id": org_id})
        if org_user:
            co_organizers.append({
                "id": org_user["_id"],
                "name": org_user["name"],
                "email": org_user["email"]
            })
    
    return co_organizers

@api_router.post("/hackathons/{hackathon_id}/notify-participants")
async def notify_hackathon_participants(hackathon_id: str, title: str, message: str, request: Request):
    user = await get_current_user(request)
    
    # Check if user is the organizer, co-organizer, or admin
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    is_organizer = hackathon["organizer_id"] == user.id
    is_co_organizer = user.id in hackathon.get("co_organizers", [])
    is_admin = user.role == "admin"
    
    if not (is_organizer or is_co_organizer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all participants
    registrations = await db.registrations.find({"hackathon_id": hackathon_id}).to_list(1000)
    participant_ids = list(set([reg["user_id"] for reg in registrations]))
    
    # Send notification to all participants
    notifications_sent = 0
    for participant_id in participant_ids:
        notification = Notification(
            user_id=participant_id,
            type="hackathon_update",
            title=f"Update: {hackathon['title']}",
            message=f"{title}\n\n{message}"
        )
        await db.notifications.insert_one(notification.dict(by_alias=True))
        notifications_sent += 1
    
    return {
        "message": f"Notification sent to {notifications_sent} participants",
        "count": notifications_sent
    }

# Duplicate function removed - using the first add_co_organizer function above

# Duplicate function removed - using the first remove_co_organizer function above

@api_router.put("/submissions/{submission_id}/winner")
async def set_winner(submission_id: str, position: int, request: Request):
    user = await get_current_user(request)
    
    if position not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Position must be 1, 2, or 3")
    
    # Get submission
    submission = await db.submissions.find_one({"_id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Get hackathon
    hackathon = await db.hackathons.find_one({"_id": submission["hackathon_id"]})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Check if user is organizer, co-organizer, or admin
    is_organizer = hackathon["organizer_id"] == user.id
    is_co_organizer = user.id in hackathon.get("co_organizers", [])
    is_admin = user.role == "admin"
    
    if not (is_organizer or is_co_organizer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update submission with winner position
    await db.submissions.update_one(
        {"_id": submission_id},
        {"$set": {"winner_position": position}}
    )
    
    return {"message": f"Set as position {position} winner", "submission_id": submission_id}

@api_router.delete("/submissions/{submission_id}/winner")
async def remove_winner(submission_id: str, request: Request):
    user = await get_current_user(request)
    
    submission = await db.submissions.find_one({"_id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    hackathon = await db.hackathons.find_one({"_id": submission["hackathon_id"]})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    is_organizer = hackathon["organizer_id"] == user.id
    is_co_organizer = user.id in hackathon.get("co_organizers", [])
    is_admin = user.role == "admin"
    
    if not (is_organizer or is_co_organizer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.submissions.update_one(
        {"_id": submission_id},
        {"$set": {"winner_position": None}}
    )
    
    return {"message": "Winner status removed"}

# ==================== FILE UPLOAD ROUTES ====================

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), request: Request = None):
    user = await get_current_user(request)
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only images allowed.")
    
    # Validate file size (max 5MB)
    file_size = 0
    chunk_size = 1024 * 1024  # 1MB chunks
    temp_file = f"/tmp/{uuid.uuid4()}"
    
    with open(temp_file, "wb") as buffer:
        while chunk := await file.read(chunk_size):
            file_size += len(chunk)
            if file_size > 5 * 1024 * 1024:  # 5MB
                os.remove(temp_file)
                raise HTTPException(status_code=400, detail="File too large. Max 5MB allowed.")
            buffer.write(chunk)
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    upload_path = f"/app/uploads/hackathon_banners/{unique_filename}"
    
    # Move file to uploads directory
    shutil.move(temp_file, upload_path)
    
    # Return URL (will be served by static files)
    file_url = f"/uploads/hackathon_banners/{unique_filename}"
    
    return {
        "url": file_url,
        "filename": unique_filename,
        "message": "File uploaded successfully"
    }

# ==================== REGISTRATION ROUTES ====================

@api_router.post("/registrations")
async def register_for_hackathon(hackathon_id: str, team_id: Optional[str] = None, request: Request = None):
    user = await get_current_user(request)
    
    # Check if already registered
    existing = await db.registrations.find_one({
        "user_id": user.id,
        "hackathon_id": hackathon_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")
    
    registration = Registration(
        user_id=user.id,
        hackathon_id=hackathon_id,
        team_id=team_id
    )
    await db.registrations.insert_one(registration.dict(by_alias=True))
    
    # Create notification
    notification = Notification(
        user_id=user.id,
        type="registration",
        title="Registration Successful",
        message=f"You have successfully registered for the hackathon"
    )
    await db.notifications.insert_one(notification.dict(by_alias=True))
    
    return {"message": "Registered successfully"}

@api_router.get("/registrations/my")
async def get_my_registrations(request: Request):
    user = await get_current_user(request)
    registrations = await db.registrations.find({"user_id": user.id}).to_list(100)
    return [{**r, "id": r.pop("_id")} for r in registrations]

@api_router.get("/hackathons/{hackathon_id}/registrations")
async def get_hackathon_registrations(hackathon_id: str, request: Request):
    user = await get_current_user(request)
    
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Check if user is organizer, co-organizer, or admin
    is_organizer = hackathon["organizer_id"] == user.id
    is_co_organizer = user.id in hackathon.get("co_organizers", [])
    is_admin = user.role == "admin"
    
    if not (is_organizer or is_co_organizer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    registrations = await db.registrations.find({"hackathon_id": hackathon_id}).to_list(1000)
    return [{**r, "id": r.pop("_id")} for r in registrations]

@api_router.get("/hackathons/{hackathon_id}/registrations/count")
async def get_hackathon_registration_count(hackathon_id: str):
    """Get registration count for a hackathon (public endpoint)"""
    count = await db.registrations.count_documents({"hackathon_id": hackathon_id})
    return {"count": count}


# ==================== TEAM ROUTES ====================

@api_router.post("/teams", response_model=Team)
async def create_team(team_data: TeamCreate, request: Request):
    user = await get_current_user(request)
    
    # Get hackathon to check team size limits
    hackathon = await db.hackathons.find_one({"_id": team_data.hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Check if user is already in a team for this hackathon
    existing_team = await db.teams.find_one({
        "hackathon_id": team_data.hackathon_id,
        "members": user.id
    })
    if existing_team:
        raise HTTPException(status_code=400, detail="You are already in a team for this hackathon")
    
    team = Team(
        name=team_data.name,
        hackathon_id=team_data.hackathon_id,
        leader_id=user.id,
        members=[user.id]
    )
    team_dict = team.dict(by_alias=True)
    await db.teams.insert_one(team_dict)
    
    return team

@api_router.post("/teams/join")
async def join_team(invite_code: str, request: Request):
    user = await get_current_user(request)
    
    team = await db.teams.find_one({"invite_code": invite_code})
    if not team:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    # Get hackathon to check team size limits
    hackathon = await db.hackathons.find_one({"_id": team["hackathon_id"]})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Check if user is registered for this hackathon
    registration = await db.registrations.find_one({
        "user_id": user.id,
        "hackathon_id": team["hackathon_id"]
    })
    if not registration:
        raise HTTPException(status_code=400, detail="You must register for the hackathon first")
    
    # Check if user is already in a team
    existing_team = await db.teams.find_one({
        "hackathon_id": team["hackathon_id"],
        "members": user.id
    })
    if existing_team:
        raise HTTPException(status_code=400, detail="You are already in a team for this hackathon")
    
    # Check team size limit
    if len(team["members"]) >= hackathon["max_team_size"]:
        raise HTTPException(status_code=400, detail=f"Team is full (max {hackathon['max_team_size']} members)")
    
    # Add user to team
    await db.teams.update_one(
        {"_id": team["_id"]},
        {"$push": {"members": user.id}}
    )
    
    # Update registration with team_id
    await db.registrations.update_one(
        {"_id": registration["_id"]},
        {"$set": {"team_id": team["_id"]}}
    )
    
    return {"message": "Joined team successfully", "team_name": team["name"]}

@api_router.get("/teams/my")
async def get_my_teams(request: Request):
    user = await get_current_user(request)
    teams = await db.teams.find({"members": user.id}).to_list(100)
    return [{**t, "id": t.pop("_id")} for t in teams]

@api_router.get("/hackathons/{hackathon_id}/teams")
async def get_hackathon_teams(hackathon_id: str):
    teams = await db.teams.find({"hackathon_id": hackathon_id}).to_list(100)
    return [{**t, "id": t.pop("_id")} for t in teams]

# ==================== SUBMISSION ROUTES ====================

@api_router.post("/submissions", response_model=Submission)
async def create_submission(submission_data: SubmissionCreate, request: Request):
    user = await get_current_user(request)
    
    # Verify user is in team
    team = await db.teams.find_one({"_id": submission_data.team_id})
    if not team or user.id not in team["members"]:
        raise HTTPException(status_code=403, detail="Not a team member")
    
    submission = Submission(**submission_data.dict())
    submission_dict = submission.dict(by_alias=True)
    await db.submissions.insert_one(submission_dict)
    
    # Notify team members
    for member_id in team["members"]:
        notification = Notification(
            user_id=member_id,
            type="submission",
            title="Project Submitted",
            message=f"Your team has submitted the project: {submission_data.project_name}"
        )
        await db.notifications.insert_one(notification.dict(by_alias=True))
    
    return submission

@api_router.get("/hackathons/{hackathon_id}/submissions")
async def get_hackathon_submissions(hackathon_id: str, request: Request):
    user = await get_current_user(request)
    
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Check if user is organizer, judge or admin
    is_organizer = hackathon["organizer_id"] == user.id
    is_judge = await db.judge_assignments.find_one({"user_id": user.id, "hackathon_id": hackathon_id})
    is_admin = user.role == "admin"
    
    if not (is_organizer or is_judge or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    submissions = await db.submissions.find({"hackathon_id": hackathon_id}).to_list(1000)
    return [{**s, "id": s.pop("_id")} for s in submissions]

@api_router.get("/teams/{team_id}/submission")
async def get_team_submission(team_id: str, hackathon_id: str):
    submission = await db.submissions.find_one({
        "team_id": team_id,
        "hackathon_id": hackathon_id
    })
    if not submission:
        return None
    submission["id"] = submission.pop("_id")
    return submission

# ==================== JUDGE ROUTES ====================

@api_router.post("/judges/assign")
async def assign_judge(hackathon_id: str, judge_user_id: str, request: Request):
    user = await get_current_user(request)
    
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    if user.role != "admin" and hackathon["organizer_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update user role to judge if not already
    await db.users.update_one(
        {"_id": judge_user_id},
        {"$set": {"role": "judge"}}
    )
    
    assignment = JudgeAssignment(
        user_id=judge_user_id,
        hackathon_id=hackathon_id
    )
    await db.judge_assignments.insert_one(assignment.dict(by_alias=True))
    
    return {"message": "Judge assigned successfully"}

@api_router.post("/scores", response_model=Score)
async def submit_score(score_data: ScoreCreate, request: Request):
    user = await get_current_user(request)
    await require_role(user, ["judge", "admin"])
    
    # Get submission to find hackathon_id
    submission = await db.submissions.find_one({"_id": score_data.submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Calculate total score
    total = sum(score_data.rubric_scores.values())
    
    score = Score(
        submission_id=score_data.submission_id,
        judge_id=user.id,
        hackathon_id=submission["hackathon_id"],
        rubric_scores=score_data.rubric_scores,
        feedback=score_data.feedback,
        total_score=total
    )
    score_dict = score.dict(by_alias=True)
    await db.scores.insert_one(score_dict)
    
    return score

@api_router.get("/submissions/{submission_id}/scores")
async def get_submission_scores(submission_id: str, request: Request):
    user = await get_current_user(request)
    
    scores = await db.scores.find({"submission_id": submission_id}).to_list(100)
    return [{**s, "id": s.pop("_id")} for s in scores]

@api_router.get("/hackathons/{hackathon_id}/leaderboard")
async def get_leaderboard(hackathon_id: str):
    submissions = await db.submissions.find({"hackathon_id": hackathon_id}).to_list(1000)
    
    leaderboard = []
    for submission in submissions:
        scores = await db.scores.find({"submission_id": submission["_id"]}).to_list(100)
        if scores:
            avg_score = sum(s["total_score"] for s in scores) / len(scores)
        else:
            avg_score = 0
        
        team = await db.teams.find_one({"_id": submission["team_id"]})
        
        leaderboard.append({
            "submission_id": submission["_id"],
            "team_name": team["name"] if team else "Unknown",
            "project_name": submission["project_name"],
            "average_score": round(avg_score, 2),
            "judge_count": len(scores)
        })
    
    leaderboard.sort(key=lambda x: x["average_score"], reverse=True)
    return leaderboard

# ==================== NOTIFICATION ROUTES ====================

@api_router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)
    notifications = await db.notifications.find({"user_id": user.id}).sort("created_at", -1).to_list(100)
    return [{**n, "id": n.pop("_id")} for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    user = await get_current_user(request)
    
    await db.notifications.update_one(
        {"_id": notification_id, "user_id": user.id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notification marked as read"}


@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(request: Request):
    user = await get_current_user(request)
    
    result = await db.notifications.update_many(
        {"user_id": user.id, "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": f"Marked {result.modified_count} notifications as read"}


# ==================== ADMIN ROUTES ====================

# Hackathon Management
@api_router.get("/admin/hackathons")
async def get_admin_hackathons(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    query = {}
    if status:
        query["status"] = status
    
    hackathons = await db.hackathons.find(query).sort("created_at", -1).to_list(1000)
    
    # Enrich with counts
    result = []
    for h in hackathons:
        reg_count = await db.registrations.count_documents({"hackathon_id": h["_id"]})
        sub_count = await db.submissions.count_documents({"hackathon_id": h["_id"]})
        result.append({
            **h,
            "id": h.pop("_id"),
            "registration_count": reg_count,
            "submission_count": sub_count
        })
    
    return result

@api_router.put("/admin/hackathons/{hackathon_id}/approve")
async def approve_hackathon(hackathon_id: str, request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    await db.hackathons.update_one(
        {"_id": hackathon_id},
        {"$set": {
            "status": "published",
            "approved_at": datetime.now(timezone.utc),
            "approved_by": user.id
        }}
    )
    
    # Send notification to organizer
    await db.notifications.insert_one({
        "_id": str(uuid.uuid4()),
        "user_id": hackathon["organizer_id"],
        "title": "Hackathon Approved!",
        "message": f"Your hackathon '{hackathon['title']}' has been approved and published.",
        "type": "hackathon_approved",
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Hackathon approved successfully"}

@api_router.put("/admin/hackathons/{hackathon_id}/reject")
async def reject_hackathon(hackathon_id: str, reason: str, request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    await db.hackathons.update_one(
        {"_id": hackathon_id},
        {"$set": {"status": "rejected"}}
    )
    
    # Send notification to organizer
    await db.notifications.insert_one({
        "_id": str(uuid.uuid4()),
        "user_id": hackathon["organizer_id"],
        "title": "Hackathon Rejected",
        "message": f"Your hackathon '{hackathon['title']}' was not approved. Reason: {reason}",
        "type": "hackathon_rejected",
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Hackathon rejected"}

@api_router.put("/admin/hackathons/{hackathon_id}/feature")
async def toggle_featured_hackathon(hackathon_id: str, featured: bool, request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    hackathon = await db.hackathons.find_one({"_id": hackathon_id})
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    update_data = {
        "featured": featured,
        "featured_at": datetime.now(timezone.utc) if featured else None
    }
    
    await db.hackathons.update_one(
        {"_id": hackathon_id},
        {"$set": update_data}
    )
    
    action = "featured" if featured else "unfeatured"
    return {"message": f"Hackathon {action} successfully"}

@api_router.delete("/admin/hackathons/{hackathon_id}")
async def delete_hackathon_admin(hackathon_id: str, request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    # Delete hackathon and related data
    await db.hackathons.delete_one({"_id": hackathon_id})
    await db.registrations.delete_many({"hackathon_id": hackathon_id})
    await db.submissions.delete_many({"hackathon_id": hackathon_id})
    await db.teams.delete_many({"hackathon_id": hackathon_id})
    
    return {"message": "Hackathon deleted successfully"}

# Analytics & Stats
@api_router.get("/admin/stats/overview")
async def get_admin_stats_overview(request: Request, days: int = 30):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days if days > 0 else 36500)  # All time if days = 0
    
    total_users = await db.users.count_documents({})
    new_users = await db.users.count_documents({"created_at": {"$gte": cutoff_date}})
    total_hackathons = await db.hackathons.count_documents({})
    pending_hackathons = await db.hackathons.count_documents({"status": "pending_approval"})
    published_hackathons = await db.hackathons.count_documents({"status": "published"})
    total_registrations = await db.registrations.count_documents({})
    total_submissions = await db.submissions.count_documents({})
    total_teams = await db.teams.count_documents({})
    
    # Get user role distribution
    users = await db.users.find().to_list(10000)
    role_distribution = {}
    for u in users:
        role = u.get("role", "participant")
        role_distribution[role] = role_distribution.get(role, 0) + 1
    
    return {
        "total_users": total_users,
        "new_users": new_users,
        "total_hackathons": total_hackathons,
        "pending_hackathons": pending_hackathons,
        "published_hackathons": published_hackathons,
        "total_registrations": total_registrations,
        "total_submissions": total_submissions,
        "total_teams": total_teams,
        "role_distribution": role_distribution,
        "period_days": days
    }

@api_router.get("/admin/stats/growth")
async def get_growth_stats(request: Request, days: int = 30):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days if days > 0 else 36500)
    
    # Get daily user signups
    users = await db.users.find({"created_at": {"$gte": cutoff_date}}).to_list(10000)
    
    # Get daily hackathon creation
    hackathons = await db.hackathons.find({"created_at": {"$gte": cutoff_date}}).to_list(10000)
    
    # Get daily registrations
    registrations = await db.registrations.find({"created_at": {"$gte": cutoff_date}}).to_list(10000)
    
    # Group by date
    user_growth = {}
    hackathon_growth = {}
    registration_growth = {}
    
    for u in users:
        date_key = u["created_at"].date().isoformat()
        user_growth[date_key] = user_growth.get(date_key, 0) + 1
    
    for h in hackathons:
        date_key = h["created_at"].date().isoformat()
        hackathon_growth[date_key] = hackathon_growth.get(date_key, 0) + 1
    
    for r in registrations:
        date_key = r["created_at"].date().isoformat()
        registration_growth[date_key] = registration_growth.get(date_key, 0) + 1
    
    # Convert to sorted arrays
    dates = sorted(set(list(user_growth.keys()) + list(hackathon_growth.keys()) + list(registration_growth.keys())))
    
    return {
        "dates": dates,
        "user_signups": [user_growth.get(d, 0) for d in dates],
        "hackathon_creations": [hackathon_growth.get(d, 0) for d in dates],
        "registrations": [registration_growth.get(d, 0) for d in dates]
    }

@api_router.get("/admin/stats/retention")
async def get_retention_stats(request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)
    
    # Total users
    total_users = await db.users.count_documents({})
    
    # Users who logged in within last 7 days
    active_7_days = await db.users.count_documents({
        "last_login": {"$gte": seven_days_ago}
    })
    
    # Users who logged in within last 30 days
    active_30_days = await db.users.count_documents({
        "last_login": {"$gte": thirty_days_ago}
    })
    
    # Users who participated in multiple hackathons
    registrations = await db.registrations.find().to_list(10000)
    user_participation = {}
    for reg in registrations:
        user_id = reg["user_id"]
        user_participation[user_id] = user_participation.get(user_id, 0) + 1
    
    multi_hackathon_users = sum(1 for count in user_participation.values() if count > 1)
    
    return {
        "total_users": total_users,
        "active_7_days": active_7_days,
        "active_30_days": active_30_days,
        "retention_rate_7_days": round((active_7_days / total_users * 100) if total_users > 0 else 0, 2),
        "retention_rate_30_days": round((active_30_days / total_users * 100) if total_users > 0 else 0, 2),
        "multi_hackathon_participants": multi_hackathon_users,
        "multi_participation_rate": round((multi_hackathon_users / total_users * 100) if total_users > 0 else 0, 2)
    }

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    total_users = await db.users.count_documents({})
    total_hackathons = await db.hackathons.count_documents({})
    total_registrations = await db.registrations.count_documents({})
    total_submissions = await db.submissions.count_documents({})
    total_teams = await db.teams.count_documents({})
    
    # Get user role distribution
    users = await db.users.find().to_list(10000)
    role_distribution = {}
    for u in users:
        role = u.get("role", "participant")
        role_distribution[role] = role_distribution.get(role, 0) + 1
    
    return {
        "total_users": total_users,
        "total_hackathons": total_hackathons,
        "total_registrations": total_registrations,
        "total_submissions": total_submissions,
        "total_teams": total_teams,
        "role_distribution": role_distribution
    }

@api_router.get("/admin/users")
async def get_all_users(request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    users = await db.users.find().sort("created_at", -1).to_list(1000)
    return [{**u, "id": u.pop("_id")} for u in users]

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, new_role: str, request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    if new_role not in ["admin", "organizer", "judge", "participant"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"role": new_role}}
    )
    
    return {"message": "User role updated successfully"}

@api_router.get("/admin/export/users")
async def export_users(request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    users = await db.users.find().to_list(10000)
    csv_data = "ID,Name,Email,Role,Created At\n"
    for u in users:
        csv_data += f"{u['_id']},{u['name']},{u['email']},{u.get('role', 'participant')},{u['created_at']}\n"
    
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=users.csv"})

@api_router.get("/admin/export/hackathons")
async def export_hackathons(request: Request):
    user = await get_current_user(request)
    await require_role(user, ["admin"])
    
    hackathons = await db.hackathons.find().to_list(10000)
    csv_data = "ID,Title,Organizer,Status,Registrations,Submissions,Created At\n"
    for h in hackathons:
        reg_count = await db.registrations.count_documents({"hackathon_id": h["_id"]})
        sub_count = await db.submissions.count_documents({"hackathon_id": h["_id"]})
        csv_data += f"{h['_id']},{h['title']},{h.get('organizer_name', 'N/A')},{h['status']},{reg_count},{sub_count},{h['created_at']}\n"
    
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=hackathons.csv"})

# Include the router in the main app
app.include_router(api_router)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
