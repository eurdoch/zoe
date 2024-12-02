import Weight from "../types/Weight";
import WeightEntry from "../types/WeightEntry";

const VITALE_BOX_URL = "https://directto.link";

export async function postWeight(weight: Weight): Promise<any> {
  const response = await fetch(`${VITALE_BOX_URL}/weight`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(weight),
  });
  return response.json();
}

export async function getWeight(startDate?: number, endDate?: number): Promise<WeightEntry[]> {
  const response = await fetch(`${VITALE_BOX_URL}/weight?startDate=${startDate}&endDate=${endDate}`, {
    method: 'GET',
  });
  return response.json();
}

export async function deleteWeight(id: string): Promise<void> {
  await fetch(`${VITALE_BOX_URL}/weight/${id}`, {
    method: 'DELETE',
  });
}
