import { createRoot } from "react-dom/client";
import { Check, Menu, Sparkles, X } from "lucide-react";
import ProfileDocumentView from "./components/profile-document-view";
import { visualProfileFixture } from "./lib/profile-document-fixtures";
import type { ProfileStyle } from "@shared/profile-document";
import "./index.css";

const params = new URLSearchParams(window.location.search);
const requested = params.get("style");
const style: ProfileStyle = requested === "executive" || requested === "editorial" || requested === "modern" || requested === "expressive" ? requested : "executive";
const profile = visualProfileFixture(style);
if (params.get("content") === "sparse") {
  profile.projects = [];
  profile.experience = profile.experience.slice(0, 1);
  profile.skills = [];
}
if (params.get("content") === "one") {
  profile.projects = profile.projects.slice(0, 1);
}
if (params.get("content") === "three") {
  profile.projects = profile.projects.slice(0, 3);
}
if (params.get("content") === "maximum") {
  profile.identity.headline = "Building dependable regional services through disciplined, human-centred transformation.";
  profile.projects = Array.from({ length: 8 }, (_, index) => ({
    ...profile.projects[index % profile.projects.length],
    id: `maximum-project-${index + 1}`,
    title: `${profile.projects[index % profile.projects.length].title} — portfolio example ${index + 1}`,
  }));
  profile.skills = Array.from({ length: 40 }, (_, index) => `Supported capability ${index + 1}`);
}
if (params.get("photo") === "present") profile.identity.photoUrl = "/proxy-logo.png";
if (params.get("photo") === "broken") profile.identity.photoUrl = "/missing-portrait.jpg";
const panelOpen = params.get("panel") !== "closed";

function VisualTest() {
  if (!panelOpen) {
    return <main className="builder-preview-mode">
      <header><span>Visitor preview · unpublished test fixture</span></header>
      <ProfileDocumentView document={profile}/>
    </main>;
  }

  return <main className="builder-shell">
    <header className="builder-topbar"><div className="builder-back"><span>←</span><b>Proxy</b></div><div><span className="builder-save-state">All changes saved</span><button className="builder-menu" aria-label="Open editing panel"><Menu /></button></div></header>
    <div className="builder-workspace">
      <section className="builder-canvas"><div className="builder-browser"><span/><span/><span/><small>myproxy.work/portfolio/maya</small></div><ProfileDocumentView document={profile}/></section>
      <aside className={`builder-panel ${panelOpen ? "builder-panel--open" : ""}`}>
        <div className="builder-panel-head"><div><p>Your page</p><span>Private draft</span></div><button aria-label="Close editing panel"><X /></button></div>
        <nav><button className="active">improve</button><button>edit</button><button>style</button><button>settings</button></nav>
        <div className="builder-panel-body"><p className="builder-panel-kicker"><Sparkles/> Make this page yours</p><div className="builder-question"><span>Building one operating model · Northstar Services</span><p className="builder-source-context"><b>From your CV</b> Led regional service operations and introduced a shared operating model across six markets.</p><h2>Before you introduced the shared model, what was difficult for the country teams?</h2><textarea placeholder="A few honest sentences are enough."/><button className="builder-primary"><Sparkles/> Show the improvement</button><button className="builder-text-button">Skip this question</button></div></div>
        <footer><button className="builder-primary"><Check/> Review this version</button></footer>
      </aside>
    </div>
  </main>;
}

createRoot(document.getElementById("root")!).render(<VisualTest/>);
