import type { Key } from "react";

export interface ColombiaDepartment {
    id: Key | null | undefined;
    departamento: string;
    ciudades: string[];
}

export const COLOMBIA_JSON_URL =
    "https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.min.json";

export async function fetchColombiaData(): Promise<ColombiaDepartment[]> {
    try {
        const response = await fetch(COLOMBIA_JSON_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch Colombia data");
        }

        const data = (await response.json()) as ColombiaDepartment[];

        return data;
    } catch (error) {
        console.error("Error fetching Colombia data:", error);
        return [];
    }
}
