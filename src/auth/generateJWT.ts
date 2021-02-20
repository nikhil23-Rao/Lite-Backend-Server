import config from "config";
import jwt from "jsonwebtoken";

export const generateJWT = (obj: Object) => {
  return jwt.sign(obj, config.get("jwtPrivateKey"));
};
