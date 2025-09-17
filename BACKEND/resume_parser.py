import os
import re
from typing import Dict, List, Tuple
from difflib import SequenceMatcher

# Optional dependencies – we import defensively and fall back
try:
    import fitz  # PyMuPDF for robust PDF text extraction
except Exception:
    fitz = None
try:
    import pdfplumber
except Exception:
    pdfplumber = None
try:
    from pdf2image import convert_from_path
    import pytesseract
except Exception:
    convert_from_path = None
    pytesseract = None
import os
import re
from typing import Dict, List, Tuple

# Optional dependencies – we import defensively and fall back
try:
    import fitz  # PyMuPDF for robust PDF text extraction
except Exception:
    fitz = None
try:
    import pdfplumber
except Exception:
    pdfplumber = None
try:
    from pdf2image import convert_from_path
    import pytesseract
except Exception:
    convert_from_path = None
    pytesseract = None

# NLP (spaCy) for smarter entity extraction when available
try:
    import spacy
    try:
        nlp = spacy.load('en_core_web_sm')
    except Exception:
        nlp = None
except Exception:
    spacy = None
    nlp = None

# -----------------------------------------------------------------------------
# Configuration for dictionary-driven extraction
# -----------------------------------------------------------------------------
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, 'data')

def _resolve_data_path(filename: str) -> str:
    """Return the path to a data file, preferring the 'data' folder but
    falling back to the Backend root if needed."""
    p1 = os.path.join(DATA_DIR, filename)
    if os.path.exists(p1):
        return p1
    p2 = os.path.join(BASE_DIR, filename)
    if os.path.exists(p2):
        return p2
    # default to data path even if missing to keep behavior predictable
    return p1

SKILLS_CSV = _resolve_data_path('UpdatedSkills.csv')  # one skill per line
MAJORS_CSV = _resolve_data_path('major.csv')  # one major per line
EDU_LEVELS_CSV = _resolve_data_path('Book1.csv')  # one level per line
COLLEGES_CSV = _resolve_data_path('colleges_master.csv')  # compiled master list


def _load_list_csv(path: str) -> List[str]:
    items: List[str] = []
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                # handle either one-value-per-line or CSV with header 'name'
                header = f.readline()
                if "," in header:
                    # treat as CSV
                    cols = [c.strip().lower() for c in header.split(',')]
                    name_idx = 0
                    if 'name' in cols:
                        name_idx = cols.index('name')
                    else:
                        # fallback to first column
                        items.append(header.strip()) if header.strip() else None
                        for line in f:
                            val = line.strip()
                            if val and not val.startswith('#'):
                                items.append(val)
                        return items
                    for line in f:
                        parts = [p.strip() for p in line.split(',')]
                        if parts and parts[0]:
                            items.append(parts[name_idx])
                else:
                    # header is a value line; include if valid
                    val = header.strip()
                    if val and not val.startswith('#'):
                        items.append(val)
                    for line in f:
                        val = line.strip()
                        if val and not val.startswith('#'):
                            items.append(val)
        except Exception:
            pass
    return items


# -----------------------------------------------------------------------------
# Target fields (normalized to human-readable with spaces)
# -----------------------------------------------------------------------------
APPLICANT_FIELDS = [
    "name", "father name", "category", "education level", "major", "skills",
    "sectors of interest", "preferred locations", "remote ok", "experience years",
    "preferred language", "disability status", "mobile number", "alt mobile number",
    "email", "aadhaar number", "bank account linked", "languages known", "address line1",
    "address line2", "state", "district", "pincode"
]
EDUCATION_FIELDS = [
    "level", "course", "board university name", "institute name", "year of passing", "marks or grade"
]
EXPERIENCE_FIELDS = [
    "type", "years", "details"
]


def clean_key(key: str) -> str:
    return key.lower().replace('_', ' ').strip()


