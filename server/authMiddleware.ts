import { Request, Response, NextFunction } from "express";
import { DbUser, findUserByToken, UserRole } from "./db";

export interface AuthedRequest extends Request {
  user?: DbUser;
  token?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : (req.headers["x-auth-token"] as string | undefined);
  const user = findUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.user = user;
  req.token = token;
  next();
}

export function requireHost(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "host") {
    return res.status(403).json({ error: "Host role required" });
  }
  next();
}

export function requireRole(role: UserRole) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: `${role} role required` });
    }
    next();
  };
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : (req.headers["x-auth-token"] as string | undefined);
  const user = findUserByToken(token);
  if (user) {
    req.user = user;
    req.token = token;
  }
  next();
}
