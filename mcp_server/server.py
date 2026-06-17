import sys
import json
from pathlib import Path

# Ensure the project root is on sys.path so 'rag' package is importable
PROJECT_ROOT = str(Path(__file__).parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastmcp import FastMCP
from rag.retrieval import query_database

mcp = FastMCP("Nyaya Sahayak Legal Tools")

DATA_DIR = Path(__file__).parent.parent / "data" / "raw"

# Load IPC/BNS data at module level for fast lookups
with open(DATA_DIR / "ipc_bns_mapping.json", "r", encoding="utf-8") as f:
    IPC_BNS_DATA = json.load(f)


# ──────────────────────────────────────────────
# TOOL 1: Search Legal Database (RAG)
# ──────────────────────────────────────────────

@mcp.tool()
def search_legal_database(query: str) -> str:
    """
    Search the Nyaya Sahayak legal database for Indian laws, IPC/BNS mappings,
    constitutional articles, and consumer/labor/property laws.

    Args:
        query: The natural language search query.
    """
    if not query or not query.strip():
        return "Error: Please provide a non-empty search query."
    return query_database(query)


# ──────────────────────────────────────────────
# TOOL 2: Search BNS/IPC Section
# ──────────────────────────────────────────────

@mcp.tool()
def search_bns_section(query: str) -> dict:
    """Search Indian Penal Code (IPC) and Bharatiya Nyaya Sanhita (BNS) sections.

    Accepts a section number (e.g. "420", "302") or a keyword (e.g. "theft", "murder").
    Returns matching sections with both old IPC and new BNS details.

    Args:
        query: Section number or keyword to search for.
    """
    if not query or not query.strip():
        return {"found": False, "results": [], "message": "Error: Please provide a section number or keyword."}

    query = query.strip().lower()
    results = []

    for entry in IPC_BNS_DATA:
        # Match by section number (IPC or BNS)
        if query == entry.get("ipc_section", "").lower() or query == entry.get("bns_section", "").lower():
            results.append(entry)
            continue
        # Match by keyword in title or description
        title = entry.get("ipc_title", "").lower()
        desc = entry.get("ipc_description", "").lower()
        category = entry.get("category", "").lower()
        if query in title or query in desc or query in category:
            results.append(entry)

    if not results:
        return {"found": False, "results": [], "message": f"No sections matched '{query}'. Try a different keyword or section number."}

    return {"found": True, "results": results, "message": f"Found {len(results)} matching section(s)."}


# ──────────────────────────────────────────────
# TOOL 3: Check Limitation Period
# ──────────────────────────────────────────────

LIMITATION_PERIODS = {
    "civil_suit": {
        "period": "3 years",
        "act": "Limitation Act, 1963",
        "details": "For recovery of money, movable property, or specific performance of contract."
    },
    "criminal_complaint": {
        "period": "Varies by offence",
        "act": "Code of Criminal Procedure, 1973 (Section 468)",
        "details": "6 months for offences punishable up to 1 year; 1 year for offences punishable up to 3 years; 3 years for offences punishable with 3+ years. No limitation for offences punishable with death/life imprisonment."
    },
    "consumer_complaint": {
        "period": "2 years",
        "act": "Consumer Protection Act, 2019 (Section 69)",
        "details": "Within 2 years from the date on which the cause of action arose."
    },
    "cheque_bounce": {
        "period": "30 days + 1 month",
        "act": "Negotiable Instruments Act, 1881 (Section 138)",
        "details": "Demand notice within 30 days of cheque return. Complaint within 1 month of expiry of 15-day notice period."
    },
    "property_dispute": {
        "period": "12 years",
        "act": "Limitation Act, 1963 (Article 65)",
        "details": "For possession of immovable property based on title."
    },
    "motor_accident": {
        "period": "6 months",
        "act": "Motor Vehicles Act, 1988 (Section 166)",
        "details": "Claim petition within 6 months of accident. Tribunal may accept late claims with sufficient cause."
    },
    "labor_dispute": {
        "period": "3 years",
        "act": "Industrial Disputes Act, 1947",
        "details": "For raising industrial dispute. Varies by state for wage recovery."
    },
    "divorce": {
        "period": "No fixed limitation",
        "act": "Hindu Marriage Act, 1955 / Special Marriage Act, 1954",
        "details": "No limitation for filing divorce petition. 1-year cooling period for mutual consent divorce."
    }
}


@mcp.tool()
def check_limitation_period(case_type: str) -> dict:
    """Look up the statute of limitations (time limit) for filing a legal case in India.

    Args:
        case_type: Type of case. One of: civil_suit, criminal_complaint, consumer_complaint,
                   cheque_bounce, property_dispute, motor_accident, labor_dispute, divorce
    """
    if not case_type or not case_type.strip():
        return {"error": "Please provide a case type.", "available_types": list(LIMITATION_PERIODS.keys())}

    # Normalize input
    normalized = case_type.strip().lower().replace(" ", "_")

    if normalized not in LIMITATION_PERIODS:
        return {
            "error": f"Unknown case type: '{case_type}'.",
            "available_types": list(LIMITATION_PERIODS.keys())
        }

    data = LIMITATION_PERIODS[normalized]
    return {
        "case_type": normalized,
        "period": data["period"],
        "act": data["act"],
        "details": data["details"]
    }


# ──────────────────────────────────────────────
# TOOL 4: Find Relevant Acts
# ──────────────────────────────────────────────

ACT_MAPPINGS = {
    "labor": {
        "keywords": ["salary", "employer", "termination", "fired", "wages", "overtime", "retrenchment", "worker", "employee", "pf", "provident", "gratuity", "maternity", "harassment", "workplace"],
        "act_name": "Labor Laws (Industrial Disputes Act, Payment of Wages Act, POSH Act 2013)",
        "relevant_sections": "ID Act S.2(k), S.25F, S.25G; Payment of Wages Act; POSH Act 2013 — ICC procedure",
        "brief_description": "Covers employment disputes, wrongful termination, unpaid wages, workplace harassment, and social security benefits."
    },
    "property": {
        "keywords": ["landlord", "tenant", "rent", "eviction", "lease", "property", "registration", "rera", "builder", "flat", "apartment", "mortgage"],
        "act_name": "Property Laws (Transfer of Property Act 1882, RERA 2016)",
        "relevant_sections": "TPA S.105-106 (Lease), S.108 (Rights), Registration Act 1908, RERA 2016",
        "brief_description": "Covers tenancy rights, eviction protection, property transfer, registration, and real estate regulation."
    },
    "family": {
        "keywords": ["divorce", "marriage", "custody", "maintenance", "alimony", "dowry", "domestic violence", "husband", "wife", "child"],
        "act_name": "Family Laws (Hindu Marriage Act 1955, DV Act 2005, S.125 CrPC)",
        "relevant_sections": "HMA S.13 (Divorce), S.13B (Mutual Consent), S.125 CrPC (Maintenance), DV Act 2005",
        "brief_description": "Covers marriage, divorce, child custody, maintenance, dowry harassment, and domestic violence protection."
    },
    "consumer": {
        "keywords": ["product", "defective", "refund", "consumer", "complaint", "service", "warranty", "misleading", "advertisement", "online shopping"],
        "act_name": "Consumer Protection Act, 2019",
        "relevant_sections": "S.2 (Definitions), S.35-38 (Filing), S.69 (Limitation: 2 years), S.84-87 (Product Liability)",
        "brief_description": "Covers consumer rights, defective products, deficient services, misleading ads, and e-commerce disputes."
    },
    "motor_vehicle": {
        "keywords": ["accident", "driving", "vehicle", "insurance", "licence", "drunk", "helmet", "challan", "traffic", "hit and run"],
        "act_name": "Motor Vehicles Act, 1988 (Amended 2019)",
        "relevant_sections": "S.185 (Drunk Driving), S.184 (Dangerous Driving), S.140-144 (No-fault liability), S.161-164 (MACT)",
        "brief_description": "Covers traffic violations, accident compensation, drunk driving penalties, and insurance claims."
    },
    "rti": {
        "keywords": ["information", "government", "rti", "transparency", "disclosure", "public authority", "pio"],
        "act_name": "Right to Information Act, 2005",
        "relevant_sections": "S.6 (Filing: ₹10 fee), S.7 (30-day response), S.8 (Exemptions), S.18-19 (Appeals), S.20 (Penalties)",
        "brief_description": "Covers right to access government information, filing procedure, exemptions, appeals, and penalties."
    },
    "criminal": {
        "keywords": ["theft", "fraud", "assault", "murder", "robbery", "cheating", "forgery", "rape", "kidnapping", "fir", "police", "bail", "arrest"],
        "act_name": "Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS) 2023",
        "relevant_sections": "IPC/BNS sections vary by offence. Use search_bns_section tool for specific sections.",
        "brief_description": "Covers criminal offences including theft, assault, fraud, sexual offences, and their punishments under both old IPC and new BNS."
    },
    "constitution": {
        "keywords": ["fundamental rights", "constitution", "article", "equality", "freedom", "speech", "religion", "writ", "habeas corpus"],
        "act_name": "Constitution of India",
        "relevant_sections": "Art 14 (Equality), Art 19 (Freedoms), Art 21 (Life & Liberty), Art 32 (Supreme Court writs), Art 226 (HC writs)",
        "brief_description": "Covers fundamental rights, directive principles, constitutional remedies, and writ jurisdictions."
    }
}


@mcp.tool()
def find_relevant_acts(situation: str) -> list[dict]:
    """Given a situation description, find the most relevant Indian laws and acts.

    Args:
        situation: Plain English description (e.g. "my employer hasn't paid salary for 3 months")
    """
    if not situation or not situation.strip():
        return [{"error": "Please describe your situation."}]

    situation_lower = situation.strip().lower()
    matched = []

    for category, mapping in ACT_MAPPINGS.items():
        score = sum(1 for kw in mapping["keywords"] if kw in situation_lower)
        if score > 0:
            matched.append({
                "relevance_score": score,
                "act_name": mapping["act_name"],
                "relevant_sections": mapping["relevant_sections"],
                "brief_description": mapping["brief_description"]
            })

    # Sort by relevance score (most matches first)
    matched.sort(key=lambda x: x["relevance_score"], reverse=True)

    if not matched:
        return [{
            "act_name": "General Legal Aid",
            "relevant_sections": "Legal Services Authorities Act, 1987",
            "brief_description": "No specific act matched. Consider contacting your nearest Legal Aid Centre or District Legal Services Authority (DLSA) for free legal assistance. Call toll-free: 15100 (NALSA helpline)."
        }]

    # Remove the score from the output
    for m in matched:
        del m["relevance_score"]

    return matched


# ──────────────────────────────────────────────
# RESOURCE: Legal Statistics
# ──────────────────────────────────────────────

@mcp.resource("legal://statistics")
def get_legal_statistics() -> str:
    """Returns key statistics about the Indian legal system."""
    stats = {
        "court_hierarchy": ["Supreme Court", "High Courts (25)", "District Courts (600+)"],
        "pending_cases": {
            "supreme_court": "~80,000",
            "high_courts": "~60,00,000",
            "district_courts": "~4,40,00,000",
            "total": "~5,00,00,000 (5 crore)"
        },
        "judges": {
            "supreme_court": "34 (sanctioned)",
            "high_courts": "~1,100 (sanctioned)",
            "district_courts": "~25,000 (sanctioned)"
        },
        "judge_population_ratio": "21 judges per million population (recommended: 50)",
        "avg_disposal_time": {
            "district_courts": "3-5 years",
            "high_courts": "5-10 years",
            "supreme_court": "2-5 years"
        },
        "alternative_dispute_resolution": ["Lok Adalat", "Mediation", "Arbitration"],
        "free_legal_aid": "Available under Legal Services Authorities Act, 1987 for SC/ST, women, children, disabled, and persons with annual income under ₹3 lakh"
    }
    return json.dumps(stats, indent=2)


# ──────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run()
