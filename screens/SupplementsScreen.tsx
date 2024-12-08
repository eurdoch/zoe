
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions, Modal, Pressable } from 'react-native';
import { getSupplement } from '../network/supplement';
import SupplementEntry from '../types/SupplementEntry';
import FloatingActionButton from '../components/FloatingActionButton';
import { formatTime } from '../utils';
import CustomModal from '../CustomModal';
interface SupplementScreenProps {}
const SupplementScreen: React.FC<SupplementScreenProps> = () => {
  const [supplementEntries, setSupplementEntries] = useState<SupplementEntry[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const loadData = () => {
    getSupplement().then(entries => setSupplementEntries(entries));
  }
  useEffect(() => {
    loadData();
  }, []);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {
        supplementEntries.map(entry => <View style={styles.supplementEntry} key={entry._id}>
            <View style={styles.entryTextContainer}>
              <Text style={[styles.entryText, styles.boldText]}>{formatTime(entry.createdAt)}</Text>
              <Text style={styles.entryText}>{entry.name}</Text>
            </View>
            <Text style={styles.entryText}>{entry.amount + ' ' + entry.amount_unit }</Text>
        </View>)
      }
      <FloatingActionButton onPress={() => setModalVisible(true)} />
      <CustomModal visible={modalVisible} setVisible={setModalVisible}>
        <Text>Hello</Text>
      </CustomModal>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: Dimensions.get("window").width,
    padding: 10,
    gap: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  supplementEntry: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  entryTextContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  entryText: {
    fontFamily: 'Inter',
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});
export default SupplementScreen;
