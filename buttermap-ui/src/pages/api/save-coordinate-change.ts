'use server'
import fs from 'fs';
import path from 'path';
import {NextApiRequest, NextApiResponse} from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const changesPath = '/map changes'; // Relative to the base folder
        const savePath = path.join(changesPath);

        try {
            // Ensure the directory exists
            if (!fs.existsSync(savePath)) {
                fs.mkdirSync(savePath, { recursive: true });
            }

            // Parse the incoming JSON object
            const coordinateChange = req.body;
            console.log("body",req.body)
            if (!coordinateChange || !coordinateChange.action || !coordinateChange.coord) {
                return res.status(400).json({ error: 'Invalid CoordinateChange object' });
            }

            // Define the file name (e.g., timestamp-based)
            const fileName = `coordinate-change-${Date.now()}.json`;
            const filePath = path.join(savePath, fileName);

            // Save the object as a JSON file
            fs.writeFileSync(filePath, JSON.stringify(coordinateChange, null, 4));

            return res.status(200).json({ message: 'File saved successfully', filePath });
        } catch (error) {
            console.error('Error saving file:', error);
            return res.status(500).json({ error: 'Failed to save file' });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}
