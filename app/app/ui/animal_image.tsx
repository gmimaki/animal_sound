'use client';

import { useEffect, useState } from "react"
import { generateImage } from "../lib/actions"
import { Adjective, Animal } from "../lib/definitions"
import Image from 'next/image';

export default function AnimalImage() {
    //const imageUrl = await generateImage(Animal.Lion, [Adjective.Beautiful]);
    // TODO Client Componentを返す
    //return <img src={imageUrl} alt="Generated Image" />;
    const [imageUrl, setImageUrl] = useState<string>("");
    const [error, setError] = useState<Error | null>(null);

    useEffect (() => {
        const fetchImage = async() => {
            try {
                // TODO 引数
                const res = await generateImage(Animal.Lion, [Adjective.Beautiful], new Date());
                const imageUrl = `data:image/png;base64,${res}`;
                setImageUrl(imageUrl);
            } catch (err) {
                setError(err as Error);
            }
        };

        fetchImage();
    }, []);

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    if (!imageUrl) {
        return <div>Loading...</div>;
    }

    return <Image src={imageUrl} alt="Generated Image" width={280} height={180} />
}