export const getListingsByAddress = async (address: string) => {
    const URL = process.env.NEXT_PUBLIC_SERVER_URL;
    try {
        const response = await fetch(`${URL}/api/getListings/${address}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address }),
        });
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.log('Error fetching listings by address:', error);
        throw error;
    }
}