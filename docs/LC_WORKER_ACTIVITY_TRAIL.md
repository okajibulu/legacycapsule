# LegacyCapsule Worker Activity Trail and Change Register

FILE PATH

/docs/LC_WORKER_ACTIVITY_TRAIL.md

DOCUMENT OWNER

Founder (CG01) — governance owner; all AI and human workers are responsible for recording their own actions.

STATUS

Active — initial governance standard; trail starts from adoption and does not claim to reconstruct unrecorded historical activity.

VERSION

v1.0

CREATED

20 October 2026

LAST UPDATED

20 October 2026

DEPENDS ON

/docs/COMPONENT_MAP.md

/PROJECT_RULES.md

/CHANGELOG.md

Relevant architecture and implementation documents for the task being performed

SUPERSEDES

None

SUPERSEDED BY

None

DOCUMENT PURPOSE

Provide a durable, append-only record of actions performed by any AI or human worker on LegacyCapsule (LC). The trail must make it possible to determine what was attempted, what actually changed, why it changed, where the evidence lives, who authorised it, what verification occurred, and whether the work reached a shared branch or production.

---

## 1. Scope

Record material work carried out for LegacyCapsule, including:

- Repository inspection, code or document review, and technical investigation when findings affect decisions or work allocation.
- Recommendations that propose a change to existing behaviour, architecture, security, data, governance, or user experience.
- Files created, modified, renamed, moved, or deleted.
- Database schema changes, migrations, data updates, policy changes, and changes to external services.
- Tests, builds, verification, and failed or incomplete attempts that materially affect the task.
- Branch creation, commits, pull requests, merges, releases, and deployments.
- Work intentionally not performed because approval, evidence, access, or prerequisites were missing.
- Corrections, reversals, and incidents involving unauthorised or unrecorded changes.

Routine conversation that has no material LC consequence does not need a separate entry. When uncertain, record the action.

This file records worker activity. It is distinct from LC's runtime activity log, which records application/user events. It does not replace Git history, pull requests, deployment records, database migration history, incident records, or the Component Map.

## 2. Mandatory rules

1. **Every worker records its own work.** The worker performing the action is responsible for preparing the entry before handing work over or ending the session.
2. **Record actions, not just outcomes.** Include meaningful investigation, rejected approaches, failed attempts, and work left incomplete when these matter to the task.
3. **Evidence over attribution.** Identify a worker as the actor only when the worker's own report or reliable repository/tool evidence supports that attribution. Do not infer authorship from the current file contents alone.
4. **No silent changes.** Any repository or external-system mutation must be disclosed, including the exact target, branch/environment, purpose, and resulting evidence.
5. **Approval is separate from execution.** Record the source and scope of approval. Approval for a plan or document does not imply approval for code changes, database changes, merge to `main`, or production deployment.
6. **No unauthorised production actions.** Do not deploy, run production migrations, merge to `main`, or make destructive external changes without explicit approval for that action.
7. **Append-only history.** Do not rewrite or remove a prior entry to conceal or tidy history. If an entry is wrong or incomplete, add a correction entry referencing its Activity ID. If the platform permits an amendment, preserve the original text and record the amendment.
8. **Use precise status language.** Distinguish `Proposed`, `Attempted`, `Completed`, `Failed`, `Blocked`, `Reverted`, and `Not performed`. Do not report a test, build, merge, or deployment as successful unless it was actually observed.
9. **Reference evidence.** Provide commit SHAs, branch names, pull request links, file paths, test output locations, migration identifiers, or other verifiable references where available. If evidence is unavailable, state that explicitly.
10. **Protect secrets and personal data.** Never paste credentials, access tokens, secret environment values, private keys, or unnecessary personal data into this file. Refer to a secret by variable name only.
11. **Report Component Map impact.** Every implementation entry must say what was added, modified, removed, or why no update is required. Identify proposed Component Map updates even when a worker is not authorised to edit the map.
12. **Separate facts from inference.** Label unverified root causes, hypotheses, and recommendations as such.
13. **Log corrections and incidents promptly.** An unauthorised change, missing activity entry, incorrect attribution, or material mismatch between a report and repository evidence requires an explicit incident/correction entry.
14. **Do not fabricate history.** This trail begins on adoption. Earlier work may be added retrospectively only when evidence supports it and the entry is clearly marked `Retrospective`.

## 3. Required activity entry

Use one entry per coherent task or change set. Split entries when actions have materially different approvals, targets, or outcomes.

Copy this template for each new entry:

### [LC-ACT-YYYYMMDD-NNN] — [Short action title]

