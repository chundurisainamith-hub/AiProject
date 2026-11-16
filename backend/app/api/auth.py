import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.core.security import get_password_hash, verify_password, create_access_token
from backend.app.models.all_models import User, AdminRequest
from backend.app.schemas.all_schemas import LoginRequest, TokenResponse, UserResponse
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    username = req.username.strip().lower()
    password = req.password
    mode = (req.login_type or "user").lower()

    # Determine mode based on username suffix or explicit mode
    if mode == "admin" or username.endswith("@adm.com"):
        if not username.endswith("@adm.com"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Login failed: admin username must end with @adm.com"
            )
        if len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters"
            )

        # Check if any owner exists
        owner_exists = db.query(User).filter(User.role == "owner").first() is not None

        # Check if this admin is already in the approved users table
        admin_user = db.query(User).filter(User.username == username).first()

        if not owner_exists:
            # The very first admin registered becomes OWNER
            hashed_pwd = get_password_hash(password)
            owner_user = User(
                username=username,
                hashed_password=hashed_pwd,
                role="owner",
                is_active=True
            )
            db.add(owner_user)
            db.commit()
            db.refresh(owner_user)

            token = create_access_token(subject=owner_user.username, role="owner")
            return TokenResponse(
                access_token=token,
                role="owner",
                username=owner_user.username,
                message="Owner administrator account established and logged in"
            )

        if admin_user:
            # Admin already approved/registered in User table
            if not verify_password(password, admin_user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Login failed: incorrect password"
                )
            token = create_access_token(subject=admin_user.username, role=admin_user.role)
            return TokenResponse(
                access_token=token,
                role=admin_user.role,
                username=admin_user.username,
                message="Administrator authentication successful"
            )

        # If not in users table, check pending/rejected requests in admin_requests table
        admin_req = db.query(AdminRequest).filter(AdminRequest.username == username).first()
        if not admin_req:
            # Create pending request
            hashed_pwd = get_password_hash(password)
            new_req = AdminRequest(
                username=username,
                hashed_password=hashed_pwd,
                status="pending"
            )
            db.add(new_req)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_202_ACCEPTED,
                detail="Request sent to the admin. You can sign in once it is accepted."
            )
        else:
            if not verify_password(password, admin_req.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Login failed: incorrect password"
                )
            if admin_req.status == "pending":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your request is still waiting for approval."
                )
            elif admin_req.status == "rejected":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your admin request was rejected."
                )
            elif admin_req.status == "approved":
                # Create user record if not migrated yet
                new_admin = User(
                    username=admin_req.username,
                    hashed_password=admin_req.hashed_password,
                    role="admin",
                    is_active=True
                )
                db.add(new_admin)
                db.commit()
                db.refresh(new_admin)
                token = create_access_token(subject=new_admin.username, role="admin")
                return TokenResponse(
                    access_token=token,
                    role="admin",
                    username=new_admin.username,
                    message="Administrator account activated"
                )

    else:
        # User login mode
        if not username.endswith("@ner.com"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Login failed: username must end with @NER.com"
            )
        if len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters"
            )

        user = db.query(User).filter(User.username == username).first()
        if not user:
            # First time user login auto-registers
            hashed_pwd = get_password_hash(password)
            user = User(
                username=username,
                hashed_password=hashed_pwd,
                role="user",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            if not verify_password(password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Login failed: incorrect password"
                )

        token = create_access_token(subject=user.username, role=user.role)
        return TokenResponse(
            access_token=token,
            role=user.role,
            username=user.username,
            message="User authentication successful"
        )

@router.post("/register", response_model=TokenResponse)
def register(req: LoginRequest, db: Session = Depends(get_db)):
    """Explicit registration endpoint delegating to the verified multi-tier registration pipeline."""
    return login(req, db=db)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
