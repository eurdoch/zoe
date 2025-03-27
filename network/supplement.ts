import { Realm } from '@realm/react';
import Supplement from "../types/Supplement";
import SupplementEntry from "../types/SupplementEntry";
import { API_BASE_URL, SYNC_ENABLED } from '../config';
import { syncService } from '../services/SyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function postSupplement(supplement: Supplement, realm: Realm): Promise<SupplementEntry> {
  try {
    let result: SupplementEntry;
    
    // Create in local Realm database
    realm.write(() => {
      const supplementEntry = {
        _id: new Realm.BSON.ObjectId().toString(),
        ...supplement,
      };
      result = realm.create('SupplementEntry', supplementEntry);
    });
    
    return result!;
  } catch (error) {
    console.error('Error creating supplement:', error);
    throw error;
  }
}

export async function getSupplementNames(realm: Realm): Promise<string[]> {
  try {
    const supplements = realm.objects<SupplementEntry>('SupplementEntry');
    const uniqueNames = new Set(supplements.map(supplement => supplement.name));
    return Array.from(uniqueNames);
  } catch (error) {
    console.error('Error getting supplement names:', error);
    throw error;
  }
}

export async function getSupplement(realm: Realm, startDate?: number, endDate?: number): Promise<SupplementEntry[]> {
  try {
    let supplements = realm.objects<SupplementEntry>('SupplementEntry');
    
    if (startDate && endDate) {
      supplements = supplements.filtered('createdAt >= $0 && createdAt <= $1', startDate, endDate);
    } else if (startDate) {
      supplements = supplements.filtered('createdAt >= $0', startDate);
    } else if (endDate) {
      supplements = supplements.filtered('createdAt <= $0', endDate);
    }
    
    // Sort by createdAt time
    const sortedSupplements = supplements.sorted('createdAt');
    
    return Array.from(sortedSupplements).map(supplement => ({ ...supplement }));
  } catch (error) {
    console.error('Error getting supplements:', error);
    throw error;
  }
}

export async function getSupplementById(id: string, realm: Realm): Promise<SupplementEntry> {
  try {
    const supplement = realm.objectForPrimaryKey<SupplementEntry>('SupplementEntry', id);
    if (!supplement) {
      throw new Error(`Supplement with id ${id} not found`);
    }
    return { ...supplement };
  } catch (error) {
    console.error('Error getting supplement by id:', error);
    throw error;
  }
}

export async function deleteSupplement(id: string, realm: Realm): Promise<void> {
  try {
    // Delete from local Realm database
    realm.write(() => {
      const supplement = realm.objectForPrimaryKey<SupplementEntry>('SupplementEntry', id);
      if (supplement) {
        realm.delete(supplement);
      }
    });
    
    // If sync is enabled, delete from the remote server as well
    if (SYNC_ENABLED) {
      try {
        // Get JWT token from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.warn('No authentication token found, skipping server deletion for supplement');
          return;
        }
        
        // Delete the supplement from the server with authentication
        const response = await fetch(`${API_BASE_URL}/supplement/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        if (!response.ok) {
          console.warn(`Failed to delete supplement with ID ${id} from server: ${response.status} ${response.statusText}`);
          
          // If unauthorized, log it specifically
          if (response.status === 401 || response.status === 403) {
            console.error('Authentication failed when deleting supplement from server');
          }
        } else {
          console.log(`Successfully deleted supplement with ID ${id} from server`);
        }
      } catch (syncError) {
        console.warn(`Failed to sync deletion of supplement with ID ${id}:`, syncError);
        // This doesn't affect the local deletion, it just means we'll have inconsistency with the server
      }
    }
  } catch (error) {
    console.error('Error deleting supplement:', error);
    throw error;
  }
}
