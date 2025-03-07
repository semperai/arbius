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
