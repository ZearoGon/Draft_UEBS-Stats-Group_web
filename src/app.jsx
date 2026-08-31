


const { useState, useEffect, useRef, useMemo, useCallback } = React;

// -------- DATA --------
const COMMITTEE = [
{ initials: "ZC", name: "Dr Zexun Chen", pron: "", role: "Faculty Maintainer", field: "MSBE", year: "", supervisor: "", topic: "Statistical methods for business research", email: "Zexun.Chen@ed.ac.uk", bio: "Dr Zexun Chen leads the Statistics Study Group at the University of Edinburgh Business School, focusing on statistical tools and methods that are extensively used in business school research. He organises discussion sessions and coordinates the group's activities." },
{ initials: "SF", name: "Shiqi Fang", pron: "", role: "PhD Maintainer", field: "MSBE", year: "", supervisor: "", topic: "Gaussian processes, Bayesian methods, Git & GitHub", email: "S.Fang-6@sms.ed.ac.uk", bio: "Shiqi Fang contributes to the group from a management research perspective. He has presented on topics including Git & GitHub, Gaussian Process, and Bayesian Linear Regression, helping bridge statistical methods with management science." },
{ initials: "HS", name: "Heqing Shi", pron: "", role: "PhD Maintainer", field: "FinTech", year: "", supervisor: "", topic: "Covariance estimation, kernel methods, credit scoring", email: "Heqing.Shi@ed.ac.uk", bio: "Heqing Shi focuses on fintech applications, contributing knowledge in high-dimensional covariance matrix estimation and the kernel trick. His research spans credit scoring, risk forecasting, and asset pricing statistical tools." },
{ initials: "YQ", name: "Yifan Qi", pron: "", role: "PhD Maintainer", field: "Accounting & Finance", year: "", supervisor: "", topic: "Econometrics, asset pricing, Fama-MacBeth regression", email: "Y.Qi-18@sms.ed.ac.uk", bio: "Yifan Qi focuses on econometrics and asset pricing. He has presented on Econometrics Foundation and the Fama-MacBeth two-pass regression procedure, a cornerstone methodology for testing asset pricing models in cross-sectional finance research." },
{ initials: "CG", name: "Chenyang Guo", pron: "", role: "PhD Maintainer", field: "MSBE", year: "", supervisor: "", topic: "Sampling methods, change-point detection, MOSUM", email: "C.Guo-17@sms.ed.ac.uk", bio: "Chenyang Guo contributes expertise in statistical sampling and time series analysis. He has presented on Accept-Reject Sampling methods and MOSUM-based change-point detection techniques for identifying structural breaks in financial data." },
{ initials: "YH", name: "Yizhuo Hu", pron: "", role: "PhD Maintainer", field: "FinTech", year: "", supervisor: "", topic: "MLE, propensity score matching, synthetic data", email: "yhu8@ed.ac.uk", bio: "Yizhuo Hu works on statistical estimation and causal inference methods. He has presented on Maximum Likelihood Estimation, Propensity Score Matching, and Synthetic Data generation for financial research applications." },
{ initials: "RT", name: "Runzhi Tian", pron: "", role: "PhD Maintainer", field: "FinTech", year: "", supervisor: "", topic: "AI research agents, Stata & Python integration", email: "R.Tian-6@sms.ed.ac.uk", bio: "Runzhi Tian bridges AI-powered research workflows with traditional econometrics. He co-presented the hands-on workshop on Claude Code × Stata & Python, guiding researchers through building domain-specific AI research agents." },
{ initials: "YJ", name: "Yuyang Jiang", pron: "", role: "PhD Maintainer", field: "MSBE & Finance", year: "", supervisor: "", topic: "AI methods in finance", email: "Y.Jiang-172@sms.ed.ac.uk", bio: "Yuyang Jiang focuses on applying artificial intelligence and machine learning methods to explore financial research questions." }];


// -------- RESEARCH ATLAS DATA --------
// Fields of the knowledge network. Statistics is the trunk ("core");
// every lecture hangs on one branch via its `topic` key.
const TOPICS = [
{ id: "core", label: "Statistics", caption: "The Backbone", x: 600, y: 380, href: "", blurb: "Statistics is the connective tissue of everything we do - the shared language that lets credit researchers argue with asset pricers and econometricians borrow from machine learning. Lectures on research craft and tooling live on the trunk itself." },
{ id: "stat", label: "Statistical Methods", x: 600, y: 150, href: "topics/statistical-methods.html", blurb: "Tests, estimators and sampling schemes - the raw machinery. From maximum likelihood to Gaussian processes and change-point detection, these lectures sharpen the tools every other branch depends on." },
{ id: "econ", label: "Econometrics", x: 265, y: 258, href: "topics/econometrics.html", blurb: "Bridging economics and statistics: identification, causal inference and the foundations of regression. DiD, matching and IV - the grammar of empirical economic arguments." },
{ id: "asset", label: "Asset Pricing", x: 935, y: 258, href: "topics/asset-pricing.html", blurb: "Can returns be predicted in the cross-section? Factor models, Fama-MacBeth regressions and the ongoing hunt for pricing power in stocks, bonds and derivatives." },
{ id: "credit", label: "Credit Research", x: 265, y: 502, href: "topics/credit-research.html", blurb: "Credit scoring, default prediction and the statistics of lending decisions. A growing branch - blog material is up, and the first dedicated lecture is waiting for a speaker." },
{ id: "ai", label: "AI & Machine Learning", x: 935, y: 502, href: "20260313_UEBS%20Statistics%20Study%20group_AI,ML,DL_Business_Overview.html", blurb: "Machine learning, deep learning and AI-powered research workflows - from kernel methods to synthetic data and AI research agents driving Stata & Python." },
{ id: "risk", label: "Risk Management", x: 600, y: 610, href: "topics/risk-management.html", blurb: "Risk forecasting and the high-dimensional statistics behind it - covariance estimation, portfolio risk and the models that keep tail events honest." }];

const EVENTS = [
{ date: "29", month: "May", year: "2026", kicker: "Schedule", title: "Factor Momentum Revisited: Does the 47-Factor Kernel Collapse to BAB and QMJ?", short: "Factor Momentum", topic: "asset", loc: "Conference Room, 4th Floor, UEBS", time: "17:00 - 18:00", cat: "schedule", speaker: "Zhengnan Lu", pdf: "" },
{ date: "27", month: "Mar", year: "2026", kicker: "Schedule", title: "Claude Code × Stata & Python: AI Research Agent", short: "Claude Code × Stata", topic: "ai", loc: "UEBS Boardroom", time: "17:00 - 18:00", cat: "schedule", speaker: "Runzhi Tian, Yifan Qi", pdf: "" },
{ date: "17", month: "Oct", year: "2025", kicker: "Schedule", title: "Synthetic Data", short: "Synthetic Data", topic: "ai", loc: "UEBS Boardroom", time: "17:00 - 18:00", cat: "schedule", speaker: "Yizhuo Hu", pdf: "" },
{ date: "03", month: "Oct", year: "2025", kicker: "Lecture", title: "Bayesian Linear Regression", short: "Bayesian LR", topic: "stat", loc: "UEBS", time: "", cat: "talk", speaker: "Shiqi Fang", pdf: "https://www.dropbox.com/scl/fi/3jz3x5ami44gb44oiwpxp/bayesian-linear-regression.pdf?rlkey=jlyu5rg1nimf9ln1953u0l59j&st=pi203pjt&dl=0" },
{ date: "17", month: "Apr", year: "2025", kicker: "Lecture", title: "Change-Point Detection: MOSUM Methods", short: "MOSUM", topic: "stat", loc: "UEBS", time: "", cat: "talk", speaker: "Chenyang Guo", pdf: "https://www.dropbox.com/scl/fi/9tkoswo22bozi93a6jke1/Statistic_Study_Group_MOSUM.pdf?rlkey=vx4qk4yzfp49akxzugrfrsx8v&st=e2y4mzly&dl=0" },
{ date: "25", month: "Mar", year: "2025", kicker: "Lecture", title: "Gaussian Process", short: "Gaussian Process", topic: "stat", loc: "UEBS", time: "", cat: "talk", speaker: "Shiqi Fang", pdf: "https://www.dropbox.com/scl/fi/kexcpoyhye1cnj1pbt93i/Gaussian_Process.pdf?rlkey=vh228goc3ydcqt156x9yb50h9&st=fc0rvck6&dl=0" },
{ date: "17", month: "Mar", year: "2025", kicker: "Lecture", title: "Asset Pricing: Fama-MacBeth", short: "Fama-MacBeth", topic: "asset", loc: "UEBS", time: "", cat: "talk", speaker: "Yifan Qi", pdf: "https://www.dropbox.com/scl/fi/fb8audgy6o0w186q2r47c/Yifan-Qi_Fama-MacBeth20250317.pdf?rlkey=u6vy48y1eultn2136pa3lcync&st=kcvjvs3l&dl=0" },
{ date: "27", month: "Feb", year: "2025", kicker: "Lecture", title: "Matching Techniques - Propensity Score Matching", short: "PSM", topic: "econ", loc: "UEBS", time: "", cat: "talk", speaker: "YiZhuo Hu", pdf: "https://www.dropbox.com/scl/fi/a643rh9nh9x50asrs8q1i/psm.pdf?rlkey=4nijr2dp2lemecv3sorxyxlux&st=fc7ux3js&dl=0" },
{ date: "13", month: "Feb", year: "2025", kicker: "Lecture", title: "Difference-in-Differences", short: "DiD", topic: "econ", loc: "UEBS", time: "", cat: "talk", speaker: "Ke Bi", pdf: "https://www.dropbox.com/scl/fi/fux8sj0ldcdlmhj8k6s5l/DiD.pdf?rlkey=61ymfgxyzny8l3q4v4skfrtgl&st=v0dtd0vf&dl=0" },
{ date: "30", month: "Jan", year: "2025", kicker: "Lecture", title: "The Kernel Trick", short: "Kernel Trick", topic: "ai", loc: "UEBS", time: "", cat: "talk", speaker: "Heqing Shi", pdf: "https://www.dropbox.com/scl/fi/zu843zmrowdmsqoe3zaql/The_Kernel_Trick.pdf?rlkey=siad2qsrngvwpbjhdbclnrdo9&st=rd3g3j1r&dl=0" },
{ date: "06", month: "Dec", year: "2024", kicker: "Lecture", title: "Maximum Likelihood Estimation", short: "MLE", topic: "stat", loc: "UEBS", time: "", cat: "talk", speaker: "Yizhuo Hu", pdf: "https://www.dropbox.com/scl/fi/f1pt2cokqsllraxqbp7hp/Maximum-Likelihood-Estimation.pdf?rlkey=uwqzcfc3ayx162ct2csrfx6ni&st=h1cfev32&dl=0" },
{ date: "22", month: "Nov", year: "2024", kicker: "Lecture", title: "Git & GitHub", short: "Git & GitHub", topic: "core", loc: "UEBS", time: "", cat: "talk", speaker: "Shiqi Fang", pdf: "https://www.dropbox.com/scl/fi/046ag2pcb8xe82it58zl6/git-and-github.pdf?rlkey=xx8i9gbyamggtsvaoxsn5tw8d&st=rk8jo8rz&dl=0" },
{ date: "08", month: "Nov", year: "2024", kicker: "Lecture", title: "Sampling Method: Accept-Reject Sampling", short: "A-R Sampling", topic: "stat", loc: "UEBS", time: "", cat: "talk", speaker: "Chenyang Guo", pdf: "https://www.dropbox.com/scl/fi/zqshamol6je8l81weyscd/Accept_Reject_Sampling.pdf?rlkey=urw2z6qwfz9cvvc4r91oqjisw&st=bx0r9p4a&dl=0" },
{ date: "25", month: "Oct", year: "2024", kicker: "Lecture", title: "Econometrics Foundation 2", short: "Econometrics II", topic: "econ", loc: "UEBS", time: "", cat: "talk", speaker: "Ke Bi", pdf: "https://www.dropbox.com/scl/fi/11l9de4k067q0pdmfertl/IV.pptx?rlkey=2huic7f23bcvs0zfut7ernmsr&st=ulk4cqym&dl=0" },
{ date: "18", month: "Oct", year: "2024", kicker: "Lecture", title: "Econometrics Foundation 1", short: "Econometrics I", topic: "econ", loc: "UEBS", time: "", cat: "talk", speaker: "Yifan Qi", pdf: "https://www.dropbox.com/scl/fi/a4kh4t1u07wja5dmhgt0a/Econometric-Foundation_Discuss1_Yifan-Qi.pdf?rlkey=jwqwy981fi4j1mrttryjvs8a1&st=k885ao04&dl=0" },
{ date: "26", month: "Sep", year: "2024", kicker: "Lecture", title: "High-dimensional Covariance Matrix Estimation", short: "HD Covariance", topic: "risk", loc: "UEBS", time: "", cat: "talk", speaker: "Heqing Shi", pdf: "https://www.dropbox.com/scl/fi/nq15yeqswst16jt1ytf08/high_dimensional_covariance_matrix_estimation.pdf?rlkey=r9atw5fpoc7wfl1i4w3aiqgit&st=g9t4ty29&dl=0" }];

const eventDate = (e) => new Date(`${e.month} ${e.date}, ${e.year}`);
const EVENTS_SORTED = [...EVENTS].sort((a, b) => eventDate(b) - eventDate(a));

const LOCAL_MATERIALS = {
  "Bayesian Linear Regression": "assets/talks/bayesian%20linear%20regression.pdf",
  "Change-Point Detection: MOSUM Methods": "assets/talks/Statistic_Study_Group_MOSUM.pdf",
  "Gaussian Process": "assets/talks/Gaussian_Process.pdf",
  "Asset Pricing: Fama-MacBeth": "assets/talks/Yifan%20Qi_Fama%20MacBeth20250317.pdf",
  "Matching Techniques - Propensity Score Matching": "assets/talks/psm.pdf",
  "Difference-in-Differences": "assets/talks/DiD.pdf",
  "The Kernel Trick": "assets/talks/The_Kernel_Trick.pdf",
  "Maximum Likelihood Estimation": "assets/talks/Maximum%20Likelihood%20Estimation.pdf",
  "Git & GitHub": "assets/talks/git%20and%20github.pdf",
  "Sampling Method: Accept-Reject Sampling": "assets/talks/Accept_Reject_Sampling.pdf"
};
const materialHref = (title, fallback) => LOCAL_MATERIALS[title] || fallback;


const NEWS = [
{ cat: "Blog", date: "14 Jun 2024", title: "What You Can Get From This Website", excerpt: "The resources from this website are mainly for researchers in the area of finance. We record statistical tools - models, tests and more - into blogs covering credit research, risk management and asset pricing.", img: "archive · group members · 2024", visual: "distribution", cover: "https://pub-2f317f8151d14a0da62cf2e5fb439603.r2.dev/2024.jpg", coverAlt: "Statistics Study Group members, Christmas 2024", href: "#talks" },
{ cat: "Blog", date: "06 Jun 2024", title: "Conference & Workshop Opportunities", excerpt: "A curated list of upcoming conferences and workshops including the 2024 Edinburgh World-Class Workshop on FinTech, Economics of Financial Technology Conference, and the 1st Doctoral Finance Symposium.", img: "events · conferences", visual: "network" },
{ cat: "Lecture", date: "29 May 2026", title: "Factor Momentum Revisited: BAB and QMJ", excerpt: "Zhengnan Lu replicates Ehsani & Linnainmaa (2022, JF) and shows that time-series factor momentum collapses onto just two well-known factors (BAB and QMJ), offering a concentrated view of pricing power.", img: "lecture · factor momentum", visual: "regression", href: "topics/asset-pricing.html" },
{ cat: "Lecture", date: "27 Mar 2026", title: "Claude Code × Stata & Python: AI Research Agent", excerpt: "A hands-on workshop guiding participants through the full setup of an AI-powered Stata & Python research environment. Part of the UEBS Statistics Study Group series bridging econometrics and AI.", img: "workshop · AI coding", visual: "network", href: "20260313_UEBS%20Statistics%20Study%20group_AI,ML,DL_Business_Overview.html" },
{ cat: "Lecture", date: "17 Oct 2025", title: "Synthetic Data in Finance", excerpt: "Exploring how synthetic data helps address privacy concerns, supports model training, and enhances data sharing - while acknowledging limitations in fidelity, validation, and regulatory uncertainty.", img: "lecture · synthetic data", visual: "distribution", href: "20260313_UEBS%20Statistics%20Study%20group_AI,ML,DL_Business_Overview.html" },
{ cat: "Lecture", date: "17 Apr 2025", title: "Change-Point Detection: MOSUM Methods", excerpt: "Chenyang Guo presents MOSUM-based change-point detection methods and their applications in financial time series analysis and structural break identification.", img: "lecture slide · MOSUM methods", visual: "breaks", cover: "assets/covers/mosum-change-point.png", coverAlt: "MOSUM lecture slide showing a time-series change point and its detector", href: "assets/talks/Statistic_Study_Group_MOSUM.pdf" },
{ cat: "Lecture", date: "17 Mar 2025", title: "Asset Pricing: Fama-MacBeth Regression", excerpt: "Yifan Qi walks through the Fama-MacBeth two-pass regression procedure - a cornerstone methodology for testing asset pricing models in cross-sectional finance research.", img: "lecture slide · Fama–MacBeth", visual: "regression", cover: "assets/covers/fama-macbeth.png", coverAlt: "Opening slide from Yifan Qi's Fama-MacBeth asset pricing lecture", href: "assets/talks/Yifan%20Qi_Fama%20MacBeth20250317.pdf" }];


// -------- NAV --------
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("about");
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollFrame = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      if (scrollFrame.current) return;
      scrollFrame.current = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        const sections = ["about", "maintainers", "talks", "posts", "join"];
        let cur = "about";
        for (const id of sections) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top < 140) cur = id;
        }
        setActive(cur);
        scrollFrame.current = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollFrame.current) cancelAnimationFrame(scrollFrame.current);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 900) setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileOpen]);

  const go = (id) => (e) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" });
  };
  return (
    <nav className={"nav" + (scrolled ? " scrolled" : "") + (mobileOpen ? " menu-open" : "")} aria-label="Primary navigation">
        <div className="container nav-inner">
          <a className="brand" href="#top" onClick={(e) => {e.preventDefault();setMobileOpen(false);window.scrollTo({ top: 0, behavior: "smooth" });}} aria-label="Statistics Study Group home">
            <img src="assets/uebs-logo.svg"
          alt="University of Edinburgh Business School"
          className="brand-logo"
          style={{ height: 38, width: 'auto', display: 'block' }} />
            <div className="brand-text">
              <span className="a">Statistics</span>
              <span className="b" style={{ fontFamily: "\"Source Serif 4\"", color: "rgb(2, 2, 2)" }}>STUDY GROUP</span>
            </div>
          </a>
          <div className="nav-links">
            <a href="#about" className={active === "about" ? "active" : ""} onClick={go("about")}>About</a>
            <a href="#maintainers" className={active === "maintainers" ? "active" : ""}
              aria-current={active === "maintainers" ? "location" : undefined} onClick={go("maintainers")}>Maintainers &amp; Contributors</a>
            <a href="#talks" className={active === "talks" ? "active" : ""} onClick={go("talks")}>Research Atlas</a>
            <a href="#posts" className={active === "posts" ? "active" : ""} onClick={go("posts")}>Posts</a>
            <button className="nav-cta" onClick={go("join")}>Join Us</button>
          </div>
          <div className="nav-mobile">
            <button className="nav-menu-btn" type="button" aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen((open) => !open)}>
              <span>{mobileOpen ? "Close" : "Menu"}</span>
              <span className="nav-menu-icon" aria-hidden="true"><i /><i /></span>
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="mobile-menu" id="mobile-navigation">
            <div className="container mobile-menu-inner">
              <a href="#about" className={active === "about" ? "active" : ""} onClick={go("about")}>About</a>
              <a href="#maintainers" className={active === "maintainers" ? "active" : ""}
                aria-current={active === "maintainers" ? "location" : undefined} onClick={go("maintainers")}>Maintainers &amp; Contributors</a>
              <a href="#talks" className={active === "talks" ? "active" : ""} onClick={go("talks")}>Research Atlas</a>
              <a href="#posts" className={active === "posts" ? "active" : ""} onClick={go("posts")}>Posts</a>
              <button type="button" className="mobile-menu-cta" onClick={go("join")}>Join the group</button>
            </div>
          </div>
        )}
      </nav>);

}