def extract_text_from_pdf(pdf_path: str) -> str:
    # 1) Try PyMuPDF
    if fitz is not None:
        try:
            with fitz.open(pdf_path) as doc:
                return "\n".join(page.get_text() or "" for page in doc)
        except Exception:
            pass
    # 2) Try pdfplumber
    if pdfplumber is not None:
        try:
            text = ""
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text += (page.extract_text() or "") + "\n"
            if text.strip():
                return text
        except Exception:
            pass
    # 3) OCR fallback
    if convert_from_path and pytesseract:
        try:
            images = convert_from_path(pdf_path)
            text = "\n".join(pytesseract.image_to_string(img) for img in images)
            return text
        except Exception:
            pass
    return ""


# ----------------------------- Basic extractors ------------------------------
EMAIL_REGEX = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
# Flexible phone; we'll normalize after matching
PHONE_REGEX = re.compile(r"(?:(?:\+?\d{1,3})?[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,5}")


def extract_email(text: str) -> str:
    m = EMAIL_REGEX.search(text)
    return m.group(0) if m else ""


def extract_phone(text: str) -> str:
    m = PHONE_REGEX.search(text)
    if not m:
        return ""
    raw = m.group(0)
    digits = re.sub(r"\D", "", raw)
    # Heuristics: if Indian number 10 digits, prepend +91 if not present
    if len(digits) >= 10:
        last10 = digits[-10:]
        return "+91 " + last10 if not digits.startswith("+91") else "+" + digits
    return raw


def extract_name(text: str) -> Tuple[str, str]:
    # Prefer spaCy PERSON entities
    if nlp is not None:
        try:
            doc = nlp(text[:2000])  # first chunk
            for ent in doc.ents:
                if ent.label_ == 'PERSON':
                    parts = ent.text.strip().split()
                    if len(parts) >= 2 and parts[0][0].isupper() and parts[1][0].isupper():
                        return parts[0], " ".join(parts[1:])
        except Exception:
            pass
    # Fallback #1: look for "Name:" within first 30 lines
    top_lines = [ln.strip() for ln in text.splitlines()[:30] if ln.strip()]
    for line in top_lines:
        if ':' in line:
            key, val = line.split(':', 1)
            if clean_key(key) in ("name", "full name"):
                parts = val.strip().split()
                if len(parts) >= 2:
                    return parts[0], " ".join(parts[1:])
    # Fallback #2: infer from email local part
    m = EMAIL_REGEX.search(text)
    if m:
        local = m.group(0).split('@', 1)[0]
        local = re.sub(r"\d+", "", local)
        parts = re.split(r"[._-]", local)
        parts = [p for p in parts if p]
        if len(parts) >= 2:
            return parts[0].title(), " ".join(p.title() for p in parts[1:])
    # Fallback #3: first non-heading line with 2-4 capitalized tokens
    heading_words = {"education", "skills", "experience", "projects", "extracurricular", "extra-curricular"}
    for line in top_lines[:10]:
        lw = line.lower()
        if any(hw in lw for hw in heading_words):
            continue
        tokens = line.split()
        cap_tokens = [t for t in tokens if t and t[0].isupper()]
        if 2 <= len(cap_tokens) <= 4:
            return cap_tokens[0], " ".join(cap_tokens[1:])
    return "", ""


