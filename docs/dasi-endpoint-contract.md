# Dasi Screen — Endpoint Contract (slim)

The **5 required endpoints** for the Dasi screen (`/knowledge/dasi`). Deep research and
source preference / scanned sources are out of scope.

Call shape: browser → `/api/knowledge/<path>` (Next proxy, attaches the token server-side) →
upstream service. JSON bodies. Error body: `{ "message": "..." }`.

**Naming.** Paths and field names are English. Enum **values** are still Turkish
(`status: "eskale_edildi"`, `role: "admin"`, `target_kind: "cevap"`) — see the open item at the
end of this file.

**Two upstreams.** Sending a message runs the retrieval query, so it is served by the AI
service; everything else is plain CRUD on the knowledge backend:

| Endpoint | Upstream | Env var |
|---|---|---|
| `POST /questions` | AI service | `AI_API_URL` |
| all others | Knowledge backend | `BACKEND_API_URL` |

The browser does not know the difference — it always calls `/api/knowledge/<path>` and the
proxy picks the upstream per route (`src/app/api/knowledge/[...path]/service-routing.ts`).
The routing matches METHOD + path, because `GET /questions` (Questions screen) goes to the
backend while `POST /questions` goes to the AI service. Both upstreams receive the same
`Authorization: Bearer <token>`.

---

## 1. `POST /questions` — send message · **AI service** (`AI_API_URL`)

Sends the user's message and returns the answer in the same response. The screen's core
endpoint, and the only one served by the AI service.

**Body**
```json
{
  "text": "Fazla mesai bordroda nasıl gösterilir?",
  "tag_id": ["t3"],
  "company_id": null
}
```

| Field | Meaning |
|---|---|
| `text` | The message text |
| `tag_id` | Selected tag ids (may be empty) |
| `company_id` | Selected company id, or `null` for a general question |

**Response — answer found**
```json
{
  "id": "q_a1b2",
  "text": "...",
  "status": "otomatik_cevaplandi",
  "escalated_to_expert": false,
  "created_at": "2026-08-24T14:22:10",
  "answers": [
    {
      "id": "c_e5f6",
      "question_id": "q_a1b2",
      "text": "Fazla mesainin bordroda yanlış gösterilmesi...",
      "verified": false,
      "created_at": "2026-08-24T14:22:10"
    }
  ]
}
```

**Response — no answer found**
```json
{
  "id": "q_x9y8",
  "status": "eskale_edildi",
  "escalated_to_expert": true,
  "answers": []
}
```

Rules:
- **No fabricated answers.** On no match, return `answers: []` and
  `escalated_to_expert: true`. The UI reads these two fields to switch to the
  "couldn't find it, escalated to an expert" flow.
- `status` is always either `otomatik_cevaplandi` or `eskale_edildi` — no intermediate state.
- `company_id` may only be a company the user is assigned to; otherwise **403**.
- Being slow is fine — the UI plays a waiting animation during this call. Proxy timeout is 30 s.

## 2. `POST /answers/{answer_id}/rate` — rate the answer

The two buttons under an answer. One endpoint drives both flows.

**Body**: `{ "sufficient": true }`

**Response**
```json
{
  "question": { "id": "q_a1b2", "status": "cozuldu" },
  "answer": { "id": "c_e5f6", "rating": "yeterli" }
}
```

| `sufficient` | Answer | Question |
|---|---|---|
| `true` | `rating: "yeterli"` | `status: "cozuldu"` |
| `false` | `rating: "yetersiz"` | `status: "eskale_edildi"` |

`false` means the question drops into the shared pool — it is **not** assigned to a person.

## 3. `GET /tags` — list tags

Feeds the tag picker in the composer.

**Query**: `status=aktif`

**Response**
```json
[{ "id": "t3", "name": "fazla-mesai", "category": "mevzuat", "status": "aktif" }]
```

Sorted alphabetically by `name` (Turkish collation).

## 4. `GET /companies` — list companies

Feeds the company picker in the composer.

**Response**
```json
[{ "id": "s2", "name": "Işıldak Lojistik", "status": "onayli", "access": true }]
```

**`access` is required.** The UI drops entries where it is `false`; a user cannot ask on behalf
of a company they are not assigned to. `access = true` when the user is the company's MT/ÖGY,
or their role is `bilgi_uzmani` / `admin`.

## 5. `GET /me` — current user + role

Called once on load. The role drives the screen's role gates.

**Response**
```json
{ "id": "u5", "name": "Ömer", "email": "omer@datassist.com.tr", "role": "admin" }
```

`role` ∈ `operasyon` | `bilgi_uzmani` | `admin`. Anything outside these three leaves the UI
role-less, so the enum must be fixed.

---

## Optional (present on the screen, but it works without them)

| Method | Path | Purpose | If missing |
|---|---|---|---|
| GET | `/kb-articles` | The 4 suggestion cards on the welcome screen | Cards are hidden |
| POST | `/tags/suggest` | Tag suggestions while typing (body: `{ "text": "..." }`, max 4 results) | User picks tags manually |
| POST | `/answers/{id}/verify` | Knowledge Expert marks an answer `verified` (body `{}`, 403 if unauthorized) | Button is hidden |

## Summary

| # | Method | Path | Purpose | Upstream |
|---|---|---|---|---|
| 1 | POST | `/questions` | Send message, get answer | **AI service** |
| 2 | POST | `/answers/{id}/rate` | Good enough / ask an expert | Backend |
| 3 | GET | `/tags?status=aktif` | Tag picker | Backend |
| 4 | GET | `/companies` | Company picker | Backend |
| 5 | GET | `/me` | Current user + role | Backend |

The three optional endpoints above are all served by the backend.

## Open item: enum values

Paths and field names are English; enum values are not yet. The wire format currently mixes the
two:

```json
{ "status": "eskale_edildi", "rating": "yeterli", "role": "bilgi_uzmani" }
```

Translating them (`escalated`, `sufficient`, `knowledge_expert`, …) also means renaming the i18n
keys that mirror these values (`knowledge.status.*`) and the role lists in `navigation.ts`.
Decide before the backend hardens its enums.
