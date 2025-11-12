import express from "express";
import {
    listCameras,
    createCamera,
    updateCamera,
    deleteCamera,
} from "../controllers/cameraController.js";

const router = express.Router();

router.get("/", listCameras);
router.post("/", createCamera);
router.patch("/:id", updateCamera);
router.delete("/:id", deleteCamera);

export default router;
