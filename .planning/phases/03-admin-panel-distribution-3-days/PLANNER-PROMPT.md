<planning_context>
**Phase:** 3  
**Phase Name:** Admin Panel & Distribution  
**Mode:** standard (planning, not gap_closure or reviews)

<files_to_read>
- .planning/PROJECT.md (Project overview)
- .planning/ROADMAP.md (Phase goals and requirements)
- .planning/REQUIREMENTS.md (MVP scope, REQ-102, REQ-201, REQ-402, REQ-501)
- .planning/STATE.md (Project history, Phase 1-2 state)
- .planning/phases/03-admin-panel-distribution-3-days/03-RESEARCH.md (Technical research)
- .planning/phases/02-user-dashboard-core-ui-3-days/02-01-PLAN.md (Dashboard patterns to reuse)
- .planning/phases/02-user-dashboard-core-ui-3-days/02-02-PLAN.md (Transaction/table patterns)
</files_to_read>

**Phase Requirement IDs (MUST ALL appear in plan requirements fields):**  
REQ-102, REQ-201, REQ-402, REQ-501

**Phase Goal (from ROADMAP):**  
Build admin controls for revenue distribution and user management. Success criteria: Admin can initiate distribution in <1 minute, allocation calculations verified pre-submission, audit logs capture all actions, approval workflow prevents accidental submissions.

**Project instructions:** None (read ./copilot-instructions.md if exists)

**Git info:** Repo = web3-distribution, branch = dev_jeevesh, working in /Users/jeeveshsingale/creative-rights-tracker

</planning_context>

<task_context>
You are gsd-planner. Create PLAN.md files that executors can implement without interpretation.

**Core responsibility:** Decompose Phase 3 into 3-4 parallel-optimized tasks organized as 2-wave execution. Every decision MUST be concrete and actionable.

**Key constraints:**
- Solo developer, 3-day window, 6 hrs/day
- Reuse Phase 2 component patterns (DashboardLayout, cards, Tailwind styling)
- Use existing hooks: useAuth(), useRevenueContract(), supabaseClient()
- Keep forms simple: React useState + validation (no Formik)
- Every distribution action MUST be logged to Supabase `activity` table
- Role check: if (user?.role !== 'admin') => redirect to /dashboard
- Web3 contracts exist and are callable (Phase 1 audit complete)

**MANDATORY in every task:**

1. `<read_first>` — Files executor MUST read before starting:
   - Always include the file being modified
   - Include any "source of truth" file (config, type definition, existing pattern)
   - Include any file whose signatures/patterns must be replicated

2. `<acceptance_criteria>` — Verifiable conditions (grep-checkable, not subjective):
   - NEVER "looks correct" or "properly configured"
   - ALWAYS include exact strings, patterns, values, or command outputs
   - Every criterion must be checkable via grep, file read, or test

3. `<action>` — Specific implementation (no vague "align X with Y"):
   - ALWAYS include concrete values: config keys, function signatures, imports, env vars
   - Use actual code samples when needed
   - Executor should complete from action text alone (read_first for verification)

4. **Goal-backward must_haves:**
   - truths: Observable behaviors from user's perspective (3-7 items)
   - artifacts: Specific files that must exist with min line counts
   - key_links: Critical connections (component -> API, etc.)

**Parallelization:**
- Identify task dependencies
- Assign waves (no file conflicts in same wave)
- Same-wave tasks = can run parallel

**Wave structure:**
- Wave 1: Foundation (AdminLayout, types)
- Wave 2: Features (Distribution form, User mgmt table, Audit log) — depend on Wave 1

</task_context>

<output_format>
Create PLAN.md files in `.planning/phases/03-admin-panel-distribution-3-days/` with names:
- 03-01-PLAN.md
- 03-02-PLAN.md
- 03-03-PLAN.md (optional if Wave 2 becomes too large)

Each PLAN.md must have:
1. Frontmatter (phase, plan, type, wave, depends_on, files_modified, autonomous, requirements, must_haves)
2. <objective> section
3. <context> section with @file references
4. <tasks> section (2-3 tasks per plan, each with name/files/read_first/action/accept criteria/done)
5. <threat_model> section (STRIDE threats if security_enforcement enabled)
6. <verification> section
7. <success_criteria> section
8. <output> section (reference to SUMMARY.md)

Security enforcement is enabled by default — include <threat_model> with STRIDE register in every plan.

</output_format>

**CRITICAL RULES:**

- Every task MUST have `<read_first>` block with concrete file paths
- Every task MUST have `<acceptance_criteria>` with GREP-VERIFIABLE conditions
- Every `<action>` MUST include concrete values (no "align X with Y" without specifying what)
- Wire form fields to APIs: not guesses, actual endpoint paths
- Every DROP requires user ID / timestamp logged to Supabase (audit trail)
- Every Web3 call wrapped in try/catch with user-friendly error toast
- Reuse Phase 2 components: DashboardLayout, RevenueSnapshot, ChartsPanel styling patterns
- Keep the Tailwind color scheme consistent with Phase 2

**Pre-planning checklist:**
- [ ] Phase goal understood (admin distribution + user mgmt)
- [ ] Requirements mapped (REQ-102, REQ-201, REQ-402, REQ-501)
- [ ] Tech stack locked (Supabase, Tailwind, ethers.js, react-hot-toast)
- [ ] Reusable components identified (DashboardLayout, useAuth, useRevenueContract)
- [ ] Task dependencies identified (layout first, then features)
- [ ] Wave structure planned (2 waves max for 3-day window)

---

**Now create the plans.**

Note: This is an internal planning directive — you're creating executable PLAN.md prompts for /gsd-execute-phase, not documentation. Every spec must be concrete enough that an executor (Claude) can implement without asking clarifying questions.
