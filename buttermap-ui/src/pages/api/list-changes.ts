import {NextApiRequest, NextApiResponse} from "next";
import fs from "fs";
import path from "path";
import {CoordinateChange} from "@/app/model/coordinate";
import {notFound} from "next/navigation";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (process.env.NODE_ENV === "production") {
        notFound(); // Render a 404 in production
    }
    const folderPath = path.join("/map changes"); // Adjust the folder path as needed

    try {
        // Check if the folder exists
        if (!fs.existsSync(folderPath)) {
            return res.status(404).json({error: "Folder not found"});
        }

        const files = fs.readdirSync(folderPath);
        const changes: { fileName: string, change: CoordinateChange }[] = []

        files.forEach((file) => {
            if (file.endsWith(".json")) {
                try {
                    const filePath = path.join(folderPath, file);
                    const content = fs.readFileSync(filePath, "utf-8");
                    const json = JSON.parse(content);
                    // Check if the JSON object has the "status" property with value "PENDING"
                    if (json.status === "PENDING") {
                        changes.push({fileName: file, change: json as CoordinateChange})
                    }
                    return changes
                } catch (error) {
                    console.error(`Error reading or parsing file: ${file}`, error);
                    return false;
                }
            }
            return false;
        });

        // Return the list of JSON files with status "PENDING"
        return res.status(200).json(changes);
    } catch (error) {
        console.error("Error processing request:", error);
        return res.status(500).json({error: "Failed to list JSON files"});
    }
}
