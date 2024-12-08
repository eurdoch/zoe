import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import DataPoint from '../types/DataPoint';
import ScatterPlot from '../ScatterPlot';
import { getExerciseNames } from '../network/exercise';
import { convertFromDatabaseFormat } from '../utils';
interface AnalysisScreenProps {
  navigation: any;
}
const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ navigation }) => {
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [datasetLabels, setDatasetLabels] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<DataPoint[][]>([]);

  useEffect(() => {
    getExerciseNames().then(setExerciseNames);
  }, []);

  return (
    <View style={styles.container}>
      <Text>Analysis</Text>
      <ScatterPlot
        datasets={datasets}
        datasetLabels={datasetLabels}
        onDataPointClick={() => {}}
      />
      <View style={styles.switchesContainer}>
        {exerciseNames.map((exerciseName) => (
          <View key={exerciseName} style={styles.switchContainer}>
            <Text>{convertFromDatabaseFormat(exerciseName)}</Text>
            <Switch />
          </View>
        ))}
        <View style={styles.switchContainer}>
          <Text>Weight</Text>
          <Switch />
        </View>
        <View style={styles.switchContainer}>
          <Text>Supplements</Text>
          <Switch />
        </View>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  switchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
export default AnalysisScreen;