def split_sections(text: str) -> Dict[str, str]:
    lines = [ln.rstrip() for ln in text.splitlines()]
    indices = {}
    section_order: List[Tuple[str, int]] = []
    pattern_map = {
        # Allow short non-letter prefix like punctuation before the heading word
        'education': re.compile(r"^\s*[^A-Za-z]{0,10}\s*education\b", re.I),
        'skills': re.compile(r"^\s*[^A-Za-z]{0,10}\s*skills\b", re.I),
        'experience': re.compile(r"^\s*[^A-Za-z]{0,10}\s*(work\s+)?experience\b", re.I),
        'projects': re.compile(r"^\s*[^A-Za-z]{0,10}\s*projects\b", re.I),
        'extras': re.compile(r"^\s*[^A-Za-z]{0,10}\s*(?:extra[-\s]?curricular|activities)\b", re.I),
        'internships': re.compile(r"^\s*[^A-Za-z]{0,10}\s*internships\b", re.I),
        'achievements': re.compile(r"^\s*[^A-Za-z]{0,10}\s*(?:academic\s+achievements|achievements)\b", re.I),
        'positions': re.compile(r"^\s*[^A-Za-z]{0,10}\s*positions\b", re.I),
        'subjects': re.compile(r"^\s*[^A-Za-z]{0,10}\s*(?:key\s+subjects|subjects)\b", re.I),
    }
    for idx, ln in enumerate(lines):
        for name, pat in pattern_map.items():
            if name not in indices and pat.search(ln):
                indices[name] = idx
                section_order.append((name, idx))
    section_order.sort(key=lambda x: x[1])
    sections: Dict[str, str] = {}
    # Header is everything before first section
    first_idx = section_order[0][1] if section_order else len(lines)
    sections['header'] = "\n".join(lines[:first_idx]).strip()
    for i, (name, start) in enumerate(section_order):
        end = section_order[i + 1][1] if i + 1 < len(section_order) else len(lines)
        sections[name] = "\n".join(lines[start:end]).strip()
    return sections


def _degree_to_level(degree_text: str) -> str:
    s = degree_text.lower()
    # PhD / Doctorate
    if re.search(r"\b(ph\.?d|doctorate|doctoral)\b", s):
        return "Ph.d"
    # Post-Graduation (Masters, MBA, M.Tech, M.Sc, M.E., MS, MA)
    if re.search(r"\b(m\.?tech|mtech|m\.?e\b|m\.?sc|msc|mba|m\.s\.|ms\b|m\.?a\b|master|post\s*-?graduation)\b", s):
        return "Post-Graduation"
    # Graduation (Bachelors: B.Tech, BE, BSc, BA, BCA, B.Com, BS, etc.)
    if re.search(r"\b(b\.?tech|btech|b\.?e\b|b\.?sc|bsc|b\.?a\b|ba\b|bca\b|bcom|b\.?com|bachelor|bs\b|b\.s\.)\b", s):
        return "Graduation"
    # Diploma/Certificate
    if re.search(r"\b(diploma|polytechnic|certificate)\b", s):
        return "Diploma"
    return ""


def _extract_major_from_line(line: str) -> str:
    # Prefer content after 'in' up to comma/semicolon/" from/at"
    m = re.search(r"\bin\s+([^,;\n]+)", line, flags=re.I)
    if m:
        major = m.group(1)
        # Trim trailing words like 'engineering', 'technology' if they look generic
        major = re.sub(r"\b(engineering|technology|tech|engg)\b", "", major, flags=re.I)
        major = re.sub(r"\s+", " ", major).strip(" -:.,")
        return major
    return ""


