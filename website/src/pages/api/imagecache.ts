import * as fs from 'fs';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.status(405).json({ msg: 'method not allowed' });
    return;
  }

  if (typeof req.query.url !== 'string') {
    res.status(400).json({ msg: 'query missing url' });
    return;
  }

  const decodedUri = decodeURIComponent(req.query.url);

  res.setHeader('Cache-Control', 's-maxage=604800');
  res.setHeader('Content-Type', 'image/jpg');

  try {
    const response = await axios.get(decodedUri, {
      timeout: 10_000,
      responseType: 'arraybuffer',
    });

    res.status(200).send(response.data);
  } catch (e) {
    console.log('IMAGECACHE ERROR', JSON.stringify(e));
    res.status(404);
  }
}
