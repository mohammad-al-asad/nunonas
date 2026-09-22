"use client";

import { useState } from "react";
import { parse, isWithinInterval, startOfDay } from "date-fns";
import { BookingsHeader } from "@/components/BookingsHeader";
import { HotelBookingsTable } from "@/components/HotelBookingsTable";
import {
  HotelBooking,
  HotelBookingDetailsModal,
} from "@/components/HotelBookingDetailsModal";
import { Pagination } from "@/components/Pagination";

const HOTEL_BOOKINGS: HotelBooking[] = [
  {
    id: "#BK-1029",
    customer: {
      name: "Eleanor Shellstrop",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
      since: "2021",
    },
    checkIn: "Feb 14, 2026",
    checkOut: "Feb 17, 2026",
    nights: 3,
    roomType: "Deluxe King Room",
    roomNumber: "Room 101",
    ratePerNight: 280,
    serviceFee: 110,
    tourismTax: 50,
    status: "CONFIRMED",
    payment: "Unpaid",
    phone: "+1 (555) 234-5678",
    email: "eleanor@goodplace.com",
    specialRequests:
      "Prefer a room with a city view. Also, late check-in around 10:00 PM.",
    guests: "2 Guests",
  },
  {
    id: "#BK-1030",
    customer: {
      name: "Julian Casablancas",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
      since: "2020",
    },
    checkIn: "Feb 14, 2026",
    checkOut: "Feb 17, 2026",
    nights: 3,
    roomType: "Deluxe King Room",
    roomNumber: "Room 102",
    ratePerNight: 280,
    serviceFee: 110,
    tourismTax: 50,
    status: "PENDING",
    payment: "Unpaid",
    phone: "+1 (555) 555-0123",
    email: "julian@strokes.com",
    specialRequests: "Birthday celebration.",
    guests: "1 Guest",
  },
  {
    id: "#BK-1031",
    customer: {
      name: "Michael Scott",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
      since: "2022",
    },
    checkIn: "Feb 14, 2026",
    checkOut: "Feb 17, 2026",
    nights: 3,
    roomType: "Deluxe King Room",
    roomNumber: "Room 103",
    ratePerNight: 280,
    serviceFee: 110,
    tourismTax: 50,
    status: "CONFIRMED",
    payment: "Unpaid",
    phone: "+1 (555) 123-4567",
    email: "michael@dundermifflin.com",
    specialRequests: "Near elevator.",
    guests: "2 Guests",
  },
  {
    id: "#BK-1032",
    customer: {
      name: "Sarah Jenkins",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
      since: "2023",
    },
    checkIn: "Feb 14, 2026",
    checkOut: "Feb 17, 2026",
    nights: 3,
    roomType: "Deluxe King Room",
    roomNumber: "Room 104",
    ratePerNight: 280,
    serviceFee: 110,
    tourismTax: 50,
    status: "CANCELLED",
    payment: "Unpaid",
    phone: "+1 (555) 987-6543",
    email: "sarah@example.com",
    specialRequests: "Quiet room.",
    guests: "2 Guests",
  },
  {
    id: "#BK-1033",
    customer: {
      name: "Sarah Jenkins",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
      since: "2023",
    },
    checkIn: "Feb 14, 2026",
    checkOut: "Feb 17, 2026",
    nights: 3,
    roomType: "Deluxe King Room",
    roomNumber: "Room 105",
    ratePerNight: 280,
    serviceFee: 110,
    tourismTax: 50,
    status: "CHECK IN",
    payment: "Paid",
    phone: "+1 (555) 987-6543",
    email: "sarah@example.com",
    specialRequests: "None.",
    guests: "1 Guest",
  },
  {
    id: "#BK-1034",
    customer: {
      name: "Sarah Jenkins",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
      since: "2023",
    },
    checkIn: "Feb 14, 2026",
    checkOut: "Feb 17, 2026",
    nights: 3,
    roomType: "Deluxe King Room",
    roomNumber: "Room 106",
    ratePerNight: 280,
    serviceFee: 110,
    tourismTax: 50,
    status: "COMPLETE",
    payment: "Paid",
    phone: "+1 (555) 987-6543",
    email: "sarah@example.com",
    specialRequests: "None.",
    guests: "2 Guests",
  },
];

export default function HotelBookingsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState<HotelBooking | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: {
    start: Date | null;
    end: Date | null;
  }) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const filteredBookings = HOTEL_BOOKINGS.filter((booking) => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || booking.status === statusFilter.toUpperCase();

    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const checkInDate = parse(booking.checkIn, "MMM dd, yyyy", new Date());
      matchesDate = isWithinInterval(startOfDay(checkInDate), {
        start: startOfDay(dateRange.start),
        end: startOfDay(dateRange.end),
      });
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalItems = filteredBookings.length;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="min-h-screen p-4 md:p-10 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto">
        <BookingsHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />
        <HotelBookingsTable
          bookings={paginatedBookings}
          onViewDetails={setSelectedBooking}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>

      <HotelBookingDetailsModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}