def parse_education(sec_text: str) -> List[Dict[str, str]]:
    if not sec_text:
        return []
    rows: List[Dict[str, str]] = []
    degree_pat = re.compile(r"(ph\.?d|doctorate|doctoral|m\.?tech|mtech|m\.?e\b|m\.?sc|msc|mba|ms\b|m\.?s\.|master|b\.?tech|btech|b\.?e\b|b\.?sc|bsc|b\.?a\b|ba\b|bca\b|bcom|b\.?com|bachelor|bs\b|b\.s\.|diploma)", re.I)
    def _extract_year_of_passing(s: str) -> str:
        # Prefer end year for ranges, else last single year
        rng = list(re.finditer(r"((?:19|20)\d{2})\s*[-–—]\s*(\d{2}|\d{4})", s))
        if rng:
            y1 = rng[-1].group(1)
            y2 = rng[-1].group(2)
            if len(y2) == 2:
                return y1[:2] + y2
            return y2
        yrs = re.findall(r"(?:19|20)\d{2}", s)
        return yrs[-1] if yrs else ""
    marks_pat = re.compile(r"(cgpa|gpa|grade|percentage)\s*[:\-]?\s*([0-9.]+)", re.I)
    for block in re.split(r"\n\s*\n+", sec_text):
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        if not lines:
            continue
        # Split block into entry slices where degree keywords appear
        idxs = [i for i, ln in enumerate(lines) if degree_pat.search(ln)]
        if not idxs:
            # No recognized degree in this block — skip it entirely
            continue
            idxs = [0]
        idxs.append(len(lines))
        for s, e in zip(idxs[:-1], idxs[1:]):
            sub_lines = lines[s:e]
            line = " ".join(sub_lines)
            if not line:
                continue
            # Skip standalone level labels like 'Level: Diploma'
            if re.match(r"^\s*level\s*:\s*", sub_lines[0], flags=re.I):
                continue
            # Custom degree extraction for 'Bachelor'/'Master' phrases
            m = degree_pat.search(line)
            degree = ""
            if m:
                deg_start = m.start()
                deg_words = line[deg_start:].split()
                if deg_words and deg_words[0].lower() in ["bachelor", "master"]:
                    if len(deg_words) > 1 and deg_words[1].lower() in ["of", "in"]:
                        # Take all words after 'of' or 'in' until a breaking word
                        deg_phrase = [deg_words[0], deg_words[1]]
                        for w in deg_words[2:]:
                            if w.lower() in ["in", ",", "-", "|", "/"]:
                                break
                            deg_phrase.append(w)
                        degree = " ".join(deg_phrase)
                    else:
                        degree = deg_words[0]
                else:
                    degree = m.group(0)
            else:
                # Slice without a recognized degree — skip it
                continue
            # Year of passing: if range like 2024-26, take end year as 2026; else last 4-digit year
            year = _extract_year_of_passing(line)
            # Determine marks only from the segment after the degree line up to (but not including) the first year line
            year_line_idx = None
            for j, ltxt in enumerate(sub_lines):
                if re.search(r"(?:19|20)\d{2}", ltxt):
                    year_line_idx = j
                    break
            # Improved marks extraction: only consider numbers <= 10 from lines near year, college, major, or course
            marks = ""
            candidate_lines = []
            inst = ""  # Ensure inst is always defined before use
            # Find lines above and below year line
            if year_line_idx is not None:
                if year_line_idx > 0:
                    candidate_lines.append(sub_lines[year_line_idx-1])
                candidate_lines.append(sub_lines[year_line_idx])
                if year_line_idx < len(sub_lines)-1:
                    candidate_lines.append(sub_lines[year_line_idx+1])
            # Also check lines near college/institute, major, and course
            for idx, ltxt in enumerate(sub_lines):
                if (degree and degree in ltxt) or (inst and inst in ltxt) or ("major" in ltxt.lower()):
                    if idx > 0:
                        candidate_lines.append(sub_lines[idx-1])
                    candidate_lines.append(ltxt)
                    if idx < len(sub_lines)-1:
                        candidate_lines.append(sub_lines[idx+1])
            # Remove duplicates
            candidate_lines = list(dict.fromkeys(candidate_lines))
            # Search for valid marks
            valid_marks = []
            for cline in candidate_lines:
                # Find all numbers <= 10
                for num in re.findall(r"\b(\d+(?:\.\d+)?)\b", cline):
                    try:
                        if float(num) <= 10:
                            valid_marks.append(num)
                    except:
                        pass
                # Also check for percentage
                for perc in re.findall(r"(\d+(?:\.\d+)?)\s*%", cline):
                    valid_marks.append(perc + "%")
            if valid_marks:
                marks = valid_marks[-1]
            # Extract institute early so we can remove it from the text for major extraction
            inst = match_institute_from_education("\n".join(sub_lines), threshold=0.85)
            # Remove institute phrase from the line when extracting major (avoid contamination)
            line_for_major = line
            if inst:
                # Use a loose removal with soft-key matching to handle punctuation/case variants
                sk_inst = _soft_key(inst)
                # Build a regex to drop the institute words approximately
                words = [re.escape(w) for w in sk_inst.split() if len(w) > 2]
                if words:
                    pat = re.compile(r"\b(?:" + r"|".join(words) + r")\b", re.I)
                    line_for_major = pat.sub(" ", _soft_key(line))
                    line_for_major = re.sub(r"\s+", " ", line_for_major).strip()
            else:
                line_for_major = line
            # Major extraction: prefer 'in <subject>' if present, else clean chunk after degree
            start = m.end()
            tail = line_for_major[start:]
            tail = re.sub(r"^\s*,?\s*", "", tail)
            # Remove all institute words from major chunk
            if inst:
                inst_words = [w for w in re.split(r"[^A-Za-z0-9]+", inst) if len(w) > 2]
                for w in inst_words:
                    tail = re.sub(rf"\b{re.escape(w)}\b", "", tail, flags=re.I)
            # Always initialize m_bsc before use
            m_bsc = re.search(r"(Bachelor of Science|B\.Sc|BSc)[^\n]*in\s+([A-Za-z0-9 .&-]+)", line, flags=re.I)
            m_in = re.search(r"in\s+([A-Za-z0-9 .&-]+)", tail, flags=re.I)
            # List of stop words: institute names and education field keywords
            stop_words = [
                "university", "college", "institute", "polytechnic", "academy", "iit", "iiit", "nit", "iim",
                "jalandhar", "madras", "delhi", "odisha", "expected", "grade", "point", "board", "bse", "chse",
                "technology", "engineering", "diploma", "school", "education", "level", "science"
            ]
            def clean_major(raw):
                # Preserve periods, only split on comma, semicolon, colon, digits, and stop words
                tokens = re.split(r"[,;:\d]", raw)
                major_tokens = []
                for token in tokens:
                    token_strip = token.strip()
                    # If any stop word appears, stop
                    if any(re.search(rf"\b{re.escape(sw)}\b", token_strip, flags=re.I) for sw in stop_words):
                        break
                    major_tokens.append(token_strip)
                return " ".join(major_tokens).strip()

            # Try to extract major after 'in' even for non-standard wording
            m_generic_in = re.search(r"in\s+([A-Za-z0-9 .&-]+)", line, flags=re.I)
            # After extracting course and institute, check remaining text for major
            majors_vocab = _load_list_csv(MAJORS_CSV)
            # Remove course and institute from line
            line_clean = line
            if degree:
                line_clean = re.sub(re.escape(degree), '', line_clean, flags=re.I)
            if inst:
                line_clean = re.sub(re.escape(inst), '', line_clean, flags=re.I)
            # Remove commas and extra spaces
            line_clean = re.sub(r'[,:;\-]', ' ', line_clean)
            line_clean = re.sub(r'\s+', ' ', line_clean).strip()
            major = ''
            for term in majors_vocab:
                # Match whole word or phrase, case-insensitive
                if re.search(rf'\b{re.escape(term)}\b', line_clean, flags=re.I):
                    major = term
                    break
            board_name = ""
            inst_name = ""
            if inst:
                # Special handling for IIT/NIT
                iit_match = re.search(r"(Indian Institute of Technology|National Institute of Technology)\s*(,)?\s*([A-Za-z]+)?", line, flags=re.I)
                if iit_match:
                    base = iit_match.group(1).strip()
                    extra = ''
                    # If there is a comma or space, take the next word
                    if iit_match.group(3):
                        extra = iit_match.group(3).strip()
                    inst_full = base + (' ' + extra if extra else '')
                    inst_name = inst_full.strip()
                elif re.search(r"university\b", inst, flags=re.I):
                    board_name = inst
                else:
                    inst_name = inst
            # Map degree to education level category
            level_cat = _degree_to_level(degree)
            rows.append({
                "level": level_cat,
                "course": degree.title() if degree else "",
                "major": major,
                "board university name": board_name,
                "institute name": inst_name,
                "year of passing": year,
                "marks or grade": marks,
            })
    return rows or []


