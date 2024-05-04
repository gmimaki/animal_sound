import { useEffect, useState } from "react"
import { generateImage } from "../lib/actions"
import { Adjective, Animal } from "../lib/definitions"

export default async function AnimalImages() {
    const imageUrl = await generateImage(Animal.Lion, [Adjective.Beautiful]);
    // TODO Client Componentを返す
    return <img src={imageUrl} alt="Generated Image" />;
    /*
    const [imageUrl, setImageUrl] = useState<string>("");
    const [error, setError] = useState<Error | null>(null);

    useEffect (() => {
        const fetchImage = async() => {
            try {
                // TODO 引数
                const url = await generateImage(Animal.Lion, [Adjective.Beautiful]);
                setImageUrl(url);
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

    return <img src={imageUrl} alt="Generated Image" />;
    */
}