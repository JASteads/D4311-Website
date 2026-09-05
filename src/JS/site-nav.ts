import { API_URL } from "./config";

export const safeLink = async (url: string) => {
    const result = await fetch(`${API_URL}/api/redirect?file=${encodeURIComponent(url)}`);
        
    if (!result.ok) {
        console.error('Failed to redirect');
        return '';
    }

    return (await result.json()).redirectTo as string;
}