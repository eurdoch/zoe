import Food from "../types/Food";
import FoodEntry from "../types/FoodEntry";

const VITALE_BOX_URL = "https://directto.link";

export async function postFood(food: Food): Promise<any> {
  const response = await fetch(`${VITALE_BOX_URL}/food`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(food),
  });
  return response.json();
}

export async function getFood(id: string): Promise<FoodEntry> {
  const response = await fetch(`${VITALE_BOX_URL}/food/${id}`, {
    method: 'GET',
  });
  return response.json();
}

export async function deleteFood(id: string): Promise<any> {
  const response = await fetch(`${VITALE_BOX_URL}/food/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function getFoodByUnixTime(unixTime: number): Promise<FoodEntry[]> {
  const response = await fetch(`${VITALE_BOX_URL}/food?unixTime=${unixTime}`, {
    method: 'GET',
  });
  return response.json();
}