// -------- HERO --------
function HeroCarousel() {
  const slides = [
    { src: "https://pub-2f317f8151d14a0da62cf2e5fb439603.r2.dev/2024.jpg",   label: "2024 · Christmas" },
    { src: "https://pub-2f317f8151d14a0da62cf2e5fb439603.r2.dev/2025_1.jpg", label: "2025 · Easter" },
    { src: "https://pub-2f317f8151d14a0da62cf2e5fb439603.r2.dev/2025_2.jpg", label: "2025 · Halloween" },
    { src: "https://pub-2f317f8151d14a0da62cf2e5fb439603.r2.dev/UK%20Finnovator_20260201.jpg", label: "2026 · UK Finnovator Winner · Birmingham" },
    { src: "https://pub-2f317f8151d14a0da62cf2e5fb439603.r2.dev/20270529.jpg", label: "2027 May" },
  ];
  const [i, setI] = useState(0);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const swipeRef = useRef(null);
  const autoPlaying = !prefersReducedMotion && !manuallyPaused && !hoverPaused && !focusPaused && !dragging;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = (event) => setPrefersReducedMotion(event.matches);
    setPrefersReducedMotion(media.matches);
    if (typeof media.addEventListener === "function") media.addEventListener("change", syncPreference);
    else media.addListener(syncPreference);
    return () => {
      if (typeof media.removeEventListener === "function") media.removeEventListener("change", syncPreference);
      else media.removeListener(syncPreference);
    };
  }, []);

  useEffect(() => {
    if (!autoPlaying) return;
    const id = setInterval(() => {
      if (!document.hidden) setI(n => (n + 1) % slides.length);
    }, 5200);
    return () => clearInterval(id);
  }, [autoPlaying, slides.length]);

  const handlePrev = () => {
    setManuallyPaused(true);
    setI(n => (n - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setManuallyPaused(true);
    setI(n => (n + 1) % slides.length);
  };

  const handleSelect = (idx) => {
    setManuallyPaused(true);
    setI(idx);
  };

  const handlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest("button")) return;
    swipeRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    setDragging(true);
    if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId);
  };

  const finishPointerGesture = (event) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    setDragging(false);
    if (!start || start.id !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const threshold = Math.max(44, Math.min(80, event.currentTarget.clientWidth * 0.08));
    if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy) * 1.15) return;
    event.preventDefault();
    if (dx < 0) handleNext();
    else handlePrev();
  };

  const cancelPointerGesture = (event) => {
    swipeRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const counter = `${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;

  return (
    <figure className="hero-carousel" aria-roledescription="carousel" aria-label="Statistics Study Group photo gallery"
      onMouseEnter={() => setHoverPaused(true)} onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setFocusPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusPaused(false); }}
      onPointerDown={handlePointerDown} onPointerUp={finishPointerGesture} onPointerCancel={cancelPointerGesture}
      style={{ margin: 0, touchAction: "pan-y", userSelect: "none" }}>
      {slides.map((s, idx) => (
        <div key={idx}
             className={"slide" + (idx === i ? " active" : "")}
             role="group" aria-roledescription="slide" aria-label={`${idx + 1} of ${slides.length}: ${s.label}`}
             aria-hidden={idx !== i}>
          <img src={s.src} alt={`Statistics Study Group gathering, ${s.label}`}
            loading={idx === 0 ? "eager" : "lazy"} fetchPriority={idx === 0 ? "high" : "auto"} decoding="async" draggable="false"
            onDragStart={(event) => event.preventDefault()}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      ))}
      <button type="button" className="nav-btn prev" onClick={handlePrev} aria-label="Previous photo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button type="button" className="nav-btn next" onClick={handleNext} aria-label="Next photo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      <div className="dots">
        {slides.map((_, idx) => (
          <button type="button" key={idx} className={idx === i ? "on" : ""} onClick={() => handleSelect(idx)}
            aria-label={`Show photo ${idx + 1}: ${slides[idx].label}`} aria-current={idx === i ? "true" : undefined} />
        ))}
      </div>
      <figcaption className="caption">
        <span className="t">{slides[i].label}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span aria-live={autoPlaying ? "off" : "polite"} aria-atomic="true">{counter}</span>
          <button type="button" disabled={prefersReducedMotion}
            aria-label={prefersReducedMotion ? "Automatic slideshow disabled by reduced motion preference" : manuallyPaused ? "Play slideshow" : "Pause slideshow"}
            aria-pressed={manuallyPaused || prefersReducedMotion}
            onClick={() => setManuallyPaused((value) => !value)}
            style={{ color: "inherit", background: "rgba(20,19,15,0.28)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 999, padding: "5px 9px", font: "inherit", letterSpacing: "inherit", cursor: prefersReducedMotion ? "not-allowed" : "pointer" }}>
            {prefersReducedMotion ? "Auto off" : manuallyPaused ? "Play" : "Pause"}
          </button>
        </span>
      </figcaption>
    </figure>
  );
}

function Hero({ variant }) {
  if (variant === "split") {
    return (
      <section className="hero split">
          <div className="hero-probability-field" data-probability-field aria-hidden="true" />
          <div className="container">
            <div className="hero-grid">
              <div className="hero-text">
                <div className="hero-eyebrow">
                  <span className="dot" />
                  <span className="mono">EST. 2024 · STATISTICS FOR BUSINESS SCHOOL RESEARCH</span>
                </div>
                <h1>
                  A community sharing <em>statistics-based knowledge</em> for business school research.
                </h1>
                <p className="hero-sub">
                  UEBS doctoral researchers share statistical methods, seminar materials and practical research knowledge across finance, management and beyond.
                </p>
                <div className="hero-actions" aria-label="Explore the study group">
                  <a className="hero-action primary" href="#talks">Explore the Research Atlas</a>
                  <a className="hero-action secondary" href="#maintainers">Meet the group</a>
                </div>
              </div>
              <HeroCarousel />
            </div>
            <HeroMeta />
          </div>
        </section>);

  }
  return (
    <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">
            <span className="dot" />
            <span className="mono">Est. 2024 · Statistics for Business School Research</span>
          </div>
          <h1>
            A community sharing <em>statistics-based knowledge</em><br />for business school research.
          </h1>
          <p className="hero-sub">
            We are a statistics-based knowledge exchange platform for doctoral research, documenting and sharing methodologies - tests, regression models, and more - extensively used in business school research. All content is contributed by PhD researchers from the University of Edinburgh Business School.
          </p>
          <HeroMeta />
        </div>
      </section>);

}

function HeroMeta() {
  return (
    <div className="hero-meta">
        <div className="cell" title="8 maintainers and 12 contributors; these roles overlap"><div className="k">Maintainers &amp; Contributors</div><div className="v">8 / 12<small>roles overlap</small></div></div>
        <div className="cell"><div className="k">Topics</div><div className="v">5+<small>fields</small></div></div>
        <div className="cell"><div className="k">Lectures</div><div className="v">16<small>sessions</small></div></div>
        <div className="cell"><div className="k">Founded</div><div className="v">2024<small>UEBS</small></div></div>
      </div>);

}

// -------- ABOUT --------
// Schedule & Research Topics moved into the Research Atlas (section 03);
// About now carries the mission alone.
function About() {
  const MISSION = {
    prose: [
    "This website is managed by the UEBS Statistics Group. We are a statistics-based knowledge exchange platform for doctoral research, documenting and sharing methodologies - statistical tests, regression models and more - that are extensively used in business school research. All posts and blogs are contributed by PhD researchers from the University of Edinburgh Business School.",
    "The resources are mainly for researchers in the area of finance. We find it useful to record the statistics-based knowledge we come across into blogs. Topics such as credit scoring, risk forecasting and asset pricing are primarily covered, as these span our current main research interests. We believe these insights are also meaningful to researchers in accounting, marketing, operations research and beyond."],

    list: [
    "In-person discussion sessions",
    "Blog-style statistics-based knowledge",
    "Presentation materials & PDFs",
    "Open to all UEBS researchers",
    "Google Form subscription",
    "GitHub: uebs-stats-group"]

  };
  return (
    <section id="about" className="section">
        <div className="container">
          <div className="section-header reveal">
            <div className="num"><span>01 / 05</span> &nbsp; About</div>
            <h2>A community held together by <em>statistics, seminars, and a shared passion</em> for rigorous research.</h2>
          </div>
          <div className="reveal">
            <div className="about-grid">
              <div className="about-prose">
                {MISSION.prose.map((p, i) => <p key={i}>{p}</p>)}
                <p style={{ marginTop: 24 }}>
                  <a href="#talks" onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById("talks");
                    if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" });
                  }} style={{ color: "var(--accent)", textDecoration: "none", fontFamily: "var(--mono)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--accent)", paddingBottom: 2, fontWeight: 500 }}>
                    Explore the Research Atlas - schedule, topics & lectures →
                  </a>
                </p>
              </div>
              <aside className="about-aside">
                <div className="label">What we do · Our Mission</div>
                <ul>
                  {MISSION.list.map((item, i) =>
                <li key={i}>
                      <span className="n">{String(i + 1).padStart(2, "0")}</span>
                      <span className="t">
                        {item}
                      </span>
                    </li>
                )}
                </ul>
              </aside>
            </div>
          </div>
        </div>
      </section>);

}

// -------- SPEAKERS & CONTRIBUTORS DATA --------
const CONTRIBUTORS = [
{ initials: "ZL", name: "Zhengnan Lu", role: "PhD Contributor", field: "Finance", bio: "Zhengnan Lu is a PhD researcher in Finance, focusing on empirical asset pricing, factor structures, and market anomalies.", lectures: [
  { title: "Factor Momentum Revisited: Does the 47-Factor Kernel Collapse to BAB and QMJ?", date: "29 May 2026", pdf: "" }] },
{ initials: "KB", name: "Ke Bi", role: "PhD Contributor", field: "Economics & Finance", bio: "Ke Bi is a PhD researcher specializing in micro-econometrics, policy evaluation, and causal inference methodologies in business research.", lectures: [
  { title: "Difference-in-Differences", date: "13 Feb 2025", pdf: "https://www.dropbox.com/scl/fi/fux8sj0ldcdlmhj8k6s5l/DiD.pdf?rlkey=61ymfgxyzny8l3q4v4skfrtgl&st=v0dtd0vf&dl=0" },
  { title: "Econometrics Foundation 2", date: "25 Oct 2024", pdf: "https://www.dropbox.com/scl/fi/11l9de4k067q0pdmfertl/IV.pptx?rlkey=2huic7f23bcvs0zfut7ernmsr&st=ulk4cqym&dl=0" }] },
{ initials: "ZC", name: "Dr Zexun Chen", role: "Faculty Maintainer & Organizer", field: "MSBE", bio: "Dr Zexun Chen leads the Statistics Study Group at the University of Edinburgh Business School, focusing on statistical tools and methods that are extensively used in business school research.", lectures: [
  { title: "Study Group Research Methods & Discussions", date: "Continuous", pdf: "" }] },
{ initials: "SF", name: "Shiqi Fang", role: "PhD Maintainer & Speaker", field: "MSBE", bio: "Shiqi Fang is a PhD researcher contributing to the group from a management research perspective, bridging statistical methods with management science.", lectures: [
  { title: "Bayesian Linear Regression", date: "03 Oct 2025", pdf: "https://www.dropbox.com/scl/fi/3jz3x5ami44gb44oiwpxp/bayesian-linear-regression.pdf?rlkey=jlyu5rg1nimf9ln1953u0l59j&st=pi203pjt&dl=0" },
  { title: "Gaussian Process", date: "25 Mar 2025", pdf: "https://www.dropbox.com/scl/fi/kexcpoyhye1cnj1pbt93i/Gaussian_Process.pdf?rlkey=vh228goc3ydcqt156x9yb50h9&st=fc0rvck6&dl=0" },
  { title: "Git & GitHub", date: "22 Nov 2024", pdf: "https://www.dropbox.com/scl/fi/046ag2pcb8xe82it58zl6/git-and-github.pdf?rlkey=xx8i9gbyamggtsvaoxsn5tw8d&st=rk8jo8rz&dl=0" }] },
{ initials: "HS", name: "Heqing Shi", role: "PhD Maintainer & Speaker", field: "FinTech", bio: "Heqing Shi's research focuses on fintech applications, high-dimensional covariance matrix estimation, and credit scoring statistical tools.", lectures: [
  { title: "The Kernel Trick", date: "30 Jan 2025", pdf: "https://www.dropbox.com/scl/fi/zu843zmrowdmsqoe3zaql/The_Kernel_Trick.pdf?rlkey=siad2qsrngvwpbjhdbclnrdo9&st=rd3g3j1r&dl=0" },
  { title: "High-dimensional Covariance Matrix Estimation", date: "26 Sep 2024", pdf: "https://www.dropbox.com/scl/fi/nq15yeqswst16jt1ytf08/high_dimensional_covariance_matrix_estimation.pdf?rlkey=r9atw5fpoc7wfl1i4w3aiqgit&st=g9t4ty29&dl=0" }] },
{ initials: "YQ", name: "Yifan Qi", role: "PhD Maintainer & Speaker", field: "Accounting & Finance", bio: "Yifan Qi focuses on econometrics and empirical asset pricing, particularly cross-sectional return predictability testing.", lectures: [
  { title: "Claude Code × Stata & Python: AI Research Agent", date: "27 Mar 2026", pdf: "" },
  { title: "Asset Pricing: Fama-MacBeth", date: "17 Mar 2025", pdf: "https://www.dropbox.com/scl/fi/fb8audgy6o0w186q2r47c/Yifan-Qi_Fama-MacBeth20250317.pdf?rlkey=u6vy48y1eultn2136pa3lcync&st=kcvjvs3l&dl=0" },
  { title: "Econometrics Foundation 1", date: "18 Oct 2024", pdf: "https://www.dropbox.com/scl/fi/a4kh4t1u07wja5dmhgt0a/Econometric-Foundation_Discuss1_Yifan-Qi.pdf?rlkey=jwqwy981fi4j1mrttryjvs8a1&st=k885ao04&dl=0" }] },
{ initials: "CG", name: "Chenyang Guo", role: "PhD Maintainer & Speaker", field: "MSBE", bio: "Chenyang Guo contributes expertise in statistical sampling methods and change-point detection in financial time series analysis.", lectures: [
  { title: "Change-Point Detection: MOSUM Methods", date: "17 Apr 2025", pdf: "https://www.dropbox.com/scl/fi/9tkoswo22bozi93a6jke1/Statistic_Study_Group_MOSUM.pdf?rlkey=vx4qk4yzfp49akxzugrfrsx8v&st=e2y4mzly&dl=0" },
  { title: "Sampling Method: Accept-Reject Sampling", date: "08 Nov 2024", pdf: "https://www.dropbox.com/scl/fi/zqshamol6je8l81weyscd/Accept_Reject_Sampling.pdf?rlkey=urw2z6qwfz9cvvc4r91oqjisw&st=bx0r9p4a&dl=0" }] },
{ initials: "YH", name: "Yizhuo Hu", role: "PhD Maintainer & Speaker", field: "FinTech", bio: "Yizhuo Hu works on statistical estimation, causal inference, and synthetic data generation for financial research applications.", lectures: [
  { title: "Synthetic Data", date: "17 Oct 2025", pdf: "" },
  { title: "Matching Techniques - Propensity Score Matching", date: "27 Feb 2025", pdf: "https://www.dropbox.com/scl/fi/a643rh9nh9x50asrs8q1i/psm.pdf?rlkey=4nijr2dp2lemecv3sorxyxlux&st=fc7ux3js&dl=0" },
  { title: "Maximum Likelihood Estimation", date: "06 Dec 2024", pdf: "https://www.dropbox.com/scl/fi/f1pt2cokqsllraxqbp7hp/Maximum-Likelihood-Estimation.pdf?rlkey=uwqzcfc3ayx162ct2csrfx6ni&st=h1cfev32&dl=0" }] },
{ initials: "RT", name: "Runzhi Tian", role: "PhD Maintainer & Speaker", field: "FinTech", bio: "Runzhi Tian focuses on bridging AI-powered research workflows with traditional econometric and statistical tools.", lectures: [
  { title: "Claude Code × Stata & Python: AI Research Agent", date: "27 Mar 2026", pdf: "" }] }];

/* ============================================================
   THE PEOPLE, AS A NETWORK
   Ported whole from the design lab (people-lab-galaxy.html): the
   roster additions, the geometry, how the network behaves, and how
   it is drawn. COMMITTEE and CONTRIBUTORS above are its input.
   ============================================================ */
/* ------------------------------------------------------------
   Added 2026-08: three contributors, two visiting PhDs, and one
   member who has joined but not presented yet (she holds a seat).
   Dates for the two new talks were not supplied, so none is shown.
   ------------------------------------------------------------ */
const NEWCOMERS = [
  { initials: "HZ", name: "Han Zhang", kind: "contributor", role: "PhD Contributor", field: "Marketing",
    topic: "Influencer marketing, sponsored content",
    bio: "Han Zhang works on influencer marketing. She brought the group her own published work on the “sponsored content residue” - what a sponsored post leaves behind in how audiences read an influencer’s later, unpaid posts.",
    lectures: [{ title: "The “sponsored content residue” in influencer marketing", date: "27 Feb 2026",
                 venue: "Int. Journal of Research in Marketing · ABS 4", pdf: "" }] },
  { initials: "XY", name: "Xindi Yang", kind: "contributor", role: "PhD Contributor", field: "FinTech",
    topic: "",
    bio: "Xindi Yang brought the group its first speaker from outside the Business School, introducing Zhaoxi Zhang from the School of Mathematics.",
    lectures: [], introduced: "ZX", introducedDate: "13 Feb 2026" },
  { initials: "ZX", name: "Zhaoxi Zhang", kind: "contributor", role: "Guest Speaker", field: "School of Mathematics",
    topic: "",
    bio: "Zhaoxi Zhang is from the School of Mathematics, invited into the group by Xindi Yang.",
    lectures: [{ title: "The generalized underlap coefficient with an application in clustering (evaluating the dependence of a partition on covariates)", date: "13 Feb 2026", pdf: "" }] },
];
/* With the group, but nothing on record yet. They sit on the ring rather than
   in the core, and they are stated plainly - a name and a standing, no more. */
const SEAT_PEOPLE = [
  { slot: 2, initials: "JK", name: "Jiwon Kim",    field: "Finance",        standing: "Member · Finance" },
  { slot: 3, initials: "KZ", name: "Ke Zhang",     field: "Finance",        standing: "Visiting PhD · Finance" },
  { slot: 5, initials: "ZK", name: "Zhikai Zhang", field: "Finance",        standing: "Visiting PhD · Finance" },
  { slot: 6, initials: "GW", name: "Gan Wang",     field: "MSBE & Finance", standing: "Member · MSBE & Finance" },
];
const SEAT_BY_SLOT = new Map(SEAT_PEOPLE.map(p => [p.slot, p]));

const PEOPLE = (() => {
  const byInitials = new Map();
  COMMITTEE.forEach(m => byInitials.set(m.initials, { ...m, kind: "maintainer", lectures: [] }));
  CONTRIBUTORS.forEach(c => {
    const found = byInitials.get(c.initials);
    if (found) { found.lectures = c.lectures || []; found.speakerRole = c.role; }
    else byInitials.set(c.initials, { ...c, kind: "contributor", topic: "", email: "", lectures: c.lectures || [] });
  });
  return [...byInitials.values(), ...NEWCOMERS];
})();
const MAINTAINERS = PEOPLE.filter(p => p.kind === "maintainer");
const GUESTS = PEOPLE.filter(p => p.kind === "contributor");
/* A contributor is anyone with something on record - a lecture given, or a
   speaker brought in. Most maintainers are contributors too; the two lists
   overlap, they do not partition the group. */
const CONTRIBUTORS_ALL = PEOPLE.filter(p => p.lectures.length > 0 || !!p.introduced);
const CONTRIB_SET = new Set(CONTRIBUTORS_ALL.map(p => p.initials));
/* Ties: pairs who work together, drawn as one bright process in the spread
   state, the same weight as an introduction. */
const TIES = [["SF", "KB"]];
const RING = 4;                       // named people on the ring
const LECTURE_COUNT = PEOPLE.reduce((n, p) => n + p.lectures.length, 0);
const NEW_SINCE = new Set(["HZ", "XY", "ZX", "KZ", "ZK", "JK", "GW"]);
/* "Field TBC" is a placeholder, not a research area: it never joins people up */
const NO_FIELD = "Field TBC";
const FIELDS = ["MSBE", "FinTech", "Accounting & Finance", "MSBE & Finance", "Finance",
                "Economics & Finance", "Marketing", "School of Mathematics"];

const noise = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixRGB = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
/* ============================================================
   MANY OPEN SEATS
   One vacancy reads as an afterthought. A ring of them reads as a
   standing invitation - and it is honest: a study group that wants
   to grow has more than one place to fill. All sixteen exist from
   the start; only the first `seatCount` are wired in, so changing
   the number never disturbs the ten people already there.
   ============================================================ */
const MAX_SEATS = 16;
const SEAT_FIELDS = FIELDS.filter(f => f !== NO_FIELD);
const NODES = [
  ...PEOPLE,
  ...Array.from({ length: MAX_SEATS }, (_, k) => ({
    ghost: true, slot: k,
    name: (SEAT_BY_SLOT.get(k) || {}).name || "Your name here?",
    initials: (SEAT_BY_SLOT.get(k) || {}).initials || "+",
    role: (SEAT_BY_SLOT.get(k) || {}).standing || "The next lecture",
    field: "", lectures: [],
    taken: SEAT_BY_SLOT.get(k) || null,
    wants: SEAT_FIELDS[k % SEAT_FIELDS.length],   // what an empty seat is hoping for
  })),
];

/* ============================================================
   GEOMETRY - a neuron is not a dot on a graph
   Processes bow instead of running straight, each soma grows a few
   short dendrites that connect to nothing, and the connected graph
   underneath still guarantees that nobody sits alone.
   ============================================================ */
function buildEdges(nodes) {
  const real = nodes.filter(n => !n.p.ghost);
  const map = new Map();
  const key = (a, b) => a.i < b.i ? a.i + "-" + b.i : b.i + "-" + a.i;
  const add = (a, b, kind) => {
    const k = key(a, b);
    if (!map.has(k)) map.set(k, { a, b, kind, k, ph: noise(a.i * 7 + b.i * 3) * 6.28, bow: (noise(a.i * 5 + b.i * 11) - 0.5) * 0.26 });
  };
  const d2 = (a, b) => (a.sx - b.sx) * (a.sx - b.sx) + (a.sy - b.sy) * (a.sy - b.sy);
  for (let i = 0; i < real.length; i++)
    for (let j = i + 1; j < real.length; j++)
      if (real[i].p.field === real[j].p.field && real[i].p.field !== NO_FIELD)
        add(real[i], real[j], "field");
  // Xindi Yang brought Zhaoxi Zhang in - an edge that records something
  // that actually happened between two people
  real.forEach(a => {
    if (!a.p.introduced) return;
    const b = real.find(x => x.p.initials === a.p.introduced);
    if (b) add(a, b, "intro");
  });
  // ...and the ties: Shiqi Fang and Ke Bi, joined at the same weight
  TIES.forEach(([ia, ib]) => {
    const a = real.find(x => x.p.initials === ia), b = real.find(x => x.p.initials === ib);
    if (a && b) add(a, b, "tie");
  });
  real.forEach(a => {
    real.filter(b => b !== a).sort((x, y) => d2(a, x) - d2(a, y)).slice(0, 2).forEach(b => add(a, b, "web"));
  });
  const parent = {};
  const find = (x) => parent[x] === x ? x : (parent[x] = find(parent[x]));
  real.forEach(n => parent[n.i] = n.i);
  map.forEach(ed => { const ra = find(ed.a.i), rb = find(ed.b.i); if (ra !== rb) parent[ra] = rb; });
  const pairs = [];
  for (let i = 0; i < real.length; i++)
    for (let j = i + 1; j < real.length; j++) pairs.push({ a: real[i], b: real[j], d: d2(real[i], real[j]) });
  pairs.sort((p, q) => p.d - q.d);
  pairs.forEach(p => {
    const ra = find(p.a.i), rb = find(p.b.i);
    if (ra !== rb) { parent[ra] = rb; add(p.a, p.b, "web"); }
  });
  // every open seat hangs off the two people nearest to it: a vacancy is
  // always a vacancy *somewhere*, next to someone
  nodes.filter(n => n.p.ghost && n.active).forEach(seat => {
    real.slice().sort((x, y) => d2(seat, x) - d2(seat, y)).slice(0, 2)
      .forEach(b => add(seat, b, "ghost"));
  });
  return [...map.values()];
}

/* control point of the bowed process, recomputed from live positions */
function ctrl(ed) {
  const ax = ed.a.x, ay = ed.a.y, bx = ed.b.x, by = ed.b.y;
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  const dx = bx - ax, dy = by - ay;
  return [mx - dy * ed.bow, my + dx * ed.bow];
}
function bez(ed, u) {
  const c = ctrl(ed), v = 1 - u;
  return [v * v * ed.a.x + 2 * v * u * c[0] + u * u * ed.b.x,
          v * v * ed.a.y + 2 * v * u * c[1] + u * u * ed.b.y];
}
function strokeProcess(ctx, ed, u0, u1) {
  const c = ctrl(ed);
  if (u0 <= 0 && u1 >= 1) {
    ctx.beginPath(); ctx.moveTo(ed.a.x, ed.a.y);
    ctx.quadraticCurveTo(c[0], c[1], ed.b.x, ed.b.y);
    return;
  }
  const N = 10;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const p = bez(ed, u0 + (u1 - u0) * (i / N));
    if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
  }
}
/* ============================================================
   INTERACTION - how the network behaves
   Every one of these is deliberately slower than a signal you would
   notice out of the corner of your eye. A depolarisation is a wave,
   not a tracer round: it takes about two seconds to cross one
   process, and a soma that has just fired takes another second and
   a half to settle. Nothing here flashes.
   ============================================================ */
const SIG_SPEED = 0.46;          // fraction of a process per second ≈ 2.2s per hop
const MAX_SIG = 40;

function emit(s, from, amp, t, exclude) {
  (s.adj[from.i] || []).forEach(lk => {
    if (s.sig.length >= MAX_SIG) return;
    if (exclude && lk.ed === exclude) return;
    if (lk.other.p.ghost && !s.seatReceives) return;   // only the "listening" seat is wired in
    s.sig.push({
      ed: lk.ed, from, to: lk.other, amp,
      u: lk.ed.a === from ? 0 : 1, dir: lk.ed.a === from ? 1 : -1,
      speed: SIG_SPEED * (0.85 + noise(t * 7 + from.i + lk.other.i) * 0.3),
    });
  });
}
function advance(s, dt, relay, t) {
  for (let i = s.sig.length - 1; i >= 0; i--) {
    const g = s.sig[i];
    g.u += g.dir * g.speed * dt;
    g.ed.act = Math.max(g.ed.act, g.amp * 0.9);
    if (g.u <= 0 || g.u >= 1) {
      s.sig.splice(i, 1);
      g.to.act = Math.max(g.to.act, g.amp);
      s.fired++;
      // the seat receives, but has nobody to pass it on to yet
      if (relay && g.amp > 0.22 && !g.to.p.ghost) emit(s, g.to, g.amp * 0.55, t, g.ed);
    }
  }
}
function relax(s, dt, tauSoma, tauEdge) {
  const ks = Math.exp(-dt / tauSoma), ke = Math.exp(-dt / tauEdge);
  for (const nd of s.nodes) nd.act *= ks;
  for (const ed of s.edges) ed.act *= ke;
}

const BEHAVIOURS = {

resting: {
  label: "Resting", swatch: ["#2A3550", "#4C6690"],
  update(s, dt, t, e) {
    relax(s, dt, 2.4, 1.8);
    if (t > s.next) {
      s.next = t + 3.6 + noise(t * 11) * 2.6;
      const real = s.nodes.filter(n => !n.p.ghost);
      const nd = real[Math.floor(noise(t * 29) * real.length) % real.length];
      nd.act = Math.max(nd.act, 0.38);
      (s.adj[nd.i] || []).forEach(lk => lk.ed.act = Math.max(lk.ed.act, 0.16));
    }
  },
  hover(s, nd) { nd.act = Math.max(nd.act, 0.55); },
},

field: {
  label: "Receptive field", swatch: ["#2C4A46", "#63B9A8"],
  update(s, dt, t, e) {
    const on = s.mouse.on && e > 0.3;
    for (const nd of s.nodes) {
      const d = on ? Math.hypot(nd.x - s.mouse.x, nd.y - s.mouse.y) : 9999;
      // a gentle falloff, or the field collapses to a single soma and reads as nothing
      const target = Math.pow(clamp01(1 - d / 330), 1.4);
      nd.act += (target - nd.act) * Math.min(1, dt * 5);
    }
    for (const ed of s.edges) {
      const target = Math.pow(Math.min(ed.a.act, ed.b.act), 0.7);
      ed.act += (target - ed.act) * Math.min(1, dt * 5);
    }
  },
  hover() {},
},

propagate: {
  label: "Propagation", swatch: ["#33406B", "#8AA6E8"],
  update(s, dt, t, e) {
    relax(s, dt, 1.7, 1.1);
    advance(s, dt, true, t);
    if (e > 0.5 && t > s.next) {
      s.next = t + 7.5 + noise(t * 13) * 4;
      const real = s.nodes.filter(n => !n.p.ghost);
      const nd = real[Math.floor(noise(t * 37) * real.length) % real.length];
      nd.act = 1; emit(s, nd, 0.85, t);
    }
  },
  hover(s, nd, t) {
    if (t - (nd.lastFire || -9) < 1.4) return;
    nd.lastFire = t; nd.act = 1;
    emit(s, nd, 0.9, t);
  },
},

sync: {
  label: "Synchrony", swatch: ["#3A3358", "#A98FE0"],
  update(s, dt, t, e) {
    const w = s.w || 1;
    for (const nd of s.nodes) {
      const ph = t * 0.9 - (nd.x / w) * 2.8 + nd.seed * 0.12;
      const v = 0.5 + 0.5 * Math.sin(ph);
      nd.act = Math.pow(v, 1.7) * (nd.p.ghost ? 0.5 : 1);
    }
    for (const ed of s.edges) ed.act = Math.pow(Math.min(ed.a.act, ed.b.act), 0.7);
  },
  hover(s, nd) { nd.act = Math.min(1, nd.act + 0.4); },
},

plasticity: {
  label: "Plasticity", swatch: ["#4A3A2C", "#D8A46B"],
  update(s, dt, t, e) {
    relax(s, dt, 2.0, 0.9);
    advance(s, dt, false, t);
    let best = null, bw = -1;
    for (const ed of s.edges) {
      const rate = 0.12 + noise(ed.a.i * 3 + ed.b.i * 7) * 0.16;
      const w = 0.5 + 0.5 * Math.sin(t * rate + ed.ph * 2);
      ed.w = w;
      ed.act = Math.max(ed.act, w * 0.55);
      if (w > bw) { bw = w; best = ed; }
    }
    for (const nd of s.nodes) {
      const lks = s.adj[nd.i] || [];
      const m = lks.length ? lks.reduce((a, l) => a + (l.ed.w || 0), 0) / lks.length : 0;
      nd.act = Math.max(nd.act, m * 0.42);
    }
    if (e > 0.5 && t > s.next && best) {
      s.next = t + 4.5 + noise(t * 17) * 3;
      s.sig.push({ ed: best, from: best.a, to: best.b, amp: 0.5, u: 0, dir: 1, speed: SIG_SPEED * 0.72 });
    }
  },
  hover(s, nd) { nd.act = Math.max(nd.act, 0.6); },
},

};
/* ============================================================
   ART - how the same network is drawn
   From a hand-inked histological plate to a journal cover.
   ============================================================ */
const ART = {

deepsky: {
  label: "Deep-sky", paper: false, swatch: ["#04060C", "#FFD9A8", "#9FC4F5"],
  hue: { "MSBE": "#A9DDAE", "FinTech": "#9FC4F5", "Accounting & Finance": "#F5A9A2", "MSBE & Finance": "#D9A6E8", "Finance": "#F7CE90", "Economics & Finance": "#8FDAD6",
         "Marketing": "#F0A8D8", "School of Mathematics": "#B9B0F5" },
  warm: [255, 184, 99],
  bg(ctx, w, h, s, e, t) {
    ctx.globalCompositeOperation = "lighter";
    [[0.22, 0.30, 300, "58,86,150"], [0.74, 0.24, 260, "104,66,138"],
     [0.52, 0.72, 340, "120,64,48"], [0.88, 0.66, 220, "48,92,110"]].forEach((c, i) => {
      const cx = c[0] * w + Math.sin(t * 0.04 + i) * 14, cy = c[1] * h + Math.cos(t * 0.03 + i) * 10;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, c[2]);
      g.addColorStop(0, `rgba(${c[3]},${0.16 * e})`); g.addColorStop(1, `rgba(${c[3]},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, c[2], 0, 6.2832); ctx.fill();
    });
  },
  neuropil(ctx, s, e, t, w, h) {
    ctx.globalCompositeOperation = "lighter";
    for (const d of s.dust) {
      const a = d.a * e * (0.5 + 0.5 * Math.sin(t * d.tw + d.ph));
      if (a <= 0.01) continue;
      ctx.beginPath(); ctx.arc(d.rx * w, d.ry * h, d.r * 1.1, 0, 6.2832);
      ctx.fillStyle = rgba(mixRGB([255, 214, 176], [186, 210, 255], d.ct), a); ctx.fill();
    }
  },
  twig(ctx, nd, col, e, t) {
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 0.8;
    nd.twigs.forEach(tw => {
      const sway = Math.sin(t * 0.5 + tw.ph) * 0.14;
      const a0 = tw.ang + sway, L = tw.len * e;
      ctx.beginPath(); ctx.moveTo(nd.x, nd.y);
      ctx.quadraticCurveTo(nd.x + Math.cos(a0) * L * 0.6 - Math.sin(a0) * tw.curl * L,
                           nd.y + Math.sin(a0) * L * 0.6 + Math.cos(a0) * tw.curl * L,
                           nd.x + Math.cos(a0) * L, nd.y + Math.sin(a0) * L);
      ctx.strokeStyle = rgba(col, 0.10 * e * (0.6 + nd.act * 0.7)); ctx.stroke();
    });
  },
  edge(ctx, ed, col, base, act, e) {
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 0.9 + act * 0.9;
    strokeProcess(ctx, ed, 0, 1);
    ctx.strokeStyle = rgba(col, base + act * 0.34); ctx.stroke();
  },
  signal(ctx, ed, u, amp, col) {
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 2.4;
    strokeProcess(ctx, ed, Math.max(0, u - 0.1), Math.min(1, u + 0.1));
    ctx.strokeStyle = rgba(col, 0.34 * amp); ctx.stroke();
    const p = bez(ed, u);
    const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 15);
    g.addColorStop(0, rgba(col, 0.32 * amp)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], 15, 0, 6.2832); ctx.fill();
  },
  soma(ctx, nd, col, R, act, e, dim, t) {
    ctx.globalCompositeOperation = "lighter";
    if (nd.p.ghost) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R + 3.5, 0, 6.2832);
      ctx.setLineDash([2.5, 3.5]); ctx.lineWidth = 1.1;
      ctx.strokeStyle = rgba(col, e * dim * (0.26 + pulse * 0.24)); ctx.stroke(); ctx.setLineDash([]);
      return;
    }
    const RR = R * (1 + act * 0.52);
    const bl = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, RR * 9);
    bl.addColorStop(0, rgba(col, (0.17 + act * 0.66) * dim));
    bl.addColorStop(0.42, rgba(col, (0.04 + act * 0.09) * dim)); bl.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = bl; ctx.beginPath(); ctx.arc(nd.x, nd.y, RR * 9, 0, 6.2832); ctx.fill();
    if (nd.p.kind === "maintainer" && e > 0.05) {
      const L = RR * 9 * e;
      [0, Math.PI / 2].forEach(rot => {
        ctx.save(); ctx.translate(nd.x, nd.y); ctx.rotate(rot); ctx.scale(1, 0.1);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, L);
        g.addColorStop(0, rgba(col, (0.22 + act * 0.5) * dim)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, L, 0, 6.2832); ctx.fill(); ctx.restore();
      });
    }
    ctx.beginPath(); ctx.arc(nd.x, nd.y, RR * 0.92, 0, 6.2832);
    ctx.fillStyle = rgba(mixRGB(col, [255, 255, 255], 0.55 + act * 0.3), (0.85 + act * 0.15) * dim); ctx.fill();
  },
  nameTag(ctx, nd, a) {
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1.2px";
    ctx.font = '500 9.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = `rgba(206,220,244,${a})`;
    ctx.fillText(nd.p.name.toUpperCase(), nd.x, nd.y + nd.r + 10);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  },
  over(ctx, w, h, s) {
    ctx.globalCompositeOperation = "source-over";
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.05; ctx.drawImage(s.grain(Math.round(w), Math.round(h)), 0, 0, w, h); ctx.globalAlpha = 1;
  },
},

