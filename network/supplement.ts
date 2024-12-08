import Supplement from "../types/Supplement";
import SupplementEntry from "../types/SupplementEntry";

const VITALE_BOX_URL = "https://directto.link";

export async function postSupplement(supplement: Supplement): Promise<any> {
  const response = await fetch(`${VITALE_BOX_URL}/supplement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(supplement),
  });
  return response.json();
}

export async function getExerciseNames(): Promise<string[]> {
  const response = await fetch(`${VITALE_BOX_URL}/supplement/names`, {
    method: 'GET',
  });
  return response.json();
}

export async function getSupplementNames(): Promise<string[]> {
  const response = await fetch(`${VITALE_BOX_URL}/supplement/names`, {
    method: 'GET',
  });
  return response.json();
}

export async function getSupplement(startDate?: number, endDate?: number): Promise<SupplementEntry[]> {
  const response = await fetch(`${VITALE_BOX_URL}/supplement?startDate=${startDate}&endDate=${endDate}`, {
    method: 'GET',
  });
  return response.json();
}
export async function deleteSupplement(id: string): Promise<void> {
  await fetch(`${VITALE_BOX_URL}/supplement/${id}`, {
    method: 'DELETE',
  });
}
