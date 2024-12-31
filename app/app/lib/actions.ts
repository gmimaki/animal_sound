'use server';

import { Adjective, Animal } from "./definitions";
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, PutObjectCommandInput, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, GetItemCommand, PutItemCommand, PutItemInput } from "@aws-sdk/client-dynamodb";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_US || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_US || ""
    },
});

export async function generateImage(
    animal: Animal,
    adjectives: Adjective[],
    now: Date
): Promise<string> {
    const exists = await existsImage(animal, adjectives, now);
    if (exists) {
        return exists;
    }

    const bedrockCommand = new InvokeModelCommand({
        modelId: "amazon.nova-canvas-v1:0",
        body: JSON.stringify({
            "taskType": "TEXT_IMAGE",
            "textToImageParams": {
                "text": `${adjectives.join("、")}${animal}の画像を生成してください`,
            },
            "imageGenerationConfig": {
                "width": 512,
                "height": 512,
                "numberOfImages": 1,
                "quality": "standard",
                "cfgScale": 8.0,
                "seed": 0, // TODO seed必要かも
            }
        }),
        contentType: "application/json",
        accept: "image/png",
    });

    try {
        const response = await bedrockClient.send(bedrockCommand);
        const imageDataStr = JSON.parse(new TextDecoder().decode(response.body)).images[0];
        if (imageDataStr) {
            saveImage(animal, adjectives, imageDataStr, now);
            return imageDataStr;
        }
        throw new Error("画像の生成に失敗しました。");
    } catch (error) {
        throw error;
    }
}

// TODO 抽象に依存させたい
const s3Client = new S3Client({
    region: "ap-northeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_US || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_US || "",
    },
    /* localの場合はMinIOに必要な設定を記述
    ...(process.env.ENV=== "local" && {
        endpoint: process.env.MINIO_ENDPOINT || "",
        forcePathStyle: true,
    }),
    */
})

const dynamoClient = new DynamoDBClient({
    region: "ap-northeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_US || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_US || ""
    },
    /*
    ...(process.env.ENV=== "local" && {
        endpoint: process.env.DYNAMODB_ENDPOINT || "",
    }),
    */
});

const existsImage = async (animal: Animal, adjectives: Adjective[], now: Date): Promise<string> => {
    const dynamoTable = "GeneratedImages"
    const dynamoKey = `${animal}_${adjectives.sort().join("_")}`
    const dynamoCommand = new GetItemCommand({
        TableName: dynamoTable,
        Key: {
            "Key": {
                S: dynamoKey,
            },
        },
    });

    const res = await dynamoClient.send(dynamoCommand);
    if (!res.Item) {
        return "";
    }

    // TODO 日付確認して、N日以内か確認

    const s3Bucket = res.Item.S3Bucket.S;
    const s3Key = res.Item.S3Key.S;
    const s3Command = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key,
    });
    const s3res = await s3Client.send(s3Command);
    const s3TextContent = await s3res.Body?.transformToString();

    return s3TextContent || "";
};

// バックグラウンドで画像保存
async function saveImage(animal: Animal, adjectives: Adjective[], imageBase64: string, now: Date) {
    try {
        // S3保存
        const fileName = `${now.getTime()}_${uuidv4()}.txt`
        const s3PutInput: PutObjectCommandInput = {
            Bucket: process.env.S3_BUCKET_NAME_IMAGE,
            Key: fileName,
            Body: imageBase64,
        }
        const s3PutCommand = new PutObjectCommand(s3PutInput)
        await s3Client.send(s3PutCommand)

        // Dynamo保存　
        const dynamoTable = "GeneratedImages"
        const dynamoKey = `${animal}_${adjectives.sort().join("_")}`
        const putItemInput: PutItemInput = {
            TableName: dynamoTable,
            Item: {
                Key: { S: dynamoKey },
                S3Bucket: { S: process.env.S3_BUCKET_NAME_IMAGE || "" },
                S3Key: { S: fileName },
                RegisteredAt: { S: now.getTime().toString() }
            },
        }
        const dynamoCommand = new PutItemCommand(putItemInput)
        dynamoClient.send(dynamoCommand)
    } catch (error) {
        console.error(error)
    }
}