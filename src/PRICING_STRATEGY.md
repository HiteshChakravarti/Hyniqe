# HYNIQÉ PRICING STRATEGY
## Complete Reference Document

---

## 🎯 THE 3 TIERS

### 1️⃣ **Starter (Solo) — $39/mo**
**Annual:** $312/year (2 months free)  
**INR:** ₹3,499/mo | ₹28,008/year

**Who it's for:** Freelancers, solo founders, individual operators who want 1–2 helpers max.

#### What they get:
- **1 workspace**
- **Choose any 2 AI Employees** (1-2 helpers)
- **Brain basics** (light orchestration)
- **150 credits/month** (enough for regular power-ups)
- **Standard integrations** (limited set)
- **Community/basic support**

#### Hard Limits (important):
- **Workspaces:** 1
- **Seats:** 1 user
- **Knowledge base size:** 200MB / limited documents
- **Power-up runs/day:** Optional cap (keeps costs safe)

#### Why it exists:
Price-sensitive entry, but clearly nudges upgrade to $97.

---

### 2️⃣ **Hyniqé X (Core) — $97/mo** ⭐ MAIN PLAN
**Annual:** $780/year (2 months free)  
**INR:** ₹8,699/mo | ₹69,912/year

**Who it's for:** Most SMBs, founders, solo operators who want "everything".

#### What they get:
- **All 5 AI Employees** (all helpers)
- **Full Brain + Power-Ups library**
- **Unlimited workspaces** (BIG differentiator for client projects)
- **250 credits/month**
- **All integrations included** (your "real" set)
- **Priority email support**
- **Templates / Packs** (if you have them)
- **1-3 seats included** (you decide)

#### Soft Limits (optional):
- **Seats included:** 1–3 seats
- **Knowledge base:** 2GB (medium)
- **Some advanced admin settings** locked to Team plan

#### Why this wins:
Matches Sintra's most attractive offer; most people will pick it.

---

### 3️⃣ **Agency / Team — $149/mo**
**Annual:** $1,188/year (2 months free)  
**INR:** ₹13,349/mo | ₹106,512/year

**Who it's for:** Agencies, teams, operators managing multiple people + client workspaces.

#### What they get (Core + governance + more usage):
- **Everything in $97 Hyniqé X**
- **Team controls:**
  - Members + roles (Owner/Admin/Member)
  - Workspace sharing rules
  - Activity log / history
  - Approval / review modes (optional later)
- **Shared knowledge base** + "workspace-level knowledge"
- **750 credits/month**
- **Faster support / onboarding call** (optional)
- **Advanced integrations / webhooks** (later)
- **3 seats included**

#### Seat Add-Ons:
- **Extra seats:** $9–$19/user/month
  - $9 if you want faster adoption
  - $19 if you want higher ARPA and can justify with governance + admin features

#### Why it's priced at $149:
Easy step above $97, and agencies can justify it instantly.

---

## 💳 CREDIT SYSTEM

### Philosophy:
**DO NOT charge credits for basic chat with a helper** (people hate that).

### What Credits Should Pay For:
Charge credits for **"heavy or valuable actions"**:

#### Examples that cost credits:
- Generating multi-doc outputs (JD + interview kit + onboarding checklist)
- Running an "ATS scan + rewrite + tailored resume pack"
- Deep research, web fetch, large file processing
- Multi-step agent workflows ("Run All", "campaign builder", "proposal generator")

### Credit Mapping (suggested):
- **Small power-up:** 1–3 credits
- **Medium:** 5–10 credits
- **Heavy:** 15–30 credits

---

## 🔋 CREDIT TOP-UPS

Top-ups **never expire** and **roll over month-to-month** until used.

| Credits | USD    | INR        | Notes         |
|---------|--------|------------|---------------|
| 100     | $15    | ₹1,349     |               |
| 500     | $49    | ₹4,399     | **Best Value** |
| 2000    | $149   | ₹13,349    |               |

This lets power users scale without forcing an immediate plan upgrade.

---

## 📅 ANNUAL PRICING

**"2 months free" model** - simplest mental model, increases cashflow.

