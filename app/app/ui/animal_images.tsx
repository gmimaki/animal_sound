import { useEffect, useState } from "react"
import { generateImage } from "../lib/actions"
import { Adjective, Animal } from "../lib/definitions"
import AnimalImage from "./animal_image"

export default async function AnimalImages() {
    return (
        <>
            <AnimalImage />
            {/*
            <AnimalImage />
            <AnimalImage />
            */}
        </>
    );
}