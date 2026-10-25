import { Suspense } from "react";
import { ALL_LESSONS, getLessonById } from "@/data/curriculum";
import { LessonWorkspaceView } from "@/components/lesson/LessonWorkspaceView";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return ALL_LESSONS.map((lesson) => ({
    lessonId: lesson.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);

  return {
    title: lesson ? `${lesson.title} (${lesson.commandName}) — TERMINAL ZERO` : "Lesson Workspace — TERMINAL ZERO",
    description: lesson?.learningObjective || "Interactive Linux terminal lesson exercise.",
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8 text-xs font-mono text-[#A0A8B8]">
          Initializing terminal workspace...
        </div>
      }
    >
      <LessonWorkspaceView lessonId={lessonId} />
    </Suspense>
  );
}
