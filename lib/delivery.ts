/**
 * Resolves an Indian pincode to its corresponding city name based on the first 3 digits (sorting district).
 */
export function resolvePincodeToCity(pincode: string): string | null {
  if (!pincode || pincode.trim().length !== 6) return null;
  const prefix = pincode.trim().substring(0, 3);
  
  const mapping: { [key: string]: string } = {
    "834": "Ranchi",
    "835": "Ranchi",
    "831": "Jamshedpur",
    "832": "Jamshedpur",
    "826": "Dhanbad",
    "828": "Dhanbad",
    "827": "Bokaro",
    "825": "Hazaribagh",
    "814": "Deoghar",
    "815": "Giridih",
    "816": "Dumka",
    "800": "Patna",
    "801": "Patna",
    "802": "Ara",
    "803": "Biharsharif",
    "804": "Jehanabad",
    "805": "Nawada",
    "842": "Muzaffarpur",
    "841": "Chapra",
    "843": "Sitamarhi",
    "844": "Hajipur",
    "845": "Motihari",
    "846": "Darbhanga",
    "847": "Madhubani",
    "848": "Samastipur",
    "851": "Begusarai",
    "852": "Saharsa",
    "853": "Khagaria",
    "854": "Purnia",
    "855": "Kishanganj",
    "110": "Delhi",
    "400": "Mumbai",
    "560": "Bengaluru",
    "600": "Chennai",
    "700": "Kolkata"
  };

  return mapping[prefix] || null;
}

/**
 * Calculates and formats the estimated delivery date based on current date and delivery days.
 */
export function calculateDeliveryDate(days: number): string {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + days);
  
  return deliveryDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