- **Date/time (UTC):** YYYY-MM-DD HH:MM
- **Entry type:** Implementation / Investigation / Documentation / Review / Database / Deployment / Governance / Incident / Correction / Retrospective
- **Actor / worker ID:** [e.g. G11, CG03, Claude worker ID, human contributor]
- **Model and tool context:** [exact model if known; tools or environment used]
- **Session ID:** [unique session identifier, if applicable]
- **Request / task reference:** [link, issue, handover, or concise description of the instruction]
- **Approval:** [Approved / Not required / Pending / Not approved]; identify approver and exact scope, or state that no approval was obtained
- **Repository:** `okajibulu/legacycapsule` or identify the external system
- **Branch and base commit:** [branch name; base SHA where known]
- **Commit / PR / change reference:** [SHA, PR link, or `None — uncommitted`]
- **Environment affected:** Local / Branch / Develop / Main / Staging / Production / External service / None
- **Action performed:** [specific actions, not a general summary]
- **Reason and intended outcome:** [why the action was taken]
- **Files added:** [paths, or None]
- **Files modified:** [paths and concise description, or None]
- **Files moved / renamed / deleted:** [paths, or None]
- **Database / external-system effects:** [exact change and environment, or None]
- **Existing behaviour impact:** [Preserved / Intentionally changed with approval / Potentially affected / Unknown / None]; describe affected behaviour
- **Verification performed:** [commands, tests, checks, comparison, and observed results]
- **Verification not performed / limitations:** [what remains unverified and why]
- **Outcome status:** Proposed / Attempted / Completed / Failed / Blocked / Reverted / Not performed
- **Known risks / follow-up:** [items, owner, and next step, or None]
- **Component Map impact:** [Added / Modified / Removed / Status change / No change required]; identify exact component entries or the reason no update is required
- **Related activity IDs:** [prior or follow-up entries, or None]

---

## 4. Activity ID rules

- Use the format `LC-ACT-YYYYMMDD-NNN`, where the date is UTC and `NNN` is a zero-padded sequence for that date.
- Before assigning an ID, inspect the latest entries and use the next unused sequence for that date.
- Never reuse an ID.
- If a correction is made on a later date, create a new ID and link the original entry under Related activity IDs.
- If two workers independently create entries, they must reconcile duplicate IDs before the shared branch is merged; do not silently renumber published entries.

## 5. Evidence and change-control expectations

For code or documentation changes, the record should normally make it possible to answer:

1. What exact files changed?
2. What was the baseline branch/commit?
3. What was the resulting commit or pull request?
4. What specific instruction or approval authorised the change?
5. Which existing behaviour was preserved or changed?
6. What checks were run, and what did they actually show?
7. What remains unverified?
8. Was the Component Map updated or is an update pending?
9. Did the change reach `main` or production? What evidence confirms that?

For work that does not change files, record the investigation scope, sources inspected, material findings, uncertainties, and the decision or handover that followed.

A commit is evidence of a repository change; it does not, by itself, prove that the change was approved, tested, deployed, or authored by a particular worker.

## 6. Handover requirement

Every worker handover must include:

- Activity ID(s) created during the session.
- A concise summary of completed, failed, blocked, and unperformed actions.
- The branch and commit SHA to inspect.
- Exact files changed.
- Verification results and unresolved risks.
- Component Map impact and any pending update.
- Any action that still requires Founder approval.

If no material action was performed, state: **No material LC action performed; no activity entry required.** Do not claim a log entry exists when it does not.

## 7. Initial adoption entry

### LC-ACT-20261020-001 — Establish worker activity trail

- **Date/time (UTC):** 2026-10-20 [exact time not captured]
- **Entry type:** Governance / Documentation
- **Actor / worker ID:** ChatGPT — project governance session
- **Model and tool context:** GPT-6; GitHub repository connector
- **Session ID:** Not assigned
- **Request / task reference:** Founder instruction to add a repository file recording all worker actions on LegacyCapsule.
- **Approval:** Explicitly requested by Founder for creation of the activity-trail file.
- **Repository:** `okajibulu/legacycapsule`
- **Branch and base commit:** `docs/lc-worker-activity-trail`, branched from `docs/initial-component-map`; base commit SHA must be captured from GitHub before merge.
- **Commit / PR / change reference:** Initial file-creation commit: `5485553c60949e46a9c2205fdda16e7bc224fe51`; subsequent governance updates are recorded in Git history.
- **Environment affected:** Documentation branch only; no application runtime, database, or production change intended.
- **Action performed:** Drafted this append-only worker activity trail standard and created a dedicated documentation branch.
- **Reason and intended outcome:** Establish traceability for actions across multiple LC workers and reduce silent, unattributed, or unauthorised changes.
- **Files added:** `docs/LC_WORKER_ACTIVITY_TRAIL.md` (this file).
- **Files modified:** None intended by this entry.
- **Files moved / renamed / deleted:** None.
- **Database / external-system effects:** None.
- **Existing behaviour impact:** None; governance documentation only.
- **Verification performed:** Repository branches and existing activity-log implementation paths were inspected. The application runtime activity log was distinguished from this worker governance trail.
- **Verification not performed / limitations:** The Component Map branch contains a substantial, historically accumulated document that has not yet been reconciled against the current implementation. This entry does not claim a full Component Map audit.
- **Outcome status:** Completed — initial file committed.
- **Known risks / follow-up:** Capture the resulting commit SHA; review the Component Map against the current tree in bounded sections; append a new activity entry for each material follow-up.
- **Component Map impact:** Updated `docs/COMPONENT_MAP.md` on this documentation branch to register this governance document. The broader implementation inventory remains unreconciled.
- **Related activity IDs:** None

---

## 8. Document history

| Version | Date | Change | Author |
|---|---|---|---|
| v1.0 | 20 October 2026 | Initial worker activity-trail standard, entry template, evidence requirements, and adoption entry. | ChatGPT — GPT-6 |