journal: {
  label: "Journal cover", paper: false, swatch: ["#06080F", "#5AD2E0", "#F08A9B"],
  hue: { "MSBE": "#5AD2E0", "FinTech": "#6FA8F0", "Accounting & Finance": "#F08A9B", "MSBE & Finance": "#C77CE0", "Finance": "#FFA56B", "Economics & Finance": "#66C8B4" },
  warm: [255, 176, 120],
  bg(ctx, w, h, s, e, t) {
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(w * 0.5, h * 0.46, 30, w * 0.5, h * 0.46, Math.max(w, h) * 0.62);
    g.addColorStop(0, `rgba(40,70,110,${0.16 * e})`); g.addColorStop(1, "rgba(10,16,30,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  },
  neuropil(ctx, s, e, t, w, h) {
    ctx.globalCompositeOperation = "lighter";
    s.dust.forEach((d, i) => {
      if (i % 3) return;                       // sparse: the cover breathes
      const a = d.a * e * 0.32;
      if (a <= 0.01) return;
      ctx.beginPath(); ctx.arc(d.rx * w, d.ry * h, d.r * 0.8, 0, 6.2832);
      ctx.fillStyle = `rgba(190,214,244,${a})`; ctx.fill();
    });
  },
  twig(ctx, nd, col, e, t) {
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = 0.6;
    nd.twigs.forEach(tw => {
      const a0 = tw.ang + Math.sin(t * 0.4 + tw.ph) * 0.09, L = tw.len * 0.8 * e;
      ctx.beginPath(); ctx.moveTo(nd.x, nd.y);
      ctx.lineTo(nd.x + Math.cos(a0) * L, nd.y + Math.sin(a0) * L);
      ctx.strokeStyle = rgba(col, 0.13 * e * (0.5 + nd.act * 0.6)); ctx.stroke();
    });
  },
  edge(ctx, ed, col, base, act, e) {
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = 0.85 + act * 0.5;
    strokeProcess(ctx, ed, 0, 1);
    ctx.strokeStyle = rgba(col, Math.min(0.9, base * 1.5 + act * 0.5)); ctx.stroke();
  },
  signal(ctx, ed, u, amp, col) {
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = 2; ctx.lineCap = "round";
    strokeProcess(ctx, ed, Math.max(0, u - 0.07), Math.min(1, u + 0.07));
    ctx.strokeStyle = rgba(mixRGB(col, [255, 255, 255], 0.4), 0.85 * amp); ctx.stroke();
    ctx.lineCap = "butt";
  },
  soma(ctx, nd, col, R, act, e, dim, t) {
    ctx.globalCompositeOperation = "source-over";
    if (nd.p.ghost) {
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R + 3, 0, 6.2832);
      ctx.setLineDash([2.5, 3.5]); ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(col, e * dim * 0.4); ctx.stroke(); ctx.setLineDash([]);
      return;
    }
    const RR = R * (1 + act * 0.22);
    ctx.globalCompositeOperation = "lighter";
    const bl = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, RR * 5);
    bl.addColorStop(0, rgba(col, (0.14 + act * 0.30) * dim)); bl.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = bl; ctx.beginPath(); ctx.arc(nd.x, nd.y, RR * 5, 0, 6.2832); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.beginPath(); ctx.arc(nd.x, nd.y, RR, 0, 6.2832);
    ctx.fillStyle = rgba(col, (0.9 + act * 0.1) * dim); ctx.fill();
    if (nd.p.kind === "maintainer") {
      ctx.beginPath(); ctx.arc(nd.x, nd.y, RR + 3.4, 0, 6.2832);
      ctx.lineWidth = 0.8; ctx.strokeStyle = rgba(col, (0.45 + act * 0.4) * dim * e); ctx.stroke();
    }
  },
  nameTag(ctx, nd, a) {
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0.9px";
    ctx.font = '600 9px "Source Sans 3", system-ui, sans-serif';
    ctx.fillStyle = `rgba(222,232,246,${a * 0.95})`;
    ctx.fillText(nd.p.name.toUpperCase(), nd.x, nd.y + nd.r + 10);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  },
  over(ctx, w, h) {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(190,214,244,0.16)"; ctx.lineWidth = 1;
    ctx.strokeRect(16.5, 16.5, w - 33, h - 33);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1.4px";
    ctx.textAlign = "right"; ctx.font = '500 8.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = "rgba(190,214,244,0.5)";
    ctx.fillText("FIG. 1 · FUNCTIONAL CONNECTIVITY, UEBS STATISTICS GROUP (n = " + PEOPLE.length + ")", w - 30, h - 34);
    ctx.textAlign = "center";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  },
},

