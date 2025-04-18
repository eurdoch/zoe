import { Realm } from '@realm/react';
import Supplement from "../types/Supplement";
import SupplementEntry from "../types/SupplementEntry";
import { API_BASE_URL, SYNC_ENABLED } from '../config';
import { syncService } from '../services/SyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function postSupplement(supplement: Supplement, realm: Realm): Promise<SupplementEntry> {
  try {
    let result: SupplementEntry;
    let supplementEntry: any;
    
    // Create in local Realm database
    realm.write(() => {
      supplementEntry = {
        _id: new Realm.BSON.ObjectId().toString(),
        ...supplement,
      };
      result = realm.create('SupplementEntry', supplementEntry);
    });
    
    // If sync is enabled, save to the remote server as well
    if (SYNC_ENABLED) {
      try {
        // Get JWT token from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.warn('No authentication token found, skipping server save for supplement');
          return result!;
        }
        
        // Save the supplement to the server with authentication
        const response = await fetch(`${API_BASE_URL}/supplement`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(supplementEntry),
        });
        
        if (!response.ok) {
          console.warn(`Failed to save supplement to server: ${response.status} ${response.statusText}`);
          
          // If unauthorized, log it specifically
          if (response.status === 401 || response.status === 403) {
            console.error('Authentication failed when saving supplement to server');
          }
        } else {
          console.log(`Successfully saved supplement with ID ${supplementEntry._id} to server`);
        }
      } catch (syncError) {
        console.warn('Failed to sync new supplement to server:', syncError);
        // This doesn't affect the local save, it just means we'll have inconsistency with the server
      }
    }
    
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

export async function getSupplement(realm: Realm, startDate?: number, endDate?: number, last_logged?: number): Promise<SupplementEntry[]> {
  try {
    console.log(`👉 getSupplement called with startDate: ${startDate}, endDate: ${endDate}, last_logged: ${last_logged}`);
    let supplements = realm.objects<SupplementEntry>('SupplementEntry');
    console.log(`👉 Total supplements in Realm: ${supplements.length}`);
    
    if (startDate && endDate) {
      supplements = supplements.filtered('createdAt >= $0 && createdAt <= $1', startDate, endDate);
      console.log(`👉 After date range filter: ${supplements.length}`);
    } else if (startDate) {
      supplements = supplements.filtered('createdAt >= $0', startDate);
      console.log(`👉 After start date filter: ${supplements.length}`);
    } else if (endDate) {
      supplements = supplements.filtered('createdAt <= $0', endDate);
      console.log(`👉 After end date filter: ${supplements.length}`);
    }
    
    // If last_logged is specified, sort by createdAt descending and limit results
    if (last_logged && last_logged > 0) {
      const sortedSupplements = supplements.sorted('createdAt', true); // true for descending
      const limitedSupplements = Array.from(sortedSupplements.slice(0, last_logged)).map(supplement => ({ ...supplement }));
      console.log(`👉 After sorting and limiting to ${last_logged}: ${limitedSupplements.length}`);
      console.log(`👉 First entry:`, limitedSupplements[0] || 'No entries');
      return limitedSupplements;
    }
    
    // Default behavior: sort by createdAt ascending
    const sortedSupplements = supplements.sorted('createdAt');
    const resultSupplements = Array.from(sortedSupplements).map(supplement => ({ ...supplement }));
    console.log(`👉 Final result (sorted ascending): ${resultSupplements.length}`);
    return resultSupplements;
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
