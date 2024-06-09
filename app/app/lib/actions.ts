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
    return "https://oaidalleapiprodscus.blob.core.windows.net/private/org-DIUSC9XbPpbbwgWi8ovCuU3A/user-YfGltMEVqEE3FnXW7iGx8hcP/img-LCfn6wCyu7YifbX70As5XBTO.png?st=2024-05-11T04%3A28%3A38Z&se=2024-05-11T06%3A28%3A38Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-05-10T22%3A23%3A30Z&ske=2024-05-11T22%3A23%3A30Z&sks=b&skv=2021-08-06&sig=VCLkjBuIhDRkrO4jKL7c9knG%2B7GwAlOJx3XFheUncyM%3D";
    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `${adjectives.join("、")}${animal}`,
            n: 1,
            size: "1024x1024",
        });

        if (response.data && response.data.length > 0) {
            const imageUrl = response.data[0].url;
            if (imageUrl) {
                console.log(imageUrl)
                /* バックグラウンドで画像保存 */
                saveImage(imageUrl)
                return imageUrl;
            }
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
        accessKeyId: process.env.ACCESS_KEY_ID || "",
        secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
    },
    /* localの場合はMinIOに必要な設定を記述 */
    ...(process.env.env === "local" && {
        endpoint: process.env.MINIO_ENDPOINT || "",
        forcePathStyle: true,
    }),
})

const dynamoClient = new DynamoDBClient({ region: "ap-northeast-1" });

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
            }
        }
        const dynamoCommand = new PutItemCommand(putItemInput)
        dynamoClient.send(dynamoCommand)
    } catch (error) {
        console.error(error)
    }
}