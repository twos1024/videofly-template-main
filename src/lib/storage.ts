import { s3mini } from "s3mini";

import {
  fetchValidatedRemoteMedia,
  type MediaKind,
} from "@/lib/media-validation";

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicDomain?: string;
}

export class Storage {
  private client: s3mini;
  private endpointWithBucket: string;
  private publicDomain?: string;

  constructor(config: StorageConfig) {
    const endpoint = config.endpoint.replace(/\/$/, "");
    this.endpointWithBucket = `${endpoint}/${config.bucket}`;
    this.publicDomain = config.publicDomain?.replace(/\/$/, "");

    this.client = new s3mini({
      endpoint: this.endpointWithBucket,
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    });
  }

  /**
   * 上传文件到 R2/S3
   */
  async uploadFile(params: {
    key: string;
    body: Buffer;
    contentType?: string;
  }): Promise<{ url: string; key: string }> {
    const response = await this.client.putObject(
      params.key,
      params.body,
      params.contentType || "application/octet-stream"
    );

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return { url: this.getPublicUrl(params.key), key: params.key };
  }

  /**
   * 从 URL 下载文件并上传到 R2/S3
   */
  async downloadAndUpload(params: {
    sourceUrl: string;
    keyPrefix: string;
    kind: MediaKind;
  }): Promise<{ url: string; key: string; contentType: string; size: number }> {
    const media = await fetchValidatedRemoteMedia({
      sourceUrl: params.sourceUrl,
      kind: params.kind,
    });
    const key = `${params.keyPrefix}.${media.extension}`;
    const uploaded = await this.uploadFile({
      key,
      body: media.buffer,
      contentType: media.contentType,
    });

    return {
      ...uploaded,
      contentType: media.contentType,
      size: media.size,
    };
  }

  /**
   * 获取公开 URL
   */
  getPublicUrl(key: string): string {
    if (this.publicDomain) {
      return `${this.publicDomain}/${key}`;
    }
    return `${this.endpointWithBucket}/${key}`;
  }
}

// 单例工厂
let storageInstance: Storage | null = null;

export function getStorage(): Storage {
  if (!storageInstance) {
    const endpoint = process.env.STORAGE_ENDPOINT;
    const accessKeyId = process.env.STORAGE_ACCESS_KEY;
    const secretAccessKey = process.env.STORAGE_SECRET_KEY;
    const bucket = process.env.STORAGE_BUCKET;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        "Storage configuration missing. Required: STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, STORAGE_BUCKET"
      );
    }

    storageInstance = new Storage({
      endpoint,
      region: process.env.STORAGE_REGION || "auto",
      accessKeyId,
      secretAccessKey,
      bucket,
      publicDomain: process.env.STORAGE_DOMAIN,
    });
  }
  return storageInstance;
}
