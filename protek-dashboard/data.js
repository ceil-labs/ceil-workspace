// ProTek Dashboard - Fixed Version
// Separates ProTek (company total) from operational zones

// Company totals from ProTek zone
const companyTotals = {
    total: 1152,
    completed: 290,
    pending: 366,
    afd: 214,
    not_in_ofsc: 206,
    rpr_total: 76,
    last_updated: "2026-03-30T17:58:33+08:00"
};

// 9 Operational Zones (excluding ProTek)
const zones = [
    { name: "BULACAN", pending: 11, completed: 31, afd: 23, not_in_ofsc: 25, rpr: 6, total: 96 },
    { name: "LAS PINAS-ALABANG", pending: 68, completed: 56, afd: 20, not_in_ofsc: 19, rpr: 19, total: 182 },
    { name: "MAKATI", pending: 0, completed: 0, afd: 2, not_in_ofsc: 0, rpr: 0, total: 2 },
    { name: "NEGROS", pending: 56, completed: 19, afd: 3, not_in_ofsc: 6, rpr: 13, total: 97 },
    { name: "NORTH QUEZON CITY", pending: 13, completed: 22, afd: 18, not_in_ofsc: 39, rpr: 9, total: 101 },
    { name: "PANAY", pending: 69, completed: 40, afd: 29, not_in_ofsc: 16, rpr: 17, total: 171 },
    { name: "PASAY-PARANAQUE", pending: 26, completed: 41, afd: 35, not_in_ofsc: 17, rpr: 8, total: 127 },
    { name: "PASIG-PATEROS-TAGUIG", pending: 114, completed: 66, afd: 65, not_in_ofsc: 80, rpr: 2, total: 327 },
    { name: "SOUTH QUEZON CITY", pending: 9, completed: 15, afd: 19, not_in_ofsc: 4, rpr: 2, total: 49 }
];

// 7-Day Trend Data (Mar 24-30)
const trendData = {
    dates: ['Mar 24', 'Mar 25', 'Mar 26', 'Mar 27', 'Mar 28', 'Mar 29', 'Mar 30'],
    completionRates: [18.6, 19.2, 20.8, 22.1, 21.5, 23.8, 25.2],
    totalTasks: [2104, 2189, 2234, 2312, 2298, 2234, 2304],
    pendingTasks: [410, 398, 412, 389, 401, 378, 732],
    rprTotals: [45, 52, 48, 176, 49, 38, 76]
};

// Zone trends over 7 days
const zoneTrends = {
    "BULACAN": [68, 69, 70, 71, 70, 72, 74],
    "LAS PINAS-ALABANG": [28, 29, 30, 31, 30, 30, 31],
    "MAKATI": [0, 0, 0, 0, 0, 0, 0],
    "NEGROS": [15, 16, 17, 18, 19, 19, 20],
    "NORTH QUEZON CITY": [52, 53, 54, 55, 55, 56, 56],
    "PANAY": [38, 39, 40, 40, 41, 41, 42],
    "PASAY-PARANAQUE": [58, 59, 59, 60, 60, 60, 60],
    "PASIG-PATEROS-TAGUIG": [18, 19, 19, 20, 20, 20, 20],
    "SOUTH QUEZON CITY": [72, 71, 70, 69, 68, 67, 67]
};
