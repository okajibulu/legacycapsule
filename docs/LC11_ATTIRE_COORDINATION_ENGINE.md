## Product Requirements & System Design Specification: Aso-Ebi / Aso-Oke Distribution Module (Phase 1)

---

## 1. System Context & Operational Goals

The Aso-Ebi Distribution Module operates as a premium add-on for a digital life-event and tribute platform. It digitizes the end-to-end lifecycle of African event attire (*Aso-Oke / Aso-Ebi*)—from inventory configuration and category-locked ordering to offline payment verification, low-stock alerts, and event-day fulfillment.

### Primary Objectives

* **Acknowledge Offline Realities:** Support manual bank transfers directly to the Event Owner’s account without taking custody of funds.
* **Dual-Control Financial Governance:** Eliminate reconciliation disputes through an immutable, shared audit ledger accessible by both the Organiser and Event Owner.
* **Operational Efficiency:** Eliminate "blind polling" using automated, event-driven WhatsApp/Email notification digests.
* **Restricted Access & Tiered Rewards:** Restrict fabric availability by guest eligibility tiers and map completed purchases to assigned souvenir/gift tiers.

---

## 2. User Roles & Permission Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               USER ROLES & ACCESS MATRIX                                 │
├───────────────────────┬───────────────────────────────┬──────────────────────────────────┤
│ ROLE                  │ CORE PERMISSIONS              │ ACTIONS                          │
├───────────────────────┼───────────────────────────────┼──────────────────────────────────┤
│ Event Owner           │ Full Inventory & Financial    │ • Set stock & low-inventory alert│
│ (Sole Supplier)       │ Clearance                     │ • Connect bank account details   │
│                       │                               │ • Perform Level 2 Bank Clearance │
│                       │                               │ • Override / uncheck clearance   │
├───────────────────────┼───────────────────────────────┼──────────────────────────────────┤
│ Event Organiser       │ Operational Execution &       │ • Configure packages & options   │
│ (Planner)             │ Receipts Audit                │ • Map guest category access      │
│                       │                               │ • Perform Level 1 Receipt Audit  │
│                       │                               │ • View audit & change history    │
├───────────────────────┼───────────────────────────────┼──────────────────────────────────┤
│ Guest / Buyer         │ Category-Restricted Purchase  │ • View allowed fabric options    │
│                       │                               │ • Input tailoring metrics        │
│                       │                               │ • Upload transfer receipt        │
│                       │                               │ • Access pickup voucher          │
├───────────────────────┼───────────────────────────────┼──────────────────────────────────┤
│ Event Usher / Agent   │ Gate & Pickup Distribution    │ • Scan/verify pickup voucher     │
│                       │                               │ • View assigned souvenir tier    │
│                       │                               │ • Mark fabric as "Issued"        │
└───────────────────────┴───────────────────────────────┴──────────────────────────────────┘

```

---

## 3. End-to-End System Workflow

1. **1. Inventory & Access Configuration:** Store Setup & Rules.
* Owner & Organiser define store settings, upload fabric options, and set low-stock thresholds.
* Organiser maps guest category access and configures approval mode (1-Level vs. 2-Level).
* Organiser and Owner set their notification trigger rules.


2. **2. Ordering & Customization:** Guest Selection & Tailoring.
* Guest logs into the event hub and views only the packages permitted for their tier.
* Guest selects tailoring parameters (Raw Fabric, Cap Size, Auto-Gele, or Custom Measurements).
* Guest submits order; system generates a unique **Payment Reference Code** (e.g., `AO-8842`) and displays offline payment details.


3. **3. Receipt Upload & Data Capture:** Receipt Submission.
* Guest completes bank transfer offline and uploads a receipt screenshot.
* System auto-extracts or prompts for **6 Cogent Parameters**: *Guest Name, Payee Name, Bank Name, Transfer Date/Time, Amount Paid, and Item Paid For*.
* Order enters the Organiser's audit queue.


4. **4. Verification & Imprint Locking:** Dual-Control Audit.
* **Level 1 (Organiser Audit):** Organiser verifies receipt clarity and amount $\rightarrow$ Ticks audit checkbox $\rightarrow$ Saves record.
* **Level 2 (Owner Clearance):** Owner matches payment against their bank statement $\rightarrow$ Ticks clearance checkbox $\rightarrow$ Saves record.
* System locks fields, records User IDs and timestamps, and permanently updates inventory.


5. **5. Monitoring, Notifications & Pickup:** Low-Stock & Fulfillment.
* If stock falls below the configured limit, the system fires an urgent alert to the Owner and Organiser.
* Guest receives an **Aso-Ebi Pickup Voucher** containing a unique lookup code and assigned souvenir tier.
* On pickup/event day, the Usher verifies the voucher, hands over the fabric and corresponding gift package, and updates the status to `Claimed`.


---

## 4. Module-by-Module Technical Specification

### Module A: Inventory & Category Access Engine

1. **Sole Supplier Setup:** The Event Owner is configured as the single inventory source.
2. **Category Restrictions:** The store must support category-based locking (`Family Only`, `VIP Friends`, `General Guests`). Unauthenticated or non-eligible guests cannot view locked options.
3. **Tailoring & Customization Options:** Every fabric bundle must support configurable fulfillment options:
* **Raw Fabric:** Unstitched yards/bundles.
* **Cap / Headwear:** Pre-stitched *Fila* cap (requires head circumference in cm or standard S/M/L) or *Auto-Gele* (style choice).
* **Custom Tailoring:** Dress or Agbada options accepting standardized sizes or custom measurement fields.



---

### Module B: Low-Stock Alert System

1. **Threshold Trigger:** The Event Owner defines a numerical trigger limit ($N$) for each inventory item.
2. **Evaluation Logic:** Inventory updates automatically when Level 2 clearance (or Level 1 in 1-Level mode) is completed.
3. **Alert Dispatch:** When `available_stock <= threshold_limit`, an immediate, high-priority notification (WhatsApp/Email) bypasses regular digest schedules and alerts both the Owner and Organiser.

---

### Module C: Dual-Control Verification & Mutation History

1. **Configuration Mode:** The system must support a toggle for verification levels:
* **1-Level Confirmation:** Organiser *OR* Owner verification immediately clears the order.
* **2-Level Confirmation:** Requires Level 1 Audit (Organiser) **followed by** Level 2 Clearance (Owner).


2. **The 6 Cogent Data Points:** The order verification interface must capture and display six mandatory fields:
* **Guest Name** (Beneficiary of the attire)
* **Payee Name** (Name on the originating bank account)
* **Bank Name** (Sending financial institution)
* **Transaction Date & Time**
* **Amount Paid**
* **Item / Bundle Paid For**



```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                DUAL-VERIFICATION TABLE STRUCTURE                                       │
├───────────────────────────────┬───────────────────────────────┬─────────────────────────┬──────────────┤
│ 6 COGENT DATA FIELDS          │ ORGANISER COLUMN (LEVEL 1)    │ OWNER COLUMN (LEVEL 2)  │ STATUS       │
├───────────────────────────────┼───────────────────────────────┼─────────────────────────┼──────────────┤
│ • Guest Name                  │ [ ] Checkbox: Audit Verified  │ [ ] Checkbox: Bank Clear│ PENDING AUDIT│
│ • Payee Name                  │                               │ (Disabled until L1 done)│              │
│ • Bank Name                   │ Notes: [ Text Input         ] │ Notes: [ Text Input   ] │              │
│ • Date & Time                 │                               │                         │              │
│ • Amount Paid                 │ Timestamp: Auto-stamped       │ Timestamp: Auto-stamped │              │
│ • Item / Bundle               │ User Imprint: User ID & Role  │ User Imprint: User ID   │              │
└───────────────────────────────┴───────────────────────────────┴─────────────────────────┴──────────────┘

