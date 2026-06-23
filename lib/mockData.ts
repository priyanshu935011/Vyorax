export interface ProductMock {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number; // in paise
  comparePrice: number | null;
  images: string[];
  categoryId: string;
  categoryName: string;
  stock: number;
  sku: string;
  brand: string;
  tags: string[];
  specs: Record<string, string>;
  cycleSize: any;
  assemblyDifficulty: number;
  whoIsThisFor: any[];
  starterKit: any[];
  relatedProducts: string[];
  isActive: boolean;
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
  rating: number;
  reviewsCount: number;
}

export const MOCK_CATEGORIES = [
  { id: "cat-cycles", name: "Cycles", slug: "cycles", parentId: null },
  { id: "cat-fitness", name: "Fitness", slug: "fitness", parentId: null },
  { id: "cat-sports", name: "Sports", slug: "sports", parentId: null },
  { id: "cat-accessories", name: "Accessories", slug: "accessories", parentId: null },
  { id: "cat-electric", name: "Electric Cycles", slug: "electric-cycles", parentId: null },
  
  // Subcategories of Cycles
  { id: "cat-mtb", name: "MTB", slug: "mtb", parentId: "cat-cycles" },
  { id: "cat-men", name: "Men", slug: "men", parentId: "cat-cycles" },
  { id: "cat-women", name: "Women", slug: "women", parentId: "cat-cycles" },
  { id: "cat-kids", name: "Kids", slug: "kids", parentId: "cat-cycles" },
];

export interface HomeSlideMock {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  ctaText: string;
  ctaHref: string;
  bgGradient: string;
  accent: string;
  order: number;
  isActive: boolean;
}

export const MOCK_SLIDES: HomeSlideMock[] = [
  {
    id: "slide-cycles",
    title: "Ranchi's Premier Cycle Hub",
    subtitle: "PROUDLY SERVING CYCLISTS OF JHARKHAND",
    desc: "Shimano-certified garage, doorstep pickup, and premium global brands (Trek, Giant, Specialized) tuned locally in Lalpur, Ranchi.",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1600&auto=format&fit=crop",
    ctaText: "Explore Cycles",
    ctaHref: "/products?category=cycles",
    bgGradient: "from-orange-600/20 via-neutral-900/5 to-transparent",
    accent: "var(--agni)",
    order: 0,
    isActive: true
  },
  {
    id: "slide-fitness",
    title: "Bowflex SelectTech Dumbbells",
    subtitle: "TRANSFORM YOUR HOME WORKOUT",
    desc: "Replace 15 pairs of dumbbells with a single pair of Bowflex adjustable SelectTech weights. Available with low-cost interest-free EMI options.",
    image: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=1600&auto=format&fit=crop",
    ctaText: "Shop Fitness",
    ctaHref: "/products?category=fitness",
    bgGradient: "from-amber-600/20 via-neutral-900/5 to-transparent",
    accent: "var(--gold)",
    order: 1,
    isActive: true
  },
  {
    id: "slide-sports",
    title: "Yonex Graphite Rackets",
    subtitle: "DOMINATE THE BADMINTON COURT",
    desc: "Japanese high-modulus graphite rackets, aerodynamic Giro helmets, safety lighting, and lock accessories for high-performance protection.",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1600&auto=format&fit=crop",
    ctaText: "Browse Sports & Gear",
    ctaHref: "/products?category=sports",
    bgGradient: "from-emerald-600/20 via-neutral-900/5 to-transparent",
    accent: "#10B981",
    order: 2,
    isActive: true
  }
];