def parse_skills(sec_text: str, full_text: str) -> List[str]:
    # Only return skills explicitly present in the document; do not enrich
    # from any dictionaries.
    items: List[str] = []
    if sec_text:
        for ln in sec_text.splitlines():
            raw = ln.strip()
            # Remove bullet and common non-alphanumeric symbols
            raw = re.sub(r"^[•\-\*\u2022\u2023\u25E6\u2043\u2219]+\s*", "", raw)
            raw = re.sub(r"[•\-\*\u2022\u2023\u25E6\u2043\u2219]", "", raw)
            raw = re.sub(r"^\W+|\W+$", "", raw)
            raw = re.sub(r"etc", "", raw)
            if not raw:
                continue
            # Skip the main section header line itself
            if re.match(r"^\s*skills\b", raw, flags=re.I):
                continue
            # Strip label prefixes like 'Technical Skills', 'Frameworks and Libraries', etc.
            raw = re.sub(r"^(technical\s+skills|frameworks?\s+and\s+libraries|frameworks|libraries|soft\s+skills|graphic\s+design(ing)?\s+skills|design\s+skills)\s*[:\-]?\s*",
                         "", raw, flags=re.I)
            if "," in raw or ";" in raw:
                parts = re.split(r"[,;]", raw)
                parts = [p.strip() for p in parts if p.strip()]
                items.extend(parts)
            else:
                # Single-line bullets that look like skills
                token_count = len([t for t in re.split(r"\s+", raw) if t])
                if 1 <= token_count <= 8:
                    items.append(raw)
    # Normalize, dedupe
    skills_vocab = _load_list_csv(SKILLS_CSV)
    def similarity(a, b):
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()
    seen = set()
    out = []
    for s in [it for it in items if it]:
        best_match = s
        best_score = 0.0
        for vocab_skill in skills_vocab:
            score = similarity(s, vocab_skill)
            if score > best_score:
                best_score = score
                best_match = vocab_skill if score > 0.92 else s  # Use vocab skill if similarity is very high
        key = best_match.lower()
        if key not in seen:
            seen.add(key)
            out.append(best_match)
    return out


