import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DataPoint from '../types/DataPoint';
import ScatterPlot from '../ScatterPlot';
import { getExerciseNames } from '../network/exercise';

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
        onDataPointClick={() => {}}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default AnalysisScreen;
