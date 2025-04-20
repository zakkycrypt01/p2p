export const getListingsById = async (id: string) => {
    const URL = process.env.NEXT_PUBLIC_SERVER_URL;
    try{
        const response = await fetch(`${URL}/api/getListing/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        const data = await response.json();
        console.log(response);
        return data;

    } catch (error) {
        console.log('Error fetching listing by id:', error);
        throw error;
    }
}