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
import type { ProfileStyle } from "@shared/profile-document";

// Demo account the hero widget mirrors. Kept as one constant so the widget
// and the "see the full profile" link can never point at different accounts.
const HERO_DEMO_USERNAME = "priya";
const MAX_CV_BYTES = 5 * 1024 * 1024;

interface HeroProfile {
  displayName: string;
  roleLine: string;
  photoUrl: string | null;
  suggestedQuestions: string[];
}

// Shown until the live fetch resolves, and if it ever fails — matches her
// real profile. The live fetch keeps this from drifting.
const HERO_PROFILE_FALLBACK: HeroProfile = {
  displayName: "Priya Sharma",
  roleLine: "VP, Talent Acquisition & Workforce Strategy — Nexora Group",
  photoUrl: null,
  suggestedQuestions: [
    "What do you see as the biggest emerging challenge in talent acquisition for the APAC region?",
    "How do you leverage data and analytics to inform your talent strategy decisions?",
  ],
};

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
  // Live chat-in-hero — ask the demo profile a real question, no click-through.
  // Uses the same public, unauthenticated /api/chat/:username endpoint the
  // portfolio page itself uses.
  const [heroQuestion, setHeroQuestion] = useState("");
  const [heroAsked, setHeroAsked] = useState("");
  const [heroAnswer, setHeroAnswer] = useState("");
  const [heroAsking, setHeroAsking] = useState(false);
  const [heroProfile, setHeroProfile] = useState<HeroProfile>(HERO_PROFILE_FALLBACK);

  // Name, role line, photo and suggested questions are fetched live from the
  // same public /api/portfolio/:username endpoint the real page uses — never
  // hardcoded — so the hero can't drift out of sync with her actual profile.
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
        const questions = (p.portfolioSuggestedQuestions || []).slice(0, 2);
        setHeroProfile({
          displayName: p.displayName || HERO_PROFILE_FALLBACK.displayName,
          roleLine: roleLine || HERO_PROFILE_FALLBACK.roleLine,
          photoUrl: p.photoUrl || null,
          suggestedQuestions: questions.length ? questions : HERO_PROFILE_FALLBACK.suggestedQuestions,
        });
      })
      .catch((err) => {
        // Network failure — keep HERO_PROFILE_FALLBACK, no visible error to the visitor.
        console.error(`[hero] /api/portfolio/${HERO_DEMO_USERNAME} fetch failed`, err);
      });
  }, []);

  const askHeroDemo = async (question: string) => {
    const text = question.trim();
    if (!text || heroAsking) return;
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
          <h1 className="site-display landing-h1" data-testid="text-hero-headline">
            Your CV can't answer questions. <em>Your page can.</em>
          </h1>
          <p className="landing-sub">Upload your CV. See your finished page in a minute, then share one link.</p>
          <CvDrop id="hero-cv" />
          <p className="landing-trust">Free · No account needed to try · Private until you publish</p>
        </div>

        <div className="landing-demo" aria-label={`Live example: ${heroProfile.displayName}'s page`}>
          <div className="landing-demo-top">
            <span>myproxy.work/portfolio/{HERO_DEMO_USERNAME}</span>
            <span className="landing-live"><i />Live</span>
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
              {heroProfile.suggestedQuestions.map((q, i) => (
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
        <h2 className="site-display landing-h2">Three steps. The first one takes a minute.</h2>
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
            <p>No hosting or domain to set up. Put it in your email signature, on LinkedIn, or send it instead of a CV.</p>
          </li>
        </ol>
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
          <figure>
            <blockquote className="site-display">"That context made the AI bot sound surprisingly like me — not like a generic career assistant."</blockquote>
            <figcaption><b>Steven Bong</b> · TA Strategy, Airtable</figcaption>
          </figure>
          <figure>
            <blockquote className="site-display">"The designs are clean and genuinely make your career look more interesting than a traditional CV ever could."</blockquote>
            <figcaption><b>John Lima</b> · Portfolio Manager, HSBC</figcaption>
          </figure>
        </div>
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
            <div className="landing-price-head"><h3>Pro</h3><b data-testid="text-price-pro">$49</b><span>one-time, no subscription</span></div>
            <ul>
              <li><Check /> Everything in Free</li>
              <li><Check /> Unlimited edits</li>
              <li><Check /> See the questions visitors ask</li>
            </ul>
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