```

3. **Field Locking & State Rules:**
* Saving a ticked box locks the respective user's column, replacing the checkbox with an immutable verification badge.
* Level 2 (Owner) controls remain disabled until Level 1 (Organiser) is ticked and saved.


4. **Audit History & Mutation Logging:**
* Edits or unchecks applied to previously saved states must **never overwrite** historic records.
* Every modification creates an entry in an immutable audit log storing: *Actor User ID, Role, Action Type, Previous State, New State, Reason for Change, and Timestamp*.
* An interactive history indicator on the UI allows users to expand and view the audit log for any row.



---

### Module D: Asynchronous Notification Rule Engine

To remove the need for constant dashboard checking, the notification system runs on configurable, event-driven rules for WhatsApp and Email delivery.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               NOTIFICATION TRIGGER ARCHITECTURE                                  │
├──────────────────────┬───────────────────────────────────────────────────────────────────────────┤
│ USER ROLE            │ TRIGGER OPTIONS                                                           │
├──────────────────────┼───────────────────────────────────────────────────────────────────────────┤
│ Organiser            │ • Instant: Send notification immediately upon guest receipt upload.       │
│ (Listens for Guest   │ • Batch Count: Send notification when $N$ unverified receipts accumulate. │
│ Receipts)            │ • Daily Digest: Send summary notification daily at Time $T$ (if queue > 0)│
├──────────────────────┼───────────────────────────────────────────────────────────────────────────┤
│ Owner                │ • Batch Count: Send notification when $N$ receipts pass Level 1 audit.    │
│ (Listens for Audited │ • Daily Digest: Send summary notification daily at Time $T$ listing all   │
│ Items)               │   audited receipts ready for bank matching.                               │
└──────────────────────┴───────────────────────────────────────────────────────────────────────────┘

```

#### Message Contents

* **Organiser Alert:** Includes total pending count, aggregate monetary value, and a direct link to the audit table.
* **Owner Alert:** Includes total audited count, list of Payee Names with corresponding amounts and bank names, total expected deposit value, and a direct link to the clearance interface.

---

### Module E: Fulfillment Ledger & Souvenir Tier Matrix

1. **Pickup Voucher Generation:** Final clearance triggers the issue of a digital fulfillment voucher displaying a unique verification code.
2. **Gift Tier Allocation:** Each Aso-Ebi package maps to a specific souvenir category (e.g., *VIP Package Purchase $\rightarrow$ Tier 1 Gold Gift Box*).
3. **Distribution Interface:**
* Ushes or distribution team members access a dedicated pickup verification screen.
* Entering or scanning the guest's voucher code reveals the items to hand over alongside the assigned souvenir tier.
* Marking items as `Claimed` updates the fulfillment ledger in real time to prevent duplicate pickups.



---

## 5. Summary of System Logic Rules for Developers

> 1. **Data Integrity:** Never hard-delete or overwrite a verification state. Save state changes as new entries in the audit trail.
> 2. **Sequential Dependency:** In 2-Level mode, Level 2 clearance controls must remain disabled until Level 1 audit is checked and saved.
> 3. **Inventory Coupling:** Inventory decrements only when an order receives final clearance.
> 4. **Notification Efficiency:** Evaluate notification settings asynchronously. Do not trigger daily digests if the queue length is zero. Urgent low-stock alerts bypass all batch and digest delays.
> 5. **Audit Traceability:** Stamp every state save with the active User ID, User Role, system timestamp, and IP reference.
> 
>