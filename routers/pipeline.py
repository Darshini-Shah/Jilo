from fastapi import APIRouter, UploadFile, File, Form, Request
from typing import List, Optional
from controllers import pipeline_controller

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])

@router.post("/preauth")
async def run_preauth(
    request: Request,
    patient_id: str = Form(...),
    files: List[UploadFile] = File(...),
    tpa_id: Optional[str] = Form(None),
):
    cms_dicts = request.app.state.cms_dicts
    return await pipeline_controller.run_preauth_pipeline(files, patient_id, cms_dicts, tpa_id=tpa_id)

@router.post("/admitted")
async def run_admitted(
    request: Request,
    patient_id: str = Form(...),
    files: List[UploadFile] = File(...),
    tpa_id: Optional[str] = Form(None),
):
    cms_dicts = request.app.state.cms_dicts
    return await pipeline_controller.run_admitted_pipeline(files, patient_id, cms_dicts, tpa_id=tpa_id)
