'use server';

import OpenAI from "openai";
import { Adjective, Animal } from "./definitions";

const openai = new OpenAI();

export async function generateImage(
    animal: Animal,
    adjectives: Adjective[]
): Promise<string> {
    return "https://oaidalleapiprodscus.blob.core.windows.net/private/org-DIUSC9XbPpbbwgWi8ovCuU3A/user-YfGltMEVqEE3FnXW7iGx8hcP/img-rbsJo8F1QT2z6MnOQWfm0HRD.png?st=2024-05-04T20%3A57%3A18Z&se=2024-05-04T22%3A57%3A18Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-05-04T21%3A24%3A40Z&ske=2024-05-05T21%3A24%3A40Z&sks=b&skv=2021-08-06&sig=AAA4fTK%2BmD/VAp%2BsL%2BPSmSmrDKR/TPL/TBgwedNpEjw%3D";
    /*
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
                return imageUrl;
            }
        }

        throw new Error("画像の生成に失敗しました。");
    } catch (error) {
        throw error;
    }
    */
}