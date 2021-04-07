import { sequelize } from "../src/connection";

export const SearchQuery = async (query: string) => {
  const [res] = await sequelize.query(`
 select * from "PublishStories"  
where title || ' ' || category || ' ' || content || ' ' || "authorName"
ILIKE '%${query}%';
`);
  return res;
};
