// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import theme from "../../../../../../constants/theme";

function getBookingDays(startDate) {
  const today = startDate ? new Date(`${startDate}T12:00:00`) : new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const dateValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { day: date.toLocaleDateString(undefined, { weekday: "short" }), date: dateValue, dateNumber: date.toLocaleDateString(undefined, { day: "numeric" }), month: date.toLocaleDateString(undefined, { month: "short" }) };
  });
}

const DateSelector = ({ selectedDate, onDateSelect, title = "Select Date", startDate = undefined }) => {
  const days = getBookingDays(startDate);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
        {days.map((item) => (
          <TouchableOpacity
            key={item.date}
            style={[
              styles.dateItem,
              selectedDate === item.date && styles.selectedDateItem,
            ]}
            onPress={() => onDateSelect(item.date)}
          >
            <Text style={[styles.dateDay, selectedDate === item.date && styles.selectedDateText]}>
              {item.day}
            </Text>
            <Text style={[styles.dateNumber, selectedDate === item.date && styles.selectedDateText]}>
              {item.dateNumber}
            </Text>
            <Text style={[styles.dateMonth, selectedDate === item.date && styles.selectedDateText]}>
              {item.month}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 15,
  },
  dateList: {
    flexDirection: "row",
  },
  dateItem: {
    width: 70,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedDateItem: {
    backgroundColor: theme.COLORS.primary,
    borderColor: theme.COLORS.primary,
  },
  dateDay: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  dateMonth: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginTop: 4,
  },
  selectedDateText: {
    color: theme.COLORS.white,
  },
});

export default DateSelector;


