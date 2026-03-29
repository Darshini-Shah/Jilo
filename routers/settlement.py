from fastapi import APIRouter, Depends, UploadFile, File, Query, status, Request
from schemas.settlement import SettlementAuditResult
from controllers.settlement_controller import SettlementController
from core.dependencies import get_current_user
from typing import List
from pydantic import BaseModel
from typing import Optional
router = APIRouter(prefix="/settlement", tags=["Settlement Audit"], dependencies=[Depends(get_current_user)])
class PipelineRequest(BaseModel):
    document_ids: List[str]
    patient_id: str
    tpa_id: Optional[str] = None
# Controller Instance
controller = SettlementController()

@router.post("/audit", status_code=status.HTTP_200_OK, response_model=dict)
async def audit_settlement(
    req: PipelineRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Audits an insurance settlement letter against FHIR clinical records.
    Automatically updates the patient's 'step' to 'discharged'.
    """
    tpa_id = req.tpa_id or current_user.get("id")
    return await controller.audit_settlement(req.document_ids, req.patient_id, tpa_id)
