import { Globe2, Linkedin, Mail, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { ImprovementProposal, ProfileDocument } from "@shared/profile-document";

type Props = {
  document: ProfileDocument;
  proposal?: ImprovementProposal | null;
  publicMode?: boolean;
  onAsk?: () => void;
  onContact?: (kind: "email" | "linkedin" | "website") => void;
};

function proposedValue(
  proposal: ImprovementProposal | null | undefined,
  section: ImprovementProposal["section"],
  field: ImprovementProposal["field"],
  targetId: string | null,
  current: string | undefined,
) {
  const active = proposal?.section === section && proposal.field === field && proposal.targetId === targetId;
  return { value: active ? proposal.proposed : current, active };
}

function Suggested({ active }: { active: boolean }) {
  return active ? <span className="proxy-page__suggested">Suggested change</span> : null;
}

function Portrait({ document, className, fallback = true }: { document: ProfileDocument; className: string; fallback?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [document.identity.photoUrl]);
  if (document.identity.photoUrl && !failed) {
    return <img className={className} src={document.identity.photoUrl} alt={document.identity.name} onError={() => setFailed(true)} />;
  }
  if (!fallback) return null;
  return <div className="proxy-page__monogram" aria-hidden="true">{document.identity.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</div>;
}

function ContactActions({ document, onAsk, onContact }: Pick<Props, "document" | "onAsk" | "onContact">) {
  const { contact } = document;
  return (
    <div className="proxy-page__actions">
      {contact.showEmail && contact.email && (
        <a className="proxy-page__primary-action" href={`mailto:${contact.email}`} onClick={() => onContact?.("email")}>
          <Mail aria-hidden="true" /> Get in touch
        </a>
      )}
      {contact.showLinkedin && contact.linkedin && (
        <a className="proxy-page__secondary-action" href={contact.linkedin} target="_blank" rel="noreferrer" onClick={() => onContact?.("linkedin")}>
          <Linkedin aria-hidden="true" /> LinkedIn
        </a>
      )}
      {contact.showWebsite && contact.website && (
        <a className="proxy-page__secondary-action" href={contact.website} target="_blank" rel="noreferrer" onClick={() => onContact?.("website")}>
          <Globe2 aria-hidden="true" /> Website
        </a>
      )}
      {document.publicBotEnabled && onAsk && (
        <button className="proxy-page__secondary-action" type="button" onClick={onAsk}>
          <MessageCircle aria-hidden="true" /> Ask about my work · AI
        </button>
      )}
    </div>
  );
}

function Editorial({ document, proposal, onAsk, onContact }: Props) {
  const headline = proposedValue(proposal, "headline", "headline", null, document.identity.headline);
  const summary = proposedValue(proposal, "summary", "summary", null, document.identity.summary);
  return (
    <div className="proxy-page proxy-page--editorial">
      <header className="proxy-page__hero proxy-page__hero--editorial">
        <div className="proxy-page__identity">
          <p className="proxy-page__eyebrow">{document.identity.title}</p>
          <h1>{document.identity.name}</h1>
          <div className={headline.active ? "proxy-page__changed" : ""}>
            <Suggested active={headline.active} />
            <h2>{headline.value}</h2>
          </div>
          <div className={summary.active ? "proxy-page__changed" : ""}>
            <Suggested active={summary.active} />
            <p className="proxy-page__lede">{summary.value}</p>
          </div>
          <ContactActions document={document} onAsk={onAsk} onContact={onContact} />
        </div>
        <Portrait document={document} className="proxy-page__portrait" />
      </header>

      {document.projects.length > 0 && (
        <section className="proxy-page__section" id="selected-work">
          <div className="proxy-page__section-heading">
            <h3>Selected work</h3><p>Real projects. Meaningful contribution.</p>
          </div>
          <div className="proxy-page__project-grid">
            {document.projects.map((project, index) => {
              const challenge = proposedValue(proposal, "project", "challenge", project.id, project.challenge);
              const contribution = proposedValue(proposal, "project", "contribution", project.id, project.contribution);
              const outcome = proposedValue(proposal, "project", "outcome", project.id, project.outcome);
              return (
                <article className="proxy-page__project" key={project.id}>
                  <p className="proxy-page__project-number">{String(index + 1).padStart(2, "0")}</p>
                  <h4>{project.title}</h4>
                  {challenge.value && <div className={challenge.active ? "proxy-page__changed" : ""}><Suggested active={challenge.active} /><span>The situation</span><p>{challenge.value}</p></div>}
                  {contribution.value && <div className={contribution.active ? "proxy-page__changed" : ""}><Suggested active={contribution.active} /><span>My contribution</span><p>{contribution.value}</p></div>}
                  {outcome.value && <div className={outcome.active ? "proxy-page__changed" : ""}><Suggested active={outcome.active} /><span>What changed</span><p>{outcome.value}</p></div>}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="proxy-page__section proxy-page__experience">
        <div className="proxy-page__section-heading"><h3>Experience</h3></div>
        {document.experience.map((role) => {
          const summary = proposedValue(proposal, "experience", "summary", role.id, role.summary);
          return (
            <article key={role.id}>
              <div><h4>{role.title}</h4><p>{role.company}</p></div>
              <div><time>{role.period}</time>{summary.value && <p className={summary.active ? "proxy-page__changed" : ""}><Suggested active={summary.active} />{summary.value}</p>}{role.highlights.slice(0, 3).map((item) => <p className="proxy-page__highlight" key={item}>{item}</p>)}</div>
            </article>
          );
        })}
      </section>

      {document.skills.length > 0 && <section className="proxy-page__section proxy-page__skills"><h3>Areas of strength</h3><div>{document.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>}
    </div>
  );
}

function Modern({ document, proposal, onAsk, onContact }: Props) {
  const headline = proposedValue(proposal, "headline", "headline", null, document.identity.headline);
  const summary = proposedValue(proposal, "summary", "summary", null, document.identity.summary);
  return (
    <div className="proxy-page proxy-page--modern">
      <header className="proxy-page__modern-header">
        <div className="proxy-page__modern-name"><span>{document.identity.name}</span><small>{document.identity.title}</small></div>
        <ContactActions document={document} onAsk={onAsk} onContact={onContact} />
      </header>
      <section className={`proxy-page__modern-intro ${document.identity.photoUrl ? "proxy-page__modern-intro--portrait" : ""}`}>
        <p className="proxy-page__eyebrow">Professional profile / {document.identity.location || "Selected work"}</p>
        <div className={headline.active ? "proxy-page__changed" : ""}><Suggested active={headline.active} /><h1>{headline.value}</h1></div>
        <div className={`proxy-page__modern-summary ${summary.active ? "proxy-page__changed" : ""}`}><Suggested active={summary.active} /><p>{summary.value}</p></div>
        <Portrait document={document} className="proxy-page__modern-portrait" fallback={false} />
      </section>
      {document.projects.length > 0 && <section className="proxy-page__modern-work"><p className="proxy-page__side-label">Selected work</p><div>{document.projects.map((project, index) => {
        const challenge = proposedValue(proposal, "project", "challenge", project.id, project.challenge);
        const contribution = proposedValue(proposal, "project", "contribution", project.id, project.contribution);
        const outcome = proposedValue(proposal, "project", "outcome", project.id, project.outcome);
        return <article key={project.id}><p className="proxy-page__project-number">0{index + 1}</p><h2>{project.title}</h2>{challenge.value && <div className={challenge.active ? "proxy-page__changed" : ""}><Suggested active={challenge.active} /><span>Context</span><p>{challenge.value}</p></div>}{contribution.value && <div className={contribution.active ? "proxy-page__changed" : ""}><Suggested active={contribution.active} /><span>Contribution</span><p>{contribution.value}</p></div>}{outcome.value && <div className={outcome.active ? "proxy-page__changed" : ""}><Suggested active={outcome.active} /><span>Outcome</span><p>{outcome.value}</p></div>}</article>;
      })}</div></section>}
      <section className="proxy-page__modern-bottom">
        <div><p className="proxy-page__side-label">Experience</p>{document.experience.map((role) => <article key={role.id}><h3>{role.title}</h3><p>{role.company}</p><time>{role.period}</time></article>)}</div>
        {document.skills.length > 0 && <div><p className="proxy-page__side-label">Capabilities</p><div className="proxy-page__modern-skills">{document.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>}
      </section>
    </div>
  );
}

function Expressive({ document, proposal, onAsk, onContact }: Props) {
  const headline = proposedValue(proposal, "headline", "headline", null, document.identity.headline);
  const summary = proposedValue(proposal, "summary", "summary", null, document.identity.summary);
  return (
    <div className="proxy-page proxy-page--expressive">
      <header className={`proxy-page__expressive-hero ${document.identity.photoUrl ? "proxy-page__expressive-hero--portrait" : ""}`}>
        <div className="proxy-page__expressive-mark" aria-hidden="true"><span /><span /></div>
        <p className="proxy-page__eyebrow">{document.identity.title}</p>
        <h1>{document.identity.name}</h1>
        <div className={headline.active ? "proxy-page__changed" : ""}><Suggested active={headline.active} /><h2>{headline.value}</h2></div>
        <div className={summary.active ? "proxy-page__changed" : ""}><Suggested active={summary.active} /><p>{summary.value}</p></div>
        <ContactActions document={document} onAsk={onAsk} onContact={onContact} />
        <Portrait document={document} className="proxy-page__expressive-portrait" fallback={false} />
      </header>
      {document.projects.length > 0 && <section className="proxy-page__expressive-work"><div className="proxy-page__section-heading"><h3>Selected work</h3><p>Context, contribution, change.</p></div>{document.projects.map((project, index) => {
        const challenge = proposedValue(proposal, "project", "challenge", project.id, project.challenge);
        const contribution = proposedValue(proposal, "project", "contribution", project.id, project.contribution);
        const outcome = proposedValue(proposal, "project", "outcome", project.id, project.outcome);
        return <article key={project.id}><div><span>{String(index + 1).padStart(2, "0")}</span><h4>{project.title}</h4></div><div>{challenge.value && <div className={challenge.active ? "proxy-page__changed" : ""}><Suggested active={challenge.active} /><b>The situation</b><p>{challenge.value}</p></div>}{contribution.value && <div className={contribution.active ? "proxy-page__changed" : ""}><Suggested active={contribution.active} /><b>My contribution</b><p>{contribution.value}</p></div>}{outcome.value && <div className={outcome.active ? "proxy-page__changed" : ""}><Suggested active={outcome.active} /><b>What changed</b><p>{outcome.value}</p></div>}</div></article>;
      })}</section>}
      <section className="proxy-page__expressive-bottom"><div><h3>Career</h3>{document.experience.map((role) => <article key={role.id}><time>{role.period}</time><h4>{role.title}</h4><p>{role.company}</p></article>)}</div>{document.skills.length > 0 && <div><h3>Strengths</h3><p>{document.skills.join(" / ")}</p></div>}</section>
    </div>
  );
}

export default function ProfileDocumentView(props: Props) {
  if (props.document.style === "modern") return <Modern {...props} />;
  if (props.document.style === "expressive") return <Expressive {...props} />;
  return <Editorial {...props} />;
}
