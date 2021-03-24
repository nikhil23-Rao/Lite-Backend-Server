export interface StoryArgsInt {
  content: string;
  image_url: string;
  title: string;
  id: string;
  authorid: number;
  date_created: Array<string>;
  category: string;
  published: boolean;
  likedBy: Array<number>;
  likes: number;
}