export const MOCK_PRODUCTS: ProductMock[] = [
  {
    id: "prod-aero-x",
    name: "Giant Aero-X Carbon Hybrid",
    slug: "giant-aero-x-carbon",
    description: "The Giant Aero-X Carbon hybrid is a premium performance machine, blending the speed of a road bike with the rugged durability of a cross-country explorer. Featuring a featherlight aerospace-grade carbon frame, state-of-the-art Shimano 1x11 gearing, and responsive hydraulic brakes, it is designed to fly through Ranchi city streets and conquer Patratu valley climbs with absolute ease.",
    shortDescription: "Cinematic performance hybrid with lightweight carbon frame, Shimano 1x11 speed, and hydraulic disc brakes.",
    price: 4500000, // Rs. 45,000 in paise
    comparePrice: 4999900,
    images: [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200&auto=format&fit=crop"
    ],
    categoryId: "cat-men",
    categoryName: "Men",
    stock: 4,
    sku: "GIANT-CYC-AEROX",
    brand: "Giant",
    tags: ["carbon", "hybrid", "premium", "shimano", "men"],
    specs: {
      Frame: "Giant Carbon Alloy Frame (Grade 5)",
      Gears: "Shimano Deore 1x11 speed derailleur",
      Brakes: "Shimano MT200 Hydraulic Disc Brakes",
      Tyres: "Maxxis Crossmark II 29x2.1 tubeless ready",
      Weight: "11.8 kg",
      Suspension: "SR Suntour 100mm with lock-out"
    },
    cycleSize: {
      sizes: [
        { minHeight: "4'8\"", maxHeight: "5'2\"", size: "S (15.5\")" },
        { minHeight: "5'3\"", maxHeight: "5'9\"", size: "M (17.5\")" },
        { minHeight: "5'10\"", maxHeight: "6'4\"", size: "L (19.5\")" }
      ]
    },
    assemblyDifficulty: 3,
    whoIsThisFor: [
      {
        title: "The College Commuter",
        avatar: "🎓",
        desc: "Speed past Ranchi traffic to make it to class on time. Ultra lightweight and extremely responsive.",
        accessories: ["GIRO-ACC-HELM", "CATEYE-ACC-LIGHT"]
      },
      {
        title: "The Weekend Enduro Rider",
        avatar: "⛰️",
        desc: "For early morning adventures on Ranchi Ring Road and climbing Patratu Valley climbs with confidence.",
        accessories: ["TOPEAK-ACC-PUMP"]
      }
    ],
    starterKit: [
      {
        id: "GIRO-ACC-HELM",
        name: "Giro Aero Shield Helmet",
        price: 249900,
        sku: "GIRO-ACC-HELM",
        image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop"
      },
      {
        id: "CATEYE-ACC-LIGHT",
        name: "Cateye USB Laser Tail Light",
        price: 99900,
        sku: "CATEYE-ACC-LIGHT",
        image: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=400&auto=format&fit=crop"
      }
    ],
    relatedProducts: ["prod-ranchi-mtb", "prod-urban-swift"],
    isActive: true,
    isFeatured: true,
    metaTitle: "Giant Aero-X Carbon Premium Hybrid Cycle - VEGA Sports",
    metaDescription: "Shop the premium Giant Aero-X Carbon cycle online. Designed with aerospace alloy frame, Shimano 1x11 speed gears, and dual hydraulic disc brakes. Delivered in Ranchi.",
    rating: 4.8,
    reviewsCount: 2
  },
  {
    id: "prod-ranchi-mtb",
    name: "Trek Ranchi Rider MTB",
    slug: "trek-ranchi-rider-mtb",
    description: "Conquer any terrain with the Trek Ranchi Rider MTB. Crafted with a premium Trek 6061 Hardtail Alloy frame, high traction 29-inch offroad tyres, and dual mechanical disc brakes, this bike is built to take on gravel, mud, sand, and Ranchi potholes without breaking a sweat.",
    shortDescription: "All-terrain Mountain Bike featuring hardtail 6061 alloy frame, 29\" tyres, and dual mechanical disc brakes.",
    price: 2450000, // Rs. 24,500 in paise
    comparePrice: 2800000,
    images: [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=1200&auto=format&fit=crop"
    ],
    categoryId: "cat-mtb",
    categoryName: "MTB",
    stock: 8,
    sku: "TREK-CYC-RANCHIMTB",
    brand: "Trek",
    tags: ["mtb", "alloy", "all-terrain", "offroad", "men"],
    specs: {
      Frame: "Trek Alpha Silver Aluminum Alloy",
      Gears: "Shimano Altus 3x8 speed (24 speeds)",
      Brakes: "Tektro Mechanical Disc Brakes",
      Tyres: "Bontrager XR2 29 x 2.2 trail tyres",
      Weight: "14.5 kg",
      Suspension: "Suntour 100mm Front Fork with manual lockout"
    },
    cycleSize: {
      sizes: [
        { minHeight: "4'10\"", maxHeight: "5'4\"", size: "S (16\")" },
        { minHeight: "5'5\"", maxHeight: "5'11\"", size: "M (18\")" },
        { minHeight: "6'0\"", maxHeight: "6'5\"", size: "L (20\")" }
      ]
    },
    assemblyDifficulty: 2,
    whoIsThisFor: [
      {
        title: "The Weekend Trailblazer",
        avatar: "🚵",
        desc: "Navigate rugged forest tracks around Jonha Falls and Hundru Falls with absolute grip and safety.",
        accessories: ["TOPEAK-ACC-PUMP"]
      }
    ],
    starterKit: [
      {
        id: "TOPEAK-ACC-PUMP",
        name: "Topeak Mini Pump",
        price: 79900,
        sku: "TOPEAK-ACC-PUMP",
        image: "https://images.unsplash.com/photo-1601362840469-817887520935?q=80&w=400&auto=format&fit=crop"
      }
    ],
    relatedProducts: ["prod-aero-x", "prod-urban-swift"],
    isActive: true,
    isFeatured: true,
    metaTitle: "Trek Ranchi Rider MTB 29er - VEGA Sports",
    metaDescription: "Shop the Trek Ranchi Rider Mountain Bike with 29-inch wheels, Alpha alloy frame, and 24-speed gears. Built to handle rough paths around Ranchi.",
    rating: 4.9,
    reviewsCount: 2
  },
  {
    id: "prod-urban-swift",
    name: "Specialized Urban Swift Hybrid",
    slug: "specialized-urban-swift",
    description: "The Specialized Urban Swift is the ultimate city machine. Lightweight, single-speed simplicity with dual V-brakes and high-pressure slick tyres. Fly through daily commutes, enjoy minimal maintenance, and feel the road with its premium Specialized steel design.",
    shortDescription: "Lightweight city cycle with single-speed simplicity, dual V-brakes, and slick city tyres.",
    price: 1599900, // Rs. 15,999 in paise
    comparePrice: 1999900,
    images: [
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop"
    ],
    categoryId: "cat-women",
    categoryName: "Women",
    stock: 2,
    sku: "SPEC-CYC-USWIFT",
    brand: "Specialized",
    tags: ["city", "hybrid", "singlespeed", "minimal", "women"],
    specs: {
      Frame: "Specialized A1 Premium Aluminum Steel",
      Gears: "Single Speed 18T Freewheel",
      Brakes: "Alloy Dual Pivot Caliper Brakes",
      Tyres: "Specialized RoadSport 700x28c",
      Weight: "12.1 kg",
      Suspension: "Rigid steel fork for maximum power transfer"
    },
    cycleSize: {
      sizes: [
        { minHeight: "4'9\"", maxHeight: "5'4\"", size: "S (49cm)" },
        { minHeight: "5'5\"", maxHeight: "5'10\"", size: "M (52cm)" },
        { minHeight: "5'11\"", maxHeight: "6'3\"", size: "L (55cm)" }
      ]
    },
    assemblyDifficulty: 1,
    whoIsThisFor: [
      {
        title: "The Daily City Commuter",
        avatar: "🎒",
        desc: "An agile, stylish fixie-style commuter requiring zero maintenance. Perfect for Ranchi roads.",
        accessories: ["KRYP-ACC-LOCK"]
      }
    ],
    starterKit: [
      {
        id: "KRYP-ACC-LOCK",
        name: "Kryptonite Heavy Duty U-Lock",
        price: 119900,
        sku: "KRYP-ACC-LOCK",
        image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400&auto=format&fit=crop"
      }
    ],
    relatedProducts: ["prod-aero-x", "prod-ranchi-mtb"],
    isActive: true,
    isFeatured: false,
    metaTitle: "Specialized Urban Swift Singlespeed City Cycle - VEGA Sports",
    metaDescription: "Shop the sleek, minimal Specialized Urban Swift city cycle. Features single speed gear ratio, light steel frame, and dual caliper brakes.",
    rating: 4.7,
    reviewsCount: 2
  },
  {
    id: "prod-animator",
    name: "Giant Animator 16\" Kids Bike",
    slug: "giant-animator-kids",
    description: "The Giant Animator is a lightweight aluminum kids' cycle designed to make learning to ride fun and easy. Featuring removable training wheels, a low standover height, a rear coaster brake, and a stylish design, it is perfect for Ranchi's youngest riders.",
    shortDescription: "Lightweight 16\" aluminum kids bike with coaster brake and removable training wheels.",
    price: 1250000, // Rs. 12,500 in paise
    comparePrice: 1499900,
    images: [
      "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?q=80&w=1200&auto=format&fit=crop"
    ],
    categoryId: "cat-kids",
    categoryName: "Kids",
    stock: 6,
    sku: "GIANT-CYC-ANIMATOR",
    brand: "Giant",
    tags: ["kids", "junior", "cycle", "children"],
    specs: {
      Frame: "ALUXX-grade aluminum",
      Fork: "High-tensile steel",
      Handlebar: "Kids steel, 160mm rise",
      Brakes: "Coaster brake (pedal backwards to stop) and caliper front brake",
      Tyres: "Giant Easy Rider, 16x2.125\"",
      Extras: "Training wheels, chainguard, bell"
    },
    cycleSize: {
      sizes: [
        { minHeight: "3'2\"", maxHeight: "3'10\"", size: "16\" Wheel (Ages 4-7)" }
      ]
    },
    assemblyDifficulty: 1,
    whoIsThisFor: [
      {
        title: "The Young Learner",
        avatar: "👦",
        desc: "Designed to build cycling confidence safely. Perfect for Ranchi parks and backyards.",
        accessories: []
      }
    ],
    starterKit: [],
    relatedProducts: ["prod-ranchi-mtb"],
    isActive: true,
    isFeatured: true,
    metaTitle: "Giant Animator 16\" Kids Bike - VEGA Sports",
    metaDescription: "Buy the Giant Animator 16\" kids cycle online. Durable ALUXX aluminum frame, training wheels, coaster and front brakes for kid safety.",
    rating: 4.9,
    reviewsCount: 1
  },
  {
    id: "prod-talon-e",
    name: "Giant Talon E+ Electric MTB",
    slug: "giant-talon-e-electric",
    description: "Experience the thrill of trail riding with the Giant Talon E+ Electric MTB. Powered by Giant's SyncDrive Core motor technology, this electric mountain bike delivers smooth, instantaneous power to help you conquer steep climbs and ride longer distances. Features a lightweight ALUXX aluminum frame, SR Suntour 100mm suspension fork, Shimano 9-speed gearing, and powerful hydraulic disc brakes.",
    shortDescription: "High-performance electric MTB with SyncDrive Core motor, 100mm suspension, and hydraulic disc brakes.",
    price: 8500000,
    comparePrice: 9900000,
    images: [
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1200&auto=format&fit=crop"
    ],
    categoryId: "cat-electric",
    categoryName: "Electric Cycles",
    stock: 5,
    sku: "GIANT-ELE-TALONE",
    brand: "Giant",
    tags: ["electric", "ebike", "mtb", "alloy", "men"],
    specs: {
      Motor: "Giant SyncDrive Core, 50Nm torque",
      Battery: "Giant EnergyPak 400Wh Li-ion",
      Frame: "ALUXX-Grade Aluminum Hardtail",
      Gears: "Shimano Alivio 9-speed",
      Brakes: "Tektro HD-M275 Hydraulic Disc Brakes",
      Weight: "21.5 kg"
    },
    cycleSize: {
      sizes: [
        { minHeight: "5'2\"", maxHeight: "5'7\"", size: "S" },
        { minHeight: "5'8\"", maxHeight: "6'0\"", size: "M" },
        { minHeight: "6'1\"", maxHeight: "6'6\"", size: "L" }
      ]
    },
    assemblyDifficulty: 2,
    whoIsThisFor: [
      {
        title: "The Trail Explorer",
        avatar: "⚡",
        desc: "Ride further and climb higher with electronic pedal assistance. Perfect for Ranchi's hilly terrains."
      }
    ],
    starterKit: [],
    relatedProducts: ["prod-ranchi-mtb", "prod-vado-e"],
    isActive: true,
    isFeatured: true,
    metaTitle: "Giant Talon E+ Electric MTB — Premium E-Bike - VEGA Sports",
    metaDescription: "Buy Giant Talon E+ electric mountain bike online. Features SyncDrive Core motor, EnergyPak battery, and Shimano 9-speed gears.",
    rating: 4.8,
    reviewsCount: 0
  },
  {
    id: "prod-vado-e",
    name: "Specialized Turbo Vado E-Bike",
    slug: "specialized-turbo-vado-ebike",
    description: "The Specialized Turbo Vado is the ultimate transportation machine, built to handle everything from daily commutes to fast workouts and longer weekend adventures. With its integrated Specialized 2.0 motor and 710Wh battery, it offers a smooth, quiet, and powerful riding experience. Features custom integrated front/rear lights, mudguards, and rear rack.",
    shortDescription: "Premium urban electric bike with integrated Specialized 2.0 motor, 710Wh battery, and cargo rack.",
    price: 12000000,
    comparePrice: 13500000,
    images: [
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1200&auto=format&fit=crop"
    ],
    categoryId: "cat-electric",
    categoryName: "Electric Cycles",
    stock: 3,
    sku: "SPEC-ELE-VADO",
    brand: "Specialized",
    tags: ["electric", "ebike", "city", "premium", "women"],
    specs: {
      Motor: "Specialized 2.0, 70Nm torque, 250W",
      Battery: "Specialized U2-710, integrated, 710Wh",
      Frame: "E5 Aluminum, bottom bracket motor mount",
      Gears: "SRAM NX 11-speed",
      Brakes: "SRAM Level Easy Hydraulic Disc Brakes",
      Weight: "23.8 kg"
    },
    cycleSize: {
      sizes: [
        { minHeight: "5'0\"", maxHeight: "5'5\"", size: "S" },
        { minHeight: "5'6\"", maxHeight: "5'10\"", size: "M" },
        { minHeight: "5'11\"", maxHeight: "6'4\"", size: "L" }
      ]
    },
    assemblyDifficulty: 2,
    whoIsThisFor: [
      {
        title: "The Eco Commuter",
        avatar: "🚲",
        desc: "Ditch the car and zoom past Ranchi traffic in comfort. Integrated rack for office bags or groceries."
      }
    ],
    starterKit: [],
    relatedProducts: ["prod-urban-swift", "prod-talon-e"],
    isActive: true,
    isFeatured: true,
    metaTitle: "Specialized Turbo Vado Premium Electric Commuter - VEGA Sports",
    metaDescription: "Buy Specialized Turbo Vado urban electric bike. Powerful Specialized 2.0 motor, 710Wh battery, fully equipped city commuter.",
    rating: 4.9,
    reviewsCount: 0
  },
  {
    id: "prod-dumbbells",
    name: "Bowflex SelectTech Adjustable Dumbbell Set",
    slug: "bowflex-selecttech-dumbbells",
    description: "Replace 15 pairs of dumbbells with a single pair of Bowflex SelectTech Adjustable Dumbbells. Using an innovative dial selection mechanism, you can adjust your weight from 2.5 kg up to 24 kg per hand instantly. Finished with durable thermoplastic coating to prevent clanking and rusting.",
    shortDescription: "Space-saving adjustable dumbbells replacing 15 pairs. Dial system from 2.5kg to 24kg.",
    price: 1199900, // Rs. 11,999 in paise
    comparePrice: 1599900,
    images: [
      "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=1200&auto=format&fit=crop"
    ],
    categoryId: "cat-fitness",
    categoryName: "Fitness",
    stock: 12,
    sku: "BOWFLEX-FIT-ADJDUMB",
    brand: "Bowflex",
    tags: ["dumbbells", "homegym", "strength", "weights"],
    specs: {
      "Weight Range": "2.5 kg to 24 kg per hand",
      "Weight Settings": "2.5, 3.5, 4.5, 5.5, 6.5, 8, 9, 10, 11.5, 13.5, 16, 18, 20.5, 22.5, 24 kg",
      Material: "Durable steel plates with thermoplastic rubber shield",
      Base: "Impact-resistant thermoplastic storage tray included",
      Grip: "Ergonomic knurled steel handle"
    },
    cycleSize: null,
    assemblyDifficulty: 1,
    whoIsThisFor: [
      {
        title: "The Home Gym Builder",
        avatar: "🏋️",
        desc: "Excellent for people building strength in small spaces. Full workout versatility.",
        accessories: []
      }
    ],
    starterKit: [],
    relatedProducts: [],
    isActive: true,
    isFeatured: true,
    metaTitle: "Bowflex SelectTech Adjustable Dumbbell Pair - VEGA Sports",
    metaDescription: "Buy Bowflex SelectTech Adjustable Dumbbells (2.5kg to 24kg) online. Premium home gym selector dumbbells.",
    rating: 4.8,
    reviewsCount: 2
  },
  {
    id: "prod-racket",
    name: "Yonex Carbon Pro Badminton Racket",
    slug: "yonex-carbon-pro-badminton",
    description: "Dominate the court with the Yonex Carbon Pro Badminton Racket. Featuring high modulus Japanese carbon graphite frame construction, a stiff aero-box shaft for explosive smash power, and a super light weight of 82g (4U) for lightning fast net recovery.",
    shortDescription: "Japanese high modulus carbon badminton racket with stiff shaft. Lightweight 82g (4U).",
    price: 349900, // Rs. 3,499 in paise
    comparePrice: 420000,
    images: [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop"
    ],
    categoryId: "cat-sports",
    categoryName: "Sports",
    stock: 15,
    sku: "YONEX-SPT-BADMINTON",
    brand: "Yonex",
    tags: ["badminton", "racket", "graphite", "carbon"],
    specs: {
      Material: "Japanese High Modulus Carbon Graphite",
      Weight: "82 +/- 2 grams (4U)",
      GripSize: "G5",
      MaxTension: "30 lbs",
      Balance: "Head-Heavy (Smash oriented)",
      ShaftFlex: "Stiff"
    },
    cycleSize: null,
    assemblyDifficulty: 1,
    whoIsThisFor: [
      {
        title: "The Offensive Smasher",
        avatar: "🏸",
        desc: "High tension capacity and head heavy balance built for intermediate and advanced court attack.",
        accessories: []
      }
    ],
    starterKit: [],
    relatedProducts: [],
    isActive: true,
    isFeatured: false,
    metaTitle: "Yonex Carbon Pro Badminton Racket 4U - VEGA Sports",
    metaDescription: "Shop Yonex Carbon Pro Badminton Racket. Features Japanese carbon graphite, G5 grip, support up to 30lbs tension.",
    rating: 5.0,
    reviewsCount: 2
  },
  {
    id: "prod-helmet",
    name: "Giro Aero Shield Helmet",
    slug: "giro-aero-shield-helmet",
    description: "Stay safe and look sleek with the Giro Aero Shield Helmet. Engineered with an aerodynamic poly-carbonate shell and multi-density EPS foam liner for maximum shock absorption. Features 18 cooling ventilation channels and Giro's micro-adjust dial fit system. Certified to exceed global CE EN1078 safety standards.",
    shortDescription: "Premium aerodynamic cycling helmet with multi-density EPS, dial fit system, and magnetic visor shield.",
    price: 249900,
    comparePrice: 299900,
    images: ["https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1200&auto=format&fit=crop"],
    categoryId: "cat-accessories",
    categoryName: "Accessories",
    stock: 15,
    sku: "GIRO-ACC-HELM",
    brand: "Giro",
    tags: ["helmet", "accessories", "safety", "gear"],
    specs: {
      Material: "In-mold polycarbonate with EPS liner",
      Ventilation: "18 aerodynamic vents",
      "Fit System": "Giro RocLoc fit adjustment",
      Certifications: "CE EN1078, CPSC certified",
      Weight: "260 grams"
    },
    cycleSize: null,
    assemblyDifficulty: 1,
    whoIsThisFor: [],
    starterKit: [],
    relatedProducts: ["prod-light", "prod-lock"],
    isActive: true,
    isFeatured: true,
    metaTitle: "Giro Aero Shield Helmet — Premium Cycling Safety - VEGA Sports",
    metaDescription: "Shop the premium Giro Aero Shield Helmet online. Engineered with high-strength polycarbonate shell, 18 cooling vents, and magnetic visor.",
    rating: 4.9,
    reviewsCount: 0
  },
  {
    id: "prod-light",
    name: "Cateye USB Laser Tail Light",
    slug: "cateye-usb-laser-tail-light",
    description: "Be visible from miles away with the Cateye USB Laser Tail Light. This high-intensity tail light combines 5 bright red LEDs with 2 lane-marking laser beams that project a safe virtual lane around your bike. Features 4 distinct flashing patterns, a rechargeable battery, and waterproof casing.",
    shortDescription: "Rechargeable high-intensity bicycle tail light with virtual lane laser projection and waterproof casing.",
    price: 99900,
    comparePrice: 149900,
    images: ["https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=1200&auto=format&fit=crop"],
    categoryId: "cat-accessories",
    categoryName: "Accessories",
    stock: 20,
    sku: "CATEYE-ACC-LIGHT",
    brand: "Cateye",
    tags: ["lighting", "safety", "accessories", "laser"],
    specs: {
      "Light Output": "80 Lumens red LED",
      "Laser Mode": "2 virtual lane laser beams",
      "Battery Type": "Rechargeable 600mAh Li-ion battery",
      "Runtime": "Up to 8 hours on flash mode",
      Waterproofing: "IPX4 waterproof rating"
    },
    cycleSize: null,
    assemblyDifficulty: 1,
    whoIsThisFor: [],
    starterKit: [],
    relatedProducts: ["prod-helmet", "prod-lock"],
    isActive: true,
    isFeatured: true,
    metaTitle: "Cateye USB Laser Tail Light — High Visibility Laser Safety - VEGA Sports",
    metaDescription: "Buy Cateye USB Laser Tail Light online. Features 5 high-intensity red LEDs and lane-marking laser projections for night riding.",
    rating: 4.7,
    reviewsCount: 0
  },
  {
    id: "prod-pump",
    name: "Topeak Mini High-Pressure Pump",
    slug: "topeak-mini-high-pressure-pump",
    description: "Never get stranded with a flat tire. The Topeak Mini High-Pressure Pump is a lightweight, compact hand pump made from high-strength CNC machined aluminum alloy. Capable of pumping up to 120 PSI, it features a dual-head thread-on flex hose compatible with both Presta and Schrader valves. Mounting bracket included.",
    shortDescription: "Lightweight CNC aluminum bicycle hand pump, up to 120 PSI capacity, Presta and Schrader compatible.",
    price: 79900,
    comparePrice: 99900,
    images: ["https://images.unsplash.com/photo-1601362840469-817887520935?q=80&w=1200&auto=format&fit=crop"],
    categoryId: "cat-accessories",
    categoryName: "Accessories",
    stock: 25,
    sku: "TOPEAK-ACC-PUMP",
    brand: "Topeak",
    tags: ["pump", "tools", "accessories", "inflation"],
    specs: {
      Material: "CNC machined aluminum alloy",
      Capacity: "Up to 120 PSI / 8.3 Bar",
      Valves: "Dual Presta & Schrader flexible hose head",
      Length: "170 mm compact design",
      Weight: "85 grams"
    },
    cycleSize: null,
    assemblyDifficulty: 1,
    whoIsThisFor: [],
    starterKit: [],
    relatedProducts: ["prod-helmet", "prod-lock"],
    isActive: true,
    isFeatured: false,
    metaTitle: "Topeak Mini High-Pressure Pump — CNC Aluminum Cycle Pump - VEGA Sports",
    metaDescription: "Shop Topeak Mini High-Pressure Hand Pump. Compact, lightweight aluminum alloy build, dual valve compatibility, up to 120 PSI.",
    rating: 4.6,
    reviewsCount: 0
  },
  {
    id: "prod-lock",
    name: "Kryptonite Heavy Duty U-Lock",
    slug: "kryptonite-heavy-duty-u-lock",
    description: "Protect your investment with the Kryptonite Heavy Duty U-Lock. Crafted from 14mm hardened carbon steel shackle that resists cutting, leverage, and prying attacks. Features a high-security disc-style lock cylinder that is pick and drill resistant. Includes a protective vinyl coating to prevent frame scratches.",
    shortDescription: "High-security bicycle U-Lock with 14mm hardened carbon steel shackle and pick-resistant cylinder.",
    price: 119900,
    comparePrice: 149900,
    images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop"],
    categoryId: "cat-accessories",
    categoryName: "Accessories",
    stock: 18,
    sku: "KRYP-ACC-LOCK",
    brand: "Kryptonite",
    tags: ["lock", "security", "accessories", "safety"],
    specs: {
      Shackle: "14mm hardened carbon steel shackle",
      Cylinder: "Disc-style high security pick-resistant cylinder",
      Coating: "Molded vinyl frame-protection cover",
      Keys: "3 keys included",
      Bracket: "Quick-release mounting bracket"
    },
    cycleSize: null,
    assemblyDifficulty: 1,
    whoIsThisFor: [],
    starterKit: [],
    relatedProducts: ["prod-helmet", "prod-light"],
    isActive: true,
    isFeatured: false,
    metaTitle: "Kryptonite Heavy Duty U-Lock — Hardened Steel Bike Security - VEGA Sports",
    metaDescription: "Buy Kryptonite Heavy Duty U-Lock online. High-security 14mm hardened steel shackle, pick and cut resistant, protective frame coating.",
    rating: 4.8,
    reviewsCount: 0
  }
];

