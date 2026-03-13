import pandas as pd
import glob
import os

def load_and_concat_cms_files(folder_path, file_pattern, skiprows=0):
    """Generic function to load split multi-part files and align headers before concatenating."""
    search_path = os.path.join(folder_path, file_pattern)
    files = glob.glob(search_path)
    print(f"📁 Found {len(files)} files for pattern: {file_pattern}")
    
    df_list = []
    for f in files:
        if ".pkl" in f or "~$" in f: continue 
        
        ext = os.path.splitext(f)[1].lower()
        try:
            if ext in ['.csv', '.txt']:
                try:
                    df = pd.read_csv(f, skiprows=skiprows, low_memory=False, dtype=str, encoding='latin1')
                except Exception:
                    df = pd.read_csv(f, skiprows=skiprows, sep='\t', low_memory=False, dtype=str, encoding='latin1')
            elif ext in ['.xlsx', '.xls', '']:
                df = pd.read_excel(f, skiprows=skiprows, dtype=str)
            else:
                continue

            if not df.empty:
                df.columns = df.columns.astype(str).str.strip().str.upper()
                df_list.append(df)
                
        except Exception as e:
            print(f"❌ Error reading {os.path.basename(f)}: {e}")

    return pd.concat(df_list, ignore_index=True) if df_list else pd.DataFrame()


def get_cached_df(cache_name, folder_path, pattern, skiprows=0):
    cache_path = os.path.join(folder_path, cache_name)
    if os.path.exists(cache_path):
        print(f"⚡ Loading from cache: {cache_name}")
        return pd.read_pickle(cache_path)
    else:
        print(f"⏳ Parsing raw files to create {cache_name}...")
        df = load_and_concat_cms_files(folder_path, pattern, skiprows)
        if not df.empty:
            df.to_pickle(cache_path)
        return df

# We are keeping these old dummy functions just so your import statement doesn't crash, 
# but they aren't actually used anymore.
def load_ptps(): pass
def load_mues(): pass
def load_oce_demographics(): pass
def load_ncd_crosswalk(): pass