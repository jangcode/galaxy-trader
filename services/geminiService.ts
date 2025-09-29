import { GoogleGenAI, Type } from "@google/genai";
import type { Good, MarketGood, Planet } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface GeminiMarketResponse {
    specialtyGoodId: string;
    market: MarketGood[];
}

export const generateMarketForPlanet = async (
    planet: Omit<Planet, 'id' | 'position' | 'market'>,
    goods: Good[]
): Promise<{ market: MarketGood[] }> => {
    
    const goodsList = goods.map(g => `- ${g.name} (ID: ${g.id}, Base Price: ${g.basePrice})`).join('\n');

    const prompt = `
You are an economic simulator for a space trading game.
Based on the following planet information, generate a market price list for all available goods.

Planet Information:
- Name: ${planet.name}
- Description: ${planet.description}
- Tax Rate: ${planet.taxRate * 100}%

Available goods in the galaxy:
${goodsList}

Your task is to:
1. Identify ONE specialty good for this planet from the list above, based on its description. The specialty good is something the planet produces or has in abundance.
2. Generate a full market list with a 'buyPrice' and 'sellPrice' for EVERY good in the provided list. The 'goodId' in the market list MUST match an ID from the available goods.
3. For the specialty good, the 'buyPrice' should be significantly BELOW its base price (around 50-70% of base price).
4. For goods that would be scarce or in high demand on this planet according to its description, the 'buyPrice' should be significantly ABOVE the base price.
5. All other goods should have prices fluctuating reasonably around their base price.
6. The 'sellPrice' for any good must be lower than its 'buyPrice' on the same planet (typically 85-95% of the buy price).
7. Ensure all generated prices are positive integers.

Respond ONLY with a JSON object that matches the provided schema. The 'market' array must contain an entry for every single available good.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        specialtyGoodId: { type: Type.STRING },
                        market: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    goodId: { type: Type.STRING },
                                    buyPrice: { type: Type.INTEGER },
                                    sellPrice: { type: Type.INTEGER }
                                },
                                required: ['goodId', 'buyPrice', 'sellPrice'],
                            }
                        }
                    },
                    required: ['specialtyGoodId', 'market'],
                }
            }
        });

        const jsonString = response.text;
        const result: GeminiMarketResponse = JSON.parse(jsonString);

        // Basic validation
        if (!result.market || result.market.length !== goods.length) {
            throw new Error('Generated market data is incomplete or invalid.');
        }

        // Ensure specialty good has a low price, just in case the model didn't follow instructions perfectly
        const specialtyMarketGood = result.market.find(m => m.goodId === result.specialtyGoodId);
        const specialtyGood = goods.find(g => g.id === result.specialtyGoodId);

        if (specialtyMarketGood && specialtyGood && specialtyMarketGood.buyPrice > specialtyGood.basePrice) {
            console.warn("Gemini didn't make the specialty good cheap. Adjusting price manually.");
            specialtyMarketGood.buyPrice = Math.round(specialtyGood.basePrice * (0.5 + Math.random() * 0.2)); // 50-70%
            specialtyMarketGood.sellPrice = Math.round(specialtyMarketGood.buyPrice * 0.9);
        }


        return { market: result.market };

    } catch (error) {
        console.error("Error generating market data with Gemini:", error);
        throw new Error("Failed to generate planetary market. The AI economists are on strike.");
    }
}
