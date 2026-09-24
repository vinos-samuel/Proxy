import { createRoot } from "react-dom/client";
import { Check, Menu, Sparkles, X } from "lucide-react";
import ProfileDocumentView from "./components/profile-document-view";
import { visualProfileFixture } from "./lib/profile-document-fixtures";
import type { ProfileStyle } from "@shared/profile-document";
import "./index.css";

const params = new URLSearchParams(window.location.search);
const requested = params.get("style");
const style: ProfileStyle = requested === "modern" || requested === "expressive" ? requested : "editorial";
const profile = visualProfileFixture(style);
if (params.get("content") === "sparse") {
  profile.projects = [];
  profile.experience = profile.experience.slice(0, 1);
  profile.skills = [];
}
if (params.get("photo") === "present") profile.identity.photoUrl = "/proxy-logo.png";
if (params.get("photo") === "broken") profile.identity.photoUrl = "/missing-portrait.jpg";
const panelOpen = params.get("panel") !== "closed";

function VisualTest() {
  return <main className="builder-shell">
    <header className="builder-topbar"><div className="builder-back"><span>←</span><b>Proxy</b></div><div><span className="builder-save-state">Draft saved</span><button className="builder-menu"><Menu /></button></div></header>
    <div className="builder-workspace">
      <section className="builder-canvas"><div className="builder-browser"><span/><span/><span/><small>myproxy.work/portfolio/maya</small></div><ProfileDocumentView document={profile}/></section>
      <aside className={`builder-panel ${panelOpen ? "builder-panel--open" : ""}`}>
        <div className="builder-panel-head"><div><p>Your page</p><span>Revision 4</span></div><button><X /></button></div>
        <nav><button className="active">improve</button><button>edit</button><button>style</button><button>settings</button></nav>
        <div className="builder-panel-body"><p className="builder-panel-kicker"><Sparkles/> Make one part stronger</p><div className="builder-question"><span>Regional operating model</span><h2>What changed because of your work?</h2><textarea placeholder="A few honest sentences are enough."/><button className="builder-primary"><Sparkles/> Show the improvement</button><button className="builder-text-button">Skip this question</button></div></div>
        <footer><button className="builder-primary"><Check/> Approve this version</button></footer>
      </aside>
    </div>
  </main>;
}

createRoot(document.getElementById("root")!).render(<VisualTest/>);