def parse_experience(sec_text: str) -> Tuple[List[Dict[str, str]], str]:
    rows: List[Dict[str, str]] = []
    total_months = 0
    if not sec_text:
        return rows, ""
    # Split by role blocks separated by blank lines
    for block in re.split(r"\n\s*\n+", sec_text):
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        if not lines:
            continue
        # find date range in first 2 lines
        dater = ""
        date_pat = re.compile(r"(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}\s*[–-]\s*(present|\w+\s+\d{4})", re.I)
        for l in lines[:3]:
            m = date_pat.search(l)
            if m:
                dater = m.group(0)
                break
        # Exclude the header-like first line if it's just 'EXPERIENCE'
        content_lines = lines[1:] if re.match(r"^experience$", lines[0], flags=re.I) else lines
        details = " ".join([l for l in content_lines if not date_pat.search(l)])
        rows.append({
            "type": "",
            "years": "",
            "details": details,
        })
    # years aggregation left empty (can compute later)
    return rows, ""


def extract_skills(text: str) -> List[str]:
    skills_vocab = _load_list_csv(SKILLS_CSV)
    found: List[str] = []
    lower = text.lower()
    for term in skills_vocab:
        t = term.strip()
        if t and t.lower() in lower:
            found.append(term)
    # de-duplicate preserving order
    seen = set()
    out = []
    for s in found:
        if s.lower() not in seen:
            seen.add(s.lower())
            out.append(s)
    return out


def extract_major(text: str) -> str:
    majors_vocab = _load_list_csv(MAJORS_CSV)
    lower = text.lower()
    for term in majors_vocab:
        if term.lower() in lower:
            return term
    return ""


def extract_education_level(text: str) -> str:
    levels_vocab = _load_list_csv(EDU_LEVELS_CSV)
    lower = text.lower()
    for term in levels_vocab:
        if term.lower() in lower:
            return term
    return ""


def _load_colleges() -> List[str]:
    return _load_list_csv(COLLEGES_CSV)


def _tokenize(s: str) -> List[str]:
    # Ignore very short tokens (e.g., D.A.V -> d a v) to reduce noise
    return [w for w in re.split(r"[^a-z0-9]+", s.lower()) if len(w) > 2]



