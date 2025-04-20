import { useState, useEffect } from "react";

export function useSuiPrice() {
  const [suiPrice, setSuiPrice] = useState<number>(0);

  useEffect(() => {
    const fetchSuiPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd"
        );
        const data = await response.json();
        setSuiPrice(data.sui.usd);
      } catch (error) {
        console.error("Error fetching SUI price:", error);
        // Fallback to a default price if the API fails
        setSuiPrice(5); // Default to $5 if API fails
      }
    };

    fetchSuiPrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchSuiPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return suiPrice;
}