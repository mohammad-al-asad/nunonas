from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from datetime import UTC, datetime

from app.api.deps import (
    get_booking_service,
    get_db,
    get_current_user_id,
    get_loyalty_service,
    get_s3_uploader,
    get_user_repo,
)
from app.core.account_lookup import find_existing_email_async, find_existing_phone_async
from app.core.responses import envelope
from app.core.serializers import to_jsonable
from app.domain import support_tickets
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.providers.s3_uploader import S3Uploader
from app.repositories.user_repository import UserRepository
from app.schemas.user import ImageUploadResponse, PersonalDetailsResponse, PersonalDetailsUpdate
from app.services.booking_service import BookingService
from app.services.loyalty_service import LoyaltyService

router = APIRouter(prefix="/users", tags=["Users"])


def serialize_personal_details(user: dict) -> PersonalDetailsResponse:
    return PersonalDetailsResponse(
        id=str(user["_id"]),
        full_name=user.get("full_name", ""),
        gender=user.get("gender"),
        email=user.get("email"),
        phone=user.get("phone"),
        date_of_birth=user.get("date_of_birth"),
        profile_image_url=user.get("profile_image_url"),
        created_at=user["created_at"],
        points_balance=user.get("points_balance", 0),
        location_enabled=user.get("location_enabled", False),
    )


def _serialize_support_ticket(document: dict) -> dict:
    messages = document.get("messages") if isinstance(document.get("messages"), list) else []
    return {
        "id": str(document.get("ticket_code") or document.get("_id") or ""),
        "ticket_key": str(document.get("_id") or ""),
        "ticket_code": str(document.get("ticket_code") or ""),
        "issue_type": support_tickets.title_case(document.get("issue_type"), "Account"),
        "subject": str(document.get("subject") or ""),
        "description": str(document.get("description") or ""),
        "status": support_tickets.title_case(document.get("status"), "Open"),
        "priority": support_tickets.title_case(document.get("priority"), "Medium"),
        "created_at": support_tickets.iso(document.get("created_at")),
        "updated_at": support_tickets.iso(document.get("updated_at")),
        "messages": [support_tickets.serialize_message(item) for item in messages],
    }


def _support_ticket_query(ticket_id: str, user_id: str) -> dict:
    try:
        return {"_id": ObjectId(ticket_id), "user_id": ObjectId(user_id)}
    except (InvalidId, ValueError):
        return {"ticket_code": ticket_id, "user_id": ObjectId(user_id)}


@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repo),
):
    user = await user_repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return envelope(to_jsonable(serialize_personal_details(user).model_dump()))


@router.patch("/me/personal-details")
async def update_personal_details(
    payload: PersonalDetailsUpdate,
    user_id: str = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repo),
):
    current_user = await user_repo.find_by_id(user_id)
    if not current_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    normalized_email = payload.email.lower() if payload.email else None
    normalized_phone = payload.phone.strip() if payload.phone else None

    if normalized_email and normalized_email != current_user.get("email"):
        existing_email_account = await find_existing_email_async(
            user_repo.collection.database,
            normalized_email,
            exclude_collection="users",
            exclude_id=user_id,
        )
        if existing_email_account:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is already in use by another account.",
            )

    if normalized_phone and normalized_phone != current_user.get("phone"):
        existing_phone_account = await find_existing_phone_async(
            user_repo.collection.database,
            normalized_phone,
            exclude_collection="users",
            exclude_id=user_id,
        )
        if existing_phone_account:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This phone number is already used by another account.",
            )

    updated_user = await user_repo.update_profile(
        user_id,
        {
            "full_name": payload.full_name.strip(),
            "gender": payload.gender,
            "email": normalized_email,
            "phone": normalized_phone,
            "date_of_birth": payload.date_of_birth.isoformat() if payload.date_of_birth else None,
        },
    )
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return envelope(to_jsonable(serialize_personal_details(updated_user).model_dump()))


@router.get("/me/bookings")
async def my_bookings(
    status: str | None = Query(default=None, pattern="^(upcoming|past)$"),
    user_id: str = Depends(get_current_user_id),
    service: BookingService = Depends(get_booking_service),
):
    bookings = await service.list_my_bookings(user_id, status)
    return envelope(to_jsonable(bookings), meta={"count": len(bookings), "status_filter": status})


