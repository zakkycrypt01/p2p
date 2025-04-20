export const getListings = async () => {
    try {
        const URL = process.env.NEXT_PUBLIC_SERVER_URL;
        // console.log('URL :>> ', URL);
        const response = await fetch(`${URL}/api/getListings`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        // console.log('response data :>> ', data);
        return data;
    } catch (error) {
        console.log('Error fetching listings:', error);
        throw error;
    }
}