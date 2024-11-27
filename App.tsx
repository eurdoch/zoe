import React, { useEffect, useState } from 'react';
import type {PropsWithChildren} from 'react';
import {
    Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import ScatterPlot from './ScatterPlot';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import { getExerciseNames } from './exercises/network';
import { DataPoint, convertFromDatabaseFormat } from './utils';
import ExerciseSelect from './ExerciseSelect';
import DropdownItem from './types/DropdownItem';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [exercises, setExercises] = useState<DropdownItem[]>([])
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    getExerciseNames()
      .then(names => {
        const items = names.map(name => ({
          label: convertFromDatabaseFormat(name),
          value: name,
        }));
        setExercises(items);
      })
      .catch(console.log);
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      {data && <ScatterPlot data={data} /> }
      { exercises && <ExerciseSelect items={exercises} />}
    </SafeAreaView>
  );
}

export default App;
