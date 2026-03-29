from preprocessing.pdf_to_text import process_single_pdf
import os
import sys
import json
from typing import List
from fastapi import UploadFile, HTTPException, status
from google import genai
from google.genai import types

import logging

# Disable most logging for cleaner output
logging.getLogger("google").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)

# ---------------------------
# Robust Path Initialization
# ---------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# Support legacy non-package neighbor imports
sys.path.append(os.path.join(BASE_DIR, "preprocessing"))

from core.supabase import get_supabase
from preprocessing.pdf_to_text import run_pdf_pipeline
from schemas.settlement import SettlementAuditResult
import dotenv

dotenv.load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

class SettlementController:
    """
    Controller for auditing insurance settlement letters against FHIR clinical records.
    """
    
    async def audit_settlement(self, document_ids: List[str], 
        patient_id: str, 
        tpa_id: str ) -> dict:
        
        supabase = get_supabase()
        
        # 1. Update Patient Status to "discharged"
        print(f"Update patient {patient_id} status to 'discharge'...")
        try:
            supabase.table("patients").update({"step": "discharge"}).eq("id", patient_id).eq("tpa_id", tpa_id).execute()
        except Exception as e:
            print(f"Warning: Failed to update patient status: {e}")

        # 2. Extract text from Settlement PDF
        combined_structured = ""
        doc_id = str(uuid.uuid4())
        file_name = "document.pdf"
        
        # ==========================================
        # STEP 1: DOWNLOAD FROM BUCKET & PROCESS
        # ==========================================
        for doc_uuid in document_ids:
            doc_res = supabase.table("documents").select("file_name, file_url").eq("id", doc_uuid).execute()
            
            if not doc_res.data:
                continue
                
            file_url = doc_res.data[0]["file_url"]
            file_name = doc_res.data[0]["file_name"]
            
            # --- THE FIX: Extract the relative path just like you do in delete_document ---
            marker = "/storage/v1/object/public/medical_documents/"
            if marker in file_url:
                storage_path = file_url.split(marker, 1)[1]
            else:
                storage_path = file_url # Fallback just in case
                
            print(f"--- Downloading {file_name} from Supabase Storage ---")
            
            try:
                # Pass the clean storage_path, NOT the full URL
                file_bytes = supabase.storage.from_("medical_documents").download(storage_path)
                
                # 3. Process the bytes in memory using our fast function
                raw_content = process_single_pdf(file_bytes, file_name) 
                combined_structured += raw_content
                
                # 4. UPDATE the existing document row with the extracted text
                supabase.table("documents").update({
                    "extracted_text": raw_content 
                }).eq("id", doc_uuid).execute()

            except Exception as e:
                print(f"❌ Failed processing {file_name}: {e}")
                raise HTTPException(status_code=500, detail=str(e))
            
        combined_structured = structure_text_with_gemini(combined_structured, file_name)
                
        if combined_structured.startswith("Error"):
            raise Exception(combined_structured)

        # 3. Fetch Patient and FHIR Records for Context
        print(f"Fetching context for patient {patient_id}...")
        patient_res = supabase.table("patients").select("name").eq("id", patient_id).single().execute()
        patient_name = patient_res.data.get("name", "Unknown Patient")
        
        fhir_res = supabase.table("fhir_records").select("fhir_json").eq("patient_id", patient_id).execute()
        fhir_context = [record["fhir_json"] for record in fhir_res.data]
        
        if not fhir_context:
            print("Warning: No FHIR records found for this patient. Audit will be limited.")

        # 4. AI Audit Analysis
        print("Running AI Audit...")
        if not API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured.")
            
        client = genai.Client(api_key=API_KEY)
        
        prompt = f"""
        You are a Medical Billing Auditor. Compare the Settlement Letter against FHIR data.
        
        CONTEXT (FHIR CLINICAL DATA):
        {json.dumps(fhir_context, indent=2)}
        
        SETTLEMENT LETTER TEXT:
        {settlement_text}
        
        INSTRUCTIONS:
        1. Extract the Patient Name and {patient_id}.
        2. Set 'is_audit_passed' to true only if deductions are zero.
        3. If false, list EVERY deductions with:
           - The exact 'amount' deducted.
           - The 'reason_given' by insurance.
           - A 'recommendation' explaining EXACTLY which missing bills, test reports, or clinical notes (from FHIR or otherwise) are needed to recover this specific amount.
           - A 'pass_probability' (percentage 0-100%) representing the chance of winning an appeal if the recommended documents are provided.
        4. DO NOT include a summary paragraph.
        5. Return strictly in JSON format.
        """
        
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SettlementAuditResult,
                    temperature=0.1 
                ),
            )
            
            audit_result = SettlementAuditResult.model_validate_json(response.text)
            return audit_result.model_dump()
            
        except Exception as e:
            print(f"Audit failure: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"AI Audit failed: {str(e)}"
            )
        
