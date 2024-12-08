import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Switch } from 'react-native';
import ScatterPlot from '../ScatterPlot';
import { getExerciseNames } from '../network/exercise';
import { convertFromDatabaseFormat, getExercisesByNameAndConvertToDataPoint, mapWeightEntriesToDataPoint } from '../utils';
import { getSupplement } from '../network/supplement';
import { getWeight } from '../network/weight';
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
    
    if (value) {
      // Adding dataset when switch is turned on
      if (id === 'weight') {
        getWeight().then(entries => {
          const dset = mapWeightEntriesToDataPoint(entries);
          console.log(dset);
          setSelectedDatasets([
            ...selectedDatasets,
            { [id]: dset}
          ])
        });
      } else if (id === 'supplements') {
        // handle
      } else {
        getExercisesByNameAndConvertToDataPoint(id).then(dset => {
          setSelectedDatasets([
            ...selectedDatasets,
            { [id]: dset }
          ])
        });
      }
    } else {
      // Removing dataset when switch is turned off
      setSelectedDatasets(selectedDatasets.filter(item => !Object.keys(item).includes(id)));
    }
  }

  return (
    <View style={styles.container}>
      <ScatterPlot
        datasets={selectedDatasets.map(item => Object.values(item)[0])}
        datasetLabels={selectedDatasets.map(item => Object.keys(item)[0])}
        onDataPointClick={() => {}}
      />
      <View style={{flex: 1}}>
        <ScrollView style={styles.switchesContainer}>
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
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  switchesContainer: {
    height: 200,
  },
});
export default AnalysisScreen;
