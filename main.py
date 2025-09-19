from sentence_transformers import SentenceTransformer
import re
from flask import Flask, request, jsonify, session
from datetime import date
import os
from supabase import create_client, Client
from geopy.geocoders import Nominatim
import requests
import re
from resume_parser import parse_resume
from recommend import rank_for_applicant, split_list_field, normalize_text, extract_degree_info
import pandas as pd
app = Flask(__name__)
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "Backend is working"})
@app.route("/pdf", methods=["GET"])
def pdf_parse():
    pdf_url = request.args.get("pdf_url")
    if not pdf_url:
        return jsonify({"error": "Missing pdf_url query parameter."}), 400
    try:
        resp = requests.get(pdf_url)
        if resp.status_code != 200:
            return jsonify({"error": "Failed to fetch PDF from URL."}), 400
        # Save to temp file
        tmp_path = os.path.join(os.path.dirname(__file__), "_temp_resume.pdf")
        with open(tmp_path, "wb") as f:
            f.write(resp.content)
        result = parse_resume(tmp_path)
        os.remove(tmp_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
app.secret_key = "your-very-secret-key"  # Change for production

# Supabase setup for future use
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

geolocator = Nominatim(user_agent="internship_portal")

# Education level ranking for comparison (lower number = lower level)
EDUCATION_ORDER = {
    "diploma": 1,
    "Diploma": 1,
    "graduation": 2,
    "Graduation": 2,
    "undergraduation": 2,
    "under-graduation": 2,
    "post-graduation": 3,
    "Post-Graduation": 3,
    "post graduation": 3,
    "post_graduation": 3,
    "ph.d": 4,
    "Ph.d": 4,
    "phd": 4,
    "ph.d.": 4
}

def get_coords(location_name):
    try:
        loc = geolocator.geocode(location_name)
        if loc:
            return (loc.latitude, loc.longitude)
    except Exception:
        pass
    return None

@app.route("/reco", methods=["GET"])
def rule():
    applicant_id = request.args.get("applicant_id")
    if not applicant_id:
        return "Please provide applicant_id as a query parameter.", 400
    # Fetch applicant data from Supabase
    applicant = supabase.table("applicants").select("*").eq("applicant_id", applicant_id).execute().data
    internships = supabase.table("internships").select("*").execute().data
    interactions = supabase.table("user_interactions").select("*").eq("candidate_id", applicant_id).execute().data
    # Determine applicant education rank (None if missing/unrecognized)
    applicant_edu_level = None
    if applicant and applicant[0].get("education_level"):
        applicant_edu_level = EDUCATION_ORDER.get(str(applicant[0]["education_level"]).strip().lower())
    # Filter internships:
    # 1. Deadline not passed
    # 2. Applicant meets minimum education requirement (if both sides known)
    valid_internships = []
    for internship in internships:
        # Deadline filter
        deadline = internship.get("application_deadline")
        if deadline and deadline < str(date.today()):
            continue
        # Education requirement filter
        min_edu = internship.get("min_education_level")
        if min_edu and applicant_edu_level is not None:
            req_rank = EDUCATION_ORDER.get(str(min_edu).strip().lower())
            # If requirement recognized and applicant rank lower -> skip
            if req_rank and (applicant_edu_level is None or applicant_edu_level < req_rank):
                continue
        # Build location_coord from location column (city names)
        loc_name = internship.get("location")
        location_coord = None
        if loc_name:
            coords = get_coords(loc_name)
            if coords:
                location_coord = coords
        # Build required internship dict
        # Ensure embedding is a list of floats, not a string
        # emb = internship.get("embedding")
        # if isinstance(emb, str):
        #     try:
        #         import ast
        #         emb = ast.literal_eval(emb)
        #     except Exception:
        #         emb = []
        valid_internships.append({
            "id": internship.get("internship_id"),
            "location_coord": location_coord,
            "min_education_level": internship.get("min_education_level"),
            "specialization": internship.get("specialisation_area"),
            "embedding": internship.get("embedding"),
            "posted_date": internship.get("posted_date"),
            "remote": bool(internship.get("remote", False))
        })
    # Remove internships that have been interacted with
    interacted_ids = {i.get("internship_id") for i in interactions}
    # Each entry in valid_internships stores the internship id under key 'id'
    valid_internships = [i for i in valid_internships if i.get("id") not in interacted_ids]
    # Convert preferred_locations to lat/lon using geopy
    preferred_locations = applicant[0].get("preferred_locations") if applicant else None
    location_coords = []
    if preferred_locations:
        # Always treat preferred_locations as a comma-separated string
        locs = [loc.strip() for loc in preferred_locations.split(",") if loc.strip()]
        for loc in locs:
            coords = get_coords(loc)
            if coords:
                location_coords.append(coords)
        print(f"Final preferred_location_coords: {location_coords}")
    # Use process_applicant_json and rank_for_applicant for output
    def process_applicant_json(applicant_id, location_coords, valid_internships):
        """
        Fetch applicant info from Supabase using applicant_id.
        Normalize applicant and internships dataframes.
        Returns:
          applicant_df (pd.DataFrame with one row)
          internships_df (pd.DataFrame with processed internships)
        """
        fetched = supabase.table("applicants").select("*").eq("applicant_id", applicant_id).execute().data
        applicant = fetched[0] if fetched else {}
        applicant["location_coord"] = location_coords
        applicant["remote_ok"] = bool(applicant.get("remote_ok", False))
        applicant["degree_level"] = applicant.get("education_level", "")
        applicant["skills_list"] = split_list_field(applicant.get("skills", ""))
        applicant["embedding"] = applicant.get("embedding", [])
        applicant["education_level_norm"] = EDUCATION_ORDER.get(str(applicant["degree_level"]).lower(), 0)
        applicant["specialization"] = applicant.get("major", "")
        applicant_df = pd.DataFrame([applicant])
        internships_df = pd.DataFrame(valid_internships)
        if not internships_df.empty:
            for col in ["id", "location_coord", "min_education_level", "specialization", "embedding", "posted_date"]:
                if col in internships_df.columns:
                    if col == "posted_date":
                        # Convert posted_date to pandas Timestamp, coerce errors to NaT
                        internships_df[col] = pd.to_datetime(internships_df[col], errors="coerce")
                    elif col == "location_coord":
                        internships_df[col] = internships_df[col]   #.fillna("").map(normalize_text)
                    elif col in ["min_education_level", "specialization"]:
                        internships_df[col] = internships_df[col].fillna("").map(normalize_text)
                    # Do NOT normalize or stringify embedding here
                    # else:
                    #     internships_df[col] = internships_df[col]
            # Ensure min_education_numeric is always numeric
            internships_df["min_education_numeric"] = pd.to_numeric(internships_df["min_education_level"].fillna(0), errors="coerce").fillna(0).astype(int)
        return applicant_df, internships_df

    # Prepare input for process_applicant_json
    applicant_df, internships_df = process_applicant_json(applicant_id, location_coords, valid_internships)
    # Filter out internships with empty or invalid embeddings
    # def is_valid_embedding(emb):
    #     return isinstance(emb, list) and len(emb) > 0 and all(isinstance(x, (float, int)) for x in emb)
    # if "embedding" in internships_df.columns:
    #     internships_df = internships_df[internships_df["embedding"].apply(is_valid_embedding)]
    # Use rank_for_applicant to get ranked output
    ranked = rank_for_applicant(applicant_df.iloc[0], internships_df)
    return jsonify({"ranked_internships": ranked})
# Load model once globally
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
model = SentenceTransformer(EMBED_MODEL)

def normalize_text(s):
    if not s: return ""
    return str(s).strip().lower()

def build_internship_text(internship):
    """
    Create a combined text string from internship details.
    """
    # Use Supabase field names directly
    parts = [
        internship.get("title", ""),
        internship.get("description", ""),
        internship.get("sector", ""),
        internship.get("field", ""),
        internship.get("skills", ""),
        internship.get("specialisation_area", "")
    ]
    parts = [str(p).strip().lower() for p in parts if p]
    return " | ".join(parts)

def embed_internship(internship):
    """
    Given one internship dict, return the same dict with embedding vector.
    """
    text = build_internship_text(internship)
    emb = model.encode([text], convert_to_numpy=True, normalize_embeddings=True)[0]
    internship["embedding"] = emb.tolist()  # store as list (JSON serializable)
    return internship

def normalize_text(text):
    """
    Normalize text by lowering case and stripping spaces.
    """
    return str(text).strip().lower()

def split_list_field(field_str):
    """
    Split a comma/semicolon/pipe-separated string into a clean list.
    """
    if not field_str:
        return []
    return [s.strip().lower() for s in re.split(r"[;,|]", field_str) if s.strip()]

def build_applicant_text(applicant):
    """
    Build a combined text string for applicant profile.
    """
    parts = []

    # Use Supabase field names directly
    if applicant.get("major"):
        parts.append(str(applicant["major"]).strip().lower())
    if applicant.get("skills"):
        skills_cleaned = " ".join(split_list_field(applicant["skills"]))
        parts.append(skills_cleaned)
    if applicant.get("sectors_of_interest"):
        sectors_cleaned = " ".join(split_list_field(applicant["sectors_of_interest"]))
        parts.append(sectors_cleaned)
    return " | ".join(parts)

def embed_applicant(applicant):
    """
    Generate SBERT embedding for an applicant.
    """
    text = build_applicant_text(applicant)
    embedding = model.encode(text, convert_to_tensor=False).tolist()
    return embedding

@app.route("/update_embeddings", methods=["POST"])
def update_embeddings():
    # Update internship embeddings
    internships = supabase.table("internships").select("*").execute().data
    for internship in internships:
        emb_intern = embed_internship(internship)
        supabase.table("internships").update({"embedding": emb_intern["embedding"]}).eq("internship_id", internship["internship_id"]).execute()

    # Update applicant embeddings
    applicants = supabase.table("applicants").select("*").execute().data
    for applicant in applicants:
        emb_app = embed_applicant(applicant)
        supabase.table("applicants").update({"embedding": emb_app}).eq("applicant_id", applicant["applicant_id"]).execute()

    return jsonify({"status": "Embeddings updated for all internships and applicants."})

if __name__ == "__main__":
    app.run(debug=True)
