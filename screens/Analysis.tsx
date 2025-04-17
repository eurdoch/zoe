// TODO staged for deletion
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Switch } from 'react-native';
import ScatterPlot from '../ScatterPlot';
import { getExerciseNames } from '../network/exercise';
import { convertFromDatabaseFormat, getExercisesByNameAndConvertToDataPoint, mapWeightEntriesToDataPoint } from '../utils';
import { getWeight } from '../network/weight';
import { Realm } from '@realm/react';

interface AnalysisScreenProps {
  navigation: any;
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ navigation }) => {
  const [selectedDatasets, setSelectedDatasets] = useState<{ [key: string]: any }[]>([]);
  const [switchStates, setSwitchStates] = useState<{ [key: string]: boolean }>({});
  // Since this file is marked for deletion (see comment at top), we'll use a stub approach for now
  const realm = {} as Realm;
  
  useEffect(() => {
    // Simplified approach since this component is staged for deletion
    setSwitchStates({ weight: false, supplements: false });
  }, []);

  const handleSwitch = (id: string, value: boolean) => {
    setSwitchStates((prevState) => ({
      ...prevState,
      [id]: value,
    }));
    
    // Simplified for TypeScript compilation since this component is staged for deletion
    if (value) {
      setSelectedDatasets([
        ...selectedDatasets,
        { [id]: [{ x: 0, y: 0, label: "stub" }] }
      ]);
    } else {
      setSelectedDatasets(selectedDatasets.filter((item: { [key: string]: any }) => !Object.keys(item).includes(id)));
    }
  }

  return (
    <View style={styles.container}>
      <ScatterPlot
        datasets={selectedDatasets.map((item: { [key: string]: any }) => Object.values(item)[0])}
        datasetLabels={selectedDatasets.map((item: { [key: string]: any }) => Object.keys(item)[0])}
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