| Plan          | Monthly | Annual    | Savings    |
|---------------|---------|-----------|------------|
| Starter       | $39/mo  | $312/yr   | $156 (2mo) |
| Hyniqé X      | $97/mo  | $780/yr   | $384 (2mo) |
| Agency/Team   | $149/mo | $1,188/yr | $600 (2mo) |

---

## 💎 PRICING PAGE DISPLAY

### 3 Cards with Clear Labels:

1. **Starter** — "For individuals"
2. **Hyniqé X** — "Best value" (highlighted)
3. **Agency / Team** — "For teams & agencies"

### Under Each Plan - Max 5 Bullets:
- Helpers included
- Workspaces
- Credits
- Seats
- Governance/integrations

### Toggle Options:
- Monthly / Annual (2 months free)
- USD ($) / INR (₹)

---

## 📈 UPGRADE PATH (Conversion Ladder)

Make the upgrade logic obvious:

1. **Starter users** → Hit workspace/helper limits quickly → **Upgrade to $97**
2. **$97 users** → Hit credits/team collaboration needs → **Upgrade to $149**
3. **Team users** → Add **seats** or **credit top-ups**

**This isn't "3 random tiers"** — it's a **ladder**.

---

## 🛠️ IN-APP ENFORCEMENT

### Entitlements Table Structure:

Store plan limits in one place so UI + backend enforce the same rules.

#### Example Fields:

```javascript
{
  plan_code: 'starter' | 'core' | 'team',
  helpers_allowed: 2 | 'unlimited',
  workspaces_allowed: 1 | 'unlimited',
  seats_included: 1 | 3,
  credits_monthly: 150 | 250 | 750,
  knowledge_base_limit: '200MB' | '2GB' | '10GB',
  features: {
    team_controls: false | false | true,
    audit_log: false | false | true,
    advanced_integrations: false | true | true,
    priority_support: false | true | true,
    api_access: false | true | true
  }
}
```

### Enforcement Strategy:

#### UI Layer:
- Disable "Add workspace" button + show upgrade CTA when limit reached
- Show "Upgrade to unlock" badges on locked features
- Display credit usage prominently with "Buy More Credits" CTA

#### Backend Layer:
- **NEVER rely only on UI** - always validate on server
- Reject creation requests when limits exceeded
- Return clear error messages with upgrade links
- Track usage and send notifications at 75%, 90%, 100% of limits

---

## 🎨 PLAN COMPARISON TABLE

| Feature                    | Starter      | Hyniqé X     | Agency/Team  |
|----------------------------|--------------|--------------|--------------|
| **Price (Monthly)**        | $39          | $97          | $149         |
| **Price (Annual)**         | $312/yr      | $780/yr      | $1,188/yr    |
| **AI Employees**           | Choose 2     | All 5        | All 5        |
| **Workspaces**             | 1            | Unlimited    | Unlimited    |
| **Credits/Month**          | 150          | 250          | 750          |
| **Seats Included**         | 1            | 1-3          | 3            |
| **Extra Seat Pricing**     | N/A          | N/A          | $9-19/user   |
| **Brain AI**               | Basic        | Full         | Full + Shared|
| **Integrations**           | Standard     | All          | All + Advanced|
| **Support**                | Community    | Priority     | Priority + Dedicated|
| **Knowledge Base Size**    | 200MB        | 2GB          | 10GB         |
| **Team Controls**          | ❌           | ❌           | ✅           |
| **Audit Log**              | ❌           | ❌           | ✅           |
| **Shared Knowledge**       | ❌           | ❌           | ✅           |
| **API Access**             | ❌           | ✅           | ✅           |
| **Custom Onboarding**      | ❌           | ❌           | ✅           |

---

## 📝 KEY MESSAGING

### Starter Plan:
"Perfect for solo operators getting started with AI automation"

### Hyniqé X (Core):
"Everything you need to scale your business with AI"

### Agency / Team:
"Built for teams collaborating across multiple client workspaces"

### Credits:
"Credits power your heavy workflows. Basic chat is always free."

### Annual Plans:
"Get 2 months free when you pay annually"

---

## 🔑 CRITICAL RULES

