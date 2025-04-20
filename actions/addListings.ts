export const addListings = async (fetchTokenDetails: any) => {
    try {
        const URL = process.env.NEXT_PUBLIC_SERVER_URL;
        // console.log('URL :>> ', URL);
        console.log('add new listings :>> ', fetchTokenDetails);
        
        const response = await fetch(`${URL}/api/addListing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(fetchTokenDetails),
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        // console.log('response data :>> ', data);
        return data;
    } catch (error) {
        console.log('Error adding listings:', error);
        throw error; // Re-throw so calling code can handle it
    }
}