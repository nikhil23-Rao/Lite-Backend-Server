export interface StoryArgsInt {
  storyid: string;
  content: string;
  image_url: string;
  title: string;
  id: string;
  authorid: string;
  date_created: Array<string>;
  category: string;
  published: boolean;
  likedBy: Array<number>;
  likes: number;
}
