
import os
import fitz  # PyMuPDF - already in requirements, ~30MB vs torch's 800MB
import io
import base64
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

api_key = os.getenv("GEMINI_API_KEY")

# Use the new google.genai SDK instead of deprecated google.generativeai
from google import genai

client = genai.Client(api_key=api_key)


def process_single_pdf(file_bytes: bytes, filename: str):
    """Converts PDF bytes to text using PyMuPDF (zero ML dependencies).
    Falls back to Gemini Vision for scanned/image-only PDFs."""
    print(f"--- Extracting text from: {filename} ---")

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        return f"Error reading PDF: {e}"

    raw_text = ""
    image_pages = []  # Track pages with no extractable text

    for page_num, page in enumerate(doc):
        page_text = page.get_text("text")
        if page_text.strip():
            raw_text += page_text + "\n"
        else:
            # This page is likely a scanned image - collect for Gemini Vision
            image_pages.append(page_num)

    # If some pages had no text (scanned), use Gemini Vision as OCR fallback
    if image_pages:
        print(f"   -> {len(image_pages)} scanned pages detected, using Gemini Vision OCR...")
        for page_num in image_pages:
            try:
                page = doc[page_num]
                # Render page to image at 150 DPI (good balance of quality vs size)
                pix = page.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("png")
                img_b64 = base64.b64encode(img_bytes).decode("utf-8")

                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[
                        {
                            "parts": [
                                {"text": "Extract ALL text from this medical document image. Preserve the layout, tables, numbers, and amounts exactly as they appear. Do not summarize."},
                                {"inline_data": {"mime_type": "image/png", "data": img_b64}}
                            ]
                        }
                    ]
                )
                if response.text:
                    raw_text += f"\n--- Page {page_num + 1} (OCR) ---\n" + response.text + "\n"
            except Exception as e:
                print(f"   -> Warning: Gemini Vision failed for page {page_num + 1}: {e}")

    doc.close()
    return raw_text


def structure_text_with_gemini(raw_text, filename):
    """Sends messy text to Gemini for cleaning and structuring."""
    prompt = f"""
    It is unstructured OCR output. Please:
    1. Clean it up (fix typos, remove page numbers and hospital headers).
    2. Structure it into sections: [Patient Info, Billing/Charges, Medications, Diagnosis].
    3. Use Markdown tables for any billing items as billing is sensitive make sure to extract is precisely and verify logically and make sure the final payable amount is correct.
    4. **Document Identification:** From the merged content, identify and list the original document types (e.g., Bill, Blood Report, Discharge Summary). Use specific markers from the text (like 'Invoice #123' or 'Lab Date: March 20') to show where each document was found.

    RAW TEXT:
    {raw_text}
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"Gemini API Error: {e}"


def run_pdf_pipeline(pdf_path: str, filename: str) -> str:
    """Orchestrates the PDF processing directly from early stages without hitting disk for output."""
    raw_content = process_single_pdf(pdf_path, filename)
    structured_data = structure_text_with_gemini(raw_content, filename)
    return structured_data


def main():
    # Use absolute paths relative to this script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_folder = os.path.join(script_dir, "hospital_pdfs")
    
    # Point to the retrieval data folder relative to this script
    output_folder = os.path.abspath(os.path.join(script_dir, "..", "retrieval", "data_from_preprocessing"))
    output_file = os.path.join(output_folder, "structured_hospital_data.txt")

    if not os.path.exists(input_folder):
        os.makedirs(input_folder)
        print(f"Created folder '{input_folder}'. Please upload your PDFs inside it and run again.")
        return

    pdf_files = [f for f in os.listdir(input_folder) if f.lower().endswith(".pdf")]

    if not pdf_files:
        print(f"No PDF files found in '{input_folder}'. Upload them to the sidebar folder.")
        return

    combined_raw_text = ""
    for filename in pdf_files:
        pdf_path = os.path.join(input_folder, filename)
        with open(pdf_path, "rb") as f:
            file_bytes = f.read()
        raw_content = process_single_pdf(file_bytes, filename)
        combined_raw_text += f"\n--- Source File: {filename} ---\n" + raw_content

    print(f"Structuring all data from {len(pdf_files)} files")  

    structured_data = structure_text_with_gemini(combined_raw_text, "Combined Patient Records")

    # --- Step C: Write the final consolidated result ---
    with open(output_file, "w", encoding="utf-8") as master_file:
        master_file.write(structured_data)

    print(f"\nSuccess! Consolidated data saved to: '{output_file}'")

if __name__ == "__main__":
    main()