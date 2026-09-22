export type Category = 'All topics' | 'Mathematics' | 'Science' | 'Technology' | 'Humanities'
export type IconName = 'algebra' | 'code' | 'atom' | 'chart' | 'leaf' | 'globe' | 'pen' | 'brain'
export interface Question { id: string; skill: string; prompt: string; options: string[]; answer: number; explanation: string }
export interface Lesson { id: string; title: string; description: string; minutes: number; content: string[]; example: { title: string; text: string }; practice: Question[]; videoQuery: string; resourceUrl: string; resourceLabel: string; focus?: boolean }
export interface Topic { id: string; name: string; category: Exclude<Category, 'All topics'>; description: string; icon: IconName; color: string; level: string; duration: string; questions: Question[]; lessons: Lesson[] }
export interface LearningPath { id: string; topicId: string; topicName: string; createdAt: string; score: number; answers: number[]; questions: Question[]; modules: Lesson[]; completed: string[]; read: string[]; practiceScores: Record<string, number>; source: 'curated' | 'ai' }
export interface SavedResource { id: string; pathId: string; lessonId: string; title: string; topic: string }
export interface Activity { id: string; date: string; type: 'diagnostic' | 'lesson' | 'practice'; label: string; seconds: number }
export interface Profile { name: string; goal: number; joinedAt: string; photoURL?: string }
export interface AppData { version: 1; profile: Profile; paths: LearningPath[]; savedTopics: string[]; savedResources: SavedResource[]; activities: Activity[]; updatedAt: string }
export interface Video { id: string; title: string; channel: string; thumbnail: string }
export interface ServiceStatus { ai: boolean; youtube: boolean }
