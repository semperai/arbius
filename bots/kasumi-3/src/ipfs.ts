import fs from 'fs';
import { Readable } from 'stream';
import FormData from 'form-data';
import axios from 'axios';
import { create, IPFSHTTPClient } from 'ipfs-http-client';

let ipfsClient: IPFSHTTPClient | undefined;

const ipfsOptions: any = {
  cidVersion: 0,
  hashAlg: 'sha2-256',
  chunker: 'size-262144',
  rawLeaves: false,
};

// Default IPFS gateways for parallel fetching
const DEFAULT_IPFS_GATEWAYS = [
  'https://ipfs.arbius.org',
  'https://ipfs.io',
  'https://dweb.link',
  'https://cloudflare-ipfs.com',
  'https://gateway.pinata.cloud',
];

/**
 * Fetch content from IPFS using Promise.any with multiple gateways
 * This improves reliability and speed by racing multiple gateways
 */
export async function fetchFromIPFS(
  cid: string,
  gateways: string[] = DEFAULT_IPFS_GATEWAYS,
  timeoutMs: number = 10000
): Promise<Buffer> {
  const fetchPromises = gateways.map(async (gateway) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${gateway}/ipfs/${cid}`;
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        signal: controller.signal,
        timeout: timeoutMs,
      });

      clearTimeout(timeoutId);
      return Buffer.from(response.data);
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw new Error(`${gateway} failed: ${error.message}`);
    }
  });

  try {
    // Promise.any returns the first successful promise
    const result = await Promise.any(fetchPromises);
    return result;
  } catch (error: any) {
    // All gateways failed
    throw new Error(`Failed to fetch ${cid} from all IPFS gateways: ${error.errors?.map((e: Error) => e.message).join(', ')}`);
  }
}

export function initializeIpfsClient(c: any) {
  if (ipfsClient == undefined) {
    ipfsClient = create({
      url: c.ipfs.http_client.url,
    });
  }
}

export async function pinFilesToIPFS(
  c: any,
  taskid: string,
  paths: string[]
) {
  switch (c.ipfs.strategy) {
    case 'http_client': {
      initializeIpfsClient(c);
      if (ipfsClient == undefined)
        throw new Error('ipfs client not initialized');

      const data = paths.map((path) => ({
        path,
        content: fs.readFileSync(`${__dirname}/../${c.cache_path}/${path}`),
      }));

      const options = {
        ...ipfsOptions,
        wrapWithDirectory: true,
      };

      const res = ipfsClient.addAll(data, options);
      for await (const { path, cid } of res) {
        if (path === '') {
          return cid.toString();
        }
      }

      throw new Error('ipfs cid extract failed');
    }
    case 'pinata': {
      const formData = new FormData();

      for (let path of paths) {
        formData.append(
          'file',
          fs.createReadStream(`${__dirname}/../${c.cache_path}/${path}`),
          {
            filepath: `${taskid}/${path}`,
          }
        );
      }

      formData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));

      const res = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            // @ts-ignore
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            Authorization: `Bearer ${c.ipfs.pinata.jwt}`,
          },
        }
      );

      return res.data.IpfsHash;
    }
    default:
      throw new Error('unknown ipfs strategy');
  }
}

export async function pinFileToIPFS(
  c: any,
  content: Buffer,
  filename: string
) {
  switch (c.ipfs.strategy) {
    case 'http_client': {
      initializeIpfsClient(c);
      if (ipfsClient == undefined)
        throw new Error('ipfs client not initialized');

      const { cid } = await ipfsClient.add(content, ipfsOptions);
      return cid.toString();
    }
    case 'pinata': {
      const formData = new FormData();

      var stream = new Readable();
      stream.push(content);
      stream.push(null); // eof

      formData.append('file', stream, filename);

      formData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));

      const res = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            // @ts-ignore
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            Authorization: `Bearer ${c.ipfs.pinata.jwt}`,
          },
        }
      );
      return res.data.IpfsHash;
    }
    default:
      throw new Error('unknown ipfs strategy');
  }
}
