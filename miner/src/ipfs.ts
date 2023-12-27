import fs from 'fs';
import { Readable } from 'stream';
import FormData from 'form-data';
import axios from 'axios';
import * as http_client from 'ipfs-http-client';
import { MiningConfig } from './types';

// TODO type correctly
let ipfsClient: any = null;

const ipfsOptions = {
  cidVersion: 0,
  hashAlg: 'sha2-256',
  chunker: 'size-262144',
  rawLeaves: false,
};


function initializeIpfsClient(c: MiningConfig) {
  if (ipfsClient == null) {
    ipfsClient = http_client.create({
      url: c.ipfs.http_client.url,
    });
  }
}

// TODO ensure pinata is using sha2-256 and chunk size-262144
export async function pinFilesToIPFS(c: MiningConfig, taskid: string, paths: string[]) {
  switch (c.ipfs.strategy) {
    case 'http_client': {
      initializeIpfsClient(c);
      const data = paths.map((path) => ({
        path,
        content: fs.readFileSync(`${__dirname}/../cache/${path}`),
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
        formData.append('file', fs.createReadStream(`${__dirname}/../cache/${path}`), {
          filepath: `${taskid}/${path}`,
        });
      }

      formData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));

      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxBodyLength: Infinity,
        headers: { 
          // @ts-ignore
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          'Authorization': `Bearer ${c.ipfs.pinata.jwt}`
        },
      });

      return res.data.IpfsHash;
    }
    default:
      throw new Error('unknown ipfs strategy');
  }
}


export async function pinFileToIPFS(
  c: MiningConfig,
  content: Buffer,
  filename: string,
) {
  switch (c.ipfs.strategy) {
    case 'http_client': {
      initializeIpfsClient(c);
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

      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxBodyLength: Infinity,
        headers: { 
          // @ts-ignore
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          'Authorization': `Bearer ${c.ipfs.pinata.jwt}`
        },
      });
      return res.data.IpfsHash;
    }
    default:
      throw new Error('unknown ipfs strategy');
  }
}


