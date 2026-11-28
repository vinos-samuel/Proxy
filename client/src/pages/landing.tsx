import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Check, Loader2, Upload } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";
import { TalkingO } from "@/components/ProxyLogo";
import ProfileDocumentView from "@/components/profile-document-view";
import { getCsrfToken } from "@/lib/queryClient";
import { renderAnswer } from "@/lib/renderAnswer";
import { setPendingCvUpload } from "@/lib/pending-cv-upload";
import { visualProfileFixture } from "@/lib/profile-document-fixtures";
import { useAuth } from "@/lib/auth";
import { PRO_BUTTON_LABEL, PRO_FEATURES, PRO_FOR } from "@/lib/pro-plan";
import { PRIYA_REVIEWED_QUESTIONS, reviewedPriyaAnswer } from "@shared/priya-reviewed-answers";
import type { ProfileStyle } from "@shared/profile-document";

// Demo account the hero widget mirrors. Kept as one constant so the widget
// and the "see the full profile" link can never point at different accounts.
const HERO_DEMO_USERNAME = "priya";

function captureLandingCard() {
  const posthog = (window as any).posthog;
  if (posthog?.capture) posthog.capture("landing_work_cards_start");
}
const MAX_CV_BYTES = 5 * 1024 * 1024;

interface HeroProfile {
  displayName: string;
  roleLine: string;
  photoUrl: string | null;
}

function Quote({ quote, name, role, href, photoUrl }: { quote: string; name: string; role: string; href?: string; photoUrl?: string }) {
  return (
    <figure>
      {photoUrl ? <img src={photoUrl} alt="" /> : null}
      <blockquote className="site-display">{quote}</blockquote>
      <figcaption>
        {href ? <a href={href}><b>{name}</b></a> : <b>{name}</b>} · {role}
      </figcaption>
    </figure>
  );
}

// Shown until the live fetch resolves, and if it ever fails — matches her
// real profile. The live fetch keeps this from drifting.
const HERO_PROFILE_FALLBACK: HeroProfile = {
  displayName: "Priya Sharma",
  roleLine: "VP, Talent Acquisition & Workforce Strategy — Nexora Group",
  photoUrl: null,
};
const HERO_SAMPLE_QUESTIONS = PRIYA_REVIEWED_QUESTIONS.slice(0, 2);

const DESIGNS: Array<{ key: ProfileStyle; label: string; mood: string }> = [
  { key: "executive", label: "Executive", mood: "Confident and proven" },
  { key: "editorial", label: "Editorial", mood: "Quiet and considered" },
  { key: "modern", label: "Modern", mood: "Clear and structured" },
  { key: "expressive", label: "Expressive", mood: "Warm and distinctive" },
];

