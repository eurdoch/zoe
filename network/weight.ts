import Realm from 'realm';
import Weight from "../types/Weight";
import WeightEntry from "../types/WeightEntry";

export async function postWeight(weight: Weight, realm: Realm): Promise<WeightEntry> {
  let newWeightEntry: WeightEntry;

  realm.write(() => {
    newWeightEntry = realm.create<WeightEntry>('WeightEntry', {
      _id: new Realm.BSON.ObjectId(),
      weight: weight.value,
      createdAt: weight.createdAt,
    });
  });

  return newWeightEntry!;
}

export async function getWeight(startDate?: number, endDate?: number, realm: Realm): Promise<WeightEntry[]> {
  let weights: WeightEntry[];

  if (startDate !== undefined && endDate !== undefined) {
    weights = realm.objects<WeightEntry>('WeightEntry')
      .filtered('createdAt >= $0 AND createdAt <= $1', startDate, endDate)
      .map(w => ({ 
        _id: w._id,
        weight: w.weight, 
        createdAt: w.createdAt 
      }));
  } else {
    weights = realm.objects<WeightEntry>('WeightEntry')
      .map(w => ({ 
        _id: w._id, 
        weight: w.weight, 
        createdAt: w.createdAt 
      }));
  }

  return weights;
}

export async function deleteWeight(id: Realm.BSON.ObjectId, realm: Realm): Promise<void> {
  const weightToDelete = realm.objectForPrimaryKey<WeightEntry>('WeightEntry', id);

  if (weightToDelete) {
    realm.write(() => {
      realm.delete(weightToDelete);
    });
  }
}
