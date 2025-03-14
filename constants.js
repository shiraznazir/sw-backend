export const AREALIST = [
  { value: "south_delhi", label: "South Delhi" },
  { value: "east_delhi", label: "East Delhi" },
  { value: "west_delhi", label: "West Delhi" },
  { value: "north_delhi", label: "North Delhi" },
  { value: "noida", label: "Noida" },
  { value: "greater_noida", label: "Greater Noida" },
  { value: "ghaziabad", label: "Ghaziabad" },
  { value: "gurugram", label: "Gurugram" },
  { value: "faridabad", label: "Faridabad" },
];

// Status mapping object for better efficiency
const STATUS_MAP = {
  0: "Incoming",
  1: "Ongoing",
  2: "Pending",
  3: "Closed",
  4: "Cancel",
};

// Function to get status text with a default fallback
export const STATUSTEXT = (status) => STATUS_MAP[status] || "Unknown";
