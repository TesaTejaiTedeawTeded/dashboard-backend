import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "tesa_token";
const isProduction = process.env.NODE_ENV === "production";
const TOKEN_TTL_MS = Number(process.env.AUTH_COOKIE_TTL_MS) || 1000 * 60 * 60 * 24 * 7; // 7 days

const buildAuthPayload = (user) => ({
    _id: user._id,
    username: user.username,
    email: user.email,
});

const sendAuthResponse = (res, user, statusCode = 200) => {
    const token = generateToken(user._id);

    res.cookie(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        maxAge: TOKEN_TTL_MS,
        path: "/",
    });

    return res.status(statusCode).json({
        token,
        user: buildAuthPayload(user),
    });
};

export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists)
            return res.status(400).json({ message: "User already exists" });

        const user = await User.create({ username, email, password });
        sendAuthResponse(res, user, 201);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        sendAuthResponse(res, user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const logoutUser = (req, res) => {
    res.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/",
    });

    res.status(200).json({ message: "Logged out" });
};