1. ✅ **Basic chat is ALWAYS FREE** - never charge credits for simple conversations
2. ✅ **Credits are for Power-Ups only** - complex workflows, multi-doc generation, heavy processing
3. ✅ **Top-ups never expire** - unlike monthly credits, purchased credits roll over forever
4. ✅ **Workspaces are the key differentiator** - Starter (1), Core/Team (unlimited)
5. ✅ **Team controls only on $149 plan** - don't give this away cheaper
6. ✅ **3 seats included with Team plan** - add-ons are $9-19/user
7. ✅ **Annual = 2 months free** - simple, clean discount model
8. ✅ **Enforce limits on BOTH UI and backend** - never trust the frontend alone

---

## 🎯 MONETIZATION STRATEGY

### Revenue Drivers:

1. **Plan Upgrades** (Primary)
   - Starter → Core: +$58/mo per user
   - Core → Team: +$52/mo per user

2. **Seat Add-Ons** (Secondary, Team plan only)
   - $9-19/user/month
   - Target: 5-10 seats per team customer

3. **Credit Top-Ups** (Tertiary, all plans)
   - Power users buy 500-2000 credit packs
   - No plan upgrade needed

4. **Annual Prepayment** (Cashflow)
   - 20-30% of customers pay annually
   - Locks in commitment

### Target Customer LTV:

- **Starter:** $468/year (if annual) - mainly acquisition
- **Core:** $1,164/year (if annual) - sweet spot
- **Team (5 users):** ~$3,000/year (team + seats) - highest value

---

## 🚀 IMPLEMENTATION CHECKLIST

### Phase 1: Core Infrastructure ✅
- [x] Pricing page with 3 tiers
- [x] Onboarding flow with plan selection
- [x] Annual/monthly toggle
- [x] USD/INR currency support
- [x] Credit top-ups display

### Phase 2: Enforcement (TO DO)
- [ ] Create entitlements database table
- [ ] Backend API for plan limits validation
- [ ] UI components for "upgrade required" states
- [ ] Credit usage tracking system
- [ ] Usage notification system (75%, 90%, 100%)

### Phase 3: User Experience (TO DO)
- [ ] In-app credit balance display
- [ ] Workspace creation limits + upgrade CTA
- [ ] Helper selection limits (Starter plan)
- [ ] Team management UI (Team plan only)
- [ ] Billing page with plan comparison
- [ ] Seat management UI (Team plan)

### Phase 4: Monetization Features (TO DO)
- [ ] Stripe integration for payments
- [ ] Annual subscription handling
- [ ] Seat add-on purchase flow
- [ ] Credit top-up purchase flow
- [ ] Invoice generation
- [ ] Prorated billing for plan changes

---

## 📊 SUCCESS METRICS TO TRACK

1. **Conversion Rate by Plan**
   - % of trials converting to Starter
   - % of trials converting to Core
   - % of trials converting to Team

2. **Upgrade Rate**
   - Starter → Core conversion %
   - Core → Team conversion %
   - Average time to upgrade

3. **Credit Economics**
   - Average credits used per user/month
   - % of users buying top-ups
   - Average top-up purchase value

4. **Annual vs Monthly**
   - % choosing annual
   - Churn rate: annual vs monthly

5. **Team Plan Metrics**
   - Average seats per Team customer
   - Seat add-on attach rate
   - Team plan ARR growth

---

## 💡 FUTURE CONSIDERATIONS

### Potential Add-Ons:
- **Premium Integrations:** $X/month for specialized tools
- **Advanced Analytics Dashboard:** $X/month
- **White-Label Option:** $X/month (remove HYNIQÉ branding)
- **Custom AI Training:** One-time fee or subscription
- **Dedicated Infrastructure:** For enterprise security/compliance

### Enterprise Tier (Future):
- **Custom Pricing**
- On-premise deployment
- SSO/SAML
- Custom SLAs
- Dedicated account manager
- Custom integrations
- Advanced security/compliance

---

**Last Updated:** December 20, 2024  
**Document Owner:** HYNIQÉ Product Team  
**Status:** ✅ Active & Implemented (Pricing Page + Onboarding)
