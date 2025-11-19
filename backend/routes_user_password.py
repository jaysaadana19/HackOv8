# Endpoint to allow Google OAuth users to set a password for backup login
# This will be added to server.py

from pydantic import BaseModel

class SetPasswordRequest(BaseModel):
    password: str

@api_router.post("/auth/set-password")
async def set_password(request_data: SetPasswordRequest, request: Request):
    """Allow Google OAuth users to set a password for backup login"""
    user = await get_current_user(request)
    
    # Check if user already has a password
    user_doc = await db.users.find_one({"_id": user.id})
    
    if user_doc.get("password_hash"):
        raise HTTPException(status_code=400, detail="Password already set. Use change password instead.")
    
    # Hash the new password
    password_hash = pwd_context.hash(request_data.password)
    
    # Update user with password
    await db.users.update_one(
        {"_id": user.id},
        {"$set": {"password_hash": password_hash}}
    )
    
    return {"message": "Password set successfully. You can now login with email and password."}
