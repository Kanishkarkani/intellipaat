export type CourseId = number;

export interface Course {
  id: CourseId;
  title: string;
  instructor: string;
  /** 0–100, derived from lesson completion once lessons are known. */
  progress: number;
  lessons: number;
}

export interface Lesson {
  id: string;
  courseId: CourseId;
  title: string;
  position: number;
  completed: boolean;
}

export interface CourseDetail {
  course: Course;
  lessons: Lesson[];
}

export interface Session {
  token: string;
  email: string;
}

/** Where the data on screen came from, so the UI can be honest about staleness. */
export type DataSource = 'network' | 'cache';
