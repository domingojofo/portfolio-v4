import Link from "next/link";
import { projects, type Project } from "@/content/projects";
import { Cover } from "./Cover";
import { SectionNav } from "./SectionNav";

// Every project modal / page, laid out as a story (after robwinters.github.io/portfolio):
//  - Intro: the company, years and role in a narrow column on the left; the story in a reading
//    column beside it (a lead line, body, "My role"); then the cover running wide
//  - Parts: each a label on the left ("Highlight" gets the highlighter stroke) and its text, then
//    its work running wide
//  - The section nav at the left edge (Intro + one tick per part), and a link on to the next project
// The CSS is .story-page in globals.css.

export type StoryPart = {
  id: string;
  /** Its name in the section nav */
  nav: string;
  /** The label on the left — "Highlight" is drawn with the highlighter */
  label?: string;
  lead?: string;
  body?: React.ReactNode[];
  /** The work, each item running wide */
  work?: React.ReactNode[];
};

export function ProjectStory({ project, headingId, lead, body, role, cover, parts }: {
  project: Project;
  headingId?: string;
  lead: string;
  body?: React.ReactNode[];
  /** "My role", as a list */
  role?: string[];
  /** What runs wide under the intro, in place of the project's cover image */
  cover?: React.ReactNode;
  parts: StoryPart[];
}) {
  const i = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(i + 1) % projects.length];
  const introId = `${project.slug}-intro`;

  return (
    <article className="story-page">
      <SectionNav sections={[{ id: introId, label: "Intro" }, ...parts.map((p) => ({ id: p.id, label: p.nav }))]} />

      <section id={introId} className="sp-section">
        <div className="sp-row">
          <div className="sp-meta">
            <h1 id={headingId}>{project.title}</h1>
            {(project.year || project.role) && (
              <p>{project.year && <span>{project.year}</span>} {project.role && <span>{project.role}</span>}</p>
            )}
          </div>
          <div className="sp-text">
            <p className="sp-lead">{lead}</p>
            {body?.map((b, n) => <p key={n} className="sp-body">{b}</p>)}
            {role && role.length > 0 && (
              <div className="sp-role">
                <h3 className="sp-label">My role</h3>
                <p>{role.map((r, n) => <span key={n}>{n > 0 && <b> • </b>}{r}</span>)}</p>
              </div>
            )}
          </div>
        </div>
        <figure className="sp-wide">
          {cover ?? <Cover cover={project.cover} sizes="(max-width: 1023px) 100vw, 1200px" eager />}
        </figure>
      </section>

      {parts.map((p) => (
        <section key={p.id} id={p.id} className="sp-section">
          {(p.label || p.lead || p.body) && (
            <div className="sp-row">
              <h2 className="sp-label sp-meta">
                {p.label === "Highlight" ? <span className="sp-marker">Highlight</span> : (p.label ?? "")}
              </h2>
              <div className="sp-text">
                {p.lead && <p className="sp-lead">{p.lead}</p>}
                {p.body?.map((b, n) => <p key={n} className="sp-body">{b}</p>)}
              </div>
            </div>
          )}
          {p.work?.map((w, n) => <div key={n} className="sp-wide">{w}</div>)}
        </section>
      ))}

      <Link className="sp-next" href={`/design/${next.slug}`} scroll={false}>
        <span className="sp-label">Next project</span>
        <span className="sp-next-title">{next.title} <span aria-hidden="true">→</span></span>
      </Link>
    </article>
  );
}
