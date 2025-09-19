import re
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.preprocessing import normalize
import math
from sklearn.metrics.pairwise import cosine_similarity
from difflib import get_close_matches


# -----------------------
# 1. helper / config
# -----------------------

degree_mapping = {
    # Matriculation
    "10th": 0, "matriculation": 0, "senior secondary": 0, "intermediate": 0, "puc": 0,
    
    # Diploma/Certifications
    "iti": 1, "diploma": 1, "polytechnic": 1, "certificate": 1, "advanced diploma": 1, "12th": 1, "Higher secondary": 1,
    
    # Graduation
    "ba": 2, "b.a": 2, "bsc": 2, "b.sc": 2, "b.com": 2, "bca": 2, "bba": 2, "bms": 2, "bbm": 2,
    "bsw": 2, "bfa": 2, "b.des": 2, "b.arch": 2, "b.tech": 2, "be": 2, "b.e": 2, "b.lib.sc": 2,
    "b.p.ed": 2, "b.j.m.c": 2, "bhm": 2, "b.pharm": 2, "bpt": 2, "bot": 2, "b.sc nursing": 2,
    "bds": 2, "mbbs": 2, "bams": 2, "bhms": 2, "bums": 2, "b.v.sc": 2, "llb": 2,
    "ba llb": 2, "bba llb": 2, "b.com llb": 2,
    
    # Post-Graduation
    "ma": 3, "m.a": 3, "msc": 3, "m.sc": 3, "mcom": 3, "m.com": 3, "mca": 3, "mba": 3,
    "m.tech": 3, "me": 3, "m.e": 3, "m.des": 3, "m.lib.sc": 3, "msw": 3, "mph": 3,
    "llm": 3, "m.p.ed": 3, "mfa": 3, "mjmc": 3, "m.ed": 3, "pg diploma": 3,
    "ca": 3, "cs": 3, "cma": 3, "integrated bachelor's-master's": 3,
    
    # Ph.D & Beyond
    "phd": 4, "ph.d": 4, "m.phil": 4, "postdoctoral": 4
}

def haversine(coord1, coord2):
    """
    Calculate the great-circle distance between two points on the Earth.
    coord1, coord2: [lat, lon]
    Returns distance in kilometers.
    """
    R = 6371  # Earth radius in km
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (math.sin(dlat/2) ** 2 +
         math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2) ** 2)
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def within_radius(applicant_coords, internship_coord, radius_km=250):
    if not applicant_coords or not internship_coord:
        return False
    for ac in applicant_coords:
        if haversine(ac, internship_coord) <= radius_km:
            return True
    return False

def normalize_text(s):
    if pd.isna(s): return ""
    s = s.lower()
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def split_list_field(x):
    if pd.isna(x): return []
    if isinstance(x, list): return [t.strip().lower() for t in x if t.strip()]
    return [t.strip().lower() for t in re.split('[,;|/]', str(x)) if t.strip()]

def jaccard(a, b):
    seta, setb = set(a), set(b)
    if not seta and not setb: return 0.0
    return len(seta & setb) / len(seta | setb)

# -----------------------
# 2. education & score helpers
# -----------------------
def load_specializations(csv_path):
    df = pd.read_csv(csv_path)
    # Convert to lowercase list for consistency
    return df['MAJOR'].str.lower().tolist()

def extract_degree_info(text):
    text = text.lower()
    degree_level, specialization = None, None
    
    # Match degree
    for k,v in degree_mapping.items():
        if k in text:
            degree_level = v
            break
    
    # Match specialization (rough)
    specs = load_specializations("major.csv")
    match = get_close_matches(text, specs, n=1, cutoff=0.4)
    specialization = match[0] if match else None
    
    return degree_level, specialization

def education_fit(candidate_level, internship_level):
    if candidate_level < internship_level:
        return 0.0  # not eligible
    diff = candidate_level - internship_level
    return {0:1.0, 1:0.8, 2:0.6, 3:0.4, 4:0.2}.get(diff, 0.2)


