// Genesis Core Systems: on-site assistant.
//
// Fully client-side. No API, no key, no network request of any kind: every
// answer below is written from the site's own published pages, so the
// assistant cannot invent claims (no made-up certifications, prices or
// clients) and cannot be talked into off-topic work like essays, code or
// trivia. Questions never leave the visitor's browser; the transcript is kept
// in sessionStorage for this tab only.
//
// The matching engine is pure and has no DOM dependency, so it can be unit
// tested in Node: `require("./assets/chat.js")` returns the engine.
(function (root) {
  "use strict";

  // =========================================================================
  // ENGINE
  // =========================================================================
  var ENGINE = (function () {
    var EMAIL = "info@genesiscoresystems.com";
    var PHONE = "+1 (914) 477-CORE";

    // ---- Knowledge base -------------------------------------------------
    // q: chip / button label. kw: words that signal this intent (run through
    // the same normalizer as visitor input, so inflections line up).
    // re: phrasings that are near-certain, worth a strong bonus.
    // requires: at least one of these tokens must be present to match.
    // subj: subject line for the mailto link on any address in the answer.
    var KB = [
      { id: "what", q: "What is Genesis Core Systems?",
        kw: "overview business purpose",
        re: [/\bwhat('?s| is| does) (genesis|gcs)( core systems)?( do| offer| provide| sell)?\s*\??\s*$/, /\b(who|what)('?s| is| are) (genesis|gcs)( core systems)?\s*\??\s*$/,
             /\bwhat do (you|u) (guys |all |folks )?(do|offer|sell|make|provide)\b/, /\bwhat do (yall|y'all) (do|offer|sell|make|provide)\b/,
             /\bwhat (does|is) (the|your|this) (company|firm)( do)?\b/, /\btell me about (genesis|gcs|your company|the company|yourselves)\s*\??\s*$/,
             /\bwhat is this (site|website|page)\b/, /\bwhat('?s| is) the (deal|story|scoop) (with|on|behind) (genesis|gcs|you|you guys|this company)\b/],
        a: "Genesis Core Systems delivers core banking to U.S. community banks. We package a proven Tier-1-grade core foundation with the work around it: configuration, integration, conversion and ongoing support, owned by one bank-facing team. The aim is fewer vendors and fewer integration points than the usual multi-vendor setup.",
        link: ["/solutions", "See the platform"], next: ["different", "conversion", "designpartner"] },

      { id: "fit", q: "Is Genesis right for a smaller bank?",
        kw: "small smaller size medium sized fit suitable asset lean limited tiny staff itstaff",
        re: [/\bright for\b/, /\b(good|fit|suitable|work|built|designed|make sense) for (a |an |our )?\$?\d+(\.\d+)?\s*(m|mm|mil|million|b|bn|billion)\b/],
        a: "That's who it's built for. Genesis is designed for small and medium-sized U.S. community banks, including banks with a lean IT team that has to keep things running while still making changes. It's designed to need minimal IT staffing on the bank's side, because Genesis runs the managed environment.",
        link: ["/about", "About Genesis"], next: ["what", "deployment", "pricing"] },

      { id: "different", q: "How is Genesis different?",
        kw: "different differ difference unique better why choose versus compare comparison advantage advantages standout competitor competitors fiserv fis jackhenry incumbent incumbents alternative alternatives",
        re: [/\b(how is|what makes) genesis different\b/, /\bwhy (choose|pick|use) genesis\b/, /\bwhy genesis\b/],
        a: "Most community banks run a core from one provider and stitch together separate vendors for digital banking, origination, payments and reporting. Genesis consolidates that into one platform and one operating relationship, with an open API layer and one named team accountable from conversion through support. Genesis isn't trying to copy the incumbent model of FIS, Fiserv and Jack Henry.",
        link: ["/solutions", "See the platform"], next: ["scratch", "api", "pricing"] },

      { id: "scratch", q: "What is Genesis built on?",
        kw: "scratch build builder own underlying foundation tier proprietary whitelabel whose technology engine nda",
        re: [/\b(genesis|platform|core|system)('s| is| was)? (built|based|powered) on\b|\b(it|this)('s| is| was)? (built|powered) on\b/, /\bbuilt? (it )?from scratch\b/, /\b(underlying|whose) core\b/, /\bwho built\b/],
        a: "Genesis is built on a proven Tier-1-grade core foundation, configured for community banks. Around it sit Genesis-built modules and approved partner modules, with Genesis-led configuration, integration, implementation, migration and ongoing operations. Details on the underlying foundation can be shared under NDA as part of your diligence.",
        link: ["/faq", "Read the FAQ"], next: ["security", "different", "contact"] },

      { id: "features", q: "What does the platform do?",
        kw: "feature capability function platform realtime posting post ledger batch overnight event reconciliation reconcile",
        re: [/\bhow (does|do) (genesis|it|the platform|your platform) work\b/, /\bwhat (does|can) (the|your) platform do\b/],
        a: "The core posts transactions in real time, at the moment they happen, rather than in an overnight batch. It's event-driven, so reconciliation is continuous instead of end-of-day, and every entity is available through an open API. Around the core sits a catalog of modules for loan origination, payments, onboarding and compliance reporting.",
        link: ["/solutions", "See the platform"], next: ["modules", "api", "payments"] },

      { id: "modules", q: "Which modules are available?",
        kw: "module catalogue catalog deposit lending loan origination onboarding workflow prebuilt configured configuration dashboard reporting",
        a: "The module catalog covers loan origination, payments, onboarding, compliance reporting and customer workflows. Modules arrive with reference configuration already built and tested, so setup starts from a working baseline, then gets fitted to your products, disclosures and reporting. Some modules are Genesis-built and others come through approved partners, with Genesis governing the integration and the support path.",
        link: ["/solutions", "See the modules"], next: ["api", "features", "contact"] },

      { id: "api", q: "Does Genesis have an open API?",
        kw: "api integrate thirdparty fintech digital online mobile app existing open endpoint webhook sdk",
        re: [/\bintegrat\w* (with|w|to|into)\b/],
        a: "Genesis is API-first. Every entity in the system is exposed through an open API, and digital banking, origination, payments and other systems connect through APIs, adapters and one integration pattern governed by Genesis. Open APIs and open data are a deliberate principle: lock-in shouldn't be a cost the bank carries.",
        link: ["/solutions", "See the platform"], next: ["modules", "lockin", "conversion"] },

      { id: "modular", q: "Can we modernize gradually?",
        kw: "modernize modernization piece incremental incrementally phased gradual gradually alongside selective whole entire",
        re: [/\b(one|a) (piece|module|step|bit) at a time\b/, /\b(replace|swap|rip out|rip and replace) (our |the |my )?(whole|entire)\b/,
             /\bwithout (replacing|swapping|switching|converting) (our |the |my )?(whole |entire |current |existing )?core\b/,
             /\b(keep|alongside) (our |the |my )?(current|existing|incumbent|old) core\b/, /\bselective(ly)? moderni[sz]/],
        a: "You can modernize in steps. Genesis doesn't require swapping your core first: a bank can start with one or two modules, such as origination, payments or onboarding, running alongside its current core, and expand as confidence builds. Full replacement and selective modernization are both options.",
        link: ["/solutions", "See the modules"], next: ["modules", "api", "conversion"] },

      { id: "deployment", q: "Cloud, hybrid or on-premises?",
        kw: "cloud onprem hybrid private dedicated deploy infrastructure server saas managed host",
        re: [/\bwhere (is|are|will|would) (the |our |my )?(data|system|platform|core)( be)? (hosted|stored|kept|run|live)\b/,
             /\b(data|core|system|platform) (be |is |are |get |gets )?(hosted|run|stored|kept|deployed) (in|on|at|with)\b/],
        a: "Genesis is cloud-first, with managed cloud as the preferred operating model. For banks with specific operating, security or infrastructure requirements, Genesis can also evaluate dedicated, hybrid or bank-hosted deployment, subject to technical validation and support constraints.",
        link: ["/faq", "Read the FAQ"], next: ["security", "uptime", "pricing"] },

      { id: "security", q: "How does Genesis handle security?",
        kw: "security soc2 soc1 audit attestation certification encryption access control controls pentest cybersecurity breach diligence tprm safe",
        a: "Genesis is designed to support bank-grade controls: encryption, access control, monitoring, incident response, business continuity and disaster recovery planning, and third-party governance. Specific certifications, audit reports and control evidence should be reviewed as part of your bank's diligence for the deployment model you choose. The team can walk your vendor-management group through it.",
        link: ["/faq", "Read the FAQ"], next: ["uptime", "compliance", "contact"] },

      { id: "uptime", q: "What about uptime and disaster recovery?",
        kw: "uptime availability downtime outage reliability sla dr bcp backup recovery disaster rto rpo failover continuity resilience",
        re: [/\b99\.9+\b|\bfive nines\b/],
        a: "Genesis targets high availability and recoverability appropriate to the deployment model you choose. Specific availability, disaster recovery, backup and RTO/RPO commitments are set in the bank's agreement and operating model rather than published as one number, because they depend on that model.",
        link: ["/faq", "Read the FAQ"], next: ["security", "support", "deployment"] },

      { id: "conversion", q: "What does a core conversion involve?",
        kw: "conversion process phase step mock uat cutover parallel mapping reconciliation sor move data",
        re: [/\bwhat (is|does) a (core |bank )?conversion( involve| entail| mean)?\s*\??\s*$/, /\bdo (you|u) (guys |all )?(do|handle|run|support|help with|manage) (core |bank )?conversions?\s*\??\s*$/],
        a: "A core conversion moves your system of record from one platform to another: every customer, account, balance, loan and ledger entry has to be mapped, moved and proven correct. The work runs in order: discovery, configuration, integration planning, data mapping, mock conversions, reconciliation, user acceptance testing, training, then cutover or a parallel run. Reconciliation decides whether a cutover date is real.",
        link: ["/core-conversion", "Read the conversion guide"], next: ["timeline", "convcost", "implementation"] },

      { id: "timeline", q: "How long does a conversion take?",
        kw: "timeline duration length month week year quick fast speed soon schedule start begin renew renewal expire expiry",
        re: [/\bwhen (should|do|would|can|must) (we|i|a bank|banks) (start|begin)\b/, /\bcontract (ends|expires|renews|is up|runs out|ending|expiring)\b/, /\bhow (fast|quickly|soon) can (we|i|a bank|you)\b/],
        a: "Months rather than weeks. The pace is set by the sequence: data mapping, mock conversions, testing and reconciliation each have to be signed off before the next starts. Separately, banks commonly start evaluating alternatives 18 to 24 months before their current contract expires, since selection and negotiation happen before any conversion work begins.",
        link: ["/core-conversion", "Read the conversion guide"], next: ["convcost", "conversion", "designpartner"] },

      { id: "convcost", q: "What does a conversion cost?",
        kw: "price conversion deconversion contract interface driver hidden",
        requires: ["conversion", "deconversion"],
        a: "The cost depends on your contracts and data. What drives it: account volume and years of history, how many connected systems need new interfaces, the deconversion fees in your current contract, staff time for testing and training, and any parallel running. Deconversion and interface fees are the items banks most often miss, so read those clauses before comparing options.",
        link: ["/core-conversion", "Read the conversion guide"], next: ["pricing", "timeline", "contact"] },

      { id: "pricing", q: "How is Genesis priced?",
        kw: "price license seat account subscription model list affordable afford volume",
        re: [/\bhow much (does|is|would) (genesis|it|the platform|this)\b/, /\bhow (does|do) (genesis|you|gcs) make money\b/],
        a: "Pricing is competitive with the major vendors. The economics are tied to the bank's agreed platform scope and account volumes rather than per-seat licensing, so they're predictable. There's no published list price because scope varies by bank; the team scopes it with you directly.",
        link: ["/contact", "Talk to the team"], next: ["designcosts", "convcost", "contact"] },

      { id: "implementation", q: "Who runs the implementation?",
        kw: "hypercare implementation lead project manager accountable accountability owner run deliver delivery staffing team",
        a: "Each engagement is led by a named conversion lead who stays accountable through go-live and the hypercare period after it. The team that scopes the work is the team that delivers it, so you aren't handed from a sales team to a delivery team you've never met.",
        link: ["/services", "See our services"], next: ["support", "training", "conversion"] },

      { id: "consultants", q: "Do we need conversion consultants?",
        kw: "consultant advisor advisory firm independent rfp selection negotiate negotiation",
        a: "They're useful for the parts where your interests and a vendor's aren't identical: choosing a provider, negotiating the contract, pricing the deconversion and checking whether a plan is credible. They don't run the conversion itself. Whoever operates the platform does the mapping, reconciliation and cutover, so settle early, in writing, who owns each step.",
        link: ["/core-conversion", "Read the conversion guide"], next: ["conversion", "implementation", "convcost"] },

      { id: "support", q: "What support do we get after go-live?",
        kw: "support helpdesk ticket issue problem incident monitoring maintenance golive ongoing escalation break breaks broken hour",
        a: "Genesis provides 24/7 monitoring and a dedicated response team that catch issues before they reach customers. Genesis is the bank-facing support owner for the Genesis-managed environment and coordinates any upstream product or partner support behind the scenes, so you have one accountable contact. Support also covers documented incident playbooks, scheduled system health reviews and planned maintenance.",
        link: ["/services", "See our services"], next: ["uptime", "training", "implementation"] },

      { id: "support247", q: "Is there 24/7 support?",
        kw: "monitoring support",
        re: [/\b24 ?(\/|x) ?7\b/, /\b24[\s-]?(hours?|hrs?)( a day)?\b/, /\b(a)?round[\s-]the[\s-]clock\b/, /\bafter[\s-]hours\b/,
             /\b(nights?|weekends?|holidays?)\b[^.?!]{0,25}\b(support|monitor\w*|cover\w*|help)\b/, /\b(support|monitor\w*|cover\w*|help)\b[^.?!]{0,25}\b(nights?|weekends?|holidays?)\b/],
        a: "Yes. Genesis provides 24/7 monitoring and a dedicated response team that catch issues before they reach customers, with scheduled health checks across every module in production. Genesis is the bank-facing support owner, so the bank has one accountable contact.",
        link: ["/services", "See our services"], next: ["support", "uptime", "implementation"] },

      { id: "training", q: "What training is provided?",
        kw: "training staff employee teller course curriculum sandbox webinar onsite education teach user",
        a: "Training is role-based and covers both customer-facing and back-office work. Staff practice on a hands-on sandbox environment, with live sessions, an on-demand library and a certification path for power users. It's delivered before go-live, not during it.",
        link: ["/services", "See our services"], next: ["support", "implementation", "conversion"] },

      { id: "designpartner", q: "What is the Design Partner Program?",
        kw: "designpartner program pilot beta early adopter cohort committee influence roadmap partner partnership founding",
        re: [/\b(what|wht|wat|whats|what's)( is| are)?( the| your| this)? design partners?( program| programme| thing| deal)?\s*\??\s*$/],
        a: "It's a limited program for community banks that want to shape the platform. Design Partners sit on the Design Committee and influence the roadmap. The bank commits to a structured process, not to a blind production conversion: your current core stays the system of record until UAT and migration reconciliation criteria are met.",
        link: ["/partnership", "About the program"], next: ["designcommit", "designcosts", "apply"] },

      { id: "designcommit", q: "What does a Design Partner commit to?",
        kw: "commit obligation require binding risk sign agree designpartner program",
        a: "A structured process: discovery, design, configuration, testing, migration validation and UAT. The bank isn't asked to commit to a production conversion at the start. Conversion is considered only after agreed UAT and migration reconciliation criteria are met, and your current core remains the system of record until then.",
        link: ["/partnership", "About the program"], next: ["designcosts", "apply", "timeline"] },

      { id: "designcosts", q: "What does Genesis cover for Design Partners?",
        kw: "cover free price designpartner partner customization implementation",
        requires: ["designpartner", "program", "partner"],
        a: "Within the agreed Design Partner MVP scope, Genesis covers the standard implementation, integration, configuration and customization work needed to bring the platform into the bank's environment. Bank-unique requirements that aren't meant to become part of the Genesis platform are scoped and priced separately.",
        link: ["/partnership", "About the program"], next: ["designcommit", "apply", "pricing"] },

      { id: "apply", q: "How do we become a Design Partner?",
        kw: "apply become enroll qualify eligible join designpartner started interested getstarted",
        requires: ["apply", "designpartner", "program", "partner", "getstarted"],
        a: "It runs in six steps: an inquiry, a working session with Genesis leadership, selection and scope, design and build, UAT and migration validation, then cutover readiness and go-live. Enrollment is limited each cycle, so the first step is simply getting in touch.",
        link: ["/partnership", "Apply to the program"], next: ["designcommit", "designcosts", "contact"] },

      { id: "team", q: "Who founded Genesis?",
        kw: "founder leadership leader executive president background experience story ohad savir brian brunner brent jenos danny galezer sofgen",
        re: [/\bwho (is|are) behind\b/, /\bwho (runs|leads|started|owns) (genesis|gcs|the company)\b/,
             /\b(founders?|team|leadership|leaders?|executives?|ceo|people)\b[^.?!]{0,30}\b(fiserv|sofgen)\b|\b(ex|former)[\s-]?(fiserv|sofgen)\b/],
        a: "Genesis was founded by Ohad Savir with Brian Brunner and Brent Jenos, both former Fiserv leaders with deep core-banking modernization experience, and Danny Galezer, whose background includes Sofgen and complex core implementation work.",
        link: ["/about", "About the team"], next: ["what", "contact", "designpartner"] },

      { id: "contact", q: "How do I talk to the team?",
        kw: "contact email phone number reach human person representative sales meeting appointment book located office address headquarters newyork",
        re: [/\bwhere (are you|is genesis|is gcs|is the company)\b/, /\b(schedule|book|arrange|set up|request) (a |an )?(call|meeting|time|chat|conversation)\b/],
        a: "The team replies within one business day. Email " + EMAIL + ", call " + PHONE + ", or use the contact form. Genesis is based in New York, NY.",
        link: ["/contact", "Contact the team"], next: ["demo", "designpartner", "what"] },

      { id: "demo", q: "Can I see a demo?",
        kw: "demo walkthrough trial preview tour screenshot video",
        re: [/\b(book|schedule|arrange|set up|request|see|watch|get) (a |an |the )?(demo|walkthrough|product tour|working session)\b/, /\bfree trial\b/, /\bsee (it|genesis|the platform|this) in action\b/,
             /\bsandbox (we|i) can (try|test|play with|use)\b|\b(can|could) (we|i) try (it|genesis|the platform|this)\b|\btry (it|genesis|the platform) (out|first|before)\b/, /\bshow me (the platform|genesis|it|the product|the system|around)\b/,
             /\bsee (the|your) (product|platform|software|system|app|ui|interface)\b/],
        a: "You can see Genesis in action in a working session with our team. We map your current stack, identify gaps and show how Genesis would slot in, so the session starts from what your bank actually runs.",
        link: ["/contact", "Book a working session"], next: ["contact", "what", "designpartner"] },

      { id: "corebanking", q: "What is a core banking system?",
        kw: "definition sor",
        re: [/\b(what is|what are|define|definition of|meaning of|explain)\b.{0,12}\bcore\b(?!\s+(processor|processing|conversion))/, /\bhow (does|do) (a |the )?core( banking)?( system)? work/, /\bhow core banking (system )?works\b/, /\bwhat does (a |the )?core( banking)?( system)? mean\b/],
        a: "A bank's core is the software that holds the official record of every customer, account, balance and transaction. Deposits, loans, interest, fees and the general ledger all run through it, and almost every other system the bank uses depends on it.",
        link: ["/core-banking-system", "Read the core banking guide"], next: ["processor", "conversion", "what"] },

      { id: "processor", q: "Core banking vs. a core processor?",
        kw: "processor outsource bureau inhouse difference",
        a: "Core banking describes the system itself: the software that maintains accounts and posts transactions. Core processing usually describes the service of running it. A core processor hosts and operates the core for the bank, instead of the bank running it in-house.",
        link: ["/core-banking-system", "Read the core banking guide"], next: ["corebanking", "deployment", "conversion"] },

      { id: "lockin", q: "What about vendor lock-in?",
        kw: "lockin ownership export portability portable leave exit trapped",
        re: [/\bcan (we|i) (leave|exit|get out|cancel|switch away)\b/, /\bexit (clause|terms|fees?|rights?)\b/, /\b(switch|move) away\b/, /\bexport (our|my|the) data\b/, /\bcontract (term|length)\b/,
             /\bget out of (our|my|the|a|this)\b/, /\bwant(ed)? (out|to leave|to exit)\b/, /\b(if|when) (we|i) (leave|exit|switch away|cancel)\b/],
        a: "Open APIs, open data and an open vendor strategy are principles at Genesis. Lock-in is a cost the bank shouldn't have to carry. Specific data access and exit terms are set in the bank's agreement, and they're worth reading closely with any provider, including deconversion fees.",
        link: ["/about", "Our principles"], next: ["api", "convcost", "contact"] },

      { id: "payments", q: "Which payment rails are supported?",
        kw: "payment ach wire card debit fednow rtp instant zelle rail transfer",
        a: "ACH, wire and card processing are supported through established partner connectivity, and instant payment rails are on the roadmap. Design Partners have a direct say in how that roadmap is prioritized.",
        link: ["/solutions", "See the platform"], next: ["api", "designpartner", "features"] },

      { id: "compliance", q: "How does Genesis handle regulatory compliance?",
        kw: "compliance regulatory bsa aml kyc ofac cfpb occ fdic ffiec exam callreport reporting update hmda cecl",
        a: "Genesis tracks regulatory changes that affect community banks and coordinates platform updates with its technology partners, so the bank doesn't run each change as its own project. The platform is designed to support the compliance reporting community banks prepare for examiners. For your specific exam and vendor-management requirements, the team can walk through the controls and evidence directly.",
        link: ["/faq", "Read the FAQ"], next: ["security", "uptime", "contact"] },

      { id: "creditunion", q: "Do you work with credit unions?",
        kw: "creditunion cu thrift international canada outside country global europe uk",
        re: [/\b(only|just) (for )?(u\.?s\.?|us|american|domestic) banks\b/, /\boutside (of )?(the )?(u\.?s\.?|us|united states)\b/,
             /\b(banks?|institutions?|we are|we're) (in|from|based in) (mexico|canada|the uk|britain|england|ireland|europe|asia|africa|australia|india|latin america|south america|brazil|germany|france|the caribbean|puerto rico)\b|\b(abroad|overseas|offshore)\b/],
        a: "Genesis is built for U.S. community banks. If you're a credit union, or outside the U.S., the team can tell you directly whether it's a fit.",
        link: ["/contact", "Ask the team"], next: ["fit", "what", "contact"] },

      { id: "careers", q: "Is Genesis hiring?",
        kw: "career job hiring hire employment position opening resume cv internship",
        a: "Genesis welcomes interest from future colleagues. Send a short note about your background to " + EMAIL + " with \"Careers\" in the subject line, or use the contact form.",
        subj: "Careers",
        link: ["/contact", "Get in touch"], next: ["team", "what"] },

      { id: "privacy", q: "Is what I type here stored?",
        kw: "privacy cookie gdpr ccpa tracking personal stored store typed transcript",
        re: [/\b(privacy|cookie) (policy|notice|statement)\b/],
        a: "Questions you type here are answered inside your browser and never sent to Genesis or anyone else. The conversation is kept only in this browser tab and clears when you close it. The site sets cookies only for analytics, and only after you select Accept on the cookie banner; the Cookie settings link in the footer changes that choice.",
        link: ["/privacy", "Privacy policy"], next: ["contact", "what"] },

      { id: "policies", q: "Do you publish your policies?",
        kw: "policy ethic conduct esg dei diversity inclusion whistleblower bribery corruption harassment slavery supplier humanrights",
        re: [/\b(report|raise) (a |an )?(concern|violation|misconduct|ethics (issue|concern))\b/],
        a: "Genesis publishes its Business and Supplier Codes of Conduct and its anti-corruption, ESG, DEI, human rights, modern slavery, whistleblower, harassment prevention and cybersecurity policies on the Policies and Commitments page. Concerns can be reported confidentially to " + EMAIL + " with \"Confidential report\" in the subject.",
        subj: "Confidential report",
        link: ["/policies", "Read our policies"], next: ["privacy", "security", "contact"] },

      { id: "legit", q: "Is Genesis a real company?",
        kw: "legit legitimate scam trustworthy reputable",
        re: [/\b(is|are) (this|genesis|you|it|gcs|genesis core systems) (legit|legitimate|a scam|a real (company|business|firm)|trustworthy|reputable)\b/, /\breal (company|business|firm)\b/, /\b(can|should) (we|i) trust (you|genesis|this|gcs)\b/],
        a: "Genesis Core Systems is a core banking company for U.S. community banks, based in New York, NY. It was founded by Ohad Savir with Brian Brunner and Brent Jenos, both former Fiserv leaders, and Danny Galezer. You can reach the team at " + EMAIL + " or " + PHONE + ".",
        link: ["/about", "Meet the team"], next: ["team", "contact"] },

      { id: "references", q: "Can we talk to references?",
        kw: "client referral testimonial casestudy",
        re: [/\bwho (are|r) (your|ur|the) (clients|customers|users)\b/, /\breferences\b|\breference (check|call|bank|customer|client)s?\b/, /\btestimonials?\b/, /\bcase stud(y|ies)\b/,
             /\bhow many (banks|clients|customers|institutions) (use|run|are on|are live|do you have|does genesis have)\b/, /\b(banks|anyone|anybody) (live|using)\b/,
             /\blive (with|at|in) (any )?(banks?|clients?|customers?)\b/, /\b(is|are) (it|this|genesis|the platform|gcs) live\b/, /\bwho uses (this|it|genesis|the platform)\b/,
             /\b(talk|speak) (to|with) (a |an )?(current |existing )?(customer|client|bank using)/,
             /\b(do you have|have you got|are there|got) (any )?(current |existing |paying )?(customers|clients)\b/, /\bany (customers|clients)\s*\??\s*$/],
        a: "Banks considering Genesis get access to referrals, technology briefings and direct contact with our leadership team, and the Design Partner Program runs in small, select cohorts. For reference requests, the team will answer you directly.",
        link: ["/contact", "Talk to the team"], next: ["designpartner", "team", "contact"] },

      { id: "consumer", q: "I have a question about my bank account",
        kw: "routing checking savings balance",
        re: [/\bmy (bank |checking |savings )?(debit |credit )?(card|account|balance|loan|mortgage|statement)\b(?!s|\s+(data|history|volumes?|structures?|holders?|types?|records?|mapping))/,
             /\bmy (debit |credit |atm |bank )?card\b[^.?!]*\b(not working|declined|blocked|lost|stolen|frozen|locked)\b/, /\bopen (a|an) (checking|savings|bank) account\b/, /\brouting number\b/, /\bcan i (get|apply for) (a|an) (loan|mortgage|credit card)\b/, /\b(i|we) need (a|an) (personal )?loan\b/],
        a: "Genesis Core Systems provides core banking technology to banks rather than accounts to individuals. For help with an account, card, balance or loan, please contact your bank directly using the number on your card or statement.",
        link: ["/about", "About Genesis"], next: ["what"] },

      { id: "genesys", q: "Are you related to Genesys?",
        kw: "genesys",
        re: [/\bgenesys\b/],
        a: "No. Genesis Core Systems is a core banking company for U.S. community banks. Genesys is a separate, unrelated company that makes contact-center software.",
        link: ["/about", "About Genesis"], next: ["what", "different", "contact"] },

      { id: "articles", q: "Do you publish guides?",
        kw: "article blog insight resource guide whitepaper newsletter read",
        a: "Yes. There's a guide to core banking systems, a guide to bank core conversion, and articles on why core modernization is hard for community banks.",
        link: ["/articles", "Browse articles"], next: ["corebanking", "conversion", "what"] }
    ];

    var BY_ID = {};
    KB.forEach(function (k) { BY_ID[k.id] = k; });

    // ---- Page-aware starting questions ----------------------------------
    var STARTERS = {
      "/": ["what", "different", "designpartner", "demo"],
      "/solutions": ["features", "modules", "api", "deployment"],
      "/services": ["conversion", "implementation", "support", "training"],
      "/partnership": ["designpartner", "designcommit", "designcosts", "apply"],
      "/about": ["team", "what", "different", "contact"],
      "/faq": ["security", "deployment", "scratch", "pricing"],
      "/core-conversion": ["timeline", "convcost", "consultants", "contact"],
      "/core-banking-system": ["corebanking", "processor", "conversion", "what"],
      "/contact": ["demo", "pricing", "designpartner", "what"],
      "/policies": ["policies", "privacy", "contact", "what"],
      "/privacy": ["privacy", "policies", "contact", "what"]
    };
    var DEFAULT_STARTERS = ["what", "designpartner", "conversion", "contact"];

    // ---- Normalization --------------------------------------------------
    // Multi-word phrases collapse to one token before splitting.
    var PHRASES = [
      [/\bhow much\b/g, "howmuch"], [/\b(how|hw|hoe|hiw) (long|lng|lon)\b/g, "howlong"], [/\bsign(ing)?[\s-]?up\b/g, "signup"],
      [/\b24 ?(\/|x) ?7\b/g, "monitoring support"], [/\bcloud[\s-]based\b/g, "cloud"],
      [/\btotal cost of ownership\b|\btco\b/g, "price"], [/\blicens(e|es|ing)\b/g, "price"],
      [/\b(data )?(at rest|in transit)\b/g, "encryption"], [/\bpen(etration)?[\s-]?test(s|ing)?\b/g, "pentest"],
      [/\biso ?27001\b/g, "certification"], [/\bdata (be )?(safe|secure|protected)\b/g, "security"],
      [/\bcontract (term|length)\b/g, "lockin"], [/\b(it|tech) (team|staff|people|department)\b/g, "itstaff"],
      [/\b(chat|talk|speak) (with|to) (a )?(live|real) (agent|person|human)\b/g, "contact person"],
      [/\bcase stud(y|ies)\b/g, "casestudy"], [/\bhuman rights\b/g, "humanrights"],
      [/\bremote deposit capture\b|\brdc\b/g, "rdc"], [/\bteller (system|platform|module|software|app)s?\b/g, "module"],
      [/\bdigital (account opening|onboarding)\b/g, "onboarding"],
      [/\bcodes? of (business )?conduct\b/g, "conduct"], [/\bearly adopters?\b/g, "adopter"],
      [/\bblog posts?\b/g, "blog"], [/\breal[\s-]?time payments?\b/g, "rtp"], [/\bper (year|month|annum|account|seat|user)\b/g, "price"],
      [/\bdesign partners?\b/g, "designpartner"], [/\breal[\s-]?time\b/g, "realtime"],
      [/\bon[\s-]?prem(ise|ises)?\b/g, "onprem"], [/\bself[\s-]?host(ed|ing)?\b/g, "onprem"],
      [/\bin[\s-]house\b/g, "inhouse"], [/\bdata ?cent(er|re)s?\b/g, "datacenter"],
      [/\bsoc ?(2|ii|two)\b/g, "soc2"], [/\bsoc ?(1|i|one)\b/g, "soc1"],
      [/\bdisaster recovery\b/g, "dr"], [/\bbusiness continuity\b/g, "bcp"],
      [/\bgo[\s-]?live\b/g, "golive"], [/\block(ed)?[\s-]?in\b/g, "lockin"], [/\bvendor lock\b/g, "lockin"],
      [/\bcredit (union|uion|unoin|unino|unon|unio|uinon)s?\b/g, "creditunion"], [/\bnew york\b/g, "newyork"], [/\bjack henry\b/g, "jackhenry"],
      [/\bsystem of record\b/g, "sor"], [/\bcore process(or|ors|ing)\b/g, "processor"],
      [/\bservice bureau\b/g, "bureau"], [/\bcall reports?\b/g, "callreport"],
      [/\bloan origination\b/g, "origination"], [/\baccount opening\b/g, "onboarding"],
      [/\bmock conversions?\b/g, "mock"], [/\bparallel run(s|ning)?\b/g, "parallel"],
      [/\buser acceptance test(ing)?\b/g, "uat"], [/\bthird[\s-]?part(y|ies)\b/g, "thirdparty"],
      [/\bfed ?now\b/g, "fednow"], [/\be[\s-]?learning\b/g, "training"], [/\bset[\s-]?up\b/g, "implementation"],
      [/\b(talk|speak) (to|with)\b/g, "contact"], [/\bget in touch\b/g, "contact"], [/\breach out\b/g, "contact"],
      [/\bwhite[\s-]?label(ed)?\b/g, "whitelabel"], [/\bopen source\b/g, "opensource"],
      [/\bgo(es|ing)? down\b/g, "downtime"], [/\b(point of|main|primary|single|day[\s-]to[\s-]day) contact\b/g, "accountable"],
      [/\b(locked|lock|tied) (into|in to|to)\b/g, "commit"], [/\bon the hook\b/g, "commit"],
      [/\bpays? for\b/g, "cover"], [/\bget(ting)? started\b/g, "getstarted"],
      [/\bopen (roles?|positions?|jobs?)\b/g, "career"], [/\b(own|ownership of|owns) (our|my|the) data\b/g, "ownership"]
    ];

    // Inflections and synonyms collapse to one canonical token.
    var SYN = {};
    function syn(canon, words) { words.split(" ").forEach(function (w) { SYN[w] = canon; }); }
    syn("conversion", "convert converts converting converted conversion conversions switch switches switching switched migrate migrates migrating migrated migration migrations replace replacing replacement transition transitioning swap swaps swapping swapped");
    syn("deconversion", "deconversion deconversions deconvert");
    syn("price", "price prices pricing priced cost costs costing fee fees quote quotes expensive cheap cheaper budget budgets spend spending howmuch charge charges charged pay paying paid");
    syn("timeline", "howlong timeline timelines timeframe duration");      // not "time": "what time is it"
    syn("cloud", "cloud saas hosted hosting aws azure gcp datacenter");
    syn("host", "host hosts");
    syn("security", "secure security cybersecurity cyber encryption encrypt encrypted");
    syn("soc2", "soc soc2");
    syn("certification", "certification certifications certified certify certificate");
    syn("audit", "audit audits audited attestation attestations");
    syn("uptime", "uptime availability downtime outage outages reliability reliable resilience resilient sla slas crash crashes crashed");
    syn("api", "api apis rest endpoint endpoints webhook webhooks sdk");
    syn("integrate", "integrate integrates integrating integrated integration integrations connect connects connecting connected connection connections connector connectors plugin adapter adapters");
    syn("support", "support supports supported supporting helpdesk");
    syn("training", "train trains trained training trainings learn learning");
    syn("staff", "staff staffing employee employees teller tellers");
    syn("program", "program programs programme cohort cohorts");
    syn("commit", "commit commits committing commitment commitments obligation obligations obligated obligate binding bound");
    syn("require", "require requires required requirement requirements");
    syn("cover", "cover covers covered covering included include includes");
    syn("apply", "apply applying enroll enrolling enrollment signup");
    syn("app", "app apps application applications");
    syn("founder", "founder founders founded cofounder cofounders ceo cto coo");
    syn("leadership", "leadership leader leaders executive executives");
    syn("contact", "contact contacting email emails phone call calling reach talk speak");
    syn("person", "person human someone somebody representative rep salesperson");
    syn("located", "located location locations office offices address headquarters hq");
    syn("demo", "demo demos demonstration walkthrough trial tour");
    syn("module", "module modules");
    syn("loan", "loan loans lending lend");
    syn("payment", "payment payments");
    syn("wire", "wire wires");
    syn("card", "card cards");
    syn("rail", "rail rails");
    syn("compliance", "compliance compliant regulatory regulation regulations regulator regulators examination examiner examiners exams");
    syn("career", "career careers job jobs hiring hire hired employment position positions opening openings internship intern role roles");
    syn("privacy", "privacy cookie cookies tracking tracked track");
    syn("policy", "policy policies");
    syn("article", "article articles blog blogs insight insights resource resources guide guides whitepaper whitepapers newsletter");
    syn("consultant", "consultant consultants advisor advisors advisory");
    syn("negotiate", "negotiate negotiating negotiation negotiations");
    syn("feature", "feature features capability capabilities function functions functionality");
    syn("move", "move moves moving moved");
    syn("difference", "different differ differs difference differences");
    syn("compare", "compare comparing comparison versus vs");
    syn("competitor", "competitor competitors incumbent incumbents rival rivals");
    syn("alternative", "alternative alternatives");
    syn("president", "president");
    syn("experience", "experience experienced");
    syn("customization", "customization customize customized custom customise customised");
    syn("configured", "configured configure configuration configurations configurable");
    syn("realtime", "realtime instantly immediate immediately");
    syn("reconciliation", "reconciliation reconcile reconciling reconciled");
    syn("client", "client clients");
    syn("referral", "referral referrals");
    syn("legit", "legit legitimate");

    // Words that say "this is about Genesis / banking" but carry no intent
    // on this site (everything here is core banking). They open the scope
    // gate without voting for any one answer.
    var DOMAIN_ONLY = setOf("company firm core bank banks banking banker bankers genesis gcs community institution institutions financial fi fis platform system systems software solution solutions technology vendor vendors provider providers");
    // "fis" is both a competitor and a common abbreviation, keep it scoring:
    DOMAIN_ONLY.fis = false;

    // Fair questions about the company that the site doesn't answer
    // (investors, revenue, headcount). They put a question in scope so the
    // visitor gets the honest "ask the team" reply instead of a refusal.
    var HONEST = setOf("investor investment funding funded revenue profit profitable profitability valuation stable stability financially financials backer backed backing headcount rdc");
    var HONEST_RE = /\bhow many (employees|people|staff)( do (you|they) have| does (genesis|the company|gcs) have| work (at|for) (genesis|you|the company|gcs))\b|\bhow long have you been (in business|around|operating)\b/;

    var STOP = setOf("whats hows wheres whos whys thats theres dont doesnt didnt cant isnt arent wasnt wont wouldnt shouldnt couldnt im ive youre theyre happen happens happened happening during while between within without whether since until upon onto through across among regarding concerning maybe perhaps typically usually generally specifically approximately roughly around case example level allowed available see show say mean think find plan exist exists need needs needed run runs running help helps helpful a an the and or but if of to in on at by for with from about as into over under after before than then so too very can could would should will shall may might must do does did done doing is are was were be been being am have has had having i me my mine we us our ours you your yours it its this that these those there here what which who whom whose when where why how any some all each every more most much many other another such only own same just also really still yet already now today currently current new existing actually exactly basically possible able sure yes no not ok okay please thanks thank hi hello hey tell know need want like get got give gives make makes made take takes took use uses used using work works working go going come let lets ask asking question questions answer info information detail details thing things kind type types sort way ways look looking interested wondering curious anything something everything nothing per via etc e g ie one two three first lot lots bit well good great best right ur pls plz yall guys folks handle handles handled handling");

    function setOf(words) { var o = {}; words.split(" ").forEach(function (w) { if (w) o[w] = true; }); return o; }

    function stem(t) {
      if (t.length < 4 || /\d/.test(t)) return t;
      if (/ies$/.test(t) && t.length > 4) return t.slice(0, -3) + "y";
      if (/(ss|x|ch|sh)es$/.test(t)) return t.slice(0, -2);
      if (/s$/.test(t) && !/(ss|us|is)$/.test(t)) return t.slice(0, -1);
      return t;
    }

    function norm(text) {
      var s = " " + String(text || "").toLowerCase()
        .replace(/[‘’`]/g, "'").replace(/&/g, " and ") + " ";
      s = s.replace(/\b(what|who|where|how|that|it|there|here)'s\b/g, "$1 is")
           .replace(/\bcan't\b/g, "can not").replace(/n't\b/g, " not")
           .replace(/'re\b/g, " are").replace(/'ll\b/g, " will").replace(/'ve\b/g, " have")
           .replace(/'m\b/g, " am").replace(/'d\b/g, " would");
      for (var i = 0; i < PHRASES.length; i++) s = s.replace(PHRASES[i][0], " " + PHRASES[i][1] + " ");
      return s.replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    }

    // Typo tolerance: an unknown word maps to the one known word it is a
    // single edit away from, with the same first letter. Short real words
    // differ by one letter all the time (stuff/staff, score/store), so a
    // dropped or doubled letter needs 5+ letters, two swapped letters 6+, and
    // a wrong letter 7+. Ambiguous matches are ignored.
    var DICT = null;
    function near1(a, b) {
      var la = a.length, lb = b.length, i = 0;
      if (Math.abs(la - lb) > 1) return false;
      while (i < la && i < lb && a.charAt(i) === b.charAt(i)) i++;
      if (la === lb) {
        if (i === la) return true;
        if (la >= 7 && a.slice(i + 1) === b.slice(i + 1)) return true;
        return la >= 6 && a.charAt(i) === b.charAt(i + 1) && a.charAt(i + 1) === b.charAt(i) && a.slice(i + 2) === b.slice(i + 2);
      }
      return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
    }
    function fuzzy(w) {
      if (w.length < 5 || /\d/.test(w) || !DICT) return null;
      var hit = null;
      for (var d in DICT) {
        if (d.length < 4 || d.charAt(0) !== w.charAt(0) || !near1(w, d)) continue;
        if (hit !== null && hit !== DICT[d]) return null;
        hit = DICT[d];
      }
      return hit;
    }

    function tokens(text, typos) {
      var out = [];
      norm(text).split(" ").forEach(function (w) {
        if (!w || STOP[w]) return;
        var t = SYN[w] || SYN[stem(w)] || stem(w);
        if (typos && !VOCAB[t] && !DOMAIN_ONLY[t] && !HONEST[t]) t = fuzzy(w) || t;
        if (t.length > 1 || /\d/.test(t)) out.push(t);
      });
      return out;
    }

    // ---- Index the knowledge base --------------------------------------
    var N = KB.length, DF = {}, VOCAB = {};
    KB.forEach(function (k) {
      var seen = {};
      k.toks = tokens(k.kw + " " + k.q);
      k.toks.forEach(function (t) { VOCAB[t] = true; if (!seen[t]) { seen[t] = 1; DF[t] = (DF[t] || 0) + 1; } });
      k.req = (k.requires || []).map(function (r) { return SYN[r] || r; });
    });
    Object.keys(DOMAIN_ONLY).forEach(function (t) { if (DOMAIN_ONLY[t]) VOCAB[t] = true; });
    function idf(t) { return 1 + Math.log(N / (DF[t] || N)); }

    // Spelling dictionary for fuzzy(): every surface word the engine knows.
    DICT = {};
    Object.keys(SYN).forEach(function (w) { if (VOCAB[SYN[w]]) DICT[w] = SYN[w]; });
    Object.keys(VOCAB).forEach(function (t) { if (!DICT[t] && !/\d/.test(t)) DICT[t] = t; });
    KB.forEach(function (k) {
      k.kw.split(" ").forEach(function (w) { var t = SYN[w] || SYN[stem(w)] || stem(w); if (w && !DICT[w] && VOCAB[t]) DICT[w] = t; });
    });

    function scoreIntent(k, toks, lower) {
      if (k.req.length && !toks.some(function (t) { return k.req.indexOf(t) !== -1; })) return 0;
      var s = 0, used = {};
      toks.forEach(function (t) { if (!used[t] && k.toks.indexOf(t) !== -1) { used[t] = 1; s += idf(t); } });
      (k.re || []).forEach(function (re) { if (re.test(lower)) s += 6; });
      return s;
    }

    // ---- Guards ---------------------------------------------------------
    // "act as" is only a jailbreak when it is aimed at the assistant: "can
    // Genesis act as a core processor" is a real question.
    var JAILBREAK = /\b(ignore|disregard|forget|override|bypass)\b[^.?!]{0,40}\b(instruction|instructions|rules?|prompts?|guidelines?|previous|above|programming|restrictions?|everything)\b|\b(pretend (to be|you are|you're)|role[\s-]?play|you are now|you're now|from now on,? you|jailbreak|dan mode|developer mode|system prompt|your (prompt|instructions|rules)|repeat after me)\b|(^\s*|\b(you|u) (to |now |should |will |must |can |could )?)act as\b(?! (a |an )?(core|processor|bank|service|bridge|middleware))/;
    // Creative or code requests. "Tell me about the Design Partner program"
    // is a question, so "tell me" / "give me" only refuse with a creative noun.
    var GENERATE = /\b(tell|give) me (a|an|another|some) (joke|story|poem|riddle|recipe|song)s?\b|\b(write|generate|compose|draft|create|produce|craft|make me)\b[^.?!]{0,45}\b(essays?|poems?|stor(y|ies)|songs?|lyrics|novels?|scripts?|code|programs?|functions?|letters?|speech(es)?|jokes?|haiku|raps?|blog posts?|tweets?|captions?|limericks?|sonnets?|recipes?|emails?)\b|\b(essay|poem|haiku|limerick|sonnet|lyrics)\b/;
    // Arithmetic is refused only when the whole message is a sum ("what is
    // 2+2", "7 x 8?"), so "24/7", "12-18 months", "T+1" and years never trip it.
    var OFFTOPIC = /\b(weather|forecast|recipe|recipes|riddle|horoscope|astrology|super ?bowl|world cup|nba|nfl|mlb|nhl|netflix|movies?|celebrit(y|ies)|homework|translate|translation|bitcoin|ethereum|dating|girlfriend|boyfriend|capital of|meaning of life|hack into|launder (money|funds|cash))\b|\b(bake|baking|eat|eating|chocolate chip|oatmeal|sugar) cookies?\b|\bcookies? (recipe|dough|jar)\b|\b(ceo|cto|founder|president) of (?!(genesis|gcs|the|our|my|your|this|a|an)\b)[a-z]+|\bconvert\w*\b[^.?!]{0,25}\b(miles?|kilometers?|km|pounds?|lbs?|kg|kilograms?|ounces?|oz|grams?|inches|feet|foot|meters?|celsius|fahrenheit|cups?|liters?|gallons?|units?|currency|currencies|pdf|word doc|jpe?g|png)\b|^\s*(what is |whats |what's |calculate |solve )?(?!24\s*[\/x]\s*7\b)\d+(\.\d+)?\s*[+*\/x×-]\s*\d+(\.\d+)?\s*[?=]?\s*$/;
    var ABUSE = /\b(fuck\w*|shit\w*|bitch\w*|asshole|bastard|cunt|dickhead|retard\w*|stupid bot|dumb bot|useless bot)\b|\b(bot|chatbot|assistant|you|you're|you are|u r|ur) (is |are |r )?(so |really )?(stupid|dumb|useless|garbage|trash|terrible|an idiot|idiot|sucks?)\b/;
    var IDENTITY = /\b(are you (a |an )?(bot|robot|ai|human|real(?! (company|business|firm|vendor|bank))|person|chatgpt|gpt|claude|machine|computer|automated|live agent))\b|\bwho are you\b|\bwhat are you\b|\bis this (a )?(bot|ai|human|real person|live (chat|agent|person))\b|\bwhat (model|llm|ai) are you\b|\bhow old are you\b|\b(chatgpt|gpt-?\d|openai|llm|large language model)\b/;
    var GREETING = /^(hi|hello|hey|hiya|howdy|yo|greetings|good (morning|afternoon|evening))( there| team| genesis)?$/;
    var THANKS = /^(thanks|thank you|thx|ty|cheers|appreciate it|much appreciated|great thanks|ok thanks|okay thanks)( very much| so much)?$/;
    var BYE = /^(bye|goodbye|see you|see ya|that is all|thats all|that is it|done|nothing else|no thanks|no thank you)$/;

    var LOW = 2.0;          // minimum score to answer
    var CLOSE = 0.9;        // runner-up within this ratio of the best => ask which

    // Recognized words that also occur in everyday, non-banking questions.
    // Alone they can't put a question in scope if anything foreign comes with them.
    var GENERIC = setOf("data timeline price contact person located number move difference compare experience start begin quick fast soon month week year schedule duration speed issue problem ongoing read update right fit store ticket small smaller size medium sized tiny lean limited staff user teach education book meeting appointment office address reach sign agree guarantee risk require cover leave exit join become interested open access control model list account overview business purpose offer feature background president break story");

    function classify(raw) {
      var text = String(raw || "").slice(0, 300);
      var lower = " " + text.toLowerCase().replace(/[‘’`]/g, "'") + " ";
      var plain = norm(text);
      // Emoji, punctuation or another script: answer with the help chips
      // rather than going silent.
      if (!plain) return { kind: /\S/.test(text) ? "vague" : "empty" };
      if (JAILBREAK.test(lower)) return { kind: "jailbreak" };
      if (GENERATE.test(lower)) return { kind: "generate" };
      if (ABUSE.test(lower)) return { kind: "abuse" };
      if (IDENTITY.test(lower)) return { kind: "identity" };
      if (GREETING.test(plain)) return { kind: "greet" };
      if (THANKS.test(plain)) return { kind: "thanks" };
      if (BYE.test(plain)) return { kind: "bye" };
      if (OFFTOPIC.test(lower)) return { kind: "offscope" };
      if (HONEST_RE.test(lower)) return { kind: "unsure" };

      var toks = tokens(text, true);
      // Words recognized only by typo matching: they can steer a question
      // that is otherwise in scope, but can't on their own pull in one that
      // also carries foreign words ("what's the score of the game").
      var exact = {};
      tokens(text).forEach(function (t) { exact[t] = true; });
      var hasDomain = toks.some(function (t) { return DOMAIN_ONLY[t]; });
      var honest = toks.some(function (t) { return HONEST[t]; });
      var content = toks.filter(function (t) { return !DOMAIN_ONLY[t] && !HONEST[t]; });
      var known = content.filter(function (t) { return VOCAB[t]; });
      var unknown = content.filter(function (t) { return !VOCAB[t]; });

      var scored = KB.map(function (k) { return { k: k, s: scoreIntent(k, content, lower) }; })
                     .filter(function (o) { return o.s > 0; })
                     .sort(function (a, b) { return b.s - a.s; });
      var best = scored[0], second = scored[1];
      var strongPhrase = best && best.s >= 6;

      if (!toks.length && !strongPhrase) return { kind: "vague" };
      // Just the name ("genesis", "gcs", "core banking"): give the overview.
      if (hasDomain && !content.length && !strongPhrase && !honest) return { kind: "answer", id: "what", score: 0 };
      // Scope gate. In scope if the visitor names the domain ("genesis",
      // "bank"), uses a core-banking-specific term ("OFAC", "migration",
      // "SOC 2"), or asks a purely generic question with nothing foreign in it
      // ("how much does it cost"). A generic term next to foreign words is out:
      // "how long is the Nile river" and "how much is a coffee" both refuse.
      var specific = known.filter(function (t) { return !GENERIC[t] && exact[t]; });
      var inScope = hasDomain || honest || strongPhrase || specific.length > 0 ||
                    (known.length > 0 && unknown.length === 0);
      // A recognized term buried in mostly foreign words: don't guess.
      if (inScope && !hasDomain && !strongPhrase && unknown.length > 2 * known.length + 1) return { kind: "unsure" };
      if (!inScope) {
        if (!known.length && unknown.length === 1 && unknown[0].length < 12 && !/[aeiou]/.test(unknown[0].slice(1))) return { kind: "vague" };
        return { kind: "offscope" };
      }
      if (!best || best.s < LOW) return { kind: "unsure" };
      if (second && second.s >= LOW && second.s >= best.s * CLOSE && !strongPhrase) {
        return { kind: "clarify", options: [best.k.id, second.k.id] };
      }
      return { kind: "answer", id: best.k.id, score: +best.s.toFixed(2) };
    }

    var REPLIES = {
      greet: { t: "Hi. I can answer questions about Genesis Core Systems, our platform, the Design Partner Program and bank core conversions. What would you like to know?", chips: ["what", "different", "designpartner", "conversion"] },
      thanks: { t: "You're welcome. Anything else I can help with?", chips: ["contact", "designpartner"] },
      bye: { t: "Thanks for stopping by. If anything comes up, the team is at " + EMAIL + ".", chips: [] },
      identity: { t: "I'm an automated assistant, not a person. I answer from Genesis Core Systems' published materials and stick to questions about Genesis, core banking and core conversions. For anything specific to your bank, the team is the right call.", chips: ["contact", "what"] },
      generate: { t: "I don't write essays, code or creative pieces. I'm here to answer questions about Genesis Core Systems, its platform and bank core conversions.", chips: ["what", "conversion", "designpartner"] },
      jailbreak: { t: "I can't change how I work. I only answer questions about Genesis Core Systems, core banking and core conversions.", chips: ["what", "conversion", "contact"] },
      abuse: { t: "I'm here to help with questions about Genesis Core Systems. Is there something I can answer for you?", chips: ["what", "contact"] },
      offscope: { t: "That's outside what I can help with. I answer questions about Genesis Core Systems, our platform, the Design Partner Program and bank core conversions.", chips: ["what", "conversion", "designpartner", "contact"] },
      unsure: { t: "I don't have a reliable answer to that, and I'd rather not guess. The team can answer it directly at " + EMAIL + " or " + PHONE + ".", chips: ["contact", "what", "conversion"] },
      vague: { t: "I didn't quite catch that. Here are a few things I can help with:", chips: ["what", "designpartner", "conversion", "contact"] },
      clarify: { t: "Just to make sure I answer the right question:", chips: [] }
    };

    function starters(path) {
      var p = String(path || "/").replace(/\.html$/, "").replace(/\/index$/, "/").replace(/\/+$/, "") || "/";
      return STARTERS[p] || DEFAULT_STARTERS;
    }

    return { classify: classify, KB: KB, byId: BY_ID, replies: REPLIES, starters: starters, tokens: tokens, EMAIL: EMAIL, PHONE: PHONE };
  })();

  if (typeof module !== "undefined" && module.exports) { module.exports = ENGINE; return; }
  if (!root.document || root.__gcsChat) return;
  root.__gcsChat = true;

  // =========================================================================
  // UI
  // =========================================================================
  var doc = root.document;
  var SS = {
    get: function (k) { try { return root.sessionStorage.getItem(k); } catch (_) { return null; } },
    set: function (k, v) { try { root.sessionStorage.setItem(k, v); } catch (_) {} }
  };
  var K_SEEN = "gcs-chat-seen", K_TEASED = "gcs-chat-teased", K_LOG = "gcs-chat-log";
  var touch = root.matchMedia && root.matchMedia("(pointer: coarse)").matches;
  // Same gate the rest of the site uses for motion: phones and tablets get
  // the quiet button only, never a bubble sliding over content mid-scroll.
  var calm = root.matchMedia && root.matchMedia("(max-width: 800px), (pointer: coarse)").matches;

  var ICON_CHAT = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14.5h4.5"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function el(tag, cls, html) { var n = doc.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  function mount() {
    var rootEl = el("div", "gcs-chat");
    rootEl.setAttribute("data-state", "hidden");

    var teaser = el("div", "gcs-chat-teaser");
    teaser.hidden = true;
    var teaserBody = el("button", "gcs-chat-teaser-body");
    teaserBody.type = "button";
    teaserBody.textContent = "Questions about Genesis or a core conversion? Ask here.";
    var teaserClose = el("button", "gcs-chat-teaser-close", ICON_CLOSE);
    teaserClose.type = "button";
    teaserClose.setAttribute("aria-label", "Dismiss");
    teaser.appendChild(teaserBody); teaser.appendChild(teaserClose);

    var launcher = el("button", "gcs-chat-launcher", ICON_CHAT);
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Ask a question about Genesis Core Systems");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", "gcs-chat-panel");

    // A <div>, not a <section>: the site gives every <section> 4-7rem of
    // vertical padding, which pushed the header into the middle of the panel.
    var panel = el("div", "gcs-chat-panel");
    panel.id = "gcs-chat-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-labelledby", "gcs-chat-title");
    panel.setAttribute("tabindex", "-1");

    var head = el("div", "gcs-chat-head");
    // A <p>, not an <h2>: this widget is on every page and must not add a
    // heading to each page's outline.
    head.innerHTML = '<div><p class="gcs-chat-title" id="gcs-chat-title">Ask Genesis</p>' +
      '<p class="gcs-chat-sub">Automated answers from our published materials</p></div>';
    var closeBtn = el("button", "gcs-chat-close", ICON_CLOSE);
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close chat");
    head.appendChild(closeBtn);

    var logEl = el("div", "gcs-chat-log");
    logEl.setAttribute("role", "log");
    logEl.setAttribute("aria-live", "polite");

    var form = el("form", "gcs-chat-form");
    form.setAttribute("novalidate", "");
    var label = el("label", "gcs-chat-sr", "Your question");
    label.setAttribute("for", "gcs-chat-input");
    var input = el("input", "gcs-chat-input");
    input.id = "gcs-chat-input";
    input.type = "text";
    input.maxLength = 300;
    input.autocomplete = "off";
    input.setAttribute("enterkeyhint", "send");
    input.placeholder = "Ask about Genesis";
    var send = el("button", "gcs-chat-send", ICON_SEND);
    send.type = "submit";
    send.setAttribute("aria-label", "Send");
    form.appendChild(label); form.appendChild(input); form.appendChild(send);

    var foot = el("p", "gcs-chat-foot");
    foot.innerHTML = 'Your questions stay in your browser. For anything bank-specific, email <a href="mailto:' + ENGINE.EMAIL + '">' + ENGINE.EMAIL + '</a>.';

    panel.appendChild(head); panel.appendChild(logEl); panel.appendChild(form); panel.appendChild(foot);
    rootEl.appendChild(teaser); rootEl.appendChild(panel); rootEl.appendChild(launcher);
    doc.body.appendChild(rootEl);
    doc.body.classList.add("has-chat");

    // ---- transcript (survives page-to-page navigation in this tab) -------
    var log = [];
    function load() { try { log = JSON.parse(SS.get(K_LOG) || "[]") || []; } catch (_) { log = []; } }
    load();
    function save() { SS.set(K_LOG, JSON.stringify(log.slice(-30))); }

    function linkify(text, subj) {
      var esc = String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      var q = subj ? "?subject=" + encodeURIComponent(subj) : "";
      return esc
        .replace(/\b([a-z]+@genesiscoresystems\.com)\b/g, '<a href="mailto:$1' + q + '">$1</a>')
        .replace(/\+1 \(914\) 477-CORE/g, '<a href="tel:+19144772673">+1 (914) 477-CORE</a>');
    }

    function chipsFor(ids) {
      var wrap = el("div", "gcs-chips");
      ids.forEach(function (id) {
        var k = ENGINE.byId[id]; if (!k) return;
        var b = el("button", "gcs-chip");
        b.type = "button";
        b.textContent = k.q;
        b.setAttribute("data-intent", id);
        wrap.appendChild(b);
      });
      return wrap;
    }

    function render(m, isLast) {
      if (m.who === "u") {
        var u = el("div", "gcs-msg gcs-msg-user");
        u.textContent = m.text;
        logEl.appendChild(u);
        return;
      }
      var b = el("div", "gcs-msg gcs-msg-bot");
      var p = el("p", null, linkify(m.text, m.subj));
      b.appendChild(p);
      if (m.link) {
        var a = el("a", "gcs-msg-link");
        a.href = m.link[0];
        a.innerHTML = linkify(m.link[1]) + ' <span aria-hidden="true">&rarr;</span>';
        b.appendChild(a);
      }
      logEl.appendChild(b);
      if (isLast && m.chips && m.chips.length) logEl.appendChild(chipsFor(m.chips));
    }

    // Keep the start of the newest answer in view. A short answer scrolls to
    // the bottom (so its chips show); a tall one stops with its first line
    // just under the panel header instead of opening mid-answer.
    function scrollToLatest() {
      var bottom = logEl.scrollHeight - logEl.clientHeight;
      var lastMsg = log[log.length - 1];
      var bots = logEl.querySelectorAll(".gcs-msg-bot"), last = bots[bots.length - 1];
      if (!lastMsg || lastMsg.who !== "b" || !last) { logEl.scrollTop = bottom; return; }
      var top = logEl.scrollTop + last.getBoundingClientRect().top - logEl.getBoundingClientRect().top - 12;
      logEl.scrollTop = Math.max(0, Math.min(bottom, top));
    }

    function redraw() {
      logEl.innerHTML = "";
      log.forEach(function (m, i) { render(m, i === log.length - 1); });
      scrollToLatest();
    }

    function push(m) {
      var old = logEl.querySelector(".gcs-chips");
      if (old) old.remove();
      log.push(m); save();
      render(m, true);
      scrollToLatest();
    }

    function botReply(result) {
      if (result.kind === "answer") {
        var k = ENGINE.byId[result.id];
        push({ who: "b", text: k.a, link: k.link, subj: k.subj, chips: k.next || [] });
        return;
      }
      if (result.kind === "empty") return;
      var r = ENGINE.replies[result.kind] || ENGINE.replies.unsure;
      push({ who: "b", text: r.t, chips: result.kind === "clarify" ? result.options : r.chips });
    }

    function ask(text, intentId) {
      text = String(text || "").trim().slice(0, 300);
      if (!text) return;
      push({ who: "u", text: text });
      botReply(intentId ? { kind: "answer", id: intentId } : ENGINE.classify(text));
    }

    function greet() {
      push({ who: "b", text: ENGINE.replies.greet.t, chips: ENGINE.starters(root.location.pathname) });
    }

    // ---- open / close ---------------------------------------------------
    function open() {
      hideTeaser(true);
      rootEl.setAttribute("data-state", "open");
      panel.hidden = false;
      launcher.setAttribute("aria-expanded", "true");
      if (!log.length) greet(); else redraw();
      if (touch) panel.focus(); else input.focus();
    }
    function close() {
      rootEl.setAttribute("data-state", "ready");
      panel.hidden = true;
      launcher.setAttribute("aria-expanded", "false");
      launcher.focus();
    }

    launcher.addEventListener("click", function () { if (panel.hidden) open(); else close(); });
    closeBtn.addEventListener("click", close);
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); close(); } });
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; ask(v); });
    logEl.addEventListener("click", function (e) {
      var chip = e.target.closest && e.target.closest(".gcs-chip");
      if (chip) { var k = ENGINE.byId[chip.getAttribute("data-intent")]; if (k) ask(k.q, k.id); }
    });

    // Back/forward cache (iOS Safari especially) restores this page with the
    // transcript as it was when the visitor left, so reload it from storage
    // before the next question overwrites what was asked on later pages.
    root.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      load();
      if (!panel.hidden) redraw();
    });

    // ---- teaser ---------------------------------------------------------
    function hideTeaser(remember) {
      teaser.hidden = true;
      if (remember) SS.set(K_TEASED, "1");
    }
    teaserBody.addEventListener("click", open);
    teaserClose.addEventListener("click", function () { hideTeaser(true); });

    // A visitor filling in a form (the contact form or any other) must never
    // have the teaser pop over the field they are typing in.
    var formTouched = false;
    function pageField(t) {
      return t && t.closest && !rootEl.contains(t) && t.closest("form, input, textarea, select");
    }
    doc.addEventListener("focusin", function (e) { if (pageField(e.target)) { formTouched = true; hideTeaser(false); } });
    doc.addEventListener("input", function (e) { if (pageField(e.target)) { formTouched = true; hideTeaser(false); } });

    function cookieBanner() { return doc.getElementById("cookie-banner"); }
    function tease() {
      if (calm || SS.get(K_TEASED) || !panel.hidden) return;
      if (cookieBanner()) return;            // never stack two bottom pop-ups; retried when it closes
      if (doc.getElementById("contact-form") || /^\/contact\/?$/.test(root.location.pathname)) return;
      if (formTouched || pageField(doc.activeElement)) return;
      SS.set(K_TEASED, "1");
      teaser.hidden = false;
    }

    // ---- sit above the cookie banner while it is up ---------------------
    function placeAboveBanner() {
      var b = cookieBanner();
      rootEl.style.setProperty("--gcs-chat-lift", (b ? b.offsetHeight : 0) + "px");
    }
    placeAboveBanner();
    var bannerObs = new MutationObserver(function () {
      placeAboveBanner();
      if (!cookieBanner() && rootEl.getAttribute("data-state") === "ready") setTimeout(tease, 700);
    });
    bannerObs.observe(doc.body, { childList: true });
    root.addEventListener("resize", placeAboveBanner);

    // ---- reveal: pops up once the visitor is scrolling the page ----------
    var revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      SS.set(K_SEEN, "1");
      rootEl.setAttribute("data-state", "ready");
      root.removeEventListener("scroll", onScroll);
      setTimeout(tease, 600);
    }
    function onScroll() {
      var max = doc.documentElement.scrollHeight - root.innerHeight;
      var y = root.scrollY || root.pageYOffset || 0;
      if (y > Math.min(600, Math.max(120, max * 0.25))) reveal();
    }
    if (SS.get(K_SEEN)) {
      reveal();                              // already met it earlier this visit
    } else {
      root.addEventListener("scroll", onScroll, { passive: true });
      setTimeout(reveal, 20000);             // and for visitors who never scroll
    }
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", mount);
  else mount();
})(typeof window !== "undefined" ? window : this);