function CvDrop({ id, compact = false }: { id: string; compact?: boolean }) {
  const [, navigate] = useLocation();
  const [problem, setProblem] = useState("");
  const [dragging, setDragging] = useState(false);

  const choose = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setProblem("Please choose a PDF. Most CV tools can export one.");
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      setProblem("That file is over 5 MB. Try exporting the PDF again without images.");
      return;
    }
    setPendingCvUpload(file);
    navigate("/try");
  };

  return (
    <div>
      <label
        htmlFor={id}
        className={`landing-drop ${dragging ? "is-dragging" : ""} ${compact ? "landing-drop--compact" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files?.[0]); }}
        data-testid={`${id}-drop`}
      >
        <span className="site-btn"><Upload /> Upload your CV</span>
        <small>or drop a PDF here · up to 5 MB</small>
        <input id={id} type="file" accept="application/pdf" onChange={(event) => choose(event.target.files?.[0])} />
      </label>
      {problem && <p className="landing-drop-problem" role="alert">{problem}</p>}
    </div>
  );
}

function DesignShowcase() {
  const [style, setStyle] = useState<ProfileStyle>("executive");
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const sample = visualProfileFixture(style);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setScale(frame.clientWidth / 1120);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-designs">
      <div className="landing-design-tabs" role="tablist" aria-label="Page designs">
        {DESIGNS.map((design) => (
          <button
            key={design.key}
            role="tab"
            aria-selected={style === design.key}
            className={style === design.key ? "is-active" : ""}
            onClick={() => setStyle(design.key)}
          >
            <b>{design.label}</b>
            <span>{design.mood}</span>
          </button>
        ))}
      </div>
      <div className="landing-design-frame" ref={frameRef} aria-label={`Sample page in the ${style} design`}>
        <div className="landing-design-scaler" style={{ transform: `scale(${scale})` }} aria-hidden="true">
          <ProfileDocumentView document={sample} />
        </div>
        <span className="landing-design-note">Sample page</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user, isLoading: authLoading } = useAuth();
  // Checkout needs an account and a page that is ready to publish.
  // A logged-out visitor uploads a CV first. A logged-in visitor goes to
  // the dashboard, which opens the existing upgrade or publish choice.
  const proHref = !authLoading && user ? "/dashboard#upgrade" : "/try";
  // Live chat-in-hero — ask the demo profile a real question, no click-through.
  // Uses the same public, unauthenticated /api/chat/:username endpoint the
  // portfolio page itself uses.
  const [heroQuestion, setHeroQuestion] = useState("");
  const [heroAsked, setHeroAsked] = useState("");
  const [heroAnswer, setHeroAnswer] = useState("");
  const [heroAsking, setHeroAsking] = useState(false);
  const [heroProfile, setHeroProfile] = useState<HeroProfile>(HERO_PROFILE_FALLBACK);

  // Name, role line and photo are fetched live. The question chips are a
  // fixed reviewed set, so the demo cannot invent figures that are not on her page.
  useEffect(() => {
    fetch(`/api/portfolio/${HERO_DEMO_USERNAME}`)
      .then((res) => {
        if (!res.ok) {
          console.error(`[hero] /api/portfolio/${HERO_DEMO_USERNAME} → ${res.status}`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        const p = data?.profile;
        if (!p) return;
        const roleLine = [p.roleTitle, p.careerTimeline?.[0]?.company].filter(Boolean).join(" — ");
        setHeroProfile({
          displayName: p.displayName || HERO_PROFILE_FALLBACK.displayName,
          roleLine: roleLine || HERO_PROFILE_FALLBACK.roleLine,
          photoUrl: p.photoUrl || null,
        });
      })
      .catch((err) => {
        // Network failure — keep HERO_PROFILE_FALLBACK, no visible error to the visitor.
        console.error(`[hero] /api/portfolio/${HERO_DEMO_USERNAME} fetch failed`, err);
      });
  }, []);

  const [location] = useLocation();
  useEffect(() => {
    if (location !== "/pricing" && window.location.hash !== "#pricing") return;
    const node = document.getElementById("pricing");
    if (!node) return;
    const nav = document.querySelector(".site-nav");
    const offset = nav instanceof HTMLElement ? nav.offsetHeight + 8 : 0;
    const top = node.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "auto" });
  }, [location]);

  const askHeroDemo = async (question: string) => {
    const text = question.trim();
    if (!text || heroAsking) return;
    const reviewed = reviewedPriyaAnswer(text);
    if (reviewed) {
      setHeroAsked(text);
      setHeroQuestion("");
      setHeroAnswer(reviewed);
      return;
    }
    setHeroAsking(true);
    setHeroAsked(text);
    setHeroQuestion("");
    setHeroAnswer("");
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(`/api/chat/${HERO_DEMO_USERNAME}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({ message: text }),
      });
      if (!response.ok) {
        console.error(`[hero] /api/chat/${HERO_DEMO_USERNAME} → ${response.status}`);
        setHeroAnswer(
          response.status === 429
            ? "This demo is getting a lot of questions right now. Give it a minute, or ask on her full page."
            : "That's worth a real answer. Ask it on her full page."
        );
        return;
      }
      const data = await response.json();
      setHeroAnswer(data.content || "That's worth a real answer. Ask it on her full page.");
    } catch (err) {
      console.error(`[hero] /api/chat/${HERO_DEMO_USERNAME} request failed`, err);
      setHeroAnswer("That's worth a real answer. Ask it on her full page.");
    } finally {
      setHeroAsking(false);
    }
  };

  return (
    <div className="site">
      <SiteNav />

      {/* 1. Hero */}
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-for">For mid-to-senior professionals who are job hunting now.</p>
          <h1 className="site-display landing-h1" data-testid="text-hero-headline">
            Turn your CV into a portfolio webpage recruiters can ask questions
          </h1>
          <p className="landing-sub">Upload your CV. See your finished page in a minute, then send the link with a referral ask.</p>
          <CvDrop id="hero-cv" />
          <p className="landing-trust">Free · No account needed to try · Private until you publish</p>
        </div>

        <div className="landing-demo" aria-label={`Live example: ${heroProfile.displayName}'s page`}>
          <div className="landing-demo-top">
            <span>myproxy.work/portfolio/{HERO_DEMO_USERNAME}</span>
            <span className="landing-live-wrap">
              <span className="landing-live"><i />Live</span>
              <span className="landing-sample-line">Sample page, fictional person</span>
            </span>
          </div>
          <div className="landing-demo-who">
            {heroProfile.photoUrl
              ? <img src={heroProfile.photoUrl} alt="" />
              : <span className="landing-demo-initial">{heroProfile.displayName.charAt(0)}</span>}
            <div>
              <b>{heroProfile.displayName}</b>
              <small>{heroProfile.roleLine}</small>
            </div>
          </div>
          <div className="landing-demo-chat" aria-live="polite">
            {!heroAsked && <p className="landing-demo-hint">Ask her page anything about her work. It answers from what she approved.</p>}
            {heroAsked && <p className="landing-q">{heroAsked}</p>}
            {heroAsking && <p className="landing-a landing-a--typing"><TalkingO className="landing-typing" /> Answering…</p>}
            {heroAnswer && <div className="landing-a" data-testid="text-hero-answer">{renderAnswer(heroAnswer)}</div>}
          </div>
          {!heroAsked && (
            <div className="landing-demo-chips">
              {HERO_SAMPLE_QUESTIONS.map((q, i) => (
                <button key={i} type="button" onClick={() => askHeroDemo(q)} data-testid={`button-hero-suggestion-${i}`}>{q}</button>
              ))}
            </div>
          )}
          <form className="landing-demo-ask" onSubmit={(event) => { event.preventDefault(); askHeroDemo(heroQuestion); }}>
            <label htmlFor="hero-question" className="sr-only">Ask Priya's page a question</label>
            <input
              id="hero-question"
              value={heroQuestion}
              onChange={(event) => setHeroQuestion(event.target.value)}
              placeholder="Ask about a project, a decision, a result…"
              data-testid="input-hero-chat"
            />
            <button type="submit" disabled={heroAsking || !heroQuestion.trim()} data-testid="button-hero-chat-send">
              {heroAsking ? <Loader2 className="animate-spin" /> : "Ask"}
            </button>
          </form>
          <a className="landing-demo-link" href={`/portfolio/${HERO_DEMO_USERNAME}`}>See her full page <ArrowRight /></a>
        </div>
      </section>

      {/* 2. How it works */}
      <section id="how" className="landing-section">
        <p className="site-eyebrow">How it works</p>
        <h2 className="site-display landing-h2">Three steps. Your page is ready before any card.</h2>
        <ol className="landing-steps">
          <li>
            <span className="landing-step-n">1</span>
            <h3>Upload your CV</h3>
            <p>Proxy turns it into a finished page before you answer a single question.</p>
          </li>
          <li>
            <span className="landing-step-n">2</span>
            <h3>Answer a question or two</h3>
            <p>Optional. Each answer makes a section stronger and teaches your page to answer visitors.</p>
          </li>
          <li>
            <span className="landing-step-n">3</span>
            <h3>Publish and share one link</h3>
            <p>No hosting or domain to set up. Put it in your email signature, on LinkedIn, or send the page with your CV and a referral ask.</p>
          </li>
        </ol>
      </section>

      <section className="landing-section" id="work-cards">
        <p className="site-eyebrow">Work cards</p>
        <h2 className="site-display landing-h2">Show how you work, not just where you've worked.</h2>
        <p className="landing-sub">A CV is easy to skim. A card is a short story of a problem you solved, written once, in your words.</p>
        <div className="landing-card-points">
          <article className="site-card"><h3>A CV says where. A card shows how.</h3><p>A CV lists roles. A card walks through one real piece of work: what was happening, what you did, and what changed. That is what a hiring manager already asks about in the interview.</p></article>
          <article className="site-card"><h3>Write the story once.</h3><p>You would prepare this for interviews anyway. Do it early. When a recruiter asks your page about that work, it can answer from the card you approved.</p></article>
          <article className="site-card"><h3>Start with one card.</h3><p>One short sitting is enough to finish the first. Then add 3 cards to show range — different problems, not three versions of the same story.</p></article>
        </div>
        <ol className="landing-steps">
          <li><span className="landing-step-n">1</span><h3>Pick one piece of work</h3><p>Choose something real from the CV page, or add your own.</p></li>
          <li><span className="landing-step-n">2</span><h3>Tell the story</h3><p>The problem, what you did, what changed, and one sentence on what you would do differently.</p></li>
          <li><span className="landing-step-n">3</span><h3>Mark it accurate, then publish</h3><p>Only cards you mark accurate go on the live page.</p></li>
        </ol>
        <p><Link href="/try" className="site-btn" onClick={() => captureLandingCard()}>Start with one card</Link></p>
        <p className="landing-trust">Nothing goes public until you publish.</p>
      </section>

      {/* 3. Designs */}
      <section className="landing-section">
        <p className="site-eyebrow">Designs</p>
        <h2 className="site-display landing-h2">Four designs. Same career. Switch any time.</h2>
        <DesignShowcase />
      </section>

      {/* 4. What early users say */}
      <section className="landing-section">
        <p className="site-eyebrow">Early users</p>
        <div className="landing-quotes">
          <Quote quote={'"That context made the AI bot sound surprisingly like me — not like a generic career assistant."'} name="Steven Bong" role="TA Strategy, Airtable" />
          <Quote quote={'"The designs are clean and genuinely make your career look more interesting than a traditional CV ever could."'} name="John Lima" role="Portfolio Manager, HSBC" />
        </div>
        <p className="landing-founder">Built by Vinos Samuel. 15+ years in APAC HR operations and talent acquisition at Netflix, Cielo, and Randstad Sourceright. <Link href="/about">Read the about page</Link>.</p>
      </section>

      {/* 5. Pricing + final call to action */}
      <section id="pricing" className="landing-section">
        <p className="site-eyebrow">Pricing</p>
        <h2 className="site-display landing-h2">Start free. Pay once if you want more.</h2>
        <div className="landing-prices">
          <div className="site-card landing-price" data-testid="card-tier-free">
            <div className="landing-price-head"><h3>Free</h3><b>$0</b></div>
            <ul>
              <li><Check /> Your page and your own link</li>
              <li><Check /> Visitors can ask your page questions</li>
              <li><Check /> 7 days of edits after you publish</li>
              <li><Check /> View count</li>
            </ul>
          </div>
          <div className="site-card landing-price landing-price--pro" data-testid="card-tier-pro">
            <div className="landing-price-head"><h3>Pro</h3><b data-testid="text-price-pro">$49</b><span>paid once</span></div>
            <p className="landing-price-for">{PRO_FOR}</p>
            <ul>
              {PRO_FEATURES.map((feature) => <li key={feature}><Check /> {feature}</li>)}
              <li><Check /> Everything in Free</li>
            </ul>
            <Link className="site-btn" href={proHref} data-testid="button-get-pro">{PRO_BUTTON_LABEL}</Link>
            {!authLoading && !user && <p className="landing-price-note">Upload your CV first. Checkout opens once your page is ready.</p>}
          </div>
        </div>
        <div className="landing-final">
          <h2 className="site-display" data-testid="text-final-cta">Try it with your CV. It's free.</h2>
          <CvDrop id="final-cv" compact />
          <p className="site-faint">Questions first? <Link className="site-link" href="/faq">Read the FAQ</Link></p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
