import { Realm } from '@realm/react';
import Supplement from "../types/Supplement";
import SupplementEntry from "../types/SupplementEntry";
import { API_BASE_URL, SYNC_ENABLED } from '../config';
import { syncService } from '../services/SyncService';

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
    
    // If sync is enabled, try to sync immediately with the server
    if (SYNC_ENABLED) {
      try {
        // Push the new supplement to the server
        await fetch(`${API_BASE_URL}/supplement`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(result),
        });
      } catch (syncError) {
        console.warn('Failed to immediately sync new supplement, will sync later:', syncError);
        // This doesn't affect the local save, it just means we'll sync later
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
    realm.write(() => {
      const supplement = realm.objectForPrimaryKey<SupplementEntry>('SupplementEntry', id);
      if (supplement) {
        realm.delete(supplement);
      }
    });
  } catch (error) {
    console.error('Error deleting supplement:', error);
    throw error;
  }
}