@router.get("/me/loyalty")
async def my_loyalty(
    user_id: str = Depends(get_current_user_id),
    service: LoyaltyService = Depends(get_loyalty_service),
):
    loyalty = await service.get_loyalty(user_id)
    return envelope(loyalty)


@router.post("/me/profile-image", response_model=ImageUploadResponse, tags=["Users"])
async def upload_profile_image(
    file: UploadFile = File(..., description="Image file to set as profile picture"),
    user_id: str = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repo),
    uploader: S3Uploader = Depends(get_s3_uploader),
) -> ImageUploadResponse:
    """Upload an image to S3 and save its public URL to the user's profile."""
    # 1. Upload to S3
    secure_url = await uploader.upload_image(
        file,
        folder_suffix=f"user-{user_id}/profile",
    )

    # 2. Persist URL in MongoDB
    updated_user = await user_repo.update_profile(user_id, {"profile_image_url": secure_url})
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return ImageUploadResponse(profile_image_url=secure_url)


@router.get("/me/support/tickets")
async def list_my_support_tickets(
    user_id: str = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repo),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user = await user_repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    cursor = db[support_tickets.COLLECTION].find({"user_id": ObjectId(user_id)}).sort("updated_at", -1)
    tickets = [_serialize_support_ticket(ticket) async for ticket in cursor]
    return envelope(to_jsonable(tickets), meta={"count": len(tickets)})


@router.post("/me/support/tickets")
async def create_support_ticket(
    payload: dict,
    user_id: str = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repo),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user = await user_repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    issue_type = str(payload.get("issue_type") or payload.get("issueType") or "").strip().lower().replace(" ", "_")
    subject = str(payload.get("subject") or "").strip()
    description = str(payload.get("description") or "").strip()
    priority = str(payload.get("priority") or "medium").strip().lower()

    if issue_type not in {"account", "technical", "billing", "compliance"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Issue type is required.")
    if not subject:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject is required.")
    if not description:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Description is required.")
    if priority not in {"low", "medium", "high"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid priority.")

    created = support_tickets.new_ticket(
        requester_type="user",
        requester_id=ObjectId(user_id),
        requester_name=str(user.get("full_name") or user.get("email") or "Customer"),
        requester_email=str(user.get("email") or ""),
        requester_avatar=str(user.get("profile_image_url") or ""),
        subject=subject,
        description=description,
        issue_type=issue_type,
        priority=priority,
    )
    result = await db[support_tickets.COLLECTION].insert_one(created)
    ticket = await db[support_tickets.COLLECTION].find_one({"_id": result.inserted_id})
    return envelope(to_jsonable(_serialize_support_ticket(ticket or created)))


@router.get("/me/support/tickets/{ticket_id}")
async def get_my_support_ticket(
    ticket_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    ticket = await db[support_tickets.COLLECTION].find_one(_support_ticket_query(ticket_id, user_id))
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support ticket not found")
    return envelope(to_jsonable(_serialize_support_ticket(ticket)))


@router.post("/me/support/tickets/{ticket_id}/messages")
async def reply_to_my_support_ticket(
    ticket_id: str,
    payload: dict,
    user_id: str = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repo),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user = await user_repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    message = str(payload.get("message") or "").strip()
    if not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message is required.")

    ticket = await db[support_tickets.COLLECTION].find_one(_support_ticket_query(ticket_id, user_id))
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support ticket not found")

    now = datetime.now(UTC)
    update_doc = {
        "$push": {
            "messages": support_tickets.new_message("user", str(user.get("full_name") or user.get("email") or "You"), message, now)
        },
        "$set": {"updated_at": now, "status": "in_progress"},
    }
    await db[support_tickets.COLLECTION].update_one({"_id": ticket["_id"]}, update_doc)
    updated = await db[support_tickets.COLLECTION].find_one({"_id": ticket["_id"]})
    return envelope(to_jsonable(_serialize_support_ticket(updated or ticket)))
