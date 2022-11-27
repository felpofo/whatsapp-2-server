import { Router } from "express";

export const routes = Router();

routes.get("/", (_, res) => {
  res.status(200).json({ message: "OK" });
});
