export interface Lesson {
  id: number;
  title: string;
  thumbnail: string;
  videoEmbed?: string;
}

export interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

export const MODULES: Module[] = [
  {
    id: 1,
    title: "Understanding the Market",
    lessons: [
      { id: 1, title: "START HERE", thumbnail: "/thumbnails/thumb-m1-l1.jpg" },
      { id: 2, title: "CONTENT PLAN", thumbnail: "/thumbnails/thumb-m1-l2.jpg" },
      { id: 3, title: "MARKET RESEARCH", thumbnail: "/thumbnails/thumb-m1-l3.jpg" },
      { id: 4, title: "PICK YOUR NICHE", thumbnail: "/thumbnails/thumb-m1-l4.jpg" },
    ],
  },
  {
    id: 2,
    title: "Building Your AI Model",
    lessons: [
      { id: 1, title: "TOOLS YOU NEED", thumbnail: "/thumbnails/thumb-m2-l1.jpg" },
      { id: 2, title: "BUILD HER", thumbnail: "/thumbnails/thumb-m2-l2.jpg" },
      { id: 3, title: "CREATE IMAGES", thumbnail: "/thumbnails/thumb-m2-l3.jpg" },
      { id: 4, title: "CREATE VIDEOS", thumbnail: "/thumbnails/thumb-m2-l4.jpg" },
    ],
  },
  {
    id: 3,
    title: "Growing Your Audience",
    lessons: [
      { id: 1, title: "ACCOUNT WARMUP", thumbnail: "/thumbnails/thumb-m3-l1.jpg" },
      { id: 2, title: "ALGORITHM HACK", thumbnail: "/thumbnails/thumb-m3-l2.jpg" },
      { id: 3, title: "INSTAGRAM SETUP", thumbnail: "/thumbnails/thumb-m3-l3.jpg" },
      { id: 4, title: "FOLLOWERS FARM STRATEGY", thumbnail: "/thumbnails/thumb-m3-l4.jpg" },
    ],
  },
  {
    id: 4,
    title: "Content Creation",
    lessons: [
      { id: 1, title: "FEED POSTS", thumbnail: "/thumbnails/thumb-m4-l1.jpg" },
      { id: 2, title: "STORIES", thumbnail: "/thumbnails/thumb-m4-l2.jpg" },
      { id: 3, title: "VIRAL REELS", thumbnail: "/thumbnails/thumb-m4-l3.jpg" },
      { id: 4, title: "NSFW CONTENT", thumbnail: "/thumbnails/thumb-m4-l4.jpg" },
    ],
  },
  {
    id: 5,
    title: "Monetizing Your AI Model",
    lessons: [
      { id: 1, title: "FANVUE SETUP", thumbnail: "/thumbnails/thumb-m5-l1.jpg" },
      { id: 2, title: "ENCRYPTED LINK", thumbnail: "/thumbnails/thumb-m5-l2.jpg" },
      { id: 3, title: "TRAFFIC → $$$", thumbnail: "/thumbnails/thumb-m5-l3.jpg" },
      { id: 4, title: "SCALE INCOME", thumbnail: "/thumbnails/thumb-m5-l4.jpg" },
    ],
  },
];

export function getModule(moduleId: number): Module | undefined {
  return MODULES.find((m) => m.id === moduleId);
}

export function getLesson(
  moduleId: number,
  lessonId: number
): { module: Module; lesson: Lesson } | undefined {
  const mod = getModule(moduleId);
  if (!mod) return undefined;
  const lesson = mod.lessons.find((l) => l.id === lessonId);
  if (!lesson) return undefined;
  return { module: mod, lesson };
}

export function getAdjacentLessons(moduleId: number, lessonId: number) {
  let prev: { moduleId: number; lessonId: number } | null = null;
  let next: { moduleId: number; lessonId: number } | null = null;

  for (let mi = 0; mi < MODULES.length; mi++) {
    const mod = MODULES[mi];
    for (let li = 0; li < mod.lessons.length; li++) {
      const lesson = mod.lessons[li];
      if (mod.id === moduleId && lesson.id === lessonId) {
        if (li > 0) {
          prev = { moduleId: mod.id, lessonId: mod.lessons[li - 1].id };
        } else if (mi > 0) {
          const prevMod = MODULES[mi - 1];
          prev = {
            moduleId: prevMod.id,
            lessonId: prevMod.lessons[prevMod.lessons.length - 1].id,
          };
        }
        if (li < mod.lessons.length - 1) {
          next = { moduleId: mod.id, lessonId: mod.lessons[li + 1].id };
        } else if (mi < MODULES.length - 1) {
          const nextMod = MODULES[mi + 1];
          next = { moduleId: nextMod.id, lessonId: nextMod.lessons[0].id };
        }
        return { prev, next };
      }
    }
  }
  return { prev, next };
}
