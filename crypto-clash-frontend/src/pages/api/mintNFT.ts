import { NextApiRequest, NextApiResponse } from 'next';
import { uploadMetadataAndMint } from '../../../../scripts/mintNFT'; // Utilisez la destructuration pour importer la fonction spécifique


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const metadataURIs = await uploadMetadataAndMint("CryptoClash Cat", "A unique digital cat for CryptoClash Game.");
            res.status(200).json({ metadataURIs });
        } catch (error) {
            console.error("Error uploading metadata and minting NFTs:", error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end('Method Not Allowed');
    }
}
