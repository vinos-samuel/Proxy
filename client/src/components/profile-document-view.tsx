import { ChevronDown, Globe2, Linkedin, Mail, MessageCircle, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ImprovementProposal, ProfileDocument } from "@shared/profile-document";

type Props = {
  document: ProfileDocument;
  proposal?: ImprovementProposal | null;
  publicMode?: boolean;
  onAsk?: () => void;
  onContact?: (kind: "email" | "linkedin" | "website") => void;
  onEdit?: (section: "introduction" | "project" | "experience" | "skills" | "details", id?: string) => void;
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

function EditButton({ label, onClick }: { label: string; onClick?: () => void }) {
  if (!onClick) return null;
  return <button className="proxy-page__edit" type="button" onClick={onClick}><Pencil aria-hidden="true" /> {label}</button>;
}

function Portrait({ document }: { document: ProfileDocument }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [document.identity.photoUrl]);
  if (!document.identity.photoUrl || failed) return null;
  return <img className="proxy-page__portrait" src={document.identity.photoUrl} alt={document.identity.name} onError={() => setFailed(true)} />;
}

function ContactActions({ document, onAsk, onContact }: Pick<Props, "document" | "onAsk" | "onContact">) {
  const { contact } = document;
  const hasActions = Boolean(
    (contact.showEmail && contact.email) ||
    (contact.showLinkedin && contact.linkedin) ||
    (contact.showWebsite && contact.website) ||
    (document.publicBotEnabled && onAsk),
  );
  if (!hasActions) return null;
  return <div className="proxy-page__actions">
    {contact.showEmail && contact.email && <a className="proxy-page__primary-action" href={`mailto:${contact.email}`} onClick={() => onContact?.("email")}><Mail aria-hidden="true" /> Get in touch</a>}
    {contact.showLinkedin && contact.linkedin && <a className="proxy-page__secondary-action" href={contact.linkedin} target="_blank" rel="noreferrer" onClick={() => onContact?.("linkedin")}><Linkedin aria-hidden="true" /> LinkedIn</a>}
    {contact.showWebsite && contact.website && <a className="proxy-page__secondary-action" href={contact.website} target="_blank" rel="noreferrer" onClick={() => onContact?.("website")}><Globe2 aria-hidden="true" /> Website</a>}
    {document.publicBotEnabled && onAsk && <button className="proxy-page__secondary-action" type="button" onClick={onAsk}><MessageCircle aria-hidden="true" /> Ask about my work <small>AI</small></button>}
  </div>;
}

function groupExperience(document: ProfileDocument) {
  const groups: Array<{ company: string; roles: ProfileDocument["experience"] }> = [];
  for (const role of document.experience) {
    const existing = groups.find((group) => group.company.trim().toLowerCase() === role.company.trim().toLowerCase());
    if (existing) existing.roles.push(role);
    else groups.push({ company: role.company, roles: [role] });
  }
  return groups;
}

