import React from "react";
import { StyleSheet, View, Text, TextInput } from "react-native";
import theme from "../../../../../../constants/theme";

type HotelGuestInfoProps = {
  name: string;
  email: string;
  phone: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
};

const HotelGuestInfo = ({
  name,
  email,
  phone,
  onNameChange,
  onEmailChange,
  onPhoneChange,
}: HotelGuestInfoProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Guest Information</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Smith"
          placeholderTextColor="#999"
          value={name}
          onChangeText={onNameChange}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="john@example.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={onEmailChange}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+1 (555) 123-4567"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={onPhoneChange}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme.COLORS.textPrimary,
    backgroundColor: "#fff",
  },
});

export default HotelGuestInfo;


