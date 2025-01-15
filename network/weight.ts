import Realm from 'realm';
import Weight from "../types/Weight";
import WeightEntry from "../types/WeightEntry";

// Realm Weight Schema
class WeightSchema extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  value!: number;
  createdAt!: number;

  static schema = {
    name: 'Weight',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      value: 'float',
      createdAt: 'int',
    },
  };
}

// Realm Database Singleton
let realmInstance: Realm | null = null;

function getRealmInstance(): Realm {
  if (!realmInstance) {
    realmInstance = new Realm({
      schema: [WeightSchema],
      schemaVersion: 1,
    });
  }
  return realmInstance;
}

export async function postWeight(weight: Weight): Promise<WeightEntry> {
  const realm = getRealmInstance();
  let newWeightEntry: WeightEntry | undefined;

  realm.write(() => {
    newWeightEntry = realm.create<WeightSchema>('Weight', {
      _id: new Realm.BSON.ObjectId(),
      value: weight.value,
      createdAt: weight.createdAt,
    });
  });

  return newWeightEntry!;
}

export async function getWeight(startDate?: number, endDate?: number): Promise<WeightEntry[]> {
  const realm = getRealmInstance();
  let weights: WeightEntry[];

  if (startDate !== undefined && endDate !== undefined) {
    weights = realm.objects<WeightSchema>('Weight')
      .filtered('createdAt >= $0 AND createdAt <= $1', startDate, endDate)
      .map(w => ({ 
        _id: w._id.toHexString(), 
        value: w.value, 
        createdAt: w.createdAt 
      }));
  } else {
    weights = realm.objects<WeightSchema>('Weight')
      .map(w => ({ 
        _id: w._id.toHexString(), 
        value: w.value, 
        createdAt: w.createdAt 
      }));
  }

  return weights;
}

export async function deleteWeight(id: string): Promise<void> {
  const realm = getRealmInstance();
  const weightToDelete = realm.objectForPrimaryKey<WeightSchema>('Weight', new Realm.BSON.ObjectId(id));

  if (weightToDelete) {
    realm.write(() => {
      realm.delete(weightToDelete);
    });
  }
}

// Optional: Close Realm when no longer needed
export function closeRealm() {
  if (realmInstance) {
    realmInstance.close();
    realmInstance = null;
  }
}