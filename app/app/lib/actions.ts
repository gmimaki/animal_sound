'use server';

import OpenAI from "openai";
import { Adjective, Animal } from "./definitions";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { BatchWriteItemCommand, DynamoDBClient, PutItemCommand, PutItemCommandInput, PutItemInput, WriteRequest } from "@aws-sdk/client-dynamodb";

const openai = new OpenAI();

export async function generateImage(
    animal: Animal,
    adjectives: Adjective[]
): Promise<string> {
    try {
        /*
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `${adjectives.join("、")}${animal}`,
            n: 1,
            size: "1024x1024",
        });
        */

        //if (response.data && response.data.length > 0) {
            //const imageUrl = response.data[0].url;
            const imageUrl = "http://localhost:3000/_next/image?url=https%3A%2F%2Foaidalleapiprodscus.blob.core.windows.net%2Fprivate%2Forg-DIUSC9XbPpbbwgWi8ovCuU3A%2Fuser-YfGltMEVqEE3FnXW7iGx8hcP%2Fimg-n99yslrkVbsilFuwZRK2GdQS.png%3Fst%3D2024-10-18T13%253A15%253A45Z%26se%3D2024-10-18T15%253A15%253A45Z%26sp%3Dr%26sv%3D2024-08-04%26sr%3Db%26rscd%3Dinline%26rsct%3Dimage%2Fpng%26skoid%3Dd505667d-d6c1-4a0a-bac7-5c84a87759f8%26sktid%3Da48cca56-e6da-484e-a814-9c849652bcb3%26skt%3D2024-10-17T23%253A22%253A59Z%26ske%3D2024-10-18T23%253A22%253A59Z%26sks%3Db%26skv%3D2024-08-04%26sig%3DgLr4jjPX08h2mnGiGYTbtpsbotgmWwYvaBi8Y7FW0G4%253D&w=640&q=75"
            if (imageUrl) {
                console.log(imageUrl)
                /* バックグラウンドで画像保存 */
                saveImage(animal, adjectives, imageUrl)
                return imageUrl;
            }
        //}

        throw new Error("画像の生成に失敗しました。");
    } catch (error) {
        throw error;
    }
}

// TODO 抽象に依存させたい
const s3Client = new S3Client({
    region: "ap-northeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    /* localの場合はMinIOに必要な設定を記述 */
    ...(process.env.ENV=== "local" && {
        endpoint: process.env.MINIO_ENDPOINT || "",
        forcePathStyle: true,
    }),
})

const dynamoClient = new DynamoDBClient({
    region: "ap-northeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
    },
    ...(process.env.ENV=== "local" && {
        endpoint: process.env.DYNAMODB_ENDPOINT || "",
    }),
});

async function saveImage(animal: Animal, adjectives: Adjective[], url: string) {
    try {
        // URLからダウンロード
        const response = await axios.get(url, { responseType: 'arraybuffer' } );
        const resImage = Buffer.from(response.data, 'binary');

        // S3保存
        const fileName = `${Date.now()}_${uuidv4()}.png` // TODO 必ずpngなのか？
        const s3PutInput: PutObjectCommandInput = {
            Bucket: process.env.S3_BUCKET_NAME_IMAGE,
            Key: `generated-images/${fileName}`,
            Body: resImage,
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
                Url: { S: url },
                RegisteredAt: { S: new Date().getTime().toString() }
            },
        }
        const dynamoCommand = new PutItemCommand(putItemInput)
        dynamoClient.send(dynamoCommand)
    } catch (error) {
        console.error(error)
    }
}