def match_college_in_text(text: str) -> str:
    colleges = _load_colleges()
    if not colleges:
        return ""
    lower = text.lower()
    best = ""
    best_len = 0
    # 1) Direct substring match (prefer longest)
    for name in colleges:
        n = name.strip()
        if not n:
            continue
        if n.lower() in lower:
            if len(n) > best_len:
                best = n
                best_len = len(n)
    if best:
        return best
    # 2) Token-overlap fuzzy match
    ctx_words = set(_tokenize(text))
    best_score = 0.0
    best_name = ""
    for name in colleges:
        words = [w for w in _tokenize(name) if len(w) > 1]  # ignore 1-char like 'a'
        if not words:
            continue
        inter = sum(1 for w in words if w in ctx_words)
        score = inter / max(1, len(words))
        if score > best_score or (score == best_score and len(name) > len(best_name)):
            best_score = score
            best_name = name
    if best_score >= 0.6:
        return best_name
    return ""


def _soft_key(s: str) -> str:
    s = s.lower().replace(" and ", " & ")
    s = re.sub(r"[^a-z0-9 &]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _jaccard(a: List[str], b: List[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 1.0
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def _strip_degree_noise(line: str) -> str:
    # remove common degree/marks/major noise segments
    noise_patterns = [
        r"\b(b\.?tech|b\.?e|be\b|bsc|b\.sc|m\.?tech|mtech|me\b|msc|m\.sc|diploma|phd|doctorate)\b",
        r"\b(cse|computer\s+science|ece|eee|it|civil|mechanical|mech|electronics|electrical)\b",
        r"\b(cgpa|gpa|grade|percentage)\s*[:\-]?\s*[0-9.]+\b",
        r"\bin\s+[a-z0-9 &/.-]+",  # phrases like 'in C.S.E' or 'in Computer Science'
        r"\(.*?\)",  # drop parenthetical parts
        r"\bfrom\b\s*",  # we'll handle 'from' in slicing below
        r"\bat\b\s*",
    ]
    s = line
    for pat in noise_patterns:
        s = re.sub(pat, " ", s, flags=re.I)
    s = re.sub(r"\s+", " ", s).strip(' ,.-')
    return s


def extract_institute_candidates(edu_text: str) -> List[str]:
    if not edu_text:
        return []
    kws = re.compile(r"\b(university|college|institute|polytechnic|school|academy|technology|technological|iit|iiit|nit|iim)\b", re.I)
    cands: List[str] = []
    for raw in edu_text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if not kws.search(line):
            continue
        # Prefer the part after 'from' or 'at' if present
        part = line
        m = re.search(r"\b(from|at)\b\s+(.+)$", line, flags=re.I)
        if m:
            part = m.group(2).strip()
        cleaned = _strip_degree_noise(part)
        if cleaned and kws.search(cleaned):
            # Split on comma/semicolon and prefer the part that still contains keywords
            segments = [seg.strip() for seg in re.split(r"[,;]", cleaned) if seg.strip()]
            cand = ""
            for seg in segments:
                if kws.search(seg):
                    cand = seg
                    break
            if not cand:
                cand = cleaned
            # simple length guard to avoid tiny tokens like 'D.A.V'
            if len(cand) >= 6:
                cands.append(cand)
    # dedupe preserving order
    seen = set()
    out: List[str] = []
    for c in cands:
        sk = _soft_key(c)
        if sk not in seen:
            seen.add(sk)
            out.append(c)
    return out


def match_institute_from_education(edu_text: str, threshold: float = 0.85) -> str:
    colleges = _load_colleges()
    if not colleges or not edu_text:
        return ""
    cands = extract_institute_candidates(edu_text)
    if not cands:
        return ""
    # 0) Prefer exact match against college list using normalized keys; return CV wording
    norm_college_keys = { _soft_key(name) for name in colleges if name.strip() }
    for cand in cands:
        if _soft_key(cand) in norm_college_keys:
            return cand  # use wording from PDF (education section only)
        # 0.5) Accept PDF wording if it's a substring of a CSV name (e.g., 'IIT Kanpur' within
        #      'Indian Institute of Technology - IIT Kanpur')
        for cand in cands:
            sk_c = _soft_key(cand)
            if len(sk_c) < 5:
                continue
            for name in colleges:
                if sk_c in _soft_key(name):
                    return cand
    best_cand = ""
    best_score = 0.0
    for cand in cands:
        sk_c = _soft_key(cand)
        toks_c = _tokenize(sk_c)
        local_best = 0.0
        for name in colleges:
            sk_n = _soft_key(name)
            toks_n = _tokenize(sk_n)
            seq = SequenceMatcher(None, sk_c, sk_n).ratio()
            jac = _jaccard(toks_c, toks_n)
            score = max(seq, jac)
            if score > local_best:
                local_best = score
            if local_best >= 0.999:
                break
        if local_best > best_score:
            best_score = local_best
            best_cand = cand
    if best_score >= threshold:
        return best_cand
    return ""


def extract_years_experience(text: str) -> str:
    # Simple patterns like "3 years", "2+ years", "1 year"
    m = re.search(r"(\d+\+?)\s*years?", text.lower())
    return m.group(1) if m else ""


def parse_resume(pdf_path: str) -> Dict:
    text = extract_text_from_pdf(pdf_path)
    print("\n--- Raw Extracted Text ---\n")
    print(text)
    print("\n--- End Raw Text ---\n")

    sections = split_sections(text)
    header = sections.get('header', '')
    edu_sec = sections.get('education', '')
    skills_sec = sections.get('skills', '')
    exp_sec = sections.get('experience', '')

    # Core extractions (use header for name/contacts if possible)
    email = extract_email(header or text)
    phone = extract_phone(header or text)
    first_name, last_name = extract_name(header or text)
    skills_list = parse_skills(skills_sec, text)
    # Build detailed education rows (each block becomes one row)
    edu_rows = parse_education(edu_sec)

    # Determine highest education level category and major from the highest row
    level_rank = {"Diploma": 1, "Graduation": 2, "Post-Graduation": 3, "Ph.d": 4}
    highest_row = None
    best_rank = -1
    for r in edu_rows:
        lvl = r.get("level", "")
        rank = level_rank.get(lvl, 0)
        if rank > best_rank:
            best_rank = rank
            highest_row = r
    edu_level = highest_row.get("level", "") if highest_row else ""
    major = highest_row.get("major", "") if highest_row else ""
    exp_rows, years_exp = parse_experience(exp_sec)
    # Institutes are already matched per-row inside parse_education

    # Build mapped output aligned to our DB-oriented fields
    applicant = {
        "name": (first_name + (" " + last_name if last_name else "")).strip(),
        "father name": "",  # Not usually in resumes; keep empty unless present explicitly
        "category": "",
        "education level": edu_level,
        "major": major,
    "skills": ", ".join(skills_list),
        "sectors of interest": "",
        "preferred locations": "",
        "remote ok": "",
        "experience years": years_exp,
        "preferred language": "",
        "disability status": "",
        "mobile number": phone,
        "alt mobile number": "",
        "email": email,
        "aadhaar number": "",
        "bank account linked": "",
        "languages known": "",
        "address line1": "",
        "address line2": "",
        "state": "",
        "district": "",
        "pincode": "",
    }

    # Education rows are preserved as parsed (possibly empty)
    education = edu_rows if edu_rows else []

    experience = exp_rows if exp_rows else [{
        "type": "",
        "years": years_exp,
        "details": "",
    }]

    result = {
        "applicant": applicant,
        "education": education,
        "experience": experience,
    }

    # Pretty print mapped structure
    print("\n--- Parsed Resume (mapped to fields) ---")
    for section, payload in result.items():
        print(f"\n[{section}]")
        if isinstance(payload, list):
            for i, row in enumerate(payload, 1):
                print(f"  - entry {i}:")
                for k, v in row.items():
                    print(f"      {k}: {v}")
        else:
            for k, v in payload.items():
                print(f"  {k}: {v}")
    print("--- End Parsed Resume ---\n")

    return result