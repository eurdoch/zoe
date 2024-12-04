import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native';
import { getSupplement } from './network/supplement';
import SupplementEntry from './types/SupplementEntry';
import FloatingActionButton from './FloatingActionButton';
import { useModal } from './ModalContext';
import AddSupplementModal from './AddSupplementModal';

interface SupplementScreenProps {}

const SupplementScreen: React.FC<SupplementScreenProps> = () => {
  const [supplementEntries, setSupplementEntries] = useState<SupplementEntry[]>([]);
  const { showModal } = useModal();

  const loadData = () => {
    getSupplement().then(entries => {console.log(entries); setSupplementEntries(entries)});
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSupplement = (_e: any) => {
    showModal(<AddSupplementModal loadData={loadData} />)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {
        supplementEntries.map(entry => <View style={styles.supplementEntry} key={entry._id}>
            <Text>{entry.name}</Text>
            <Text>{entry.amount + ' ' + entry.amount_unit }</Text>
        </View>)
      }
      <FloatingActionButton onPress={handleAddSupplement} />
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: Dimensions.get("window").width,
  },
  supplementEntry: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  }
});
export default SupplementScreen;
