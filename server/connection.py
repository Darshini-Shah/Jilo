import os
import subprocess
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Get the absolute path of the project root
# Since connection.py is in Jilo/server, we need to go up one level to get to Jilo/
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

app = FastAPI(title="RCM Execution Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/run-extraction")
async def run_extraction_pipeline():
    """
    Step 2: React calls this. It runs Docker, OCR, RAG, and FHIR Gen sequentially.
    """
    print("\n🚀 FRONTEND SIGNAL: Booting up the full Extraction Pipeline...")
    
    # 1. Start Docker Database (in /retrieval)
    print("⏳ Step 1: Spinning up Docker Database...")
    retrieval_dir = os.path.join(PROJECT_ROOT, "retrieval")
    try:
        # ADDED shell=True FOR WINDOWS COMPATIBILITY
        subprocess.run(["docker", "compose", "up", "-d"], cwd=retrieval_dir, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print("❌ Docker failed!")
        raise HTTPException(status_code=500, detail="Docker compose failed.")

    # 2. Run OCR Preprocessing (in /preprocessing)
    print("⏳ Step 2: Running OCR Preprocessing...")
    preprocessing_dir = os.path.join(PROJECT_ROOT, "preprocessing")
    try:
        # ADDED shell=True FOR WINDOWS COMPATIBILITY
        subprocess.run(["python", "pdf_to_text.py"], cwd=preprocessing_dir, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print("❌ OCR failed!")
        raise HTTPException(status_code=500, detail="OCR pdf_to_text.py failed.")

    # 3. Generate RAG Handoff (in /retrieval)
    print("⏳ Step 3: Generating RAG Handoff...")
    try:
        # ADDED shell=True FOR WINDOWS COMPATIBILITY
        subprocess.run(["python", "generate_handoff.py"], cwd=retrieval_dir, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print("❌ RAG Handoff failed!")
        raise HTTPException(status_code=500, detail="RAG generate_handoff.py failed.")

    # 4. Run AI Extraction & FHIR Generation (in /formatting, but run from root)
    print("⏳ Step 4: Running AI Extraction & FHIR Generation...")
    fhir_gen_script = os.path.join(PROJECT_ROOT, "formatting", "fhir_gen.py")
    try:
        # ADDED shell=True FOR WINDOWS COMPATIBILITY
        subprocess.run(["python", fhir_gen_script], cwd=PROJECT_ROOT, check=True, shell=True)
        print("✅ EXTRACTION PIPELINE COMPLETE!")
        return {"status": "success", "message": "OCR, RAG, and FHIR Bundles generated!"}
    except subprocess.CalledProcessError as e:
        print("❌ FHIR Generation failed!")
        raise HTTPException(status_code=500, detail="FHIR formatting failed.")

@app.post("/run-audit")
async def run_audit_script():
    """
    Step 3: React calls this to run the Final Rules Engine Script.
    """
    print("\n🚀 FRONTEND SIGNAL: Booting up final_val.py for Audit...")
    
    final_val_script = os.path.join(PROJECT_ROOT, "validator", "final_val.py")
    
    try:
        # ADDED shell=True FOR WINDOWS COMPATIBILITY
        result = subprocess.run(["python", final_val_script], cwd=PROJECT_ROOT, capture_output=True, text=True, check=True, shell=True)
        print("✅ AUDIT SUCCESS:\n", result.stdout)
        return {"status": "success", "message": "Audit complete!"}
        
    except subprocess.CalledProcessError as e:
        print("❌ CRASH DETECTED:\n", e.stderr)
        raise HTTPException(status_code=500, detail="Audit failed. Check terminal.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)import os
import subprocess
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Calculate exact absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR) 

app = FastAPI(title="RCM Execution Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/run-extraction")
async def run_extraction_pipeline():
    print("\n🚀 FRONTEND SIGNAL: Booting up the full Extraction Pipeline...")
    
    # 1. Start Docker Database (in /retrieval)
    retrieval_dir = os.path.join(PROJECT_ROOT, "retrieval")
    print(f"⏳ Step 1: Spinning up Docker Database inside -> {retrieval_dir}")
    try:
        # FIX: Passed as a single string!
        subprocess.run("docker compose up -d", cwd=retrieval_dir, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print("❌ Docker failed!")
        raise HTTPException(status_code=500, detail="Docker compose failed.")
    except FileNotFoundError:
        print(f"❌ Could not find the folder: {retrieval_dir}")
        raise HTTPException(status_code=500, detail="Retrieval directory not found.")

    # 2. Run OCR Preprocessing (in /preprocessing)
    preprocessing_dir = os.path.join(PROJECT_ROOT, "preprocessing")
    print(f"⏳ Step 2: Running OCR Preprocessing inside -> {preprocessing_dir}")
    try:
        # FIX: Passed as a single string!
        subprocess.run("python pdf_to_text.py", cwd=preprocessing_dir, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print("❌ OCR failed!")
        raise HTTPException(status_code=500, detail="OCR pdf_to_text.py failed.")

    # 3. Generate RAG Handoff (in /retrieval)
    print(f"⏳ Step 3: Generating RAG Handoff inside -> {retrieval_dir}")
    try:
        # FIX: Passed as a single string!
        subprocess.run("python generate_handoff.py", cwd=retrieval_dir, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print("❌ RAG Handoff failed!")
        raise HTTPException(status_code=500, detail="RAG generate_handoff.py failed.")

    # 4. Run AI Extraction & FHIR Generation (in /formatting, but run from root)
    print(f"⏳ Step 4: Running AI Extraction & FHIR Generation from -> {PROJECT_ROOT}")
    try:
        # FIX: Passed as a single string!
        subprocess.run("python formatting/fhir_gen.py", cwd=PROJECT_ROOT, check=True, shell=True)
        print("✅ EXTRACTION PIPELINE COMPLETE!")
        return {"status": "success", "message": "OCR, RAG, and FHIR Bundles generated!"}
    except subprocess.CalledProcessError as e:
        print("❌ FHIR Generation failed!")
        raise HTTPException(status_code=500, detail="FHIR formatting failed.")

@app.post("/run-audit")
async def run_audit_script():
    print(f"\n🚀 FRONTEND SIGNAL: Booting up final_val.py for Audit from -> {PROJECT_ROOT}")
    try:
        # FIX: Passed as a single string!
        result = subprocess.run("python validator/final_val.py", cwd=PROJECT_ROOT, capture_output=True, text=True, check=True, shell=True)
        print("✅ AUDIT SUCCESS:\n", result.stdout)
        return {"status": "success", "message": "Audit complete!"}
    except subprocess.CalledProcessError as e:
        print("❌ CRASH DETECTED:\n", e.stderr)
        raise HTTPException(status_code=500, detail="Audit failed. Check terminal.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)