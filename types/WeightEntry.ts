import { BSON } from 'realm';
import Weight from './Weight';

export default interface WeightEntry extends Weight {
  _id: BSON.ObjectId;
}
