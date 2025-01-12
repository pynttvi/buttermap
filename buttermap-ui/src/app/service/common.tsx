import {CoordinateChange, PersistedCoordinateChange} from "@/app/model/coordinate";
import {Area, PersistedArea} from "@/app/model/area";
import {Auth, getAuth} from "@/app/utils";

export interface PersistedData {
    changes: PersistedCoordinateChange[]
    areas: PersistedArea[]
}

const baseUrl = "https://buttermap-backend.vercel.app"
export const fetchData = async (
    token?: string
): Promise<PersistedData | undefined> => {
    const url = `${baseUrl}/api/get-data`
    try {
        const auth: Auth | null = getAuth()
        const headers = new Headers();

        headers.append("Authorization", `Basic ${token ?? auth?.token ?? ""}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        const result = await response.json() as PersistedData;

        if (response.ok) {
            return result
        } else {
            console.error('Error fetching data', result);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

export const addArea = async (
    area: Area
): Promise<PersistedData | undefined> => {
    const url = `${baseUrl}/api/add-area`
    try {
        const auth: Auth | null = getAuth()
        if (auth) {

            const headers = new Headers();
            headers.append("Authorization", `Basic ${auth.token}`);
            headers.append("Content-Type", "application/json")
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(area)
            });

            const result = await response.json();
            if (response.ok) {
                return result
            }
        }

        console.error('Error fetching changes');

    } catch (error) {
        console.error('Error:', error);
    }
}

export const addChange = async (
    change: CoordinateChange
): Promise<PersistedData | undefined> => {
    const url = `${baseUrl}/api/add-change`
    try {
        const auth: Auth | null = getAuth()
        const headers = new Headers();
        headers.append("Authorization", `Basic ${auth?.token ?? ""}`);
        headers.append("Content-Type", "application/json")
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(change)
        });

        const result = await response.json();

        if (response.ok) {
            return result
        } else {
            console.error('Error fetching changes');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}