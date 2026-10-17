import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectView } from "@/components/ProjectView";
import { getProject, projects } from "@/content/projects";

// Opening a project link directly (shared link, refresh) shows it as a full page
export default async function ProjectPage({ params }: PageProps<"/design/[project]">) {
  const { project: slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return (
    <main className="page wide">
      <ProjectView project={project} />
    </main>
  );
}

export function generateStaticParams() {
  return projects.map((p) => ({ project: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/design/[project]">): Promise<Metadata> {
  const { project: slug } = await params;
  return { title: getProject(slug)?.title };
}
