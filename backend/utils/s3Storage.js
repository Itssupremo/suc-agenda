const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const isS3Configured = !!(
  process.env.S3_KEY &&
  process.env.S3_SECRET &&
  process.env.S3_BUCKET
);

let s3Client = null;
if (isS3Configured) {
  const config = {
    credentials: {
      accessKeyId: process.env.S3_KEY,
      secretAccessKey: process.env.S3_SECRET,
    },
    region: process.env.S3_REGION || 'us-east-1',
  };
  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT;
    // For services like DO Spaces, forcePathStyle might be required.
    config.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
  }
  s3Client = new S3Client(config);
}

/**
 * Uploads a file buffer to S3/Spaces
 * @param {string} filename Original filename
 * @param {Buffer} buffer File binary data
 * @param {string} contentType MIME type
 * @returns {Promise<string|null>} S3 Key if successful, or null if S3 is not configured
 */
const uploadToS3 = async (filename, buffer, contentType) => {
  if (!isS3Configured) return null;
  
  // Create a unique key under uploads/ folder
  const fileExtension = filename.substring(filename.lastIndexOf('.'));
  const cleanBaseName = filename
    .substring(0, filename.lastIndexOf('.'))
    .replace(/[^a-zA-Z0-9-_]/g, '_');
  const uniqueKey = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${cleanBaseName}${fileExtension}`;

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: uniqueKey,
    Body: buffer,
    ContentType: contentType || 'application/pdf',
  };

  await s3Client.send(new PutObjectCommand(params));
  return uniqueKey;
};

/**
 * Gets a file buffer from S3/Spaces
 * @param {string} key S3 key
 * @returns {Promise<Buffer|null>} File buffer
 */
const getFromS3 = async (key) => {
  if (!isS3Configured) return null;

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
  };

  const response = await s3Client.send(new GetObjectCommand(params));
  
  // S3 SDK v3 returns readable stream in response.Body. We convert it to a Buffer.
  const streamToBuffer = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });

  return await streamToBuffer(response.Body);
};

/**
 * Deletes a file from S3/Spaces
 * @param {string} key S3 key
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (key) => {
  if (!isS3Configured || !key) return;

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (err) {
    console.error(`Failed to delete S3 key ${key}:`, err.message);
  }
};

module.exports = {
  isS3Configured,
  uploadToS3,
  getFromS3,
  deleteFromS3,
};
