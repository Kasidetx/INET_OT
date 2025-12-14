import express from "express";
import { getAllEmp } from "../controllers/emp.controller.js";

const router = express.Router();

router.get("/", getAllEmp);

export default router;