export const MOCK_REVIEWS = [
  {
    id: "rev-1",
    productId: "prod-aero-x",
    userName: "Priyanshu Ranchi",
    rating: 5,
    title: "Absolutely incredible performance!",
    body: "Bought this Giant hybrid and it is incredibly fast. Ridden it on Ranchi Ring Road several times now and it is super light. The carbon frame dampens the vibrations really well. Highly recommend!",
    verified: true,
    createdAt: "2026-06-01T12:00:00Z"
  },
  {
    id: "rev-2",
    productId: "prod-aero-x",
    userName: "Anand Kumar",
    rating: 4,
    title: "Super light, but assembly took some time",
    body: "The bike is very light and feels premium. I chose self-assembly which took me about 45 mins. If you are a beginner, please book the assembly service. Great store experience in Ranchi!",
    verified: false,
    createdAt: "2026-06-02T14:30:00Z"
  },
  {
    id: "rev-3",
    productId: "prod-ranchi-mtb",
    userName: "Priyanshu Ranchi",
    rating: 5,
    title: "Amazing grip on Ranchi off-roads",
    body: "Took this Trek MTB to Hundru trail. The tyres grip incredibly well. The mechanical brakes have great stopping power. Excellent budget mountain bike from Trek!",
    verified: true,
    createdAt: "2026-06-03T10:00:00Z"
  },
  {
    id: "rev-4",
    productId: "prod-ranchi-mtb",
    userName: "Rita Kumari",
    rating: 5,
    title: "Solid build quality",
    body: "A very sturdy bike. I commute every day around Lalpur, it handles potholes easily. 5-stars to VEGA Sports store!",
    verified: false,
    createdAt: "2026-06-04T16:15:00Z"
  }
];

