import axios from "axios";
import fs from 'fs';
import path from "path";


export const handleTelegramPhotoFileLink = async (filePath: string, callback: (fileBuffer: Buffer) => Promise<void>) => {
    const extension = filePath.split('.').pop();
    const fileName = `${Date.now()}.${extension}`;
    const fileDownloadPath = path.resolve(__dirname, '..', '..', 'images', fileName);
    const fileRes = await axios.get(filePath, { responseType: 'stream' });
    if (fileRes.status !== 200) {
        return null;
    }
    const stream = fs.createWriteStream(fileDownloadPath);
    fileRes.data.pipe(stream);
    stream.on('ready', async () => {
        const buffer = fs.readFileSync(fileDownloadPath);
        await callback(buffer);
    })
    stream.on("finish", () => {
        stream.close();
    });
}