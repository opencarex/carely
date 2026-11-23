# Short presentation outline

Target: 7–10 minutes, followed by the live journey.

1. **Problem and scope** — fragmented outpatient workflow; one web application,
   one hospital deployment, six roles; academic prototype.
2. **Requirements** — reason-based doctor finding, capacity-safe booking, queue,
   intake, consultation, prescription, stock/dispensing, admin and audit.
3. **Architecture** — Next.js App Router, thin routes, services, Zod, Drizzle,
   PostgreSQL, Better Auth and SMTP. Show `architecture.md`.
4. **Security** — server roles, record policies, 403/404 behavior, strict inputs,
   transactional audits and no patient values in audit metadata.
5. **Database workflow** — appointment → queue/encounter → notes/prescription →
   stock batches/dispense record.
6. **Testing evidence** — 16 retained tests; temporary evidence tied to revisions;
   explain that removed tests are not regression coverage.
7. **Live demo** — follow `demo-guide.md`, including one negative case.
8. **Limitations** — mixed fixture screens, pending final browser/SMTP/Docker/
   backup checks and Next.js security upgrade.
9. **Conclusion** — what is implemented, what remains before release, and why
   results are reported conservatively.

Do not put real patient data, credentials, tokens or unverifiable pass claims on
slides. Add screenshots only after the final run, with revision and date captions.
