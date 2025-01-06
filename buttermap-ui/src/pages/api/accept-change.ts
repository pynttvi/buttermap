import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import {notFound} from "next/navigation";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (process.env.NODE_ENV === "production") {
        notFound(); // Render a 404 in production
    }
    const folderPath = path.join("/map changes"); // Adjust the base folder path
    const acceptedFolderPath = path.join(folderPath, "accepted");

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { filename } = req.query;

    if (!filename || typeof filename !== "string") {
        return res.status(400).json({ error: "Filename is required and must be a string" });
    }

    const filePath = path.join(folderPath, filename);
    const acceptedFilePath = path.join(acceptedFolderPath, filename);

    try {
        // Ensure the "accepted" folder exists
        if (!fs.existsSync(acceptedFolderPath)) {
            fs.mkdirSync(acceptedFolderPath, { recursive: true });
        }

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: `File ${filename} not found` });
        }

        // Read and parse the file
        const content = fs.readFileSync(filePath, "utf-8");
        const json = JSON.parse(content);

        // Check if the status is "PENDING"
        if (json.status === "PENDING") {
            json.status = "ACCEPTED"; // Update the status

            // Write updated file to the accepted folder
            fs.writeFileSync(acceptedFilePath, JSON.stringify(json, null, 4), "utf-8");

            // Remove the original file
            fs.unlinkSync(filePath);

            return res.status(200).json({
                message: `Status updated to ACCEPTED and file moved to "accepted" folder: ${filename}`,
            });
        } else {
            return res.status(400).json({
                message: `File ${filename} does not have status "PENDING"`,
            });
        }
    } catch (error) {
        console.error("Error processing file:", error);
        return res.status(500).json({ error: "Failed to process the file" });
    }
}