fluor: {
  label: "Fluorescence", paper: false, swatch: ["#000205", "#6BFF9E", "#FF6BC7"],
  hue: { "MSBE": "#6BFF9E", "FinTech": "#4FD8FF", "Accounting & Finance": "#FF6BC7", "MSBE & Finance": "#C98BFF", "Finance": "#FFE066", "Economics & Finance": "#4FFFE0" },
  warm: [255, 200, 120],
  bg(ctx, w, h, s, e, t) {
    ctx.globalCompositeOperation = "lighter";
    [[0.18, 0.24, 120], [0.82, 0.34, 96], [0.36, 0.80, 140], [0.68, 0.74, 104]].forEach((c, i) => {
      const cx = c[0] * w + Math.sin(t * 0.05 + i) * 6, cy = c[1] * h + Math.cos(t * 0.04 + i) * 5;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, c[2]);
      g.addColorStop(0, `rgba(40,150,90,${0.07 * e})`);
      g.addColorStop(0.6, `rgba(30,110,70,${0.03 * e})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, c[2], 0, 6.2832); ctx.fill();
    });
  },
  neuropil(ctx, s, e, t, w, h) {
    ctx.globalCompositeOperation = "lighter";
    for (const d of s.dust) {
      const a = d.a * e * 0.5 * (0.5 + 0.5 * Math.sin(t * d.tw * 0.5 + d.ph));
      if (a <= 0.01) continue;
      ctx.beginPath(); ctx.arc(d.rx * w, d.ry * h, d.r * 1.3, 0, 6.2832);
      ctx.fillStyle = rgba(mixRGB([80, 255, 160], [255, 110, 200], d.ct), a * 0.55); ctx.fill();
    }
  },
  twig(ctx, nd, col, e, t) {
    ctx.globalCompositeOperation = "lighter";
    nd.twigs.forEach(tw => {
      const a0 = tw.ang + Math.sin(t * 0.45 + tw.ph) * 0.12, L = tw.len * 1.15 * e;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(nd.x, nd.y);
      ctx.quadraticCurveTo(nd.x + Math.cos(a0) * L * 0.6 - Math.sin(a0) * tw.curl * L,
                           nd.y + Math.sin(a0) * L * 0.6 + Math.cos(a0) * tw.curl * L,
                           nd.x + Math.cos(a0) * L, nd.y + Math.sin(a0) * L);
      ctx.strokeStyle = rgba(col, 0.09 * e * (0.5 + nd.act * 0.9)); ctx.stroke();
      ctx.lineWidth = 0.7; ctx.strokeStyle = rgba(mixRGB(col, [255, 255, 255], 0.5), 0.12 * e); ctx.stroke();
    });
  },
  edge(ctx, ed, col, base, act, e) {
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 3.2 + act * 2;
    strokeProcess(ctx, ed, 0, 1);
    ctx.strokeStyle = rgba(col, (base + act * 0.22) * 0.5); ctx.stroke();
    ctx.lineWidth = 1;
    strokeProcess(ctx, ed, 0, 1);
    ctx.strokeStyle = rgba(mixRGB(col, [255, 255, 255], 0.45), base + act * 0.4); ctx.stroke();
  },
  signal(ctx, ed, u, amp, col) {
    ctx.globalCompositeOperation = "lighter";
    const p = bez(ed, u);
    const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 22);
    g.addColorStop(0, rgba(mixRGB(col, [255, 255, 255], 0.5), 0.4 * amp));
    g.addColorStop(0.45, rgba(col, 0.16 * amp)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], 22, 0, 6.2832); ctx.fill();
    ctx.lineWidth = 4;
    strokeProcess(ctx, ed, Math.max(0, u - 0.12), Math.min(1, u + 0.12));
    ctx.strokeStyle = rgba(col, 0.22 * amp); ctx.stroke();
  },
  soma(ctx, nd, col, R, act, e, dim, t) {
    ctx.globalCompositeOperation = "lighter";
    if (nd.p.ghost) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R + 4, 0, 6.2832);
      ctx.setLineDash([2.5, 4]); ctx.lineWidth = 1.2;
      ctx.strokeStyle = rgba(col, e * dim * (0.24 + pulse * 0.22)); ctx.stroke(); ctx.setLineDash([]);
      return;
    }
    const RR = R * (1 + act * 0.42);
    for (const L of [[13, 0.30], [7, 0.30], [3.2, 0.34]]) {
      const g = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, RR * L[0]);
      g.addColorStop(0, rgba(col, (L[1] * (0.5 + act * 0.85)) * dim)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nd.x, nd.y, RR * L[0], 0, 6.2832); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(nd.x, nd.y, RR * 1.05, 0, 6.2832);
    ctx.fillStyle = rgba(mixRGB(col, [255, 255, 255], 0.45 + act * 0.4), (0.8 + act * 0.2) * dim); ctx.fill();
  },
  nameTag(ctx, nd, a) {
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1px";
    ctx.font = '500 9px "IBM Plex Mono", monospace';
    ctx.fillStyle = `rgba(214,240,224,${a * 0.8})`;
    ctx.fillText(nd.p.name.toUpperCase(), nd.x, nd.y + nd.r + 11);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  },
  over(ctx, w, h, s) {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(236,255,244,0.82)";
    ctx.fillRect(w - 118, h - 40, 70, 3);
    ctx.textAlign = "center"; ctx.font = '500 8.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = "rgba(236,255,244,0.6)";
    ctx.fillText("20 μm", w - 83, h - 34);
    ctx.globalAlpha = 0.06; ctx.drawImage(s.grain(Math.round(w), Math.round(h)), 0, 0, w, h); ctx.globalAlpha = 1;
  },
},

golgi: {
  label: "Golgi stain", paper: true, swatch: ["#EFE7D6", "#241C14", "#6B4A2A"],
  hue: { "MSBE": "#2E2A1E", "FinTech": "#26303A", "Accounting & Finance": "#42261E", "MSBE & Finance": "#342840", "Finance": "#4A3A1E", "Economics & Finance": "#20383A" },
  warm: [90, 62, 36],
  bg(ctx, w, h, s, e) {
    ctx.globalCompositeOperation = "multiply";
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 60, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    g.addColorStop(0, "rgba(90,74,54,0)"); g.addColorStop(1, "rgba(90,74,54,0.10)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  },
  neuropil(ctx, s, e, t, w, h) {
    ctx.globalCompositeOperation = "multiply";
    s.dust.forEach((d, i) => {
      if (i % 2) return;
      const a = d.a * e * 0.34;
      if (a <= 0.02) return;
      ctx.beginPath(); ctx.arc(d.rx * w, d.ry * h, d.r * 0.75, 0, 6.2832);
      ctx.fillStyle = `rgba(36,28,20,${a})`; ctx.fill();
    });
  },
  twig(ctx, nd, col, e, t) {
    ctx.globalCompositeOperation = "multiply";
    nd.twigs.forEach((tw, i) => {
      const a0 = tw.ang + Math.sin(t * 0.35 + tw.ph) * 0.05, L = tw.len * 1.25 * e;
      const N = 7;
      for (let k = 0; k < N; k++) {                    // taper: thick at the soma, hair at the tip
        const u0 = k / N, u1 = (k + 1) / N;
        const j = (u) => {
          const x = nd.x + Math.cos(a0) * L * u - Math.sin(a0) * tw.curl * L * Math.sin(Math.PI * u);
          const y = nd.y + Math.sin(a0) * L * u + Math.cos(a0) * tw.curl * L * Math.sin(Math.PI * u);
          return [x + (noise(tw.ph * 9 + u * 13 + i) - 0.5) * 1.1, y + (noise(tw.ph * 5 + u * 7 + i) - 0.5) * 1.1];
        };
        const p0 = j(u0), p1 = j(u1);
        ctx.lineWidth = (1 - u0) * 1.5 + 0.25;
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
        ctx.strokeStyle = rgba(col, (0.42 - u0 * 0.3) * e); ctx.stroke();
      }
    });
    ctx.lineWidth = 1;
  },
  edge(ctx, ed, col, base, act, e) {
    ctx.globalCompositeOperation = "multiply";
    const N = 9;
    for (let k = 0; k < N; k++) {
      const u0 = k / N, u1 = (k + 1) / N;
      const p0 = bez(ed, u0), p1 = bez(ed, u1);
      const taper = 0.55 + 0.45 * Math.sin(Math.PI * ((u0 + u1) / 2));
      ctx.lineWidth = (0.55 + act * 0.9) * taper + 0.25;
      ctx.beginPath();
      ctx.moveTo(p0[0] + (noise(ed.ph * 7 + k) - 0.5) * 0.9, p0[1] + (noise(ed.ph * 3 + k) - 0.5) * 0.9);
      ctx.lineTo(p1[0] + (noise(ed.ph * 7 + k + 1) - 0.5) * 0.9, p1[1] + (noise(ed.ph * 3 + k + 1) - 0.5) * 0.9);
      ctx.strokeStyle = rgba(col, Math.min(0.75, (base * 2.6 + act * 0.5))); ctx.stroke();
    }
    ctx.lineWidth = 1;
  },
  signal(ctx, ed, u, amp, col) {
    ctx.globalCompositeOperation = "multiply";
    ctx.lineWidth = 2.6;
    strokeProcess(ctx, ed, Math.max(0, u - 0.09), Math.min(1, u + 0.09));
    ctx.strokeStyle = rgba(col, 0.55 * amp); ctx.stroke();
    ctx.lineWidth = 1;
  },
  soma(ctx, nd, col, R, act, e, dim, t) {
    ctx.globalCompositeOperation = "multiply";
    if (nd.p.ghost) {
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R + 3, 0, 6.2832);
      ctx.setLineDash([2.5, 3]); ctx.lineWidth = 1;
      ctx.strokeStyle = rgba([150, 60, 40], e * dim * 0.55); ctx.stroke(); ctx.setLineDash([]);
      return;
    }
    const RR = R * (1.5 + act * 0.35);
    const g = ctx.createRadialGradient(nd.x, nd.y, RR * 0.3, nd.x, nd.y, RR * 2.4);
    g.addColorStop(0, rgba(col, (0.85 + act * 0.15) * dim));
    g.addColorStop(0.45, rgba(col, 0.3 * dim)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nd.x, nd.y, RR * 2.4, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(nd.x, nd.y, RR * 0.8, 0, 6.2832);
    ctx.fillStyle = rgba(col, (0.9 + act * 0.1) * dim); ctx.fill();
  },
  nameTag(ctx, nd, a) {
    ctx.globalCompositeOperation = "source-over";
    ctx.font = 'italic 500 11.5px "Source Serif 4", Georgia, serif';
    ctx.fillStyle = `rgba(42,32,22,${Math.min(0.9, a * 1.6)})`;
    ctx.fillText(nd.p.name, nd.x, nd.y + nd.r + 12);
  },
  over(ctx, w, h, s) {
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.05; ctx.drawImage(s.grain(Math.round(w), Math.round(h)), 0, 0, w, h); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.textAlign = "right";
    ctx.font = 'italic 400 10.5px "Source Serif 4", Georgia, serif';
    ctx.fillStyle = "rgba(60,46,32,0.5)";
    ctx.fillText("Pl. I - Réseau de la Société de Statistique, Édimbourg.", w - 30, h - 30);
    ctx.textAlign = "center";
  },
},

tract: {
  label: "Tractography", paper: false, swatch: ["#030308", "#FF5C5C", "#5CFF8A"],
  hue: { "MSBE": "#A9DDAE", "FinTech": "#9FC4F5", "Accounting & Finance": "#F5A9A2", "MSBE & Finance": "#D9A6E8", "Finance": "#F7CE90", "Economics & Finance": "#8FDAD6",
         "Marketing": "#F0A8D8", "School of Mathematics": "#B9B0F5" },
  warm: [255, 190, 130],
  dirCol(ed) {
    const dx = Math.abs(ed.b.x - ed.a.x), dy = Math.abs(ed.b.y - ed.a.y);
    const L = Math.hypot(dx, dy) || 1;
    const h = dx / L, v = dy / L;
    const d = Math.abs(h - v);
    return [60 + h * 195, 60 + v * 195, 90 + (1 - d) * 140];
  },
  bg(ctx, w, h, s, e, t) {},
  neuropil(ctx, s, e, t, w, h) {
    ctx.globalCompositeOperation = "lighter";
    s.dust.forEach((d, i) => {
      if (i % 4) return;
      const a = d.a * e * 0.22;
      if (a <= 0.01) return;
      ctx.beginPath(); ctx.arc(d.rx * w, d.ry * h, d.r * 0.7, 0, 6.2832);
      ctx.fillStyle = `rgba(200,215,240,${a})`; ctx.fill();
    });
  },
  twig(ctx, nd, col, e, t) {
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 2.4;
    nd.twigs.forEach(tw => {
      const a0 = tw.ang + Math.sin(t * 0.4 + tw.ph) * 0.1, L = tw.len * 0.9 * e;
      const c = [60 + Math.abs(Math.cos(a0)) * 195, 60 + Math.abs(Math.sin(a0)) * 195, 120];
      ctx.beginPath(); ctx.moveTo(nd.x, nd.y);
      ctx.quadraticCurveTo(nd.x + Math.cos(a0) * L * 0.6 - Math.sin(a0) * tw.curl * L,
                           nd.y + Math.sin(a0) * L * 0.6 + Math.cos(a0) * tw.curl * L,
                           nd.x + Math.cos(a0) * L, nd.y + Math.sin(a0) * L);
      ctx.strokeStyle = rgba(c, 0.07 * e * (0.5 + nd.act * 0.8)); ctx.stroke();
    });
    ctx.lineWidth = 1;
  },
  edge(ctx, ed, col, base, act, e) {
    ctx.globalCompositeOperation = "lighter";
    const c = ART.tract.dirCol(ed);
    ctx.lineCap = "round";
    ctx.lineWidth = 6 + act * 3;
    strokeProcess(ctx, ed, 0, 1);
    ctx.strokeStyle = rgba(c, (base + act * 0.22) * 1.5); ctx.stroke();
    ctx.lineWidth = 1.8;
    strokeProcess(ctx, ed, 0, 1);
    ctx.strokeStyle = rgba(mixRGB(c, [255, 255, 255], 0.35), Math.min(0.9, base * 3 + act * 0.5)); ctx.stroke();
    ctx.lineCap = "butt"; ctx.lineWidth = 1;
  },
  signal(ctx, ed, u, amp, col) {
    ctx.globalCompositeOperation = "lighter";
    const c = mixRGB(ART.tract.dirCol(ed), [255, 255, 255], 0.55);
    ctx.lineCap = "round"; ctx.lineWidth = 6;
    strokeProcess(ctx, ed, Math.max(0, u - 0.11), Math.min(1, u + 0.11));
    ctx.strokeStyle = rgba(c, 0.30 * amp); ctx.stroke();
    ctx.lineCap = "butt"; ctx.lineWidth = 1;
  },
  soma(ctx, nd, col, R, act, e, dim, t) {
    ctx.globalCompositeOperation = "lighter";
    if (nd.p.ghost) {
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R + 3, 0, 6.2832);
      ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
      ctx.strokeStyle = rgba([210, 220, 240], e * dim * 0.45); ctx.stroke(); ctx.setLineDash([]);
      return;
    }
    const RR = R * (0.85 + act * 0.3);
    const g = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, RR * 5);
    g.addColorStop(0, rgba([235, 242, 255], (0.16 + act * 0.3) * dim)); g.addColorStop(1, rgba([235, 242, 255], 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nd.x, nd.y, RR * 5, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(nd.x, nd.y, RR * 0.85, 0, 6.2832);
    ctx.fillStyle = rgba(mixRGB([245, 248, 255], col, 0.35), (0.9 + act * 0.1) * dim); ctx.fill();
  },
  nameTag(ctx, nd, a) {
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0.9px";
    ctx.font = '500 9px "IBM Plex Mono", monospace';
    ctx.fillStyle = `rgba(226,234,250,${a * 0.85})`;
    ctx.fillText(nd.p.name.toUpperCase(), nd.x, nd.y + nd.r + 10);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  },
  over(ctx, w, h) {
    ctx.globalCompositeOperation = "source-over";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1.2px";
    ctx.textAlign = "right"; ctx.font = '500 8.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = "rgba(210,220,244,0.45)";
    ctx.fillText("DIRECTION-ENCODED · R: L-R   G: A-P   B: OBLIQUE", w - 30, h - 32);
    ctx.textAlign = "center";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  },
},

};

/* The empty seat needs a colour that is nobody's field colour, or it just
   reads as an eleventh person. Warm against the cool palettes, vermilion
   on the ink plate. */
const SEAT_COL = {
  deepsky: "#FFC978", journal: "#FF9E7A", fluor: "#FFF0A0",
  golgi: "#B0392C", tract: "#FFD48A",
};
Object.values(ART).forEach(P => {
  P.tint = {};
  FIELDS.forEach(f => P.tint[f] = hex2rgb(P.hue[f] || P.hue[FIELDS[0]]));
  P.ghostRGB = P.paper ? [150, 60, 40] : [226, 234, 250];
});
Object.keys(ART).forEach(k => { ART[k].seatRGB = hex2rgb(SEAT_COL[k]); });

/* ============================================================
   THE OPEN SEAT - five ways to say "this place is kept for you"
   A thin dashed ring at 25% opacity disappears on every one of the
   dark grounds, and carries no meaning even when you do catch it.
   Each treatment below raises the contrast AND says what it is.
   ============================================================ */
function seatCaption(ctx, nd, P, a, big, small, colOverride) {
  ctx.globalCompositeOperation = "source-over";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  const col = colOverride || P.seatRGB;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "1.4px";
  ctx.font = '600 8.5px "IBM Plex Mono", monospace';
  ctx.fillStyle = rgba(col, a);
  ctx.fillText(big, nd.x, nd.y + 17);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  if (small) {
    ctx.font = 'italic 400 11px "Source Serif 4", Georgia, serif';
    ctx.fillStyle = rgba(P.paper ? [90, 70, 50] : [226, 234, 250], a * 0.72);
    ctx.fillText(small, nd.x, nd.y + 29);
  }
}

const SEAT = {

beacon: {
  label: "Beacon",
  draw(ctx, nd, P, e, t, s, dim, cap) {
    const col = P.seatRGB, pulse = 0.5 + 0.5 * Math.sin(t * 1.5);
    const R = 11;
    ctx.globalCompositeOperation = P.paper ? "multiply" : "lighter";
    if (!P.paper) {
      const g = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, R * 3.2);
      g.addColorStop(0, rgba(col, (0.18 + pulse * 0.22) * e * dim));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nd.x, nd.y, R * 3.2, 0, 6.2832); ctx.fill();
    }
    ctx.save();
    ctx.setLineDash([5, 5]); ctx.lineDashOffset = -t * 9;
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = rgba(col, (0.55 + pulse * 0.35) * e * dim);
    ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, 6.2832); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(nd.x, nd.y, 2.2, 0, 6.2832);
    ctx.fillStyle = rgba(col, (0.6 + pulse * 0.3) * e * dim); ctx.fill();
  },
},

labelled: {
  label: "Labelled",
  draw(ctx, nd, P, e, t, s, dim, cap) {
    const taken = nd.p.taken;
    // a seat with a name on it keeps a solid rim and its owner's colour;
    // an empty one keeps the dashes
    const col = taken ? mixRGB(P.tint[taken.field] || P.seatRGB, P.seatRGB, 0.3) : P.seatRGB;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.5);
    const R = 9.5;
    ctx.globalCompositeOperation = P.paper ? "multiply" : "lighter";
    if (!P.paper) {
      const g = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, R * 3.1);
      g.addColorStop(0, rgba(col, ((taken ? 0.13 : 0.14) + pulse * 0.13) * e * dim));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nd.x, nd.y, R * 3.1, 0, 6.2832); ctx.fill();
    }
    if (taken) {
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = rgba(col, (0.5 + pulse * 0.1) * e * dim);
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.arc(nd.x, nd.y, 2.2, 0, 6.2832);
      ctx.fillStyle = rgba(col, 0.62 * e * dim); ctx.fill();
    } else {
      ctx.setLineDash([4, 4]); ctx.lineWidth = 1.6;
      ctx.strokeStyle = rgba(col, (0.6 + pulse * 0.25) * e * dim);
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, 6.2832); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (cap) {
      if (taken) seatCaption(ctx, nd, P, 0.58 * e * dim, taken.name, null, col);
      else if (nd.p.slot === 0)
        seatCaption(ctx, nd, P, 0.85 * e * dim, "JOIN US", "a place is always kept open");
      else seatCaption(ctx, nd, P, 0.62 * e * dim, "OPEN", null);
    }
  },
},

cone: {
  label: "Growth cone",
  draw(ctx, nd, P, e, t, s, dim, cap) {
    const col = P.seatRGB;
    ctx.globalCompositeOperation = P.paper ? "multiply" : "lighter";
    if (!P.paper) {
      const g = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, 26);
      g.addColorStop(0, rgba(col, 0.26 * e * dim));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nd.x, nd.y, 26, 0, 6.2832); ctx.fill();
    }
    // filopodia: each reaches out and draws back on its own slow cycle
    const N = 7;
    for (let i = 0; i < N; i++) {
      const base = (i / N) * 6.2832 + Math.sin(t * 0.13 + i) * 0.22;
      const ext = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.62 + i * 1.9));
      const L = (14 + noise(i * 3.3) * 17) * ext;
      const curl = (noise(i * 7.1) - 0.5) * 0.5;
      const ex = nd.x + Math.cos(base) * L, ey = nd.y + Math.sin(base) * L;
      const K = 5;
      for (let k = 0; k < K; k++) {
        const u0 = k / K, u1 = (k + 1) / K;
        const pt = (u) => [
          nd.x + Math.cos(base) * L * u - Math.sin(base) * curl * L * Math.sin(Math.PI * u),
          nd.y + Math.sin(base) * L * u + Math.cos(base) * curl * L * Math.sin(Math.PI * u)];
        const p0 = pt(u0), p1 = pt(u1);
        ctx.lineWidth = (1 - u0) * 1.5 + 0.3;
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
        ctx.strokeStyle = rgba(col, (0.62 - u0 * 0.32) * ext * e * dim); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(ex, ey, 1.5, 0, 6.2832);           // the sensing tip
      ctx.fillStyle = rgba(col, 0.7 * ext * e * dim); ctx.fill();
    }
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(nd.x, nd.y, 4.2, 0, 6.2832);
    ctx.fillStyle = rgba(col, 0.78 * e * dim); ctx.fill();
    if (cap) seatCaption(ctx, nd, P, 0.6 * e * dim, "GROWING", null);
  },
},

reticle: {
  label: "Reticle",
  draw(ctx, nd, P, e, t, s, dim, cap) {
    const col = P.seatRGB, R = 13;
    ctx.globalCompositeOperation = P.paper ? "multiply" : "source-over";
    const a = e * dim;
    ctx.strokeStyle = rgba(col, 0.75 * a); ctx.lineWidth = 1.4;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => {          // corner ticks
      ctx.beginPath();
      ctx.moveTo(nd.x + c[0] * R, nd.y + c[1] * R - c[1] * 5);
      ctx.lineTo(nd.x + c[0] * R, nd.y + c[1] * R);
      ctx.lineTo(nd.x + c[0] * R - c[0] * 5, nd.y + c[1] * R);
      ctx.stroke();
    });
    ctx.lineWidth = 1.6;                                          // the sweep
    const sw = t * 0.9 % 6.2832;
    ctx.beginPath(); ctx.arc(nd.x, nd.y, R - 4, sw, sw + 1.5);
    ctx.strokeStyle = rgba(col, 0.85 * a); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(col, 0.5 * a);
    ctx.beginPath();
    ctx.moveTo(nd.x - 4, nd.y); ctx.lineTo(nd.x + 4, nd.y);
    ctx.moveTo(nd.x, nd.y - 4); ctx.lineTo(nd.x, nd.y + 4);
    ctx.stroke();
    if (cap) seatCaption(ctx, nd, P, 0.7 * a, "RESERVED", null);
  },
},

receiving: {
  label: "Already receiving",
  receives: true,
  draw(ctx, nd, P, e, t, s, dim, cap) {
    const col = P.seatRGB, act = clamp01(nd.act);
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.5);
    const R = 10 + act * 5;
    ctx.globalCompositeOperation = P.paper ? "multiply" : "lighter";
    if (!P.paper) {
      const g = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, R * (2.6 + act * 3));
      g.addColorStop(0, rgba(col, (0.16 + pulse * 0.12 + act * 0.6) * e * dim));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R * (2.6 + act * 3), 0, 6.2832); ctx.fill();
    }
    ctx.setLineDash([4.5, 4.5]); ctx.lineDashOffset = -t * 7;
    ctx.lineWidth = 1.6 + act * 1.4;
    ctx.strokeStyle = rgba(col, (0.5 + pulse * 0.2 + act * 0.4) * e * dim);
    ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, 6.2832); ctx.stroke();
    ctx.setLineDash([]);
    if (act > 0.03) {                                             // the arriving ring
      const rr = R + (1 - act) * 22;
      ctx.lineWidth = 1.4 * act;
      ctx.strokeStyle = rgba(col, act * 0.55 * e * dim);
      ctx.beginPath(); ctx.arc(nd.x, nd.y, rr, 0, 6.2832); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(nd.x, nd.y, 2.4 + act * 3, 0, 6.2832);
    ctx.fillStyle = rgba(col, (0.55 + act * 0.45) * e * dim); ctx.fill();
    ctx.lineWidth = 1;
    if (cap) seatCaption(ctx, nd, P, (0.55 + act * 0.4) * e * dim, "LISTENING", null);
  },
},

};
const SEAT_ORDER = ["cone", "labelled", "beacon", "reticle", "receiving"];
const SEAT_COUNTS = [1, 4, 8, 16];
/* the open seat has no field, so never look its colour up in the tint table */
const tintOf = (P, nd) => nd.p.ghost ? P.ghostRGB : P.tint[nd.p.field];


/* ============================================================
   GATHER - what "one flame" actually looks like
   Drawn behind the people, at strength k = 1 - spread, so it
   swells as the group closes in and is gone once they scatter.
   ============================================================ */
const GATHER = {

beacon: {
  label: "Beacon", sub: "a light on a dark road",
  note: "The group as something that lights the way. Two beams sweep out of the cluster, the ground below catches a warm pool of light, and everything outside the reach of the beam is pushed further into the dark than it would otherwise be - the darkness is part of the picture, not just the background.",
  draw(ctx, w, h, s, k, t, cx, cy) {
    // push the dark back first, so the light has something to push against
    ctx.globalCompositeOperation = "source-over";
    const d = ctx.createRadialGradient(cx, cy, 40, cx, cy, Math.max(w, h) * 0.8);
    d.addColorStop(0, "rgba(0,0,0,0)");
    d.addColorStop(1, `rgba(0,0,0,${0.55 * k})`);
    ctx.fillStyle = d; ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "lighter";
    const L = Math.max(w, h) * 1.15, rot = t * 0.38;
    for (let i = 0; i < 2; i++) {
      const a = rot + i * Math.PI, spread = 0.26 + Math.sin(t * 0.7 + i) * 0.04;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, L);
      g.addColorStop(0, `rgba(255,222,168,${0.30 * k})`);
      g.addColorStop(0.28, `rgba(255,184,96,${0.11 * k})`);
      g.addColorStop(1, "rgba(255,150,60,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, L, a - spread, a + spread); ctx.closePath(); ctx.fill();
    }
    // the pool of light on the ground
    const p = ctx.createRadialGradient(cx, cy + 52, 0, cx, cy + 52, 300);
    p.addColorStop(0, `rgba(255,206,140,${0.20 * k})`);
    p.addColorStop(1, "rgba(255,170,80,0)");
    ctx.save(); ctx.translate(cx, cy + 52); ctx.scale(1, 0.30); ctx.translate(-cx, -(cy + 52));
    ctx.fillStyle = p; ctx.beginPath(); ctx.arc(cx, cy + 52, 300, 0, 6.2832); ctx.fill(); ctx.restore();
    // the lamp itself
    const c = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
    c.addColorStop(0, `rgba(255,246,224,${0.55 * k})`);
    c.addColorStop(0.3, `rgba(255,198,120,${0.22 * k})`);
    c.addColorStop(1, "rgba(255,160,70,0)");
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, 120, 0, 6.2832); ctx.fill();
  },
},

fusion: {
  label: "Fusion", sub: "power, held together",
  note: "A plasma core: white at the centre, cyan through the corona, with magnetic loops turning around it and shock fronts leaving every second or so. Matter falls inwards along spirals and is consumed. This is the reading that says the group is not just warm but <b>energetic</b> - something is being released here.",
  init(g) {
    g.rings = [];
    g.inf = Array.from({ length: 46 }, (_, i) => ({ a: noise(i * 3.1) * 6.28, r: 90 + noise(i * 7.7) * 190, sp: 0.5 + noise(i * 2.3) * 0.9 }));
    g.last = 0;
  },
  draw(ctx, w, h, s, k, t, cx, cy) {
    const g = s.gfx.fusion;
    ctx.globalCompositeOperation = "lighter";
    // shock fronts
    if (t - g.last > 0.85) { g.last = t; g.rings.push({ born: t }); }
    for (let i = g.rings.length - 1; i >= 0; i--) {
      const age = (t - g.rings[i].born) / 2.6;
      if (age >= 1) { g.rings.splice(i, 1); continue; }
      const r = 24 + age * 250, a = (1 - age) * (1 - age) * 0.5 * k;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832);
      ctx.lineWidth = 2.6 * (1 - age); ctx.strokeStyle = `rgba(150,220,255,${a})`; ctx.stroke();
    }
    // infalling matter
    g.inf.forEach((p, i) => {
      p.a += p.sp * 0.014; p.r -= p.sp * 0.55;
      if (p.r < 26) { p.r = 200 + noise(i * 5.5 + t) * 120; }
      const x = cx + Math.cos(p.a) * p.r, y = cy + Math.sin(p.a) * p.r * 0.86;
      const a = k * (1 - p.r / 320) * 0.8;
      if (a <= 0.02) return;
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, 6.2832);
      ctx.fillStyle = `rgba(190,235,255,${a})`; ctx.fill();
    });
    // magnetic loops
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      const rot = t * 0.22 + i * 0.9, rr = 46 + i * 15;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * 0.30, 0, 0, 6.2832);
      ctx.strokeStyle = `rgba(120,200,255,${0.16 * k})`; ctx.stroke(); ctx.restore();
    }
    // the core
    [[150, "60,140,255", 0.16], [84, "120,215,255", 0.28], [40, "220,248,255", 0.5], [15, "255,255,255", 0.85]]
      .forEach(([r, c, a]) => {
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gr.addColorStop(0, `rgba(${c},${a * k * (0.9 + 0.1 * Math.sin(t * 9))})`);
        gr.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
      });
  },
},

galaxy: {
  label: "Galaxy", sub: "a system, not a crowd",
  note: "Two logarithmic arms wound around a bright bulge, turning differentially - the inside faster than the rim, the way a real disc does. It is the reading for <b>scale</b>: not ten people standing close together but a structure with a centre, arms and an outskirt, of which the named somas are only the brightest members.",
  init(g) {
    g.d = Array.from({ length: 1700 }, (_, i) => {
      const arm = i % 2, u = noise(i * 1.7);
      const r = 22 + Math.pow(u, 0.8) * 300;
      // the arm loosens as it goes out, the way a real one does
      const spread = 0.26 + 130 / r;
      const th = Math.log(r / 20) * 3.6 + arm * Math.PI + (noise(i * 5.3) - 0.5) * spread;
      return { r, th, s: 0.35 + noise(i * 3.9) * 0.95, a: 0.25 + noise(i * 8.1) * 0.6, warm: noise(i * 2.7) };
    });
  },
  draw(ctx, w, h, s, k, t, cx, cy) {
    const g = s.gfx.galaxy;
    ctx.globalCompositeOperation = "lighter";
    // the disc it all sits in
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.35); ctx.scale(1, 0.42);
    const dg = ctx.createRadialGradient(0, 0, 20, 0, 0, 330);
    dg.addColorStop(0, `rgba(130,160,230,${0.17 * k})`);
    dg.addColorStop(0.55, `rgba(100,125,200,${0.07 * k})`);
    dg.addColorStop(1, "rgba(60,80,150,0)");
    ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(0, 0, 330, 0, 6.2832); ctx.fill();
    ctx.restore();

    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.35); ctx.scale(1, 0.42);
    g.d.forEach(p => {
      const th = p.th + t * (2.2 / Math.pow(p.r, 0.55));   // differential rotation
      const x = Math.cos(th) * p.r, y = Math.sin(th) * p.r;
      const col = p.warm > 0.72 ? "255,208,150" : p.warm > 0.4 ? "205,220,255" : "150,180,255";
      const fade = 1 - p.r / 400;                       // the rim thins out
      ctx.beginPath(); ctx.arc(x, y, p.s, 0, 6.2832);
      ctx.fillStyle = `rgba(${col},${p.a * k * fade})`; ctx.fill();
    });
    ctx.restore();

    // the bulge
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.35); ctx.scale(1, 0.66);
    [[110, "255,214,150", 0.16], [58, "255,236,196", 0.26], [22, "255,252,242", 0.5]].forEach(([r, c, a]) => {
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      gr.addColorStop(0, `rgba(${c},${a * k})`); gr.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
    });
    ctx.restore();
  },
},

supernova: {
  label: "Supernova", sub: "the moment it ignites",
  note: "Not a steady flame but a repeating detonation: every three and a half seconds the core flashes white, a shell leaves it and thins as it goes, and a crown of rays fires outward. The most dramatic of the five - it makes the gathered state an <b>event</b> rather than a condition, so it wants to be seen once rather than looped in the corner of a page.",
  draw(ctx, w, h, s, k, t, cx, cy) {
    const P = 3.4, p = (t % P) / P;
    const ease = 1 - Math.pow(1 - p, 2.6);
    ctx.globalCompositeOperation = "lighter";
    // rays
    const flash = Math.max(0, 1 - p * 9);
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * 6.2832 + t * 0.05;
      const len = (60 + noise(i * 3.3) * 300) * ease;
      const al = (1 - p) * (1 - p) * (0.10 + noise(i * 7.1) * 0.16) * k;
      if (al <= 0.01) continue;
      const gx = cx + Math.cos(a) * len, gy = cy + Math.sin(a) * len;
      const g = ctx.createLinearGradient(cx, cy, gx, gy);
      g.addColorStop(0, `rgba(255,242,220,${al})`);
      g.addColorStop(1, "rgba(200,140,255,0)");
      ctx.strokeStyle = g; ctx.lineWidth = 1 + noise(i * 2.1) * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(gx, gy); ctx.stroke();
    }
    // the shell
    const R = 20 + ease * 330;
    const sh = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
    sh.addColorStop(0, "rgba(180,120,255,0)");
    sh.addColorStop(0.75, `rgba(190,150,255,${(1 - p) * 0.20 * k})`);
    sh.addColorStop(0.95, `rgba(255,235,255,${(1 - p) * 0.34 * k})`);
    sh.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
    // the core, brightest at the instant of ignition
    [[130, "255,170,120", 0.18], [64, "255,226,190", 0.3], [24, "255,255,255", 0.55 + flash * 0.45]]
      .forEach(([r, c, a]) => {
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * (1 + flash * 0.5));
        gr.addColorStop(0, `rgba(${c},${a * k})`); gr.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, r * (1 + flash * 0.5), 0, 6.2832); ctx.fill();
      });
  },
},

forge: {
  label: "Forge", sub: "kept burning",
  note: "The warmest and least astronomical: a molten pool turning over on itself, heat shimmer rising off it in bands, and a heavy fall of sparks. Where Fusion is power and Galaxy is scale, this one is simply <b>work</b> - something is being made here, and somebody has been keeping it lit.",
  init(g) {
    g.em = Array.from({ length: 110 }, (_, i) => ({ x: 0, y: 0, vy: 0, vx: 0, life: noise(i * 9.1), r: 0, seed: noise(i * 6.3) }));
  },
  draw(ctx, w, h, s, k, t, cx, cy) {
    const g = s.gfx.forge;
    ctx.globalCompositeOperation = "lighter";
    // the pool
    for (let i = 0; i < 7; i++) {
      const a0 = i * 1.4 + t * 0.5;
      const rr = (58 + i * 20) * (0.9 + 0.1 * Math.sin(t * 1.7 + i));
      const bx = cx + Math.cos(a0) * 26, by = cy + Math.sin(a0 * 1.3) * 14;
      const c = i % 2 ? "255,120,40" : "255,180,80";
      const gr = ctx.createRadialGradient(bx, by, 0, bx, by, rr);
      gr.addColorStop(0, `rgba(${c},${0.16 * k})`);
      gr.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(bx, by, rr, rr * 0.72, 0, 0, 6.2832); ctx.fill();
    }
    const wc = ctx.createRadialGradient(cx, cy, 0, cx, cy, 46);
    wc.addColorStop(0, `rgba(255,248,225,${0.55 * k})`);
    wc.addColorStop(1, "rgba(255,190,90,0)");
    ctx.fillStyle = wc; ctx.beginPath(); ctx.arc(cx, cy, 46, 0, 6.2832); ctx.fill();
    // heat shimmer
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const y = cy - 40 - i * 26, ph = t * 1.1 + i;
      ctx.beginPath();
      for (let x = cx - 150; x <= cx + 150; x += 10)
        ctx.lineTo(x, y + Math.sin(x * 0.035 + ph) * 5);
      ctx.strokeStyle = `rgba(255,190,120,${0.07 * k * (1 - i / 8)})`; ctx.stroke();
    }
    // sparks
    g.em.forEach((e, i) => {
      e.life -= 0.008;
      if (e.life <= 0) {
        e.life = 1;
        e.x = cx + (noise(e.seed * 97 + t) - 0.5) * 130; e.y = cy + 18;
        e.vy = -(0.5 + noise(e.seed * 31 + t) * 1.5);
        e.vx = (noise(e.seed * 53 + t) - 0.5) * 0.7;
        e.r = 0.6 + noise(e.seed * 17 + t) * 1.6;
      }
      e.x += e.vx + Math.sin(t * 2 + e.seed * 12) * 0.3; e.y += e.vy;
      const a = e.life * (1 - e.life) * 3.4 * k;
      if (a <= 0.02) return;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.2832);
      ctx.fillStyle = `rgba(255,${180 + e.life * 60 | 0},${90 + e.life * 80 | 0},${a})`; ctx.fill();
    });
  },
},

};
const GATHER_ORDER = ["beacon", "fusion", "galaxy", "supernova", "forge"];
const ART_ORDER = ["deepsky", "journal", "fluor", "golgi", "tract"];
const BEH_ORDER = ["resting", "field", "propagate", "sync", "plasticity"];



// -------- MAINTAINERS & CONTRIBUTORS --------
// The people as a neural field: gathered they read as one galaxy, spread they
// read as the network they actually are. Every soma is a person, every process
// a shared field or a lecture that was brought in by someone; the dashed rings
// are places kept open. The engine below is the one settled on in the design
// lab (people-lab-galaxy.html) - see that file for the alternatives.
function Committee() {
  const hostRef = useRef(null);
  const cvsRef = useRef(null);
  const tipRef = useRef(null);
  const S = useRef(null);
  // The combination settled on in the design lab, pinned here: Deep-sky
  // drawing, depolarisation travelling along the processes, labelled open
  // seats, eight of them, and the galaxy as the gathered state.
  const artId = "deepsky", behId = "propagate", seatId = "labelled";
  const seatCount = 8, gatherId = "galaxy";
  const gatherRef = useRef(gatherId);
  useEffect(() => { gatherRef.current = gatherId; }, [gatherId]);
  const [mode, setMode] = useState("gather");
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [fieldHi, setFieldHi] = useState(null);
  const [focus, setFocus] = useState(null);
  const closeRef = useRef(null);
  const artRef = useRef(artId), behRef = useRef(behId), seatRef = useRef(seatId);

  useEffect(() => {
    if (!focus) return;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setFocus(null);
        return;
      }
      if (event.key !== "Tab") return;
      const modal = closeRef.current && closeRef.current.closest(".person-modal");
      const items = modal ? Array.from(modal.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")) : [];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => closeRef.current && closeRef.current.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [focus]);

  useEffect(() => { artRef.current = artId; }, [artId]);
  useEffect(() => {
    seatRef.current = seatId;
    const s = S.current;
    s.seatReceives = !!SEAT[seatId].receives;
    const g = s.nodes.find(n => n.p.ghost);
    if (g) g.act = 0;
  }, [seatId]);
  useEffect(() => {
    behRef.current = behId;
    const s = S.current;
    s.sig.length = 0; s.next = s.t + 1.2;
    s.nodes.forEach(n => n.act = 0); s.edges && s.edges.forEach(ed => ed.act = 0);
  }, [behId]);
  useEffect(() => {
    const s = S.current;
    s.seatCount = seatCount;
    s.needLayout = true;                 // re-ring the seats; the ten people stay put
    s.sig.length = 0;
  }, [seatCount]);

  if (!S.current) {
    S.current = {
      w: 0, h: 0, dpr: 1, t: 0, spread: 0, target: 0, tex: {},
      mouse: { x: -9999, y: -9999, on: false },
      hover: -1, fieldHi: null, focusOpen: false, gfx: {},
      sig: [], next: 2, fired: 0, visible: true,
      seatCount: 8, needLayout: false,
      nodes: NODES.map((p, i) => ({
        p, i, x: 0, y: 0, vx: 0, vy: 0, fx: 0, fy: 0, sx: 0, sy: 0,
        seed: noise(i + 1) * 10,
        r: p.ghost ? 3.2 : (p.kind === "maintainer" ? 4.2 : 3.6),
        act: 0, glow: 0, lastFire: -9,
        twigs: Array.from({ length: p.ghost ? 0 : 3 + Math.floor(noise(i * 3.7) * 3) }, (_, k) => ({
          ang: noise(i * 5.1 + k * 2.3) * 6.28,
          len: 16 + noise(i * 7.9 + k * 3.1) * 22,
          curl: (noise(i * 11.3 + k) - 0.5) * 0.5,
          ph: noise(i * 2.7 + k * 5.5) * 6.28,
        })),
      })),
      dust: Array.from({ length: 280 }, (_, i) => ({
        rx: noise(i * 3.1 + 0.5), ry: noise(i * 7.7 + 1.3),
        r: 0.4 + noise(i * 2.3) * 1.15, a: 0.1 + noise(i * 5.9) * 0.42,
        tw: 0.6 + noise(i * 1.7) * 2.4, ph: noise(i * 4.4) * 6.28, ct: noise(i * 6.1),
      })),
    };
    S.current.grain = function (w, h) {
      const s = S.current, key = "g" + w + "x" + h;
      if (s.tex[key]) return s.tex[key];
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const g = c.getContext("2d");
      const img = g.createImageData(w, h);
      let seed = 1;
      const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (rnd() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      s.tex[key] = c; return c;
    };
  }

  const layout = useCallback((w, h) => {
    const s = S.current;
    const fx0 = w / 2, fy0 = h * 0.56;
    const people = s.nodes.filter(n => !n.p.ghost);
    const seats = s.nodes.filter(n => n.p.ghost);
    const n = s.nodes.length;

    /* the ten who are here: a core, pulled in from the frame edges so the
       ring of vacancies has somewhere to sit.
       On a phone the same fifteen cells stand on end - three across and five
       down - because a name tag is wider than a fifth of a 390px screen and
       five columns run the names into each other. Fifteen cells either way,
       so the stride below still holds. */
    const narrow = w < 620;
    const cols = narrow ? 3 : 5, rows = narrow ? 5 : 3;
    const padX = w * (narrow ? 0.13 : 0.205), padY = h * (narrow ? 0.17 : 0.245);
    const cw = (w - padX * 2) / cols, ch = (h - padY * 2) / rows;
    // the stride must be coprime with the cell count or the walk collapses:
    // with 15 cells a stride of 5 visits only three of them
    people.forEach((nd, i) => {
      const cell = (i * 7) % (cols * rows);
      const cx = padX + (cell % cols) * cw + cw / 2;
      const cy = padY + Math.floor(cell / cols) * ch + ch / 2;
      nd.sx = cx + (noise(i * 11.3) - 0.5) * cw * (narrow ? 0.16 : 0.34);
      nd.sy = cy + (noise(i * 13.7) - 0.5) * ch * 0.46;
    });

    /* the places still open: an even ring around the group, so however many
       are switched on they stay evenly spaced */
    const N = Math.max(1, s.seatCount);
    // the ring is lifted and flattened so the lowest seats keep clear of the
    // footer counts - their captions hang below them
    const RX = w * (narrow ? 0.40 : 0.415), RY = h * (narrow ? 0.36 : 0.315);
    seats.forEach(nd => {
      const k = nd.p.slot;
      nd.active = k < N;
      const a = (k / N) * 6.2832 - Math.PI / 2 + 0.22;
      const wob = 0.86 + noise(k * 7.3) * 0.24;
      nd.sx = fx0 + Math.cos(a) * RX * wob;
      nd.sy = h * 0.47 + Math.sin(a) * RY * wob;
    });

    s.nodes.forEach((nd, i) => {
      const gr = 10 + Math.sqrt(i / n) * 34;
      const ga = i * 2.399963;
      nd.fx = fx0 + Math.cos(ga) * gr * 0.9;
      nd.fy = fy0 + Math.sin(ga) * gr * 0.7;
      if (nd.x === 0 && nd.y === 0) { nd.x = nd.fx; nd.y = nd.fy; }
    });
    s.edges = buildEdges(s.nodes);
    s.edges.forEach(ed => ed.act = ed.act || 0);
    s.adj = {};
    s.edges.forEach(ed => {
      (s.adj[ed.a.i] = s.adj[ed.a.i] || []).push({ ed, other: ed.b });
      (s.adj[ed.b.i] = s.adj[ed.b.i] || []).push({ ed, other: ed.a });
    });
  }, []);

  useEffect(() => {
    const s = S.current;
    const next = mode === "scatter" ? 1 : 0;
    if (s.target !== next) {
      s.nodes.forEach(nd => {
        const dx = nd.sx - nd.fx, dy = nd.sy - nd.fy;
        const L = Math.hypot(dx, dy) || 1;
        if (next === 1) { nd.vx += (dx / L) * 3.2; nd.vy += (dy / L) * 3.2; }
        else { nd.vx += (-dy / L) * 1.4; nd.vy += (dx / L) * 1.4; }
      });
      s.target = next;
      s.needsFrame = true;
      if (s.reducedMotion) s.spread = next;
    }
  }, [mode]);
  useEffect(() => { S.current.fieldHi = fieldHi; S.current.needsFrame = true; }, [fieldHi]);
  useEffect(() => { S.current.focusOpen = !!focus; }, [focus]);

  useEffect(() => {
    const s = S.current;
    if (hoverIdx < 0) return;
    const nd = s.nodes[hoverIdx];
    if (nd && !nd.p.ghost) BEHAVIOURS[behRef.current].hover(s, nd, s.t);
  }, [hoverIdx]);

  useEffect(() => {
    const cvs = cvsRef.current, host = hostRef.current;
    const ctx = cvs.getContext("2d");
    const s = S.current;
    let raf = 0;
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    s.reducedMotion = motionMedia.matches;
    s.needsFrame = true;

    const resize = () => {
      const r = cvs.getBoundingClientRect();
      s.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const bw = Math.round(r.width * s.dpr), bh = Math.round(r.height * s.dpr);
      if (!bw || !bh) return;
      s.w = r.width; s.h = r.height;
      if (cvs.width !== bw || cvs.height !== bh) { cvs.width = bw; cvs.height = bh; s.tex = {}; }
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      layout(s.w, s.h);
      s.needsFrame = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // stop drawing while the section is scrolled away
    const io = new IntersectionObserver(([en]) => { s.visible = en.isIntersecting; if (s.visible) s.needsFrame = true; },
                                        { rootMargin: "140px" });
    io.observe(host);

    const onMotionPreference = () => {
      s.reducedMotion = motionMedia.matches;
      s.needsFrame = true;
    };
    const onVisibility = () => {
      if (!document.hidden) s.needsFrame = true;
    };
    motionMedia.addEventListener("change", onMotionPreference);
    document.addEventListener("visibilitychange", onVisibility);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const { w, h } = s;
      if (!w || !h || !s.edges || !s.visible || document.hidden) return;
      if (s.reducedMotion && !s.needsFrame) return;
      s.needsFrame = false;
      const P = ART[artRef.current], B = BEHAVIOURS[behRef.current];
      if (s.needLayout) { s.needLayout = false; layout(s.w, s.h); }
      const dt = s.reducedMotion ? 0 : 1 / 60;
      s.t += dt;
      s.spread = s.reducedMotion ? s.target : s.spread + (s.target - s.spread) * 0.042;
      const e = easeInOut(clamp01(s.spread));
      const t = s.t;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      if (P.bg) P.bg(ctx, w, h, s, e, t);
      P.neuropil(ctx, s, e, t, w, h);

      /* the gathered state, drawn behind the people */
      const gk = 1 - e;
      if (gk > 0.004) {
        const G = GATHER[gatherRef.current];
        if (!s.gfx[gatherRef.current]) {
          s.gfx[gatherRef.current] = {};
          if (G.init) G.init(s.gfx[gatherRef.current]);
        }
        G.draw(ctx, w, h, s, gk, t, w / 2, h * 0.56);
      }

      /* --- physics: unchanged from the constellation --- */
      for (const nd of s.nodes) {
        let tx = nd.fx + (nd.sx - nd.fx) * e;
        let ty = nd.fy + (nd.sy - nd.fy) * e;
        if (s.reducedMotion) {
          nd.x = tx; nd.y = ty; nd.vx = 0; nd.vy = 0;
        } else {
          tx += (1 - e) * Math.sin(t * 2.4 + nd.seed * 6) * 4 + e * Math.sin(t * 0.3 + nd.seed * 4) * 7;
          ty += (1 - e) * Math.sin(t * 1.9 + nd.seed * 9) * 3.4 + e * Math.cos(t * 0.25 + nd.seed * 7) * 7;
          nd.vx += (tx - nd.x) * 0.015; nd.vy += (ty - nd.y) * 0.015;
          nd.vx *= 0.905; nd.vy *= 0.905;
          nd.x += nd.vx; nd.y += nd.vy;
        }
        const hovered = s.hover === nd.i;
        nd.glow += ((hovered ? 1 : 0) - nd.glow) * 0.16;
      }

      B.update(s, dt, t, e);

      /* --- dendrites that go nowhere: what makes it read as a cell --- */
      for (const nd of s.nodes) {
        if (nd.p.ghost) continue;
        let dim = 1;
        if (s.fieldHi && nd.p.field !== s.fieldHi) dim = 0.25;
        P.twig(ctx, nd, P.tint[nd.p.field], e * dim, t);
      }

      /* --- processes --- */
      for (const ed of s.edges) {
        const isField = ed.kind === "field";
        const breathe = 0.7 + 0.3 * Math.sin(t * 0.45 + ed.ph);
        let base = ((ed.kind === "intro" || ed.kind === "tie") ? 0.30 : isField ? 0.13 : 0.085) * e * breathe;
        let act = clamp01(ed.act) * e;
        if (s.fieldHi && !(isField && ed.a.p.field === s.fieldHi)) { base *= 0.28; act *= 0.28; }
        if (base + act <= 0.004) continue;
        const col = ed.kind === "ghost" ? P.ghostRGB
          : mixRGB(tintOf(P, ed.a), tintOf(P, ed.b), 0.5);
        P.edge(ctx, ed, col, base, act, e, t);
      }

      /* --- travelling depolarisation --- */
      for (const g of s.sig) {
        let amp = g.amp * e;
        if (s.fieldHi && g.from.p.field !== s.fieldHi && g.to.p.field !== s.fieldHi) amp *= 0.3;
        if (amp <= 0.02) continue;
        P.signal(ctx, g.ed, clamp01(g.u), amp, mixRGB(tintOf(P, g.from), tintOf(P, g.to), clamp01(g.u)));
      }

      /* --- somas --- */
      for (const nd of s.nodes) {
        let dim = 1;
        if (s.fieldHi && nd.p.field !== s.fieldHi) dim = 0.24 + 0.1 * (1 - e);
        if (nd.p.ghost) {
          if (!nd.active) continue;
          // a caption on every seat is noise once there are more than a few;
          // past that the words are held back for whichever one you point at
          // a name, the invitation at the top, or whatever you are pointing at
          const cap = !!nd.p.taken || nd.p.slot === 0 || s.hover === nd.i;
          SEAT[seatRef.current].draw(ctx, nd, P, e, t, s, dim * (0.75 + nd.glow * 0.25), cap);
          continue;
        }
        const col = mixRGB(P.warm, tintOf(P, nd), e);
        P.soma(ctx, nd, col, nd.r * (1 + nd.glow * 0.4), clamp01(nd.act), e, dim, t);
      }

      /* --- names --- */
      ctx.globalCompositeOperation = "source-over";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      for (const nd of s.nodes) {
        if (nd.p.ghost) continue;
        let a = e * (s.hover === nd.i ? 0 : 0.42 + nd.glow * 0.4 + nd.act * 0.4);
        if (s.fieldHi && nd.p.field !== s.fieldHi) a *= 0.28;
        if (a <= 0.02) continue;
        P.nameTag(ctx, nd, Math.min(1, a));
      }
      if (P.over) P.over(ctx, w, h, s, e, t);

      /* --- hover pick --- */
      let best = -1, bestD = 24;
      if (s.mouse.on && !s.focusOpen) {
        for (const nd of s.nodes) {
          if (nd.p.ghost && !nd.active) continue;
          const d = Math.hypot(nd.x - s.mouse.x, nd.y - s.mouse.y);
          if (d < bestD) { bestD = d; best = nd.i; }
        }
      }
      if (best !== s.hover) { s.hover = best; setHoverIdx(best); }
      if (best >= 0 && tipRef.current) {
        const nd = s.nodes[best];
        tipRef.current.style.left = nd.x + "px";
        tipRef.current.style.top = (nd.y - nd.r - 16) + "px";
      }
    };
    raf = requestAnimationFrame(frame);

    const onMove = (ev) => {
      const r = cvs.getBoundingClientRect();
      s.mouse.x = ev.clientX - r.left; s.mouse.y = ev.clientY - r.top; s.mouse.on = true;
      s.needsFrame = true;
    };
    const onLeave = () => { s.mouse.on = false; s.mouse.x = -9999; s.mouse.y = -9999; s.needsFrame = true; };
    cvs.addEventListener("mousemove", onMove);
    cvs.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      motionMedia.removeEventListener("change", onMotionPreference);
      document.removeEventListener("visibilitychange", onVisibility);
      cvs.removeEventListener("mousemove", onMove);
      cvs.removeEventListener("mouseleave", onLeave);
    };
  }, [layout]);

  const P = ART[artId], B = BEHAVIOURS[behId];
  const hovered = hoverIdx >= 0 ? NODES[hoverIdx] : null;
  const usedFields = FIELDS.filter(f => PEOPLE.some(p => p.field === f));
  const set = (m) => setMode(m);


  const goJoin = () => {
    const el = document.getElementById("join");
    if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" });
  };
  // someone on the ring has a name and a standing but nothing on record yet
  const seatDossier = (t) => ({ initials: t.initials, name: t.name, role: t.standing, field: t.field, lectures: [] });
  const activateNode = (node) => {
    if (!node) return;
    if (!node.ghost) { setFocus(node); return; }
    if (node.taken) setFocus(seatDossier(node.taken)); else goJoin();
  };
  const openSomaAtPointer = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const canvas = cvsRef.current;
    const state = S.current;
    if (!canvas || !state) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const radius = event.pointerType === "touch" ? 40 : 28;
    let match = null;
    let distance = radius;
    for (const candidate of state.nodes) {
      if (candidate.p.ghost && !candidate.active) continue;
      const nextDistance = Math.hypot(candidate.x - x, candidate.y - y);
      if (nextDistance < distance) {
        match = candidate;
        distance = nextDistance;
      }
    }
    if (!match) return;
    setHoverIdx(match.i);
    activateNode(match.p);
  };

  return (
    <section id="maintainers" className="section section-people">
      <div className="container">
        <div className="section-header reveal">
          <div className="num"><span>02 / 05</span> &nbsp; Maintainers & Contributors</div>
          <h2>One flame when we gather - <em>one network</em> when we spread.</h2>
        </div>

        <div className="reveal">
          <div className={"nf" + (P.paper ? " paper" : "")} data-art={artId} ref={hostRef}>
            <canvas ref={cvsRef} className={"nf-canvas" + (hovered ? " pointing" : "")}
              onPointerUp={openSomaAtPointer} aria-hidden="true" />
            <div className="nf-overlay">
              <div className={"nf-motto " + (mode === "gather" ? "in" : "out")}>
                <h3>One flame,<br />when we gather.</h3>
              </div>
              <div className={"nf-motto " + (mode === "scatter" ? "in" : "out")}>
                <h3>A network,<br />when we spread.</h3>
              </div>
              <div className="nf-ctl">
                <button className={"nf-btn" + (mode === "gather" ? " on" : "")} aria-pressed={mode === "gather"} onClick={() => set("gather")}>Gather</button>
                <button className={"nf-btn" + (mode === "scatter" ? " on" : "")} aria-pressed={mode === "scatter"} onClick={() => set("scatter")}>Spread</button>
              </div>
              <div className="nf-foot">
                <div><div className="c-n">{MAINTAINERS.length}</div><div className="c-l">Maintainers</div></div>
                <div><div className="c-n">{CONTRIBUTORS_ALL.length}</div><div className="c-l">Contributors</div></div>
                <div><div className="c-n">{LECTURE_COUNT}</div><div className="c-l">Lectures given</div></div>
              </div>
              {hovered &&
                <div className="nf-tip" ref={tipRef}>
                  <div className="t-n">{hovered.name}</div>
                  <div className="t-r" style={{ color: hovered.ghost ? SEAT_COL[artId] : P.hue[hovered.field] }}>
                    {hovered.ghost ? (hovered.taken ? hovered.taken.standing : "Open · hoping for " + hovered.wants)
                      : (hovered.speakerRole || hovered.role)}
                  </div>
                  {!(hovered.ghost && hovered.taken) &&
                    <div className="t-x">
                      {hovered.ghost ? "Give the next lecture - join the group and take the stage."
                        : (hovered.topic || (hovered.lectures[0] && hovered.lectures[0].title) || hovered.field)}
                    </div>}
                </div>}
            </div>
          </div>

          <div className="legend">
            {usedFields.map(f =>
              <button key={f} className={"leg" + (fieldHi && fieldHi !== f ? " dim" : "")}
                onMouseEnter={() => setFieldHi(f)} onMouseLeave={() => setFieldHi(null)}
                onClick={() => setFieldHi(v => v === f ? null : f)} aria-pressed={fieldHi === f}>
                <span className="dot" style={{ background: P.hue[f], boxShadow: "0 0 8px " + P.hue[f] }} />
                {f}
              </button>)}
            <span className="spacer" />
            <span className="cue">Select a node, or browse the roster below.</span>
            <a className="nf-browse" href="#contributors">Browse people ↓</a>
          </div>
        </div>

        <div className="roster reveal" id="contributors">
          <div className="roster-h">
            <div className="t">Roster</div>
            <div className="m">{PEOPLE.length} in the core · {RING} on the ring · {CONTRIBUTORS_ALL.length} contributors · {LECTURE_COUNT} lectures on record</div>
          </div>
          <table>
            <thead>
              <tr><th>Name</th><th>Standing</th><th>Field</th><th>On record</th><th /></tr>
            </thead>
            <tbody>
              {PEOPLE.map(p => (
                <tr key={p.initials} className={NEW_SINCE.has(p.initials) ? "is-new" : ""}>
                  <td className="nm">
                    <button type="button" className="person-trigger" onClick={() => setFocus(p)}>
                      <span className="pip" style={{ background: ART.deepsky.hue[p.field] }} />
                      {p.name}
                    </button>
                  </td>
                  <td>{p.speakerRole || p.role}</td>
                  <td>{p.field}</td>
                  <td>
                    {p.lectures.length ? p.lectures.map((t, i) =>
                        <div key={i}>
                          {t.title}
                          {t.venue && <span style={{ color: "var(--ink-mute)" }}> · {t.venue}</span>}
                          {t.date && <span style={{ color: "var(--ink-mute)" }}> · {t.date}</span>}
                          {t.pdf && <a className="pdf" href={materialHref(t.title, t.pdf)} target="_blank" rel="noopener noreferrer">PDF ↓</a>}
                        </div>)
                      : p.introduced
                        ? <span>Introduced {PEOPLE.find(x => x.initials === p.introduced).name}
                            <span style={{ color: "var(--ink-mute)" }}> · {p.introducedDate}</span></span>
                        : <span style={{ color: "var(--ink-mute)" }}>-</span>}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {CONTRIB_SET.has(p.initials) && <span className="tag">Contributor</span>}
                    {NEW_SINCE.has(p.initials) && <span className="tag new" style={{ marginLeft: 6 }}>New</span>}
                  </td>
                </tr>))}
              <tr className="sep"><td colSpan={5}>On the ring</td></tr>
              {SEAT_PEOPLE.map(p => (
                <tr key={p.initials} className={"ring" + (NEW_SINCE.has(p.initials) ? " is-new" : "")}>
                  <td className="nm">
                    <span className="pip" style={{ background: ART.deepsky.hue[p.field] }} />
                    {p.name}
                  </td>
                  <td>{p.standing}</td>
                  <td>{p.field}</td>
                  <td><span style={{ color: "var(--ink-mute)" }}>-</span></td>
                  <td>{NEW_SINCE.has(p.initials) && <span className="tag new">New</span>}</td>
                </tr>))}
            </tbody>
          </table>
          <div className="roster-foot">
            A <b>contributor</b> is anyone with something on record - a lecture given, or a speaker
            brought in - so most maintainers are counted twice. Shiqi Fang and Ke Bi are tied by a
            bright process in the spread state. Dates follow the British order, day first.
            Zhikai Zhang and Zhaoxi Zhang share a surname and an initial, so they are shortened
            to <b>ZK</b> and <b>ZX</b>.
          </div>
        </div>
      </div>

      {focus &&
      <div className="person-overlay" onClick={() => setFocus(null)}>
        <div className="person-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={focus.name}>
          <button ref={closeRef} className="person-close" onClick={() => setFocus(null)} aria-label={`Close ${focus.name} profile`}>✕</button>
          <div className="person-modal-top">
            <div className="person-modal-avatar">{focus.initials}</div>
            <div>
              <div className="person-modal-name">{focus.name}</div>
              <div className="contrib-role">{focus.speakerRole || focus.role}{focus.field ? " · " + focus.field : ""}</div>
            </div>
          </div>
          {focus.bio && <div className="contrib-bio" style={{ fontSize: 14.5 }}>{focus.bio}</div>}
          {focus.topic &&
            <div className="person-modal-row"><span>Research Focus</span>{focus.topic}</div>}
          {focus.email &&
            <div className="person-modal-row"><span>Contact</span><a href={"mailto:" + focus.email}>{focus.email}</a></div>}
          {focus.lectures && focus.lectures.length > 0 &&
            <div>
              <div className="contrib-lechead" style={{ marginBottom: 10 }}>Lectures · {focus.lectures.length}</div>
              <ul className="contrib-lectures">
                {focus.lectures.map((t, j) =>
                  <li key={j}>
                    <span className="d">{t.date}</span>
                    <span className="t">{t.title}</span>
                    {t.pdf && <a href={materialHref(t.title, t.pdf)} target="_blank" rel="noopener noreferrer">PDF ↓</a>}
                  </li>)}
              </ul>
            </div>}
        </div>
      </div>}
    </section>);
}

// -------- RESEARCH ATLAS (Schedule × Research Topics, merged) --------
// Statistics sits at the centre as the trunk; the six fields branch off it;
// every talk is a leaf on its branch, newest first. Clicking a field unfolds
// its branch on the map and opens the dossier below.
const ATLAS_C = { x: 600, y: 380 };
const talkKey = (e) => `${e.year}-${e.month}-${e.date}`;

function leafPoints(t, n) {
  const base = Math.atan2(t.y - ATLAS_C.y, t.x - ATLAS_C.x);
  const spread = Math.min(1.9, 0.55 * Math.max(n - 1, 0));
  const R = 108;
  return Array.from({ length: n }, (_, i) => {
    const a = n === 1 ? base : base - spread / 2 + (spread * i) / (n - 1);
    return { x: t.x + R * Math.cos(a), y: t.y + R * Math.sin(a) };
  });
}

function ResearchAtlas() {
  const newest = EVENTS_SORTED[0];
  const isUpcoming = eventDate(newest) > new Date();
  const [view, setView] = useState("map");
  const [sel, setSel] = useState(newest.topic);
  const [focus, setFocus] = useState(talkKey(newest));
  const [zoom, setZoom] = useState(1);
  const interacted = useRef(false);

  // Wheel-to-zoom on the map: percentage steps, anchored at the cursor.
  const mapWrapRef = useRef(null);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;
  const pendingScroll = useRef(null);
  useEffect(() => {
    if (view !== "map") return;
    const el = mapWrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const old = zoomRef.current;
      const next = Math.min(2, Math.max(1, +(old * (e.deltaY < 0 ? 1.1 : 1 / 1.1)).toFixed(3)));
      if (next === old) return;
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      pendingScroll.current = { px, py, cx: el.scrollLeft + px, cy: el.scrollTop + py, ratio: next / old };
      setZoom(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [view]);
  useEffect(() => {
    const el = mapWrapRef.current, p = pendingScroll.current;
    if (!el || !p) return;
    el.scrollLeft = p.cx * p.ratio - p.px;
    el.scrollTop = p.cy * p.ratio - p.py;
    pendingScroll.current = null;
  }, [zoom]);

  // Latest rail: click-and-drag horizontal scrolling
  const railRef = useRef(null);
  const railDrag = useRef({ on: false, x: 0, left: 0, moved: false });
  const onRailDown = (ev) => {
    const el = railRef.current;
    if (!el) return;
    railDrag.current = { on: true, x: ev.clientX, left: el.scrollLeft, moved: false };
    const move = (e) => {
      if (!railDrag.current.on) return;
      const dx = e.clientX - railDrag.current.x;
      if (Math.abs(dx) > 4) railDrag.current.moved = true;
      el.scrollLeft = railDrag.current.left - dx;
    };
    const up = () => {
      railDrag.current.on = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  const onRailClickCapture = (ev) => {
    if (railDrag.current.moved) {
      ev.preventDefault();
      ev.stopPropagation();
      railDrag.current.moved = false;
    }
  };

  const byTopic = useMemo(() => {
    const m = {};
    TOPICS.forEach((t) => { m[t.id] = EVENTS_SORTED.filter((e) => e.topic === t.id); });
    return m;
  }, []);

  const pick = (topicId, key) => {
    interacted.current = true;
    setSel(topicId);
    setFocus(key || null);
  };

  const goJoin = (ev) => {
    if (ev) ev.preventDefault();
    const el = document.getElementById("join");
    if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" });
  };

  useEffect(() => {
    if (!interacted.current || !focus) return;
    const el = document.getElementById("atlas-talk-" + focus);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focus, sel]);

  const selTopic = TOPICS.find((t) => t.id === sel);
  const selTalks = byTopic[sel] || [];
  const branches = TOPICS.filter((t) => t.id !== "core");

  return (
    <section id="talks" className="section">
      <div className="container">
        <div className="section-header reveal">
          <div className="num"><span>03 / 05</span> &nbsp; Research Atlas</div>
          <h2>Statistics as the backbone - <em>a living map</em> of our fields, lectures and materials.</h2>
        </div>

        <div className="reveal">
          <div className="atlas-toolbar">
            <div className="atlas-rail-wrap">
              <div className="atlas-rail" ref={railRef} onMouseDown={onRailDown} onClickCapture={onRailClickCapture}>
              <span className="atlas-rail-label">Latest</span>
              {EVENTS_SORTED.slice(0, 5).map((e) => {
                const k = talkKey(e);
                const t = TOPICS.find((x) => x.id === e.topic);
                return (
                  <button key={k}
                    className={"chip atlas-rail-chip" + (view === "map" && focus === k ? " active" : "")}
                    aria-pressed={view === "map" && focus === k}
                    onClick={() => { setView("map"); pick(e.topic, k); }}>
                    <span className="d">{e.month} {e.year}</span>{e.short}<span className="f"> · {t.label}</span>
                  </button>);
              })}
              </div>
            </div>
            <div className="atlas-switch">
              <button className={"chip" + (view === "map" ? " active" : "")} aria-pressed={view === "map"} onClick={() => setView("map")}>Atlas</button>
              <button className={"chip" + (view === "list" ? " active" : "")} aria-pressed={view === "list"} onClick={() => setView("list")}>Index</button>
            </div>
          </div>

          {view === "map" ? (
            <>
              <div className="atlas-map-outer">
                <div className="atlas-map-wrap" ref={mapWrapRef}>
                <svg className={"atlas-svg" + (sel !== "core" ? " branch-selected" : "")} viewBox="0 0 1290 760" role="group"
                  style={{ width: `${zoom * 100}%`, minWidth: `${860 * zoom}px` }}
                  aria-label="Research atlas: statistics at the centre, research fields as branches, lectures as leaves">
                  <g transform="translate(35,0)">

                    {/* trunk → field edges */}
                    {branches.map((t, i) => {
                      const mx = (ATLAS_C.x + t.x) / 2, my = (ATLAS_C.y + t.y) / 2;
                      const px = t.y - ATLAS_C.y, py = ATLAS_C.x - t.x;
                      const plen = Math.hypot(px, py) || 1;
                      const off = (i % 2 ? -1 : 1) * 26;
                      const d = `M ${ATLAS_C.x} ${ATLAS_C.y} Q ${mx + (px / plen) * off} ${my + (py / plen) * off} ${t.x} ${t.y}`;
                      return (
                        <g key={t.id}>
                          <path className={"atlas-edge" + (sel === t.id ? " active" : "")} d={d} />
                          {sel === t.id && <path className="atlas-edge-flow" d={d} />}
                        </g>);
                    })}

                    {/* frontier: the branch that doesn't exist yet */}
                    <path className="atlas-edge ghost" d="M 600 380 Q 860 336 1105 380" />

                    {/* leaves of the selected branch */}
                    {sel !== "core" && selTopic && leafPoints(selTopic, selTalks.length).map((p, i) => {
                      const e = selTalks[i];
                      const k = talkKey(e);
                      const rightSide = p.x >= selTopic.x;
                      return (
                        <g key={sel + "-" + k} className="atlas-leaf-g" style={{ animationDelay: `${i * 70}ms` }} onClick={() => pick(sel, k)}
                          role="button" tabIndex="0" aria-label={`Open ${e.title}`} aria-pressed={focus === k} aria-controls="atlas-panel"
                          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pick(sel, k); } }}>
                          <line className="atlas-twig" x1={selTopic.x} y1={selTopic.y} x2={p.x} y2={p.y} />
                          <circle className={"atlas-leaf" + (focus === k ? " focused" : "")} cx={p.x} cy={p.y} r={focus === k ? 7 : 5.5} />
                          <text className="atlas-leaf-label" x={p.x + (rightSide ? 12 : -12)} y={p.y + 4}
                            textAnchor={rightSide ? "start" : "end"}>{e.short} · {e.year}</text>
                          <title>{e.title}</title>
                        </g>);
                    })}

                    {/* field nodes */}
                    {branches.map((t, i) => {
                      const n = byTopic[t.id].length;
                      const r = 30 + 2.5 * n;
                      const isNewestField = t.id === newest.topic;
                      const topRow = t.y < ATLAS_C.y;   // caption sits on the side facing the centre, flag on the other
                      const capY = t.y + (topRow ? r + 24 : -(r + 16));
                      const flagY = topRow ? t.y - r - 16 : t.y + r + 40;
                      return (
                        <g key={t.id} className={"atlas-node atlas-float f" + (i % 3) + (sel === t.id ? " is-selected" : "")} onClick={() => pick(t.id, null)}
                          role="button" tabIndex="0" aria-label={`Open ${t.label}, ${n} ${n === 1 ? "lecture" : "lectures"}`}
                          aria-pressed={sel === t.id} aria-controls="atlas-panel"
                          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pick(t.id, null); } }}>
                          {isNewestField && <circle className="atlas-pulse" cx={t.x} cy={t.y} r={r + 6} />}
                          <circle className={"atlas-node-c" + (sel === t.id ? " active" : "") + (n === 0 ? " empty" : "")} cx={t.x} cy={t.y} r={r} />
                          <text className={"atlas-count" + (sel === t.id ? " active" : "")} x={t.x} y={t.y + 4} textAnchor="middle">{String(n).padStart(2, "0")}</text>
                          <text className={"atlas-count-sub" + (sel === t.id ? " active" : "")} x={t.x} y={t.y + 19} textAnchor="middle">{n === 0 ? "growing" : n === 1 ? "lecture" : "lectures"}</text>
                          <text className="atlas-node-label" x={t.x} y={capY + 4} textAnchor="middle">{t.label}</text>
                          {isNewestField &&
                            <text className="atlas-flag" x={t.x} y={flagY} textAnchor="middle">
                              {(isUpcoming ? "next · " : "latest · ") + newest.month + " " + newest.year}
                            </text>}
                          <title>{t.label}</title>
                        </g>);
                    })}

                    {/* ghost node: the map keeps growing */}
                    <g className="atlas-node atlas-ghost" onClick={() => goJoin()} role="button" tabIndex="0" aria-label="Propose a new research field"
                      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); goJoin(); } }}>
                      <circle className="atlas-ghost-c" cx="1105" cy="380" r="24" />
                      <text className="atlas-ghost-plus" x="1105" y="387" textAnchor="middle">+</text>
                      <text className="atlas-node-label ghost" x="1105" y="426" textAnchor="middle">your field?</text>
                      <title>Propose a new branch - join us</title>
                    </g>

                    {/* the trunk */}
                    <g className={"atlas-node atlas-core" + (sel === "core" ? " is-selected" : "")} onClick={() => pick("core", null)} role="button" tabIndex="0" aria-label="Open Statistics trunk lectures"
                      aria-pressed={sel === "core"} aria-controls="atlas-panel"
                      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pick("core", null); } }}>
                      <ellipse className={"atlas-core-c" + (sel === "core" ? " active" : "")} cx="600" cy="380" rx="118" ry="50" />
                      <text className="atlas-core-t" x="600" y="378" textAnchor="middle">Statistics</text>
                      <text className="atlas-core-sub" x="600" y="400" textAnchor="middle">
                        the backbone · {byTopic.core.length} trunk {byTopic.core.length === 1 ? "lecture" : "lectures"}
                      </text>
                      <title>Statistics - the backbone of every branch</title>
                    </g>

                  </g>
                </svg>
                </div>
                <div className="atlas-zoom">
                  <button className="atlas-zoom-btn" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} disabled={zoom <= 1} aria-label="Zoom out">−</button>
                  <button className="atlas-zoom-btn reset" onClick={() => setZoom(1)} disabled={zoom === 1} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
                  <button className="atlas-zoom-btn" onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))} disabled={zoom >= 2} aria-label="Zoom in">+</button>
                </div>
              </div>
              <div className="atlas-hint">Click a field to unfold its branch · leaves are lectures, newest first · scroll the map to zoom · the map grows with every session</div>

              <div key={sel} className="atlas-panel" id="atlas-panel">
                <div className="atlas-panel-head">
                  <div>
                    <div className="atlas-panel-kicker">{sel === "core" ? "The trunk" : "Branch"} · {selTalks.length} {selTalks.length === 1 ? "lecture" : "lectures"}</div>
                    <h3 className="atlas-panel-title" aria-live="polite">{selTopic.label}</h3>
                    <p className="atlas-panel-blurb">{selTopic.blurb}</p>
                  </div>
                  {selTopic.href && <a className="atlas-panel-link" href={selTopic.href}>Read the field notes →</a>}
                </div>
                <div>
                  {selTalks.length === 0 &&
                    <div className="event-empty">
                      This branch is still growing - no lectures yet.&nbsp;
                      <a href="#join" onClick={goJoin} style={{ color: "var(--accent)" }}>Propose the first one →</a>
                    </div>}
                  {selTalks.map((e) => {
                    const k = talkKey(e);
                    const isNewestAll = e === newest;
                    return (
                      <div key={k} id={"atlas-talk-" + k} className={"event-row" + (focus === k ? " focused" : "")} onClick={() => pick(sel, k)}
                        role="button" tabIndex="0" aria-pressed={focus === k}
                        onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); pick(sel, k); } }}>
                        <div className="event-date">
                          <div className="d">{e.date}</div>
                          <div className="m">{e.month} · {e.year}</div>
                        </div>
                        <div className="event-title">
                          <span className="kicker">
                            {e.kicker}{e.speaker ? " · " + e.speaker : ""}
                            {isNewestAll && <span className="atlas-badge">{isUpcoming ? "upcoming" : "newest"}</span>}
                          </span>
                          {e.title}
                        </div>
                        <div className="event-loc">
                          <span className="pin">Location</span>
                          {e.loc}
                        </div>
                        <div className="event-time">{e.time}</div>
                        <div className="event-arrow">
                          {e.pdf ? <a href={materialHref(e.title, e.pdf)} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()} style={{color:"var(--accent)",textDecoration:"none"}} title="Download materials"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v12M12 15l-4-4M12 15l4-4M5 21h14" stroke="currentColor" strokeWidth="1.6" /></svg></a> : <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M1 6h16M12 1l5 5-5 5" stroke="currentColor" strokeWidth="1.4" /></svg>}
                        </div>
                      </div>);
                  })}
                </div>
              </div>
            </>
          ) : (
            <TalkIndex />
          )}
        </div>
      </div>
    </section>);

}

// -------- TALK INDEX (flat list view inside the Atlas) --------
function TalkIndex() {
  const CATS = [
  { id: "all", label: "All" },
  { id: "talk", label: "Lectures" },
  { id: "schedule", label: "Schedule" }];

  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const filtered = filter === "all" ? EVENTS : EVENTS.filter((e) => e.cat === filter);

  useEffect(() => {
    setExpanded(false);
  }, [filter]);

  const displayed = expanded ? filtered : filtered.slice(0, 5);

  return (
    <div>
            <div className="events-toolbar">
              <div className="filter-chips">
                {CATS.map((c) =>
              <button key={c.id} className={"chip" + (filter === c.id ? " active" : "")} aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>{c.label}</button>
              )}
              </div>
            </div>
            <div>
              {displayed.length === 0 && <div className="event-empty">No events match that filter.</div>}
              {displayed.map((e, i) =>
            <div key={i} className="event-row">
                  <div className="event-date">
                    <div className="d">{e.date}</div>
                    <div className="m">{e.month} · {e.year}</div>
                  </div>
                  <div className="event-title">
                    <span className="kicker">{e.kicker}{e.speaker ? " · " + e.speaker : ""}</span>
                    {e.title}
                  </div>
                  <div className="event-loc">
                    <span className="pin">Location</span>
                    {e.loc}
                  </div>
                  <div className="event-time">{e.time}</div>
                  <div className="event-arrow">
                    {e.pdf ? <a href={materialHref(e.title, e.pdf)} target="_blank" rel="noopener noreferrer" style={{color:"var(--accent)",textDecoration:"none"}} title="Download materials"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v12M12 15l-4-4M12 15l4-4M5 21h14" stroke="currentColor" strokeWidth="1.6" /></svg></a> : <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M1 6h16M12 1l5 5-5 5" stroke="currentColor" strokeWidth="1.4" /></svg>}
                  </div>
                </div>
            )}
            </div>
            {filtered.length > 5 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
                <button onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="chip" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px" }}>
                  {expanded ? (
                    <>
                      Show Less
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </>
                  ) : (
                    <>
                      Show More (+{filtered.length - 5})
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </>
                  )}
                </button>
              </div>
            )}
    </div>);

}

// -------- NEWS --------
function News() {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return NEWS;
    return NEWS.filter((n) =>
    n.title.toLowerCase().includes(s) ||
    n.excerpt.toLowerCase().includes(s) ||
    n.cat.toLowerCase().includes(s)
    );
  }, [q]);

  useEffect(() => {
    setExpanded(false);
  }, [q]);

  const displayed = expanded ? filtered : filtered.slice(0, 3);

  return (
    <section id="posts" className="section">
        <div className="container">
          <div className="section-header reveal">
            <div className="num"><span>04 / 05</span> &nbsp; Posts</div>
            <h2>Recent posts from <em>the group - tools, tutorials, and updates</em>.</h2>
          </div>
          <div className="reveal">
            <div className="news-toolbar">
              <div className="search-box">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" /><path d="M11 11l4 4" stroke="currentColor" strokeWidth="1.4" /></svg>
                <label className="sr-only" htmlFor="post-search">Search posts</label>
                <input id="post-search" name="post-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search news, awards, fieldwork…" aria-controls="post-results" />
              </div>
              <div className="events-count">{filtered.length} {filtered.length === 1 ? "story" : "stories"}</div>
            </div>
            <div className="news-grid" id="post-results">
              {displayed.map((n, i) =>
            <article key={n.title} className={"news-card" + (n.href ? " has-link" : "")} data-visual={n.visual}>
                  <div className={"img" + (n.cover ? " has-cover" : "")} data-label={n.img} aria-hidden={n.cover ? undefined : "true"}>
                    {n.cover && <img src={n.cover} alt={n.coverAlt} loading="lazy" decoding="async" />}
                  </div>
                  <div className="meta"><span className="cat">{n.cat}</span> · <span>{n.date}</span></div>
                  <h3>{n.title}</h3>
                  <p>{n.excerpt}</p>
                  {n.href && <a className="read" href={n.href}>Open related material →</a>}
                </article>
            )}
              {filtered.length === 0 &&
            <div style={{ gridColumn: "1/-1", padding: "60px 0", textAlign: "center", fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-mute)", fontSize: 20 }}>
                  Nothing matches that search.
                </div>
            }
            </div>
            {filtered.length > 3 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
                <button onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="chip" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px" }}>
                  {expanded ? (
                    <>
                      Show Less
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </>
                  ) : (
                    <>
                      Show More (+{filtered.length - 3})
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>);

}

// -------- STAR RIVER (Join section backdrop) --------
// A slow galactic drift over the deep-blue join panel: stars ride gentle
// streamlines (a nod to fluid dynamics), twinkle stochastically (random
// fluctuation), and the group's formulas float past as ringed planets.
// Canvas-based, DPR-capped, paused off-screen, reduced-motion aware.
function StarRiver() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0, H = 0, raf = 0, visible = true, t = Math.random() * 100;

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = Math.max(1, Math.round(W * DPR));
      canvas.height = Math.max(1, Math.round(H * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();

    const rand = (a, b) => a + Math.random() * (b - a);
    const stars = Array.from({ length: 130 }, () => ({
      x: Math.random(), y: Math.random(),
      r: rand(0.4, 1.5), v: rand(0.004, 0.014),
      tw: rand(0, Math.PI * 2), ts: rand(0.25, 0.9), band: rand(0.5, 1)
    }));
    const planets = [
      "β̂ = (X′X)⁻¹X′y",
      "√n(θ̂ − θ) → N(0, V)",
      "p(θ | y) ∝ p(y | θ) p(θ)",
      "dS = μS dt + σS dW",
      "∂u/∂t + (u·∇)u = −∇p/ρ + ν∇²u",
      "E[R] − Rf = βλ",
      "Var(β̂) = σ²(X′X)⁻¹"
    ].map((tex, i) => ({
      tex, x: Math.random(), y: 0.14 + 0.72 * (i / 6),
      v: rand(0.0012, 0.0035), s: rand(12.5, 15.5), ring: i % 2 === 0, ph: rand(0, Math.PI * 2)
    }));

    // gentle streamline field - everything in the river bends the same way
    const flowY = (nx, ny, tt) => Math.sin(nx * 4.2 + tt * 0.12 + ny * 7) * 7;

    const draw = (dt) => {
      t += dt;
      ctx.clearRect(0, 0, W, H);

      // faint milky band breathing across the panel
      const g = ctx.createLinearGradient(0, H * 0.1, W, H * 0.9);
      g.addColorStop(0, "rgba(160,200,225,0)");
      g.addColorStop(0.45 + 0.08 * Math.sin(t * 0.05), "rgba(160,200,225,0.05)");
      g.addColorStop(1, "rgba(160,200,225,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // stars adrift on the streamlines
      ctx.fillStyle = "#cfe3ee";
      for (const s of stars) {
        s.x += s.v * dt;
        if (s.x > 1.02) s.x = -0.02;
        const px = s.x * W;
        const py = s.y * H + flowY(s.x, s.y, t);
        ctx.globalAlpha = (0.14 + 0.3 * Math.abs(Math.sin(t * s.ts + s.tw))) * s.band;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // formula planets, slower and larger - the statistics among the stars
      ctx.textAlign = "center";
      for (const p of planets) {
        p.x += p.v * dt;
        if (p.x > 1.18) p.x = -0.18;
        const px = p.x * W;
        const py = p.y * H + flowY(p.x, p.y, t * 0.6) * 1.6;
        ctx.font = `italic ${p.s}px "Source Serif 4", Georgia, serif`;
        ctx.globalAlpha = 0.17;
        ctx.fillStyle = "#bcd8e8";
        ctx.fillText(p.tex, px, py);
        if (p.ring) {
          ctx.globalAlpha = 0.07;
          ctx.strokeStyle = "#cfe3ee";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(px, py - p.s * 0.35, ctx.measureText(p.tex).width / 2 + 16, p.s * 1.2, Math.sin(p.ph) * 0.16, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; });
    io.observe(canvas);
    window.addEventListener("resize", resize);

    if (reduced) {
      draw(0);
      return () => { io.disconnect(); window.removeEventListener("resize", resize); };
    }

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible && W > 0) draw(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={ref} className="star-river" aria-hidden="true" />;
}

// -------- JOIN FORM --------
function Join() {
  const [form, setForm] = useState({ name: "", email: "", program: "", year: "", interests: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Enter your full name.";
    if (!form.email.trim()) e.email = "Enter your university email.";else
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.program) e.program = "Select a research area.";
    if (!form.year) e.year = "Select your year of study.";
    return e;
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length !== 0) {
      const firstInvalid = Object.keys(e)[0];
      requestAnimationFrame(() => document.getElementById(`join-${firstInvalid}`)?.focus());
      return;
    }
    const subject = "UEBS Statistics Study Group membership request";
    const body = [
      `Name: ${form.name.trim()}`,
      `University email: ${form.email.trim()}`,
      `Research area: ${form.program}`,
      `Year of study: ${form.year}`,
      `Research interests: ${form.interests.trim() || "Not provided"}`,
      "",
      "Please add me to the Statistics Study Group discussion session invites."
    ].join("\n");
    const mailto = `mailto:Zexun.Chen@ed.ac.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
    requestAnimationFrame(() => { window.location.href = mailto; });
  };

  return (
    <section id="join" className="join" style={{ backgroundColor: "rgb(11, 56, 78)" }}>
        <div className="join-visual" data-p5-field aria-hidden="true" />
        <div className="container">
          <div>
            <div className="section-header" style={{ gridTemplateColumns: "1fr", gap: 18, marginBottom: 24 }}>
              <div className="num"><span style={{ color: "rgba(255,255,255,0.7)" }}>05 / 05</span> &nbsp; <span style={{ color: "rgba(255,255,255,0.5)" }}>Membership</span></div>
              <h2>Join the <em>Study Group</em>. Open to all UEBS doctoral researchers and beyond.</h2>
            </div>
            <p className="lead">
              This website is managed by the UEBS Statistics Group. Please feel free to email one of the maintainers listed above or fill in the form to join us. We will add you to the discussion session invites.
            </p>
          </div>
          <div>
            {submitted ?
          <div className="form-success" role="status" tabIndex="-1">
                <strong>Email draft prepared.</strong> Your email app should open with a message addressed to Dr Zexun Chen. Send that email to complete your request. Nothing has been sent automatically.
                <div className="form-success-actions">
                  <a href="mailto:Zexun.Chen@ed.ac.uk">Email Zexun directly</a>
                  <button type="button" onClick={() => setSubmitted(false)}>Review details</button>
                </div>
              </div> :

          <form className="join-form" onSubmit={onSubmit} noValidate aria-label="Membership request">
                <div className={"field" + (errors.name ? " error" : "")}>
                  <label htmlFor="join-name">Full name</label>
                  <input id="join-name" name="name" autoComplete="name" required value={form.name} onChange={set("name")} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "join-name-error" : undefined} />
                  {errors.name && <div className="err" id="join-name-error" role="alert">{errors.name}</div>}
                </div>
                <div className={"field" + (errors.email ? " error" : "")}>
                  <label htmlFor="join-email">University email</label>
                  <input id="join-email" name="email" type="email" inputMode="email" autoComplete="email" required value={form.email} onChange={set("email")} placeholder="name@ed.ac.uk" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "join-email-error" : undefined} />
                  {errors.email && <div className="err" id="join-email-error" role="alert">{errors.email}</div>}
                </div>
                <div className="field-row">
                  <div className={"field" + (errors.program ? " error" : "")}>
                    <label htmlFor="join-program">Research area</label>
                    <select id="join-program" name="research-area" required value={form.program} onChange={set("program")} aria-invalid={Boolean(errors.program)} aria-describedby={errors.program ? "join-program-error" : undefined}>
                      <option value="">Select…</option>
                      <option>Credit Research</option>
                      <option>Risk Management</option>
                      <option>Econometrics</option>
                      <option>Asset Pricing</option>
                      <option>Statistics</option>
                      <option>AI (Machine Learning & Deep Learning)</option>
                      <option>FinTech</option>
                      <option>Other</option>
                    </select>
                    {errors.program && <div className="err" id="join-program-error" role="alert">{errors.program}</div>}
                  </div>
                  <div className={"field" + (errors.year ? " error" : "")}>
                    <label htmlFor="join-year">Year of study</label>
                    <select id="join-year" name="year-of-study" required value={form.year} onChange={set("year")} aria-invalid={Boolean(errors.year)} aria-describedby={errors.year ? "join-year-error" : undefined}>
                      <option value="">Select…</option>
                      <option>Year 1</option><option>Year 2</option>
                      <option>Year 3</option><option>Year 4</option>
                      <option>Year 5+</option>
                    </select>
                    {errors.year && <div className="err" id="join-year-error" role="alert">{errors.year}</div>}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="join-interests">Research interests (optional)</label>
                  <textarea id="join-interests" name="research-interests" rows="3" value={form.interests} onChange={set("interests")} placeholder="One or two lines about your current research." />
                </div>
                <div className="submit-row">
                  <button type="submit" className="submit-btn">
                    Prepare email request
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" /></svg>
                  </button>
                  <span className="form-note">Opens your email app. Nothing is sent automatically.</span>
                </div>
              </form>
          }
          </div>
        </div>
      </section>);

}

