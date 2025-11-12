import jwt from "jsonwebtoken";
import User from "../models/User.js";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "tesa_token";

const extractToken = (req) => {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
        return header.split(" ")[1];
    }

    if (req.cookies?.[AUTH_COOKIE_NAME]) {
        return req.cookies[AUTH_COOKIE_NAME];
    }

    return null;
};

export const protect = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        next();
    } catch (err) {
        res.status(401).json({ message: "Token failed" });
    }
};
