import json
import os
from final_df import get_cached_df
from final_dict import build_dictionaries

def run():
    CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
    PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
    base_dir = os.path.join(PROJECT_ROOT, "data")
    
    print(f"📂 Looking for CMS databases in: {base_dir}")
    
    ptp_df = get_cached_df("cache_ptp.pkl", base_dir, "ccipra*", skiprows=2)
    mue_df = get_cached_df("cache_mue.pkl", base_dir, "MCR_MUE*", skiprows=1)
    hcpcs_df = get_cached_df("cache_hcpcs.pkl", base_dir, "Data_HCPCS.txt", skiprows=0)
    ncd_df = get_cached_df("cache_ncd.pkl", base_dir, "*Initial-ICD10-NCD-Spreadsheet*", skiprows=0)
    
    ptp_dict, mue_dict, gender_dict, ncd_dict = build_dictionaries(ptp_df, mue_df, hcpcs_df, ncd_df)
    
    # Convert sets to lists for JSON serialization
    ptp_serializable = {k: list(v) for k, v in ptp_dict.items()}
    ncd_serializable = {k: list(v) for k, v in ncd_dict.items()}
    
    output = {
        "ptp_edits": ptp_serializable,
        "mue_limits": mue_dict,
        "gender_codes": gender_dict,
        "ncd_map": ncd_serializable
    }
    
    out_path = os.path.join(base_dir, "cms_dicts.json")
    with open(out_path, "w") as f:
        json.dump(output, f)
        
    print(f"✅ Successfully wrote {out_path} (Size: {os.path.getsize(out_path) / 1024 / 1024:.2f} MB)")

if __name__ == "__main__":
    run()