// -------- FOOTER --------
function Footer() {
  return (
    <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <span className="dot" />
            <span>STATISTICS STUDY GROUP · UNIVERSITY OF EDINBURGH BUSINESS SCHOOL</span>
            <span style={{ color: "var(--rule)" }}>-</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#maintainers">Maintainers</a>
            <a href="#talks">Research Atlas</a>
            <a href="#posts">Posts</a>
            <a href="#join">Contact</a>
          </div>
        </div>
      </footer>);

}

// -------- TWEAKS --------
function Tweaks({ open, theme, hero, onTheme, onHero }) {
  if (!open) return null;
  const themes = [
  { id: "oxblood", color: "#6E1A1A" },
  { id: "ink", color: "#14130F" },
  { id: "forest", color: "#2D4A2A" }];

  return (
    <div className="tweaks-panel show">
        <div className="tw-title">Tweaks</div>
        <div className="tw-sub">Live design controls</div>
        <div className="tw-group">
          <div className="tw-label">Color theme</div>
          <div className="tw-swatches">
            {themes.map((t) =>
          <button key={t.id} className={"tw-swatch" + (theme === t.id ? " on" : "")}
          style={{ background: t.color }} onClick={() => onTheme(t.id)} aria-label={t.id} />
          )}
          </div>
        </div>
        <div className="tw-group">
          <div className="tw-label">Hero layout</div>
          <div className="tw-segmented">
            <button className={hero === "editorial" ? "on" : ""} onClick={() => onHero("editorial")}>Editorial</button>
            <button className={hero === "split" ? "on" : ""} onClick={() => onHero("split")}>Split</button>
          </div>
        </div>
      </div>);

}

// -------- APP --------
function App() {
  const [tweakOpen, setTweakOpen] = useState(false);
  const [theme, setTheme] = useState(window.TWEAK_DEFAULTS.theme);
  const [hero, setHero] = useState(window.TWEAK_DEFAULTS.hero);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Tweak host protocol
  useEffect(() => {
    const onMsg = (ev) => {
      const d = ev.data || {};
      if (d.type === "__activate_edit_mode") setTweakOpen(true);
      if (d.type === "__deactivate_edit_mode") setTweakOpen(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const persist = (edits) => {
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits }, "*");
  };

  // Reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {if (e.isIntersecting) e.target.classList.add("in");});
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [hero, theme]);

  return (
    <div id="top" data-screen-label="Statistics Study Group Home">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <Nav />
        <main id="main-content" tabIndex="-1">
          <Hero variant={hero} />
          <About />
          <Committee />
          <ResearchAtlas />
          <News />
          <Join />
        </main>
        <Footer />
        <Tweaks
        open={tweakOpen}
        theme={theme} hero={hero}
        onTheme={(t) => {setTheme(t);persist({ theme: t });}}
        onHero={(h) => {setHero(h);persist({ hero: h });}} />

      </div>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
