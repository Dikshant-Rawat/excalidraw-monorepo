import express from "express";
// dotenv/config MUST stay at the absolute top so environment variables load before monorepo packages evaluate
import "dotenv/config"; 
import { JWT_SECRET } from "@repo/backend-common/config";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { CreateRoomSchema, CreateUserSchema, SigninSchema } from "@repo/common/types";
import { prisma } from "@repo/db";

const app = express();
app.use(express.json());

// ==================== SIGNUP ROUTE ====================
app.post("/signup", async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).json({
            message: "Invalid Inputs"
        });
    }

    try {
        const user = await prisma.user.create({
            data: {
                email: parsedData.data.username,
                password: parsedData.data.password, // TODO: Hash this password before production
                name: parsedData.data.name,
                photo: ""
            }
        });
        
        return res.json({
            userId: user.id
        });

    } catch (e) {
        console.error("SIGNUP ERROR:", e);
        return res.status(500).json({
            message: "Something went wrong"
        });
    }
});

// ==================== SIGNIN ROUTE ====================
app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    
    if (!parsedData.success) {
        return res.status(400).json({
            message: "Invalid Inputs"
        });
    }

    try {
        // Query exclusively by the unique identifier field (email)
        const user = await prisma.user.findUnique({
            where: {
                email: parsedData.data.username
            }
        });

        // Verify user existence
        if (!user) {
            return res.status(403).json({
                message: "Invalid Credentials"
            });
        }

        // Compare the password text safely
        if (user.password !== parsedData.data.password) {
            return res.status(403).json({
                message: "Invalid Credentials"
            });
        }

        // Generate the JWT token with the actual database user ID
        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET);

        return res.json({
            token
        });

    } catch (e) {
        console.error("SIGNIN ERROR:", e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

// ==================== ROOM ROUTE ====================
app.post("/room", middleware, async (req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    
    if (!parsedData.success) {
        return res.status(400).json({
            message: "Invalid Inputs"
        });
    }

    // Access userId added to req by your custom middleware
    const userId = (req as any).userId;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    try {
        // Create the room using the valid parsed data
        const room = await prisma.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
                // Add any extra schema relational links here if needed (e.g., adminId: userId)
            }
        });

        return res.json({
            roomId: room.id
        });

    } catch (e) {
        console.error("ROOM CREATION ERROR:", e);
        return res.status(500).json({
            message: "Failed to create room"
        });
    }
});

// ==================== START SERVER ====================
app.listen(3001, () => {
    console.log("Server running smoothly on port 3001");
});

