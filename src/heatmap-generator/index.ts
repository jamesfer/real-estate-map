import crypto from 'crypto';
import { Request, Response } from 'express';
import { Storage } from '@google-cloud/storage';
import { ApiOptions } from '../shared/models/api-options';
import { Tile } from '../shared/models/tile';
import createHeatmap from './create-heatmap';

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
const storage = new Storage();

interface RequestParameters {
  searchOptions: ApiOptions;
  tile: Tile;
  radius: number;
  tileSize: number;
}

class ApiError extends Error {
  constructor(message: string, public code: number) {
    super(message);
  }
}

function extractRequestParameters(req: Request): RequestParameters {
  const {
    searchOptions,
    radius,
    tile,
    tileSize,
  } = req.params;

  if (!searchOptions || !radius || !tile || !tileSize) {
    console.log('Missing query parameters', JSON.stringify(req.params, undefined, 2));
    throw new ApiError(`Missing query parameters ${JSON.stringify(req.params, undefined, 2)}`, 400);
  }

  const options = {
    searchOptions: JSON.parse(searchOptions),
    tile: JSON.parse(tile),
    radius: +radius,
    tileSize: +tileSize,
  };

  if (Number.isNaN(options.radius) || Number.isNaN(options.tileSize)) {
    console.log('Invalid options', JSON.stringify(options, undefined, 2));
    throw new ApiError(`Invalid options ${JSON.stringify(options, undefined, 2)}`, 400);
  }

  return options;
}

function getTimestamp(): number {
  const now = Date.now();
  return Math.floor(now / ONE_WEEK) * ONE_WEEK;
}

function generateFileHash(timestamp: number, params: RequestParameters): string {
  const json = JSON.stringify({ timestamp, params });
  return crypto.createHash('sha256').update(json).digest().toString('hex');
}

export async function handler(req: Request, res: Response) {
  res.header('Content-Type', 'application/json');
  res.header('Access-Control-Allow-Origin', 'https://jamesfer.me');

  try {
    const params = extractRequestParameters(req);
    const timestamp = getTimestamp();
    const fileHash = generateFileHash(timestamp, params);
    console.log('Request: ', JSON.stringify({ params, timestamp, fileHash }, undefined, 2));

    res.header('Cache-Control', `max-age=${ONE_WEEK / 1000}`);

    // Check if the file already exists
    const bucket = storage.bucket('');
    const file = bucket.file(fileHash);
    if (await file.exists()) {
      console.log('Found existing file');
      file.createReadStream().pipe(res);
      return;
    }

    const heatmap = await createHeatmap(0, 0, params.tile, params.searchOptions);
    const heatmapArray = Array.from(heatmap);
    console.log('Generated new heatmap');
    res.json(heatmapArray);

    await file.save(JSON.stringify(heatmapArray), { resumable: false });
    console.log('Uploaded new heatmap');
  } catch (error) {
    res.status(error instanceof ApiError ? error.code : 500).json({ message: error.message }).end();
  }
}
