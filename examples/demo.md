# Nyaya Sahayak — Demo Interactions

Three example interactions showing the full **Thought → Action → Observation → Answer** flow.

---

## Example 1: MCP Tool Route — IPC Section Lookup

**Query:** "What is Section 420 of IPC?"

**Expected Route:** `Supervisor → Action → Explainer`

### Flow:

```
You: What is Section 420 of IPC?

  🤔 Processing: "What is Section 420 of IPC?"

  🧭 Supervisor → route: action
  ⚡ Action → calling MCP tool: search_bns_section({"query": "420"})
  ✅ Action → got result from search_bns_section
  📝 Explainer → answer generated

📜 Nyaya Sahayak:

📋 Answer
Section 420 IPC (Cheating and dishonestly inducing delivery of property) is now
covered under Section 316 of the Bharatiya Nyaya Sanhita (BNS), 2023.

📌 Key Sections
• IPC Section 420 — Cheating and dishonestly inducing delivery of property
• BNS Section 316 — Equivalent new section under BNS 2023
• Punishment: Up to 7 years imprisonment + fine

🪜 Steps You Can Take
• File an FIR at your nearest police station under Section 316 BNS
• Collect all evidence: receipts, messages, bank statements
• You can also file a complaint with the Cyber Crime Cell if the fraud was online

⚖️ When to Consult a Lawyer
If the amount involved is significant or the accused is absconding, consult a
criminal lawyer immediately.

⚠️ DISCLAIMER: Yeh sirf jaankari ke liye hai, professional legal advice nahi hai.
```

---

## Example 2: RAG Route — General Rights Query

**Query:** "What are my rights as a tenant against illegal eviction?"

**Expected Route:** `Supervisor → Researcher → Explainer`

### Flow:

```
You: What are my rights as a tenant against illegal eviction?

  🤔 Processing: "What are my rights as a tenant against illegal eviction?"

  🧭 Supervisor → route: research
  🔬 Researcher → queries: [
    "What are my rights as a tenant against illegal eviction?",
    "Tenant protection laws India illegal eviction",
    "Rights of tenants under Transfer of Property Act"
  ]
  📚 Researcher → retrieved 7 unique chunks
  📝 Explainer → answer generated

📜 Nyaya Sahayak:

📋 Answer
As a tenant in India, you have strong legal protection against illegal eviction.
A landlord CANNOT evict you without following proper legal procedure through the court.

📌 Key Sections
• Transfer of Property Act 1882, Section 108 — Rights and liabilities of the lessee
• Section 106 — Notice requirement (15 days for monthly tenancy)
• State-specific Rent Control Acts — Additional protections
• CrPC Section 145 — Magistrate's power in disputes about immovable property

🪜 Steps You Can Take
1. If threatened with eviction, ask for the eviction notice in writing
2. Do NOT vacate without a court order
3. File a complaint with the police if the landlord uses force
4. Apply to the Rent Controller/Rent Court in your area
5. Keep paying rent (use money order if landlord refuses to accept)

⚖️ When to Consult a Lawyer
Immediately, if the landlord has cut water/electricity or is using intimidation.

⚠️ DISCLAIMER: Yeh sirf jaankari ke liye hai, professional legal advice nahi hai.
```

---

## Example 3: Both Route — Combined Query

**Query:** "What is the limitation period for filing a consumer complaint and how do I file one?"

**Expected Route:** `Supervisor → Both (Researcher + Action) → Explainer`

### Flow:

```
You: What is the limitation period for filing a consumer complaint and how do I file one?

  🤔 Processing: "What is the limitation period for filing a consumer complaint and how do I file one?"

  🧭 Supervisor → route: both
  🔄 Both → running Research + Action in sequence...
  🔬 Researcher → queries: [
    "What is the limitation period for filing a consumer complaint and how do I file one?",
    "Consumer complaint filing process India",
    "Consumer Protection Act complaint procedure"
  ]
  📚 Researcher → retrieved 6 unique chunks
  ⚡ Action → calling MCP tool: check_limitation_period({"case_type": "consumer_complaint"})
  ✅ Action → got result from check_limitation_period
  📝 Explainer → answer generated

📜 Nyaya Sahayak:

📋 Answer
Consumer complaint ka limitation period **2 saal** hai, from the date when the
cause of action arose (Consumer Protection Act, 2019 — Section 69).

📌 Key Sections
• Consumer Protection Act, 2019 — Section 69: Limitation period of 2 years
• Section 35-38: Filing procedure for consumer complaints
• Section 84-87: Product Liability provisions

🪜 Steps You Can Take
1. File online at consumerhelpline.gov.in or e-daakhil.nic.in
2. For claims up to ₹1 crore → District Consumer Forum
3. For ₹1-10 crore → State Consumer Commission
4. For above ₹10 crore → National Consumer Commission
5. Documents needed: bill/invoice, warranty card, complaint letter to seller,
   seller's response (or proof that you complained)
6. Court fee: Nominal (₹100–₹5,000 depending on claim amount)
7. No lawyer required — you can argue your own case

⚖️ When to Consult a Lawyer
If the claim amount is large (above ₹10 lakh) or involves a large corporation.

⚠️ DISCLAIMER: Yeh sirf jaankari ke liye hai, professional legal advice nahi hai.
```

---

## Architecture Diagram

```
User Question
     │
┌────▼────────┐
│  Supervisor  │ ← Gemini classifies query
└────┬────────┘
     │
     ├── "research" ──► Researcher (RAG: multi-query retrieval)
     │                       │
     ├── "action" ───► Action (MCP Client: tool calls via stdio)
     │                       │
     └── "both" ────► Both (Researcher + Action in sequence)
                             │
                      ┌──────▼──────┐
                      │  Explainer   │ ← Gemini synthesizes answer
                      └──────┬──────┘
                             │
                        Final Answer
```
