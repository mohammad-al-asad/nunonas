"use client";

import { useState, useEffect, useCallback } from "react";
import { parse, isWithinInterval, startOfDay } from "date-fns";
import { BookingsHeader } from "@/components/BookingsHeader";
import { BookingsTable, Booking } from "@/components/BookingsTable";
import { Pagination } from "@/components/Pagination";
import { BookingDetailsModal } from "@/components/BookingDetailsModal";
import { vendorListBookings } from "@/lib/vendor-api";


const ALL_BOOKINGS: Booking[] = [
  {
    id: "#BK-1029",
    customer: {
      name: "Eleanor Shellstrop",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    },
    date: "Mar 01, 2026",
    time: "1:00 PM",
    guests: 1,
    service: "Dinner Table",
    status: "Confirmed",
    payment: "Paid",
  },
  {
    id: "#BK-1030",
    customer: {
      name: "Julian Casablancas",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    },
    date: "Mar 02, 2026",
    time: "2:00 PM",
    guests: 2,
    service: "Spa Session",
    status: "Pending",
    payment: "Unpaid",
  },
  {
    id: "#BK-1031",
    customer: {
      name: "Michael Scott",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    },
    date: "Mar 03, 2026",
    time: "3:00 PM",
    guests: 3,
    service: "Lunch Table",
    status: "Cancelled",
    payment: "Unpaid",
  },
  {
    id: "#BK-1032",
    customer: {
      name: "Sarah Jenkins",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    },
    date: "Mar 04, 2026",
    time: "4:00 PM",
    guests: 4,
    service: "VIP Lounge",
    status: "Complete",
    payment: "Paid",
  },
  {
    id: "#BK-1033",
    customer: {
      name: "Tahani Al-Jamil",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    },
    date: "Mar 05, 2026",
    time: "5:00 PM",
    guests: 5,
    service: "Private Booth",
    status: "Confirmed",
    payment: "Unpaid",
  },
  {
    id: "#BK-1034",
    customer: {
      name: "Jason Mendoza",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop",
    },
    date: "Mar 06, 2026",
    time: "6:00 PM",
    guests: 6,
    service: "Dinner Table",
    status: "Pending",
    payment: "Unpaid",
  },
  {
    id: "#BK-1035",
    customer: {
      name: "Chidi Anagonye",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    },
    date: "Mar 07, 2026",
    time: "7:00 PM",
    guests: 7,
    service: "Spa Session",
    status: "Cancelled",
    payment: "Paid",
  },
  {
    id: "#BK-1036",
    customer: {
      name: "Janet",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop",
    },
    date: "Mar 08, 2026",
    time: "8:00 PM",
    guests: 8,
    service: "Lunch Table",
    status: "Complete",
    payment: "Unpaid",
  },
  {
    id: "#BK-1037",
    customer: {
      name: "Rosa Diaz",
      avatar:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80&h=80&fit=crop",
    },
    date: "Mar 09, 2026",
    time: "9:00 PM",
    guests: 1,
    service: "VIP Lounge",
    status: "Confirmed",
    payment: "Unpaid",
  },
  {
    id: "#BK-1038",
    customer: {
      name: "Terry Jeffords",
      avatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop",
    },
    date: "Mar 10, 2026",
    time: "10:00 PM",
    guests: 2,
    service: "Private Booth",
    status: "Pending",
    payment: "Paid",
  },
  {
    id: "#BK-1039",
    customer: {
      name: "Amy Santiago",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    },
    date: "Mar 11, 2026",
    time: "11:00 PM",
    guests: 3,
    service: "Dinner Table",
    status: "Cancelled",
    payment: "Unpaid",
  },
  {
    id: "#BK-1040",
    customer: {
      name: "Charles Boyle",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    },
    date: "Mar 12, 2026",
    time: "12:00 PM",
    guests: 4,
    service: "Spa Session",
    status: "Complete",
    payment: "Unpaid",
  },
  {
    id: "#BK-1041",
    customer: {
      name: "Eleanor Shellstrop",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    },
    date: "Mar 13, 2026",
    time: "1:00 PM",
    guests: 5,
    service: "Lunch Table",
    status: "Confirmed",
    payment: "Paid",
  },
  {
    id: "#BK-1042",
    customer: {
      name: "Julian Casablancas",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    },
    date: "Mar 14, 2026",
    time: "2:00 PM",
    guests: 6,
    service: "VIP Lounge",
    status: "Pending",
    payment: "Unpaid",
  },
  {
    id: "#BK-1043",
    customer: {
      name: "Michael Scott",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    },
    date: "Mar 15, 2026",
    time: "3:00 PM",
    guests: 7,
    service: "Private Booth",
    status: "Cancelled",
    payment: "Unpaid",
  },
  {
    id: "#BK-1044",
    customer: {
      name: "Sarah Jenkins",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    },
    date: "Mar 16, 2026",
    time: "4:00 PM",
    guests: 8,
    service: "Dinner Table",
    status: "Complete",
    payment: "Paid",
  },
  {
    id: "#BK-1045",
    customer: {
      name: "Tahani Al-Jamil",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    },
    date: "Mar 17, 2026",
    time: "5:00 PM",
    guests: 1,
    service: "Spa Session",
    status: "Confirmed",
    payment: "Unpaid",
  },
  {
    id: "#BK-1046",
    customer: {
      name: "Jason Mendoza",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop",
    },
    date: "Mar 18, 2026",
    time: "6:00 PM",
    guests: 2,
    service: "Lunch Table",
    status: "Pending",
    payment: "Unpaid",
  },
  {
    id: "#BK-1047",
    customer: {
      name: "Chidi Anagonye",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    },
    date: "Mar 19, 2026",
    time: "7:00 PM",
    guests: 3,
    service: "VIP Lounge",
    status: "Cancelled",
    payment: "Paid",
  },
  {
    id: "#BK-1048",
    customer: {
      name: "Janet",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop",
    },
    date: "Mar 20, 2026",
    time: "8:00 PM",
    guests: 4,
    service: "Private Booth",
    status: "Complete",
    payment: "Unpaid",
  },
  {
    id: "#BK-1049",
    customer: {
      name: "Rosa Diaz",
      avatar:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80&h=80&fit=crop",
    },
    date: "Mar 21, 2026",
    time: "9:00 PM",
    guests: 5,
    service: "Dinner Table",
    status: "Confirmed",
    payment: "Unpaid",
  },
  {
    id: "#BK-1050",
    customer: {
      name: "Terry Jeffords",
      avatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop",
    },
    date: "Mar 22, 2026",
    time: "10:00 PM",
    guests: 6,
    service: "Spa Session",
    status: "Pending",
    payment: "Paid",
  },
  {
    id: "#BK-1051",
    customer: {
      name: "Amy Santiago",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    },
    date: "Mar 23, 2026",
    time: "11:00 PM",
    guests: 7,
    service: "Lunch Table",
    status: "Cancelled",
    payment: "Unpaid",
  },
  {
    id: "#BK-1052",
    customer: {
      name: "Charles Boyle",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    },
    date: "Mar 24, 2026",
    time: "12:00 PM",
    guests: 8,
    service: "VIP Lounge",
    status: "Complete",
    payment: "Unpaid",
  },
  {
    id: "#BK-1053",
    customer: {
      name: "Eleanor Shellstrop",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    },
    date: "Mar 25, 2026",
    time: "1:00 PM",
    guests: 1,
    service: "Private Booth",
    status: "Confirmed",
    payment: "Paid",
  },
  {
    id: "#BK-1054",
    customer: {
      name: "Julian Casablancas",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    },
    date: "Mar 26, 2026",
    time: "2:00 PM",
    guests: 2,
    service: "Dinner Table",
    status: "Pending",
    payment: "Unpaid",
  },
  {
    id: "#BK-1055",
    customer: {
      name: "Michael Scott",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    },
    date: "Mar 27, 2026",
    time: "3:00 PM",
    guests: 3,
    service: "Spa Session",
    status: "Cancelled",
    payment: "Unpaid",
  },
  {
    id: "#BK-1056",
    customer: {
      name: "Sarah Jenkins",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    },
    date: "Mar 28, 2026",
    time: "4:00 PM",
    guests: 4,
    service: "Lunch Table",
    status: "Complete",
    payment: "Paid",
  },
  {
    id: "#BK-1057",
    customer: {
      name: "Tahani Al-Jamil",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    },
    date: "Mar 29, 2026",
    time: "5:00 PM",
    guests: 5,
    service: "VIP Lounge",
    status: "Confirmed",
    payment: "Unpaid",
  },
  {
    id: "#BK-1058",
    customer: {
      name: "Jason Mendoza",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop",
    },
    date: "Mar 30, 2026",
    time: "6:00 PM",
    guests: 6,
    service: "Private Booth",
    status: "Pending",
    payment: "Unpaid",
  },
  {
    id: "#BK-1059",
    customer: {
      name: "Chidi Anagonye",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    },
    date: "Mar 31, 2026",
    time: "7:00 PM",
    guests: 7,
    service: "Dinner Table",
    status: "Cancelled",
    payment: "Paid",
  },
  {
    id: "#BK-1060",
    customer: {
      name: "Janet",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop",
    },
    date: "Mar 01, 2026",
    time: "8:00 PM",
    guests: 8,
    service: "Spa Session",
    status: "Complete",
    payment: "Unpaid",
  },
  {
    id: "#BK-1061",
    customer: {
      name: "Rosa Diaz",
      avatar:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80&h=80&fit=crop",
    },
    date: "Mar 02, 2026",
    time: "9:00 PM",
    guests: 1,
    service: "Lunch Table",
    status: "Confirmed",
    payment: "Unpaid",
  },
  {
    id: "#BK-1062",
    customer: {
      name: "Terry Jeffords",
      avatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop",
    },
    date: "Mar 03, 2026",
    time: "10:00 PM",
    guests: 2,
    service: "VIP Lounge",
    status: "Pending",
    payment: "Paid",
  },
  {
    id: "#BK-1063",
    customer: {
      name: "Amy Santiago",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    },
    date: "Mar 04, 2026",
    time: "11:00 PM",
    guests: 3,
    service: "Private Booth",
    status: "Cancelled",
    payment: "Unpaid",
  },
  {
    id: "#BK-1064",
    customer: {
      name: "Charles Boyle",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    },
    date: "Mar 05, 2026",
    time: "12:00 PM",
    guests: 4,
    service: "Dinner Table",
    status: "Complete",
    payment: "Unpaid",
  },
  {
    id: "#BK-1065",
    customer: {
      name: "Eleanor Shellstrop",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    },
    date: "Mar 06, 2026",
    time: "1:00 PM",
    guests: 5,
    service: "Spa Session",
    status: "Confirmed",
    payment: "Paid",
  },
  {
    id: "#BK-1066",
    customer: {
      name: "Julian Casablancas",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    },
    date: "Mar 07, 2026",
    time: "2:00 PM",
    guests: 6,
    service: "Lunch Table",
    status: "Pending",
    payment: "Unpaid",
  },
  {
    id: "#BK-1067",
    customer: {
      name: "Michael Scott",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    },
    date: "Mar 08, 2026",
    time: "3:00 PM",
    guests: 7,
    service: "VIP Lounge",
    status: "Cancelled",
    payment: "Unpaid",
  },
  {
    id: "#BK-1068",
    customer: {
      name: "Sarah Jenkins",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    },
    date: "Mar 09, 2026",
    time: "4:00 PM",
    guests: 8,
    service: "Private Booth",
    status: "Complete",
    payment: "Paid",
  },
  {
    id: "#BK-1069",
    customer: {
      name: "Tahani Al-Jamil",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    },
    date: "Mar 10, 2026",
    time: "5:00 PM",
    guests: 1,
    service: "Dinner Table",
    status: "Confirmed",
    payment: "Unpaid",
  },
  {
    id: "#BK-1070",
    customer: {
      name: "Jason Mendoza",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop",
    },
    date: "Mar 11, 2026",
    time: "6:00 PM",
    guests: 2,
    service: "Spa Session",
    status: "Pending",
    payment: "Unpaid",
  },
  {
    id: "#BK-1071",
    customer: {
      name: "Chidi Anagonye",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    },
    date: "Mar 12, 2026",
    time: "7:00 PM",
    guests: 3,
    service: "Lunch Table",
    status: "Cancelled",
    payment: "Paid",
  },
  {
    id: "#BK-1072",
    customer: {
      name: "Janet",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop",
    },
    date: "Mar 13, 2026",
    time: "8:00 PM",
    guests: 4,
    service: "VIP Lounge",
    status: "Complete",
    payment: "Unpaid",
  },
  {
    id: "#BK-1073",
    customer: {
      name: "Rosa Diaz",
      avatar:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80&h=80&fit=crop",
    },
    date: "Mar 14, 2026",
    time: "9:00 PM",
    guests: 5,
    service: "Private Booth",
    status: "Confirmed",
    payment: "Unpaid",
  },
  {
    id: "#BK-1074",
    customer: {
      name: "Terry Jeffords",
      avatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop",
    },
    date: "Mar 15, 2026",
    time: "10:00 PM",
    guests: 6,
    service: "Dinner Table",
    status: "Pending",
    payment: "Paid",
  },
  {
    id: "#BK-1075",
    customer: {
      name: "Amy Santiago",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    },
    date: "Mar 16, 2026",
    time: "11:00 PM",
    guests: 7,
    service: "Spa Session",
    status: "Cancelled",
    payment: "Unpaid",
  },
];

