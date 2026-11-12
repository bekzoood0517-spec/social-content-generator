import { Request, Response } from 'express';
import { suggestAngles } from '../lib/gemini.js';
import { sanitizeText } from '../lib/validate.js';
import { Network } from '../types.js';

export async function handleSuggest(req: Request, res: Response): Promise<void> {
  try {
    const { input, network, language } = req.body || {};

    if (!input || typeof input !== 'string' || input.trim().length < 5) {
      res.status(400).json({ error: 'Input must be at least 5 characters' });
      return;
    }

    const validNetworks: Network[] = ['telegram', 'instagram', 'youtube'];
    const chosenNetwork: Network = validNetworks.includes(network) ? network : 'telegram';
    const chosenLanguage = typeof language === 'string' && language.trim() ? language.trim() : 'en';

    const angles = await suggestAngles(sanitizeText(input.trim()), chosenNetwork, chosenLanguage);

    res.json({ angles });
  } catch (err: any) {
    console.error('Suggest error:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}
