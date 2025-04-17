import Realm from 'realm';
import Weight from "../types/Weight";
import WeightEntry from "../types/WeightEntry";
import { API_BASE_URL, SYNC_ENABLED } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function postWeight(weight: Weight, realm: Realm): Promise<WeightEntry> {
  let newWeightEntry!: WeightEntry;

  realm.write(() => {
    newWeightEntry = realm.create<WeightEntry>('WeightEntry', {
      _id: new Realm.BSON.ObjectId().toString(),
      value: weight.value,
      createdAt: weight.createdAt,
    });
  });

  // If sync is enabled, save to the remote server as well
  if (SYNC_ENABLED) {
    try {
      // Get JWT token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.warn('No authentication token found, skipping server save for weight');
        return newWeightEntry!;
      }
      
      // Save the weight to the server with authentication
      const response = await fetch(`${API_BASE_URL}/weight`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newWeightEntry),
      });
      
      if (!response.ok) {
        console.warn(`Failed to save weight to server: ${response.status} ${response.statusText}`);
        
        // If unauthorized, log it specifically
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed when saving weight to server');
        }
      } else {
        console.log(`Successfully saved weight with ID ${newWeightEntry._id} to server`);
      }
    } catch (syncError) {
      console.warn('Failed to sync new weight to server:', syncError);
      // This doesn't affect the local save, it just means we'll have inconsistency with the server
    }
  }

  return newWeightEntry!;
}

export async function getWeight(realm: Realm, startDate?: number, endDate?: number): Promise<WeightEntry[]> {
  let weights: WeightEntry[];

  if (startDate !== undefined && endDate !== undefined) {
    weights = realm.objects<WeightEntry>('WeightEntry')
      .filtered('createdAt >= $0 AND createdAt <= $1', startDate, endDate)
      .map(w => ({ 
        _id: w._id,
        value: w.value, 
        createdAt: w.createdAt 
      }));
  } else {
    weights = realm.objects<WeightEntry>('WeightEntry')
      .map(w => ({ 
        _id: w._id, 
        value: w.value, 
        createdAt: w.createdAt 
      }));
  }

  return weights;
}

export async function deleteWeight(id: string, realm: Realm): Promise<void> {
  try {
    // Delete from local Realm database
    const weightToDelete = realm.objectForPrimaryKey<WeightEntry>('WeightEntry', id);

    if (weightToDelete) {
      realm.write(() => {
        realm.delete(weightToDelete);
      });
    }
    
    // If sync is enabled, delete from the remote server as well
    if (SYNC_ENABLED) {
      try {
        // Get JWT token from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.warn('No authentication token found, skipping server deletion for weight');
          return;
        }
        
        // Delete the weight from the server with authentication
        const response = await fetch(`${API_BASE_URL}/weight/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        if (!response.ok) {
          console.warn(`Failed to delete weight with ID ${id} from server: ${response.status} ${response.statusText}`);
          
          // If unauthorized, log it specifically
          if (response.status === 401 || response.status === 403) {
            console.error('Authentication failed when deleting weight from server');
          }
        } else {
          console.log(`Successfully deleted weight with ID ${id} from server`);
        }
      } catch (syncError) {
        console.warn(`Failed to sync deletion of weight with ID ${id}:`, syncError);
        // This doesn't affect the local deletion, it just means we'll have inconsistency with the server
      }
    }
  } catch (error) {
    console.error('Error deleting weight:', error);
    throw error;
  }
}
