import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Button } from '@ui-kitten/components';

const PrivacyPolicyScreen = ({ navigation }: { navigation: any }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last Updated: April 20, 2025</Text>
        
        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to our nutrition and calorie tracking application. We are committed to protecting 
          your privacy and providing transparency about how we handle your data. This Privacy Policy 
          explains our practices regarding the collection, use, and sharing of information when you 
          use our application.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.subSectionTitle}>Camera Usage</Text>
        <Text style={styles.paragraph}>
          Our application requests access to your device's camera. The camera is used solely for the 
          following specific purposes:
        </Text>
        <Text style={styles.bulletPoint}>• Scanning barcodes of food products</Text>
        <Text style={styles.bulletPoint}>• Capturing images of nutrition labels</Text>
        <Text style={styles.bulletPoint}>• Taking photos of food items for calorie estimation</Text>

        <Text style={styles.subSectionTitle}>How We Use Camera Data</Text>
        <Text style={styles.paragraph}>
          The images captured through your device's camera are:
        </Text>
        <Text style={styles.bulletPoint}>• Processed in real-time to extract relevant nutrition information</Text>
        <Text style={styles.bulletPoint}>• Temporarily used to provide you with calorie estimates and nutritional data</Text>
        <Text style={styles.bulletPoint}>• Shared with third-party language model APIs to analyze and extract nutritional information</Text>

        <Text style={styles.subSectionTitle}>Data Storage</Text>
        <Text style={styles.bulletPoint}>• We do NOT store or retain the images captured by your camera in any database</Text>
        <Text style={styles.bulletPoint}>• Images are processed transiently and are not permanently saved by our application</Text>
        <Text style={styles.bulletPoint}>• Once the nutritional information is extracted, the original images are not preserved</Text>

        <Text style={styles.sectionTitle}>Third-Party Services</Text>
        <Text style={styles.paragraph}>
          Our application uses third-party language model APIs to process images for nutrition information 
          extraction. When you use these features:
        </Text>
        <Text style={styles.bulletPoint}>• Images captured by your camera are transmitted to these services for processing</Text>
        <Text style={styles.bulletPoint}>• These transmissions occur over encrypted connections</Text>
        <Text style={styles.bulletPoint}>• We only share what is necessary for the function to work properly</Text>
        <Text style={styles.bulletPoint}>• We do not grant these third parties permission to use your data for their own purposes</Text>
        <Text style={styles.bulletPoint}>• Please note that third-party services may have their own privacy policies and terms</Text>

        <Text style={styles.sectionTitle}>Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate technical and organizational measures to protect your information 
          from unauthorized access, loss, or alteration.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.paragraph}>
          Depending on your location, you may have rights regarding your personal information, including:
        </Text>
        <Text style={styles.bulletPoint}>• The right to access information we have about you</Text>
        <Text style={styles.bulletPoint}>• The right to request deletion of your data</Text>
        <Text style={styles.bulletPoint}>• The right to restrict or object to our processing of your data</Text>
        <Text style={styles.bulletPoint}>• The right to data portability</Text>

        <Text style={styles.sectionTitle}>Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our application is not directed to children under the age of 13, and we do not knowingly collect 
          personal information from children.
        </Text>

        <Text style={styles.sectionTitle}>Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
          the new Privacy Policy on this page and updating the "Last Updated" date.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us at:
        </Text>
        <Text style={styles.paragraph}>support@zotik.app</Text>

        <Text style={styles.sectionTitle}>Consent</Text>
        <Text style={styles.paragraph}>
          By using our application, you consent to our Privacy Policy and agree to its terms and conditions.
        </Text>

        <View style={styles.buttonContainer}>
          <Button onPress={() => navigation.goBack()}>
            Back to Profile
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#8F9BB3',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    color: '#2E3A59',
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    marginLeft: 16,
    color: '#2E3A59',
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
});

export default PrivacyPolicyScreen;