export const MOCK_SITE_SETTINGS = {
  id: "singleton",
  anthropicApiKey: "sk-ant-placeholder",
  razorpayKeyId: "rzp_test_placeholder",
  razorpaySecret: "razorpay_secret_placeholder",
  shiprocketEmail: "admin@vegasports.in",
  shiprocketPass: "password_placeholder",
  aiSystemPrompt: "You are VEGA's shopping assistant. You help customers find the right cycle, fitness gear, and sports equipment from premium global brands (like Trek, Giant, Yonex, Bowflex). You know all our catalog products, their specs, pricing, and availability. You are friendly, speak Hinglish naturally, and give direct recommendations. Always end with a product suggestion or next step.",
  aiEnabled: true,
  maintenanceMode: false,
  freeShippingMin: 500000
};

export const MOCK_SERVICE_PACKAGES = [
  // Servicing
  {
    id: "pkg-srv-1",
    type: "SERVICING",
    name: "General Care (Standard)",
    price: 799, // in Rupees (will be formatted)
    desc: "Essential general maintenance to keep your ride smooth, safe, and clean.",
    includes: [
      "Gear indexing & shifter tuning",
      "Brake calliper adjustment & centering",
      "Chain deep lubrication & wipe down",
      "Headset, bottom bracket & bolt checks",
      "Tire inspection & pressure inflation",
      "15-point diagnostic safety check",
    ],
    isActive: true,
  },
  {
    id: "pkg-srv-2",
    type: "SERVICING",
    name: "Deep Tuning (Premium)",
    price: 1499,
    desc: "A thorough mechanical service with drivetrain degreasing and wheel truing.",
    includes: [
      "Everything in General Care",
      "Drivetrain chemical bath (chain, cassette, cranks)",
      "Wheel truing (tension adjustment & lateral alignment)",
      "Front/Rear hub bearing inspections & regreasing",
      "Complete frame wash & hydrophobic polish",
      "Post-wash mechanical adjustments",
    ],
    isActive: true,
  },
  {
    id: "pkg-srv-3",
    type: "SERVICING",
    name: "Elite Overhaul (Pro)",
    price: 2499,
    desc: "The ultimate full strip-down rebuild service to restore your bike to factory fresh.",
    includes: [
      "Everything in Deep Tuning",
      "Complete bike strip-down to bare frame",
      "Replacement of all inner brake & gear cables",
      "Bottom bracket overhaul (degreased & serviced)",
      "Headset rebuild & fresh bearing grease packing",
      "Suspension fork inspection & wipe down",
      "Frame detailed paint restoration & glaze polish",
    ],
    isActive: true,
  },
  // Repairing
  {
    id: "pkg-rep-1",
    type: "REPAIRING",
    name: "Brake Overhaul",
    price: 499,
    desc: "Complete service for brake components. Restores stopping power & levers feel.",
    includes: [
      "Brake pad replacement (front & rear)",
      "Brake cable tension adjustments & alignment",
      "Hydraulic brake line bleeding (if applicable)",
      "Rotor straightening & caliper lubrication",
      "Lever reach adjustment & lever cleaning",
    ],
    isActive: true,
  },
  {
    id: "pkg-rep-2",
    type: "REPAIRING",
    name: "Drivetrain Repair",
    price: 899,
    desc: "Restores shift quality, resolves skipping gears, and rebuilds drivetrain.",
    includes: [
      "Rear derailleur hanger alignment checking",
      "Chain installation / link removal & tuning",
      "Cassette/Freewheel stripping & replacement",
      "Front/Rear derailleur adjustments & limit settings",
      "Cable housing routing inspection",
    ],
    isActive: true,
  },
  {
    id: "pkg-rep-3",
    type: "REPAIRING",
    name: "Wheel Truing & Hub Overhaul",
    price: 699,
    desc: "Brings wobbling wheels back to center and regreases wheel hub bearings.",
    includes: [
      "Precision lateral & radial wheel truing",
      "Spoke tension inspection & spoke replacement",
      "Hub dismantling, deep cleaning & bearing check",
      "High-pressure bearing regreasing & packing",
      "Axle alignment & cone adjustments",
    ],
    isActive: true,
  },
];

export const DEFAULT_HOMEPAGE_CONFIG = {
  showSlider: true,
  showServices: true,
  showBento: true,
  showBrands: true,
  showStats: true,
  showProducts: true,
  showTestimonials: true,
  showSocial: true,
  stats: [
    { number: "500+", label: "Cycles Delivered" },
    { number: "4.9★", label: "Customer Rating" },
    { number: "2-Day", label: "Ranchi Delivery" },
    { number: "10+", label: "Global Brands Sold" }
  ],
  brands: [
    { name: "Trek", logo: "TREK", desc: "Premium Mountain & Road Bikes", href: "/products?brand=Trek" },
    { name: "Giant", logo: "GIANT", desc: "High-Performance Carbon Hybrids", href: "/products?brand=Giant" },
    { name: "Specialized", logo: "SPECIALIZED", desc: "Sleek City & Commuter Cycles", href: "/products?brand=Specialized" },
    { name: "Yonex", logo: "YONEX", desc: "Japanese Graphite Rackets", href: "/products?brand=Yonex" },
    { name: "Bowflex", logo: "BOWFLEX", desc: "Adjustable Dial Weights", href: "/products?brand=Bowflex" },
    { name: "Giro", logo: "GIRO", desc: "Aerodynamic Protective Helmets", href: "/products?brand=Giro" }
  ],
  collections: [
    {
      name: "Performance Cycles",
      desc: "Premium hybrid, road, and trail MTBs from Giant, Trek, and Specialized.",
      href: "/products?category=cycles",
      image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop",
      gridSpan: "lg:col-span-2 lg:row-span-2",
    },
    {
      name: "Strength & Fitness",
      desc: "Space-saving Bowflex adjustable selector dumbbells and training gears.",
      href: "/products?category=fitness",
      image: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=600&auto=format&fit=crop",
      gridSpan: "lg:col-span-2 lg:row-span-1",
    },
    {
      name: "Racquet Sports",
      desc: "High-tension graphite Yonex rackets and court accessories.",
      href: "/products?category=sports",
      image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop",
      gridSpan: "lg:col-span-1 lg:row-span-1",
    },
    {
      name: "Rider Accessories",
      desc: "Cateye lights, Giro helmets, Topeak pumps, and Kryptonite locks.",
      href: "/products?category=accessories",
      image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600&auto=format&fit=crop",
      gridSpan: "lg:col-span-1 lg:row-span-1",
    }
  ]
};


