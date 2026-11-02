"""
©AngelaMos | 2026
alert.py

Pydantic schemas for the alerts endpoints

Defines AlertStatusUpdate for status transitions, AlertQueryParams
for paginated alert listing, and SoarActionRequest for SOAR containment.
"""

from pydantic import BaseModel, Field

from app.config import settings
from app.models.Alert import AlertStatus


class AlertStatusUpdate(BaseModel):
    """
    Schema for transitioning an alert to a new status
    """
    status: AlertStatus
    notes: str | None = None


class SoarActionRequest(BaseModel):
    """
    Schema for executing a SOAR automated containment action
    """
    action: str = Field(default="block_ip")
    target: str | None = None


class AlertQueryParams(BaseModel):
    """
    Filters for listing alerts
    """
    page: int = Field(default=1, ge=1)
    per_page: int = Field(
        default=settings.DEFAULT_PAGE_SIZE,
        ge=1,
        le=settings.MAX_PAGE_SIZE,
    )
    status: str | None = None
    severity: str | None = None
