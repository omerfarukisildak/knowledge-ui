# Questions Screen — Endpoint Contract (slim)

Endpoints for the Questions screen (`/knowledge/questions`). **5 new** endpoints plus 3 already
specified for Dasi.

Call shape: browser → `/api/knowledge/<path>` (Next proxy, attaches the token server-side) →
`{BACKEND_API_URL}/<path>`. JSON bodies. Error body: `{ "message": "..." }`.

**Naming.** Paths and field names are English; enum **values** are still Turkish
(`status: "eskale_edildi"`, `target_kind: "cevap"`). See the open item in
`dasi-endpoint-contract.md`.

**Every endpoint on this screen is served by the knowledge backend** (`BACKEND_API_URL`).
The AI service (`AI_API_URL`) serves only `POST /questions` — sending a message from Dasi.
Note that `GET /questions` below is the backend, not the AI service; the proxy routes on
METHOD + path.

---

## 1. `GET /questions` — question list

The main table. Called once on load; filtering, search and pagination are done client-side today.

**Query** (all optional): `company_id`, `status`, `asker_id`

**Response**
```json
[
  {
    "id": "q_a1b2",
    "text": "Fazla mesai bordroda nasıl gösterilir?",
    "asker_id": "u2",
    "company_id": "s2",
    "tag_id": ["t3"],
    "status": "eskale_edildi",
    "created_at": "2026-08-20T09:14:00",
    "escalated_at": "2026-08-20T09:14:03",
    "solved_at": null,
    "privacy_class": "genel",
    "masked": false,
    "answer_count": 2,
    "expert_answer_count": 1,
    "real_answer_count": 1,
    "attempt_count": 1,
    "flag_count": 0
  }
]
```

The counters (they are not interchangeable):

| Field | Counts |
|---|---|
| `answer_count` | All answer records |
| `expert_answer_count` | Answers with `kind: "uzman"` |
| `real_answer_count` | Answers **not** marked `not_found` |
| `attempt_count` | Failed automatic lookups (`not_found: true`) |
| `flag_count` | Open reports on the question or its answers |

Rules:
- A failed automatic lookup is **not an answer** — it records why the question went to the pool.
  Keeping them separate avoids rows reading "Waiting for expert · 1 answer".
- `status` ∈ `otomatik_cevaplandi` | `cozuldu` | `eskale_edildi`.
- Return only rows the user is allowed to see (company access rule). Do not return company-scoped
  rows for companies the user is not assigned to.
- No cosmetic filling: `tag_id` must contain only the tags actually on that question.
- Sorted by `created_at` descending.

**Note for scale:** the screen currently loads the full list and filters in the browser. If the
list grows, the `status` / `company_id` / `asker_id` query params plus `search`, `limit`, `offset`
should be honoured server-side — the frontend can switch to them without a contract change.

## 2. `GET /questions/{question_id}` — question detail

The detail dialog: the question plus its answers in chronological order, each with its feedback.

**Response**
```json
{
  "id": "q_a1b2",
  "text": "...",
  "status": "cozuldu",
  "privacy_class": "genel",
  "masked": false,
  "answers": [
    {
      "id": "c_e5f6",
      "question_id": "q_a1b2",
      "kind": "uzman",
      "text": "Fazla mesai bordroda ayrı satır olarak...",
      "answered_by": "u3",
      "references": ["kb3"],
      "attachments": [],
      "verified": true,
      "verified_by": "u3",
      "created_at": "2026-08-21T11:02:00",
      "not_found": false,
      "rating": "yeterli",
      "masked": false,
      "feedback": [
        { "id": "g1", "target_kind": "cevap", "target_id": "c_e5f6", "user_id": "u2", "value": "onay", "date": "2026-08-21" }
      ]
    }
  ]
}
```

Rules:
- `kind` ∈ `otomatik` | `uzman`.
- `feedback` must include the requesting user's own vote — the UI highlights the button they
  already pressed. If it is omitted, the vote state is lost on reopen.
- `privacy_class = kisisel_veri` → text is masked and `masked: true` is set. The UI shows the
  "masked" note based on that flag.
- Not visible to the user → **404** (not 403; do not leak that the record exists).

## 3. `POST /feedback` — vote on an answer

The 👍 / 👎 buttons on an answer.

**Body**
```json
{ "target_kind": "cevap", "target_id": "c_e5f6", "value": "onay" }
```

`target_kind` ∈ `cevap` | `kb_kaydi` · `value` ∈ `onay` | `red`

**Response**
```json
{ "id": "g9", "target_kind": "cevap", "target_id": "c_e5f6", "user_id": "u2", "value": "onay", "date": "2026-08-24" }
```

**One vote per user per target.** A second call overwrites the existing vote instead of creating
a duplicate. After this call the UI re-fetches the detail, so the new vote must be present in
`feedback`.

## 4. `POST /flags` — report an answer

"Report" action; the user types a reason.

**Body**
```json
{ "target_kind": "cevap", "target_id": "c_e5f6", "reason": "Kaynak güncel değil, 2026 tebliği farklı." }
```

`target_kind` ∈ `cevap` | `kb_kaydi` | `soru`

**Response**
```json
{
  "id": "f4",
  "target_kind": "cevap",
  "target_id": "c_e5f6",
  "reporter_id": "u2",
  "reason": "...",
  "status": "acik",
  "priority": false,
  "date": "2026-08-24"
}
```

Rules:
- A report goes to the **shared pool** — it is not assigned to a person.
- `priority: true` when the reason concerns PII or masking; those reports jump the queue.
- `status` starts as `acik` (∈ `acik` | `inceleniyor` | `kapandi`).
- The list's `flag_count` must reflect the new report — the UI refreshes the list afterwards.

## 5. `GET /users` — user list

Resolves asker and answerer names/initials for avatars.

**Query** (optional): `role`, `active`

**Response**
```json
[{ "id": "u2", "name": "Ecmel Kaya", "email": "...", "role": "operasyon", "team": "urun", "active": true }]
```

The derived volume fields (`question_count`, `answer_count`, `mt_of_companies`) are not used on
this screen and may be `0` / `[]`.

---

## Reused from the Dasi contract

| Method | Path | Used here for |
|---|---|---|
| GET | `/tags?status=aktif` | Tag filter + tag chips on rows |
| GET | `/companies` | Company filter — entries with `access: false` are dropped |
| GET | `/me` | Role, which decides whether the screen is read-only |

## Summary

| # | Method | Path | Purpose |
|---|---|---|---|
| 1 | GET | `/questions` | Question list + counters |
| 2 | GET | `/questions/{id}` | Detail: question + answers + feedback |
| 3 | POST | `/feedback` | Vote on an answer (one per user per target) |
| 4 | POST | `/flags` | Report an answer |
| 5 | GET | `/users` | Names/avatars |
| — | GET | `/tags`, `/companies`, `/me` | Already in the Dasi contract |

## Not needed by this screen

`POST /questions/{id}/expert-answer` (writing an expert answer) is not wired here — the answer
card only renders. It belongs to the Escalations screen. `GET /feedback?target_kind=&target_id=`
(vote summary) is also unused: the detail response already embeds `feedback`.
