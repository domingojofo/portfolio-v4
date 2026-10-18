import { notFound } from "next/navigation";
import { Modal } from "@/components/Modal";
import { ProjectView } from "@/components/ProjectView";
import { getProject, projects } from "@/content/projects";

// Clicking a project from the Design section opens it here, as a modal over the page
export default async function ProjectModal({ params }: PageProps<"/design/[project]">) {
  const { project: slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return (
    <Modal labelledBy="project-title">
      <ProjectView project={project} headingId="project-title" />
    </Modal>
  );
}

export function generateStaticParams() {
  return projects.map((p) => ({ project: p.slug }));
}