export default function BookingsPage() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await vendorListBookings({ limit: 200 }) as { items?: unknown[]; bookings?: unknown[] };
      const items = (raw?.items ?? raw?.bookings ?? []) as Record<string, unknown>[];
      const normalized: Booking[] = items.map((b, idx) => ({
        id: (b.id ?? b._id ?? `#BK-${idx}`) as string,
        customer: {
          name: ((b.customer_name ?? b.customer ?? "Customer") as string),
          avatar: ((b.customer_avatar ?? b.avatar ?? "") as string),
        },
        date: ((b.date ?? "") as string),
        time: ((b.time ?? "") as string),
        guests: ((b.guests ?? 1) as number),
        service: ((b.service ?? b.service_name ?? b.provider_type ?? "") as string),
        status: ((b.status ?? "pending") as string),
        payment: ((b.payment_status ?? b.payment ?? "Unpaid") as string),
      }));
      setAllBookings(normalized);
    } catch (err) {
      console.warn("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);


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

  // Filter logic
  const filteredBookings = allBookings.filter((booking) => {
    // Search filter
    const matchesSearch =
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "All" || booking.status === statusFilter;

    // Date range filter
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const bookingDate = parse(booking.date, "MMM dd, yyyy", new Date());
      matchesDate = isWithinInterval(startOfDay(bookingDate), {
        start: startOfDay(dateRange.start),
        end: startOfDay(dateRange.end),
      });
    } else if (dateRange.start) {
      const bookingDate = parse(booking.date, "MMM dd, yyyy", new Date());
      matchesDate =
        startOfDay(bookingDate).getTime() ===
        startOfDay(dateRange.start).getTime();
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
        <BookingsTable
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

      <BookingDetailsModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}