function DetailGroup({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <div><h4>{title}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

export default function ProfileDocumentView({ document, proposal, onAsk, onContact, onEdit }: Props) {
  const [openProject, setOpenProject] = useState<string | null>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [openEmployers, setOpenEmployers] = useState<string[]>([]);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const projectButtons = useRef(new Map<string, HTMLButtonElement>());
  const headline = proposedValue(proposal, "headline", "headline", null, document.identity.headline);
  const summary = proposedValue(proposal, "summary", "summary", null, document.identity.summary);
  const employers = useMemo(() => groupExperience(document), [document.experience]);
  const firstEmployerId = employers.length ? `${employers[0].company}-0` : "";

  useEffect(() => {
    if (firstEmployerId) setOpenEmployers((current) => current.length ? current : [firstEmployerId]);
  }, [firstEmployerId]);

  const visibleProjects = showAllProjects ? document.projects : document.projects.slice(0, 3);
  const selectedProject = document.projects.find((project) => project.id === openProject);
  const visibleSkills = showAllSkills ? document.skills : document.skills.slice(0, 8);
  const summaryIsLong = (summary.value || "").split(/\s+/).filter(Boolean).length > 75;
  const shownSummary = summaryIsLong && !summaryExpanded
    ? (summary.value || "").split(/\s+/).slice(0, 70).join(" ") + "…"
    : summary.value;
  const details = document.details;
  const hasDetails = Boolean(
    (details.showEducation && details.education.length) ||
    (details.showCertifications && details.certifications.length) ||
    (details.showAwards && details.awards.length) ||
    (details.showInterests && details.interests.length),
  );

  const toggleEmployer = (id: string) => {
    setOpenEmployers((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  };
  const closeStory = () => {
    const id = openProject;
    setOpenProject(null);
    if (id) requestAnimationFrame(() => projectButtons.current.get(id)?.focus());
  };
  const renderStoryPanel = (project: ProfileDocument["projects"][number], placement: "inline" | "wide") => {
    const challenge = proposedValue(proposal, "project", "challenge", project.id, project.challenge);
    const contribution = proposedValue(proposal, "project", "contribution", project.id, project.contribution);
    const outcome = proposedValue(proposal, "project", "outcome", project.id, project.outcome);
    return <div className={`proxy-page__story-panel proxy-page__story-panel--${placement}`}>
      <div className="proxy-page__story-panel-head"><div><p>{project.company || "Selected work"}</p><h4>{project.title}</h4></div><button type="button" onClick={closeStory}>Close story</button></div>
      <div className="proxy-page__story">
        {challenge.value && <div className={challenge.active ? "proxy-page__changed" : ""}><Suggested active={challenge.active} /><span>Context</span><p>{challenge.value}</p></div>}
        {contribution.value && <div className={contribution.active ? "proxy-page__changed" : ""}><Suggested active={contribution.active} /><span>What I did</span><p>{contribution.value}</p></div>}
        {outcome.value && <div className={outcome.active ? "proxy-page__changed" : ""}><Suggested active={outcome.active} /><span>What changed</span><p>{outcome.value}</p></div>}
      </div>
    </div>;
  };

  return <article className={`proxy-page proxy-page--${document.style}`}>
    <header className="proxy-page__hero">
      <div className="proxy-page__identity">
        <div className="proxy-page__identity-top">
          <div><p className="proxy-page__eyebrow">{document.identity.title}</p><h1>{document.identity.name}</h1>{document.identity.location && <p className="proxy-page__location">{document.identity.location}</p>}</div>
          <Portrait document={document} />
        </div>
        <div className={headline.active ? "proxy-page__changed" : ""}><Suggested active={headline.active} /><h2>{headline.value}</h2></div>
        <div className={summary.active ? "proxy-page__changed" : ""}><Suggested active={summary.active} /><p className="proxy-page__lede">{shownSummary}</p>{summaryIsLong && <button className="proxy-page__read-more" type="button" aria-expanded={summaryExpanded} onClick={() => setSummaryExpanded((value) => !value)}>{summaryExpanded ? "Show less" : "Read more"}</button>}</div>
        <ContactActions document={document} onAsk={onAsk} onContact={onContact} />
        <EditButton label="Edit introduction" onClick={onEdit ? () => onEdit("introduction") : undefined} />
      </div>
    </header>

    {(document.projects.length > 0 || onEdit) && <section className="proxy-page__section proxy-page__work" id="selected-work">
      <div className="proxy-page__section-heading">
        <div><p className="proxy-page__section-kicker">Evidence</p><h3>Selected work</h3></div>
        <div className="proxy-page__section-actions"><p>Specific work. Clear contribution.</p>{onEdit && <button type="button" onClick={() => onEdit("project")}><Plus aria-hidden="true" /> Add work</button>}</div>
      </div>
      {document.projects.length === 0 ? <div className="proxy-page__empty"><p>Add one piece of work that shows how you make a difference.</p><button type="button" onClick={() => onEdit?.("project")}><Plus aria-hidden="true" /> Add selected work</button></div> : <>
        <div className="proxy-page__project-grid">{visibleProjects.map((project, index) => {
          const challenge = proposedValue(proposal, "project", "challenge", project.id, project.challenge);
          const contribution = proposedValue(proposal, "project", "contribution", project.id, project.contribution);
          const outcome = proposedValue(proposal, "project", "outcome", project.id, project.outcome);
          const preview = project.summary || outcome.value || contribution.value || challenge.value;
          return <article className={`proxy-page__project ${openProject === project.id ? "is-selected" : ""}`} key={project.id}>
            <div className="proxy-page__project-head"><p className="proxy-page__project-number">{String(index + 1).padStart(2, "0")}</p><div><h4>{project.title}</h4>{project.company && <p>{project.company}</p>}</div></div>
            {preview && <p className="proxy-page__project-preview">{preview}</p>}
            <div className="proxy-page__card-actions">
              <button ref={(node) => { if (node) projectButtons.current.set(project.id, node); }} type="button" aria-expanded={openProject === project.id} onClick={() => setOpenProject(openProject === project.id ? null : project.id)}>{openProject === project.id ? "Hide story" : "View story"}<ChevronDown aria-hidden="true" /></button>
              <EditButton label="Edit" onClick={onEdit ? () => onEdit("project", project.id) : undefined} />
            </div>
            {openProject === project.id && renderStoryPanel(project, "inline")}
          </article>;
        })}</div>
        {document.projects.length > 3 && <button className="proxy-page__disclosure" type="button" aria-expanded={showAllProjects} onClick={() => setShowAllProjects((value) => !value)}>{showAllProjects ? "Show featured work only" : `See all work (${document.projects.length})`}<ChevronDown aria-hidden="true" /></button>}
        {selectedProject && renderStoryPanel(selectedProject, "wide")}
      </>}
    </section>}

    {document.experience.length > 0 && <section className="proxy-page__section proxy-page__experience" id="experience">
      <div className="proxy-page__section-heading"><div><p className="proxy-page__section-kicker">Career</p><h3>Experience</h3></div></div>
      <div className="proxy-page__employers">{employers.map((employer, groupIndex) => {
        const groupId = `${employer.company}-${groupIndex}`;
        const expanded = openEmployers.includes(groupId) || employer.roles.length === 1;
        const periods = employer.roles.map((role) => role.period).filter(Boolean);
        return <article className="proxy-page__employer" key={groupId}>
          <div className="proxy-page__employer-head"><div><h4>{employer.company}</h4>{periods.length > 0 && <p>{periods.at(-1)}{periods.length > 1 ? ` – ${periods[0]}` : ""}</p>}</div>{employer.roles.length > 1 && <button type="button" aria-expanded={expanded} onClick={() => toggleEmployer(groupId)}>{expanded ? "Hide roles" : `Show ${employer.roles.length} roles`}<ChevronDown aria-hidden="true" /></button>}</div>
          {expanded && <div className="proxy-page__roles">{employer.roles.map((role) => {
            const roleSummary = proposedValue(proposal, "experience", "summary", role.id, role.summary);
            return <div className="proxy-page__role" key={role.id}>
              <div><h5>{role.title}</h5><time>{role.period}</time></div>
              {roleSummary.value && <p className={roleSummary.active ? "proxy-page__changed" : ""}><Suggested active={roleSummary.active} />{roleSummary.value}</p>}
              {role.highlights.length > 0 && <ul>{role.highlights.map((item, itemIndex) => <li key={`${role.id}-${itemIndex}`}>{item}</li>)}</ul>}
              <EditButton label="Edit role" onClick={onEdit ? () => onEdit("experience", role.id) : undefined} />
            </div>;
          })}{(() => {
            const evidence = document.employerContributions.find((item) => item.company.trim().toLowerCase() === employer.company.trim().toLowerCase());
            if (!evidence?.contributions.length) return null;
            return <div className="proxy-page__employer-contributions"><div><p>Selected contributions</p><ul>{evidence.contributions.map((item, index) => <li key={`${evidence.id}-${index}`}>{item}</li>)}</ul></div><EditButton label="Edit contributions" onClick={onEdit ? () => onEdit("experience", evidence.id) : undefined} /></div>;
          })()}</div>}
        </article>;
      })}</div>
    </section>}

    {document.skills.length > 0 && <section className="proxy-page__section proxy-page__skills">
      <div className="proxy-page__section-heading"><div><p className="proxy-page__section-kicker">Capabilities</p><h3>Areas of strength</h3></div><EditButton label="Edit" onClick={onEdit ? () => onEdit("skills") : undefined} /></div>
      <div className="proxy-page__skill-list">{visibleSkills.map((skill, index) => <span key={`${skill}-${index}`}>{skill}</span>)}</div>
      {document.skills.length > 8 && <button className="proxy-page__disclosure" type="button" aria-expanded={showAllSkills} onClick={() => setShowAllSkills((value) => !value)}>{showAllSkills ? "Show fewer strengths" : `Show all strengths (${document.skills.length})`}<ChevronDown aria-hidden="true" /></button>}
    </section>}

    {(hasDetails || onEdit) && <section className="proxy-page__section proxy-page__details">
      <div className="proxy-page__section-heading"><div><p className="proxy-page__section-kicker">Background</p><h3>More about me</h3></div><EditButton label="Edit" onClick={onEdit ? () => onEdit("details") : undefined} /></div>
      {hasDetails ? <div className="proxy-page__detail-grid">
        {details.showEducation && <DetailGroup title="Education" items={details.education} />}
        {details.showCertifications && <DetailGroup title="Certifications" items={details.certifications} />}
        {details.showAwards && <DetailGroup title="Recognition" items={details.awards} />}
        {details.showInterests && <DetailGroup title="Beyond work" items={details.interests} />}
      </div> : <div className="proxy-page__empty"><p>Add education, certifications or recognition if they help a visitor understand your background.</p></div>}
    </section>}
  </article>;
}