# -----------------------
# 4. Rule-based filter
# -----------------------
def rule_filter(applicant_row, internships_df, max_posted_days=180):
    today = pd.Timestamp.today()
    df = internships_df.copy()
    # education eligibility
    df = df[df['min_education_numeric'] <= applicant_row['education_level_norm']]
    # specialization preference (soft filter – keep but rank higher later)
    if applicant_row['specialization']:
        df['spec_match'] = df['specialization'].apply(lambda s: 1 if s == applicant_row['specialization'] else 0)
    else:
        df['spec_match'] = 0
    # location filter
    applicant_coords = applicant_row.get("location_coord", [])
    remote_ok = applicant_row.get("remote_ok", False)
    if applicant_coords and not remote_ok:
        # Keep internships that are either remote or within 250km of applicant's preferred coords
        df = df[df.apply(
            lambda row: (row['remote'] is True) or within_radius(applicant_coords, row['location_coord']),
            axis=1
        )]
    elif not applicant_coords and not remote_ok:
        # No preferences given → keep all (since applicant hasn’t specified)
        df = df
    else:
        # Applicant is remote_ok → keep remote ones or all
        df = df[(df['remote'] == True) | df['location_coord'].notnull()]
    # recency
    cutoff = today - pd.Timedelta(days=max_posted_days)
    if 'posted_date' in df.columns:
        df = df[df['posted_date'] >= cutoff]

    return df

# internships['repr'] = internships.apply(internship_representation, axis=1)
# corpus = internships['repr'].tolist()
# internship_embeddings = model.encode(corpus, convert_to_numpy=True, show_progress_bar=True)
# internship_embeddings = normalize(internship_embeddings, axis=1)

# np.save('internship_embeddings.npy', internship_embeddings)
# d = internship_embeddings.shape[1]
# index = faiss.IndexFlatIP(d)
# index.add(internship_embeddings)

# -----------------------
# 6. Ranking function
# -----------------------
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
model = SentenceTransformer(EMBED_MODEL)

def rank_for_applicant(applicant_row, internships_df, top_k=5):
    filtered = rule_filter(applicant_row, internships_df)
    if filtered.empty:
        filtered = rule_filter(applicant_row, internships_df, max_posted_days=365)
    if filtered.empty:
        return []
    
    corpus = filtered['embedding'].tolist()
    internship_embeddings = model.encode(corpus, convert_to_numpy=True, show_progress_bar=True)
    internship_embeddings = normalize(internship_embeddings, axis=1)

    app_emb = model.encode(applicant_row['embedding'], convert_to_numpy = True)
    app_emb = np.array(app_emb).reshape(1, -1)
    app_emb = normalize(app_emb, axis=1)

    idxs = filtered.index.to_list()

    sims = cosine_similarity(app_emb, internship_embeddings)[0]
    pd.set_option('display.max_columns', None)
    print(sims[0])
    print(internships_df)

    # skill overlap
    skill_scores = [
        jaccard(applicant_row['skills_list'], internships_df.loc[idx,'skills_list'])
        for idx in idxs
    ]

    # recency
    today = pd.Timestamp.today()
    max_days = 180
    recency_scores = [
        max(0, (max_days - (today - pd.Timestamp(internships_df.loc[idx].get('posted_date', today))).days) / max_days)
        for idx in idxs
    ]

    # education fit
    edu_scores = [
        education_fit(applicant_row['education_level_norm'], internships_df.loc[idx,'min_education_numeric'])
        for idx in idxs
    ]

    # specialization match (from rule filter)
    spec_scores = filtered['spec_match'].tolist()

    # composite score
    alpha, beta, gamma, delta, eps = 0.5, 0.2, 0.1, 0.05, 0.15
    final_scores = (
        alpha * sims +
        beta * np.array(skill_scores) +
        gamma * np.array(recency_scores) +
        delta * np.array(edu_scores) +
        eps * np.array(spec_scores)
    )

    res_df = filtered.copy()
    res_df['sim'] = sims
    res_df['skill_score'] = skill_scores
    res_df['recency_score'] = recency_scores
    res_df['edu_score'] = edu_scores
    res_df['spec_score'] = spec_scores
    res_df['final_score'] = final_scores
    res_df = res_df.sort_values('final_score', ascending=False).head(top_k)

    return res_df[['id', 'final_score','sim','skill_score','edu_score','spec_score']].to_dict(orient='records')
