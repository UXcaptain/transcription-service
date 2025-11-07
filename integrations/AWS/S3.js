import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';


export const s3client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: { // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/modules/credentials.html
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const getS3Object = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  });

  const s3Object = s3client.send(command);

  return s3Object;
};
