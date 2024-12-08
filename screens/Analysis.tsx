import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import ScatterPlot from '../ScatterPlot';
import { getExerciseNames } from '../network/exercise';
import { convertFromDatabaseFormat, getExercisesByNameAndConvertToDataPoint } from '../utils';
interface AnalysisScreenProps {
  navigation: any;
}
const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ navigation }) => {
  const [selectedDatasets, setSelectedDatasets] = useState<any>([]);
  const [switchStates, setSwitchStates] = useState<{ [key: string]: boolean }>({});
  
  useEffect(() => {
    getExerciseNames().then(names => {
      const initialStates = names.reduce((acc, name) => ({
        ...acc,
        [name]: false,
      }), {});
      setSwitchStates({ ...initialStates, weight: false, supplements: false });
    });
  }, []);

  const handleSwitch = (id: string, value: boolean) => {
    setSwitchStates((prevState) => ({
      ...prevState,
      [id]: value,
    }));
    if (id === 'weights' || id === 'supplements') {
      // handle
    } else {
      getExercisesByNameAndConvertToDataPoint(id)
        .then(dset => {
          setSelectedDatasets([
            ...selectedDatasets,
            { [id]: dset }
          ])
        });
    }
  }
  return (
    <View style={styles.container}>
      <Text>Analysis</Text>
      <ScatterPlot
        datasets={selectedDatasets.map(item => Object.values(item)[0])}
        datasetLabels={selectedDatasets.map(item => Object.keys(item)[0])}
        onDataPointClick={() => {}}
      />
      <View style={styles.switchesContainer}>
        {Object.keys(switchStates).map((id) => (
          <View key={id} style={styles.switchContainer}>
            <Text>{convertFromDatabaseFormat(id)}</Text>
            <Switch
              value={switchStates[id]}
              onValueChange={(value) => {
                handleSwitch(id, value);
              }}
            />
          </View>
        ))}
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
