import { PrismaClient, Role, OrderStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Clean existing data
  await prisma.review.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.address.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.siteSettings.deleteMany()
  await prisma.homeSlide.deleteMany()

  // 2. Create Default SiteSettings
  const siteSettings = await prisma.siteSettings.create({
    data: {
      id: 'singleton',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      razorpaySecret: process.env.RAZORPAY_SECRET || 'razorpay_secret_placeholder',
      shiprocketEmail: process.env.SHIPROCKET_EMAIL || 'admin@vyorax.in',
      shiprocketPass: process.env.SHIPROCKET_PASSWORD || 'password_placeholder',
      aiSystemPrompt: 'You are Vyorax\'s shopping assistant. You help customers find the right cycle, fitness gear, and sports equipment from premium global brands (like Trek, Giant, Yonex, Bowflex). You know all our catalog products, their specs, pricing, and availability. You are friendly, speak Hinglish naturally, and give direct recommendations. Always end with a product suggestion or next step.',
      aiEnabled: true,
      maintenanceMode: false,
      freeShippingMin: 500000, // Rs. 5000 in paise
    }
  })
  console.log('Created SiteSettings:', siteSettings.id)

  // 2b. Create Default Home Slides
  await prisma.homeSlide.createMany({
    data: [
      {
        title: "Giant Aero-X & Trek MTBs",
        subtitle: "UP TO 20% OFF ON GLOBAL PERFORMANCE CYCLES",
        desc: "Explore road, hybrid, and trail mountain bikes from Giant, Trek, and Specialized. Enjoy free delivery & expert assembly in Ranchi.",
        image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1600&auto=format&fit=crop",
        ctaText: "Explore Cycles",
        ctaHref: "/products?category=cycles",
        bgGradient: "from-orange-600/20 via-neutral-900/5 to-transparent",
        accent: "var(--agni)",
        order: 0,
        isActive: true
      },
      {
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
    ]
  })
  console.log('Seeded Home Slides')

  // 3. Create Admin User
  const adminPasswordHash = bcrypt.hashSync('changeme123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@vyorax.in',
      name: 'Vyorax Admin',
      phone: '9999999999',
      password: adminPasswordHash,
      role: Role.ADMIN,
    }
  })
  console.log('Created Admin User:', adminUser.email)

  // 4. Create Standard Customer User (for testing reviews etc.)
  const customerPasswordHash = bcrypt.hashSync('customer123', 10)
  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@vyorax.in',
      name: 'Priyanshu Ranchi',
      phone: '8888888888',
      password: customerPasswordHash,
      role: Role.CUSTOMER,
    }
  })
  console.log('Created Customer User:', customerUser.email)

  // 5. Create Categories
  const cyclesCategory = await prisma.category.create({
    data: { name: 'Cycles', slug: 'cycles', parentId: null }
  })
  const fitnessCategory = await prisma.category.create({
    data: { name: 'Fitness', slug: 'fitness', parentId: null }
  })
  const sportsCategory = await prisma.category.create({
    data: { name: 'Sports', slug: 'sports', parentId: null }
  })
  const accessoriesCategory = await prisma.category.create({
    data: { name: 'Accessories', slug: 'accessories', parentId: null }
  })
  const electricCategory = await prisma.category.create({
    data: { name: 'Electric Cycles', slug: 'electric-cycles', parentId: null }
  })

  // Create Subcategories
  const mtbCategory = await prisma.category.create({
    data: { name: 'MTB', slug: 'mtb', parentId: cyclesCategory.id }
  })
  const menCategory = await prisma.category.create({
    data: { name: 'Men', slug: 'men', parentId: cyclesCategory.id }
  })
  const womenCategory = await prisma.category.create({
    data: { name: 'Women', slug: 'women', parentId: cyclesCategory.id }
  })
  const kidsCategory = await prisma.category.create({
    data: { name: 'Kids', slug: 'kids', parentId: cyclesCategory.id }
  })
  console.log('Created Categories & Subcategories')

  // 6. Create Products
  // Product 1: High-end Hybrid Cycle
  const product1 = await prisma.product.create({
    data: {
      name: 'Giant Aero-X Carbon Hybrid',
      slug: 'giant-aero-x-carbon',
      description: 'The Giant Aero-X Carbon hybrid is a premium performance machine, blending the speed of a road bike with the rugged durability of a cross-country explorer. Featuring a featherlight aerospace-grade carbon frame, state-of-the-art Shimano 1x11 gearing, and responsive hydraulic brakes, it is designed to fly through Ranchi city streets and conquer Patratu valley climbs with absolute ease.',
      shortDescription: 'Cinematic performance hybrid with lightweight carbon frame, Shimano 1x11 speed, and hydraulic disc brakes.',
      price: 4500000, // Rs. 45,000 in paise
      comparePrice: 4999900,
      images: [
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200&auto=format&fit=crop'
      ],
      categoryId: menCategory.id,
      stock: 4,
      sku: 'GIANT-CYC-AEROX',
      brand: 'Giant',
      tags: ['carbon', 'hybrid', 'premium', 'shimano', 'men'],
      specs: {
        Frame: 'Giant Carbon Alloy Frame (Grade 5)',
        Gears: 'Shimano Deore 1x11 speed derailleur',
        Brakes: 'Shimano MT200 Hydraulic Disc Brakes',
        Tyres: 'Maxxis Crossmark II 29x2.1 tubeless ready',
        Weight: '11.8 kg',
        Suspension: 'SR Suntour 100mm with lock-out'
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
          title: 'The College Commuter',
          avatar: '🎓',
          desc: 'Speed past Ranchi traffic to make it to class on time. Ultra lightweight and extremely responsive.',
          accessories: ['GIRO-ACC-HELM', 'CATEYE-ACC-LIGHT']
        },
        {
          title: 'The Weekend Enduro Rider',
          avatar: '⛰️',
          desc: 'For early morning adventures on Ranchi Ring Road and climbing Patratu Valley climbs with confidence.',
          accessories: ['TOPEAK-ACC-PUMP']
        }
      ],
      starterKit: [
        {
          id: 'GIRO-ACC-HELM',
          name: 'Giro Aero Shield Helmet',
          price: 249900, // Rs. 2,499
          sku: 'GIRO-ACC-HELM',
          image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop'
        },
        {
          id: 'CATEYE-ACC-LIGHT',
          name: 'Cateye USB Laser Tail Light',
          price: 99900, // Rs. 999
          sku: 'CATEYE-ACC-LIGHT',
          image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=400&auto=format&fit=crop'
        }
      ],
      relatedProducts: [],
      isActive: true,
      isFeatured: true,
      metaTitle: 'Giant Aero-X Carbon Premium Hybrid Cycle - VEGA Sports',
      metaDescription: 'Shop the premium Giant Aero-X Carbon cycle online. Designed with aerospace alloy frame, Shimano 1x11 speed gears, and dual hydraulic disc brakes. Delivered in Ranchi.'
    }
  })

  // Product 2: Mountain Cycle
  const product2 = await prisma.product.create({
    data: {
      name: 'Trek Ranchi Rider MTB',
      slug: 'trek-ranchi-rider-mtb',
      description: 'Conquer any terrain with the Trek Ranchi Rider MTB. Crafted with a premium Trek 6061 Hardtail Alloy frame, high traction 29-inch offroad tyres, and dual mechanical disc brakes, this bike is built to take on gravel, mud, sand, and Ranchi potholes without breaking a sweat.',
      shortDescription: 'All-terrain Mountain Bike featuring hardtail 6061 alloy frame, 29" tyres, and dual mechanical disc brakes.',
      price: 2450000, // Rs. 24,500 in paise
      comparePrice: 2800000,
      images: [
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=1200&auto=format&fit=crop'
      ],
      categoryId: mtbCategory.id,
      stock: 8,
      sku: 'TREK-CYC-RANCHIMTB',
      brand: 'Trek',
      tags: ['mtb', 'alloy', 'all-terrain', 'offroad', 'men'],
      specs: {
        Frame: 'Trek Alpha Silver Aluminum Alloy',
        Gears: 'Shimano Altus 3x8 speed (24 speeds)',
        Brakes: 'Tektro Mechanical Disc Brakes',
        Tyres: 'Bontrager XR2 29 x 2.2 trail tyres',
        Weight: '14.5 kg',
        Suspension: 'Suntour 100mm Front Fork with manual lockout'
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
          title: 'The Weekend Trailblazer',
          avatar: '🚵',
          desc: 'Navigate rugged forest tracks around Jonha Falls and Hundru Falls with absolute grip and safety.',
          accessories: ['TOPEAK-ACC-PUMP']
        }
      ],
      starterKit: [
        {
          id: 'TOPEAK-ACC-PUMP',
          name: 'Topeak Mini Pump',
          price: 79900, // Rs. 799
          sku: 'TOPEAK-ACC-PUMP',
          image: 'https://images.unsplash.com/photo-1601362840469-817887520935?q=80&w=400&auto=format&fit=crop'
        }
      ],
      relatedProducts: [product1.id],
      isActive: true,
      isFeatured: true,
      metaTitle: 'Trek Ranchi Rider MTB 29er - VEGA Sports',
      metaDescription: 'Shop the Trek Ranchi Rider Mountain Bike with 29-inch wheels, Alpha alloy frame, and 24-speed gears. Built to handle rough paths around Ranchi.'
    }
  })

  // Product 3: City Hybrid
  const product3 = await prisma.product.create({
    data: {
      name: 'Specialized Urban Swift Hybrid',
      slug: 'specialized-urban-swift',
      description: 'The Specialized Urban Swift is the ultimate city machine. Lightweight, single-speed simplicity with dual V-brakes and high-pressure slick tyres. Fly through daily commutes, enjoy minimal maintenance, and feel the road with its premium Specialized steel design.',
      shortDescription: 'Lightweight city cycle with single-speed simplicity, dual V-brakes, and slick city tyres.',
      price: 1599900, // Rs. 15,999 in paise
      comparePrice: 1999900,
      images: [
        'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop'
      ],
      categoryId: womenCategory.id,
      stock: 2, // Low stock alert test
      sku: 'SPEC-CYC-USWIFT',
      brand: 'Specialized',
      tags: ['city', 'hybrid', 'singlespeed', 'minimal', 'women'],
      specs: {
        Frame: 'Specialized A1 Premium Aluminum Steel',
        Gears: 'Single Speed 18T Freewheel',
        Brakes: 'Alloy Dual Pivot Caliper Brakes',
        Tyres: 'Specialized RoadSport 700x28c',
        Weight: '12.1 kg',
        Suspension: 'Rigid steel fork for maximum power transfer'
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
          title: 'The Daily City Commuter',
          avatar: '🎒',
          desc: 'An agile, stylish fixie-style commuter requiring zero maintenance. Perfect for Ranchi roads.',
          accessories: ['KRYP-ACC-LOCK']
        }
      ],
      starterKit: [
        {
          id: 'KRYP-ACC-LOCK',
          name: 'Kryptonite Heavy Duty U-Lock',
          price: 119900, // Rs. 1,199
          sku: 'KRYP-ACC-LOCK',
          image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400&auto=format&fit=crop'
        }
      ],
      relatedProducts: [product2.id],
      isActive: true,
      isFeatured: false,
      metaTitle: 'Specialized Urban Swift Singlespeed City Cycle - VEGA Sports',
      metaDescription: 'Shop the sleek, minimal Specialized Urban Swift city cycle. Features single speed gear ratio, light steel frame, and dual caliper brakes.'
    }
  })

  // Product 3b: Kids Cycle
  const productKids = await prisma.product.create({
    data: {
      name: 'Giant Animator 16" Kids Bike',
      slug: 'giant-animator-kids',
      description: 'The Giant Animator is a lightweight aluminum kids\' cycle designed to make learning to ride fun and easy. Featuring removable training wheels, a low standover height, a rear coaster brake, and a stylish design, it is perfect for Ranchi\'s youngest riders.',
      shortDescription: 'Lightweight 16" aluminum kids bike with coaster brake and removable training wheels.',
      price: 1250000,
      comparePrice: 1499900,
      images: ['https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?q=80&w=1200&auto=format&fit=crop'],
      categoryId: kidsCategory.id,
      stock: 6,
      sku: 'GIANT-CYC-ANIMATOR',
      brand: 'Giant',
      tags: ['kids', 'junior', 'cycle', 'children'],
      specs: {
        Frame: 'ALUXX-grade aluminum',
        Fork: 'High-tensile steel',
        Handlebar: 'Kids steel, 160mm rise',
        Brakes: 'Coaster brake (pedal backwards to stop) and caliper front brake',
        Tyres: 'Giant Easy Rider, 16x2.125"',
        Extras: 'Training wheels, chainguard, bell'
      },
      cycleSize: {
        sizes: [
          { minHeight: "3'2\"", maxHeight: "3'10\"", size: "16\" Wheel (Ages 4-7)" }
        ]
      },
      assemblyDifficulty: 1,
      whoIsThisFor: [
        {
          title: 'The Young Learner',
          avatar: '👦',
          desc: 'Designed to build cycling confidence safely. Perfect for Ranchi parks and backyards.',
          accessories: []
        }
      ],
      starterKit: [],
      relatedProducts: [product2.id],
      isActive: true,
      isFeatured: true,
      metaTitle: 'Giant Animator 16" Kids Bike - VEGA Sports',
      metaDescription: 'Buy the Giant Animator 16" kids cycle online. Durable ALUXX aluminum frame, training wheels, coaster and front brakes for kid safety.'
    }
  })

  // Product E1: Giant Talon E+ Electric MTB
  const productElec1 = await prisma.product.create({
    data: {
      name: 'Giant Talon E+ Electric MTB',
      slug: 'giant-talon-e-electric',
      description: "Experience the thrill of trail riding with the Giant Talon E+ Electric MTB. Powered by Giant's SyncDrive Core motor technology, this electric mountain bike delivers smooth, instantaneous power to help you conquer steep climbs and ride longer distances. Features a lightweight ALUXX aluminum frame, SR Suntour 100mm suspension fork, Shimano 9-speed gearing, and powerful hydraulic disc brakes.",
      shortDescription: 'High-performance electric MTB with SyncDrive Core motor, 100mm suspension, and hydraulic disc brakes.',
      price: 8500000,
      comparePrice: 9900000,
      images: [
        'https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1200&auto=format&fit=crop'
      ],
      categoryId: electricCategory.id,
      stock: 5,
      sku: 'GIANT-ELE-TALONE',
      brand: 'Giant',
      tags: ['electric', 'ebike', 'mtb', 'alloy', 'men'],
      specs: {
        Motor: 'Giant SyncDrive Core, 50Nm torque',
        Battery: 'Giant EnergyPak 400Wh Li-ion',
        Frame: 'ALUXX-Grade Aluminum Hardtail',
        Gears: 'Shimano Alivio 9-speed',
        Brakes: 'Tektro HD-M275 Hydraulic Disc Brakes',
        Weight: '21.5 kg'
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
          title: 'The Trail Explorer',
          avatar: '⚡',
          desc: 'Ride further and climb higher with electronic pedal assistance. Perfect for Ranchi\'s hilly terrains.'
        }
      ],
      starterKit: [],
      relatedProducts: [],
      isActive: true,
      isFeatured: true,
      metaTitle: 'Giant Talon E+ Electric MTB — Premium E-Bike - VEGA Sports',
      metaDescription: 'Buy Giant Talon E+ electric mountain bike online. Features SyncDrive Core motor, EnergyPak battery, and Shimano 9-speed gears.'
    }
  })

  // Product E2: Specialized Turbo Vado E-Bike
  const productElec2 = await prisma.product.create({
    data: {
      name: 'Specialized Turbo Vado E-Bike',
      slug: 'specialized-turbo-vado-ebike',
      description: 'The Specialized Turbo Vado is the ultimate transportation machine, built to handle everything from daily commutes to fast workouts and longer weekend adventures. With its integrated Specialized 2.0 motor and 710Wh battery, it offers a smooth, quiet, and powerful riding experience. Features custom integrated front/rear lights, mudguards, and rear rack.',
      shortDescription: 'Premium urban electric bike with integrated Specialized 2.0 motor, 710Wh battery, and cargo rack.',
      price: 12000000,
      comparePrice: 13500000,
      images: [
        'https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1200&auto=format&fit=crop'
      ],
      categoryId: electricCategory.id,
      stock: 3,
      sku: 'SPEC-ELE-VADO',
      brand: 'Specialized',
      tags: ['electric', 'ebike', 'city', 'premium', 'women'],
      specs: {
        Motor: 'Specialized 2.0, 70Nm torque, 250W',
        Battery: 'Specialized U2-710, integrated, 710Wh',
        Frame: 'E5 Aluminum, bottom bracket motor mount',
        Gears: 'SRAM NX 11-speed',
        Brakes: 'SRAM Level Easy Hydraulic Disc Brakes',
        Weight: '23.8 kg'
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
          title: 'The Eco Commuter',
          avatar: '🚲',
          desc: 'Ditch the car and zoom past Ranchi traffic in comfort. Integrated rack for office bags or groceries.'
        }
      ],
      starterKit: [],
      relatedProducts: [],
      isActive: true,
      isFeatured: true,
      metaTitle: 'Specialized Turbo Vado Premium Electric Commuter - VEGA Sports',
      metaDescription: 'Buy Specialized Turbo Vado urban electric bike. Powerful Specialized 2.0 motor, 710Wh battery, fully equipped city commuter.'
    }
  })

  // Product 4: Fitness Dumbbells
  const product4 = await prisma.product.create({
    data: {
      name: 'Bowflex SelectTech Adjustable Dumbbell Set',
      slug: 'bowflex-selecttech-dumbbells',
      description: 'Replace 15 pairs of dumbbells with a single pair of Bowflex SelectTech Adjustable Dumbbells. Using an innovative dial selection mechanism, you can adjust your weight from 2.5 kg up to 24 kg per hand instantly. Finished with durable thermoplastic coating to prevent clanking and rusting.',
      shortDescription: 'Space-saving adjustable dumbbells replacing 15 pairs. Dial system from 2.5kg to 24kg.',
      price: 1199900, // Rs. 11,999 in paise
      comparePrice: 1599900,
      images: [
        'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=1200&auto=format&fit=crop'
      ],
      categoryId: fitnessCategory.id,
      stock: 12,
      sku: 'BOWFLEX-FIT-ADJDUMB',
      brand: 'Bowflex',
      tags: ['dumbbells', 'homegym', 'strength', 'weights'],
      specs: {
        'Weight Range': '2.5 kg to 24 kg per hand',
        'Weight Settings': '2.5, 3.5, 4.5, 5.5, 6.5, 8, 9, 10, 11.5, 13.5, 16, 18, 20.5, 22.5, 24 kg',
        Material: 'Durable steel plates with thermoplastic rubber shield',
        Base: 'Impact-resistant thermoplastic storage tray included',
        Grip: 'Ergonomic knurled steel handle'
      },
      assemblyDifficulty: 1,
      whoIsThisFor: [
        {
          title: 'The Home Gym Builder',
          avatar: '🏋️',
          desc: 'Excellent for people building strength in small spaces. Full workout versatility.',
          accessories: []
        }
      ],
      starterKit: [],
      relatedProducts: [],
      isActive: true,
      isFeatured: true,
      metaTitle: 'Bowflex SelectTech Adjustable Dumbbell Pair - VEGA Sports',
      metaDescription: 'Buy Bowflex SelectTech Adjustable Dumbbells (2.5kg to 24kg) online. Premium home gym selector dumbbells.'
    }
  })

  // Product 5: Sports Racket
  const product5 = await prisma.product.create({
    data: {
      name: 'Yonex Carbon Pro Badminton Racket',
      slug: 'yonex-carbon-pro-badminton',
      description: 'Dominate the court with the Yonex Carbon Pro Badminton Racket. Featuring high modulus Japanese carbon graphite frame construction, a stiff aero-box shaft for explosive smash power, and a super light weight of 82g (4U) for lightning fast net recovery.',
      shortDescription: 'Japanese high modulus carbon badminton racket with stiff shaft. Lightweight 82g (4U).',
      price: 349900, // Rs. 3,499 in paise
      comparePrice: 420000,
      images: [
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop'
      ],
      categoryId: sportsCategory.id,
      stock: 15,
      sku: 'YONEX-SPT-BADMINTON',
      brand: 'Yonex',
      tags: ['badminton', 'racket', 'graphite', 'carbon'],
      specs: {
        Material: 'Japanese High Modulus Carbon Graphite',
        Weight: '82 +/- 2 grams (4U)',
        GripSize: 'G5',
        MaxTension: '30 lbs',
        Balance: 'Head-Heavy (Smash oriented)',
        ShaftFlex: 'Stiff'
      },
      assemblyDifficulty: 1,
      whoIsThisFor: [
        {
          title: 'The Offensive Smasher',
          avatar: '🏸',
          desc: 'High tension capacity and head heavy balance built for intermediate and advanced court attack.',
          accessories: []
        }
      ],
      starterKit: [],
      relatedProducts: [],
      isActive: true,
      isFeatured: false,
      metaTitle: 'Yonex Carbon Pro Badminton Racket 4U - VEGA Sports',
      metaDescription: 'Shop Yonex Carbon Pro Badminton Racket. Features Japanese carbon graphite, G5 grip, support up to 30lbs tension.'
    }
  })

  // Product 6: Accessory Helmet
  const product6 = await prisma.product.create({
    data: {
      name: 'Giro Aero Shield Helmet',
      slug: 'giro-aero-shield-helmet',
      description: 'Stay safe and look sleek with the Giro Aero Shield Helmet. Engineered with an aerodynamic poly-carbonate shell and multi-density EPS foam liner for maximum shock absorption. Features 18 cooling ventilation channels and Giro RocLoc fit adjustment. Certified to exceed global CE EN1078 safety standards.',
      shortDescription: 'Premium aerodynamic cycling helmet with multi-density EPS, dial fit system, and magnetic visor shield.',
      price: 249900,
      comparePrice: 299900,
      images: ['https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1200&auto=format&fit=crop'],
      categoryId: accessoriesCategory.id,
      stock: 15,
      sku: 'GIRO-ACC-HELM',
      brand: 'Giro',
      tags: ['helmet', 'accessories', 'safety', 'gear'],
      specs: {
        Material: 'In-mold polycarbonate with EPS liner',
        Ventilation: '18 aerodynamic vents',
        'Fit System': 'Giro RocLoc fit adjustment',
        Certifications: 'CE EN1078, CPSC certified',
        Weight: '260 grams'
      },
      assemblyDifficulty: 1,
      whoIsThisFor: [],
      starterKit: [],
      relatedProducts: [],
      isActive: true,
      isFeatured: true,
      metaTitle: 'Giro Aero Shield Helmet — Premium Cycling Safety - VEGA Sports',
      metaDescription: 'Shop the premium Giro Aero Shield Helmet online. Engineered with high-strength polycarbonate shell, 18 cooling vents, and magnetic visor.'
    }
  })

  // Product 7: Accessory Laser Tail Light
  const product7 = await prisma.product.create({
    data: {
      name: 'Cateye USB Laser Tail Light',
      slug: 'cateye-usb-laser-tail-light',
      description: 'Be visible from miles away with the Cateye USB Laser Tail Light. This high-intensity tail light combines 5 bright red LEDs with 2 lane-marking laser beams that project a safe virtual lane around your bike. Features 4 distinct flashing patterns, a rechargeable battery, and waterproof casing.',
      shortDescription: 'Rechargeable high-intensity bicycle tail light with virtual lane laser projection and waterproof casing.',
      price: 99900,
      comparePrice: 149900,
      images: ['https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=1200&auto=format&fit=crop'],
      categoryId: accessoriesCategory.id,
      stock: 20,
      sku: 'CATEYE-ACC-LIGHT',
      brand: 'Cateye',
      tags: ['lighting', 'safety', 'accessories', 'laser'],
      specs: {
        'Light Output': '80 Lumens red LED',
        'Laser Mode': '2 virtual lane laser beams',
        'Battery Type': 'Recharge00mAh battery',
        Runtime: 'Up to 8 hours on flash mode',
        Waterproofing: 'IPX4 waterproof rating'
      },
      assemblyDifficulty: 1,
      whoIsThisFor: [],
      starterKit: [],
      relatedProducts: [],
      isActive: true,
      isFeatured: true,
      metaTitle: 'Cateye USB Laser Tail Light — High Visibility Laser Safety - VEGA Sports',
      metaDescription: 'Buy Cateye USB Laser Tail Light online. Features 5 high-intensity red LEDs and lane-marking laser projections for night riding.'
    }
  })

  // Product 8: Accessory Mini Pump
  const product8 = await prisma.product.create({
    data: {
      name: 'Topeak Mini High-Pressure Pump',
      slug: 'topeak-mini-high-pressure-pump',
      description: 'Never get stranded with a flat tire. The Topeak Mini High-Pressure Pump is a lightweight, compact hand pump made from high-strength CNC machined aluminum alloy. Capable of pumping up to 120 PSI, it features a dual-head thread-on flex hose compatible with both Presta and Schrader valves. Mounting bracket included.',
      shortDescription: 'Lightweight CNC aluminum bicycle hand pump, up to 120 PSI capacity, Presta and Schrader compatible.',
      price: 79900,
      comparePrice: 99900,
      images: ['https://images.unsplash.com/photo-1601362840469-817887520935?q=80&w=1200&auto=format&fit=crop'],
      categoryId: accessoriesCategory.id,
      stock: 25,
      sku: 'TOPEAK-ACC-PUMP',
      brand: 'Topeak',
      tags: ['pump', 'tools', 'accessories', 'inflation'],
      specs: {
        Material: 'CNC machined aluminum alloy',
        Capacity: 'Up to 120 PSI / 8.3 Bar',
        Valves: 'Dual Presta & Schrader flexible hose head',
        Length: '170 mm compact design',
        Weight: '85 grams'
      },
      assemblyDifficulty: 1,
      whoIsThisFor: [],
      starterKit: [],
      relatedProducts: [],
      isActive: true,
      isFeatured: false,
      metaTitle: 'Topeak Mini High-Pressure Pump — CNC Aluminum Cycle Pump - VEGA Sports',
      metaDescription: 'Shop Topeak Mini High-Pressure Hand Pump. Compact, lightweight aluminum alloy build, dual valve compatibility, up to 120 PSI.'
    }
  })

  // Product 9: Accessory Lock
  const product9 = await prisma.product.create({
    data: {
      name: 'Kryptonite Heavy Duty U-Lock',
      slug: 'kryptonite-heavy-duty-u-lock',
      description: 'Protect your investment with the Kryptonite Heavy Duty U-Lock. Crafted from 14mm hardened carbon steel shackle that resists cutting, leverage, and prying attacks. Features a high-security disc-style lock cylinder that is pick and drill resistant. Includes a protective vinyl coating to prevent frame scratches.',
      shortDescription: 'High-security bicycle U-Lock with 14mm hardened carbon steel shackle and pick-resistant cylinder.',
      price: 119900,
      comparePrice: 149900,
      images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop'],
      categoryId: accessoriesCategory.id,
      stock: 18,
      sku: 'KRYP-ACC-LOCK',
      brand: 'Kryptonite',
      tags: ['lock', 'security', 'accessories', 'safety'],
      specs: {
        Shackle: '14mm hardened carbon steel shackle',
        Cylinder: 'Disc-style high security pick-resistant cylinder',
        Coating: 'Molded vinyl frame-protection cover',
        Keys: '3 keys included',
        Bracket: 'Quick-release mounting bracket'
      },
      assemblyDifficulty: 1,
      whoIsThisFor: [],
      starterKit: [],
      relatedProducts: [],
      isActive: true,
      isFeatured: false,
      metaTitle: 'Kryptonite Heavy Duty U-Lock — Hardened Steel Bike Security - VEGA Sports',
      metaDescription: 'Buy Kryptonite Heavy Duty U-Lock online. High-security 14mm hardened steel shackle, pick and cut resistant, protective frame coating.'
    }
  })

  // Update related products links after creation
  await prisma.product.update({
    where: { id: product1.id },
    data: { relatedProducts: [product2.id, product3.id] }
  })
  await prisma.product.update({
    where: { id: product2.id },
    data: { relatedProducts: [product1.id, product3.id] }
  })
  await prisma.product.update({
    where: { id: product3.id },
    data: { relatedProducts: [product1.id, product2.id] }
  })
  await prisma.product.update({
    where: { id: product6.id },
    data: { relatedProducts: [product7.id, product9.id] }
  })
  await prisma.product.update({
    where: { id: product7.id },
    data: { relatedProducts: [product6.id, product9.id] }
  })
  await prisma.product.update({
    where: { id: product8.id },
    data: { relatedProducts: [product6.id, product9.id] }
  })
  await prisma.product.update({
    where: { id: product9.id },
    data: { relatedProducts: [product6.id, product7.id] }
  })
  await prisma.product.update({
    where: { id: productElec1.id },
    data: { relatedProducts: [product2.id, productElec2.id] }
  })
  await prisma.product.update({
    where: { id: productElec2.id },
    data: { relatedProducts: [product3.id, productElec1.id] }
  })

  console.log('Created Products')

  // 7. Seed Reviews (2 per product)
  const reviewsData = [
    // Product 1
    {
      productId: product1.id,
      userId: customerUser.id,
      rating: 5,
      title: 'Absolutely incredible performance!',
      body: 'Bought the Aero-X Carbon and it is incredibly fast. Ridden it on Ranchi Ring Road several times now and it is super light. The carbon frame dampens the vibrations really well. Definitely worth the price!',
      verified: true,
      isApproved: true
    },
    {
      productId: product1.id,
      guestName: 'Sumit Ranchi',
      rating: 5,
      title: 'Stunning Trail Performance!',
      body: 'Absolutely brilliant suspension. Here is my unboxing and first ride video. Frame build is rock solid!',
      images: [
        'https://www.w3schools.com/html/mov_bbb.mp4',
        'https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?q=80&w=600&auto=format&fit=crop'
      ],
      verified: true,
      isApproved: true
    },
    {
      productId: product1.id,
      guestName: 'Anand Kumar',
      rating: 4,
      title: 'Super light, but assembly took some time',
      body: 'The bike is very light and feels like an premium build. I chose self-assembly which took me about 45 mins. If you are a beginner, please book the assembly service. Highly recommend the cycle!',
      verified: false,
      isApproved: true
    },
    // Product 2
    {
      productId: product2.id,
      userId: customerUser.id,
      rating: 5,
      title: 'Amazing grip on Ranchi off-roads',
      body: 'Took the Ranchi Rider MTB to Hundru trail. The tyres grip incredibly well. The mechanical brakes have great stopping power. Excellent budget mountain bike!',
      verified: true,
      isApproved: true
    },
    {
      productId: product2.id,
      guestName: 'Rita Kumari',
      rating: 5,
      title: 'Solid build quality',
      body: 'A very sturdy bike. I commuter every day around Lalpur, it handles potholes easily. 5-stars to VEGA Sports!',
      verified: false,
      isApproved: true
    },
    // Product 3
    {
      productId: product3.id,
      guestName: 'Amit Shah',
      rating: 4,
      title: 'Minimal design, fast city commute',
      body: 'I like the minimal design. Single speed Freewheel is perfect for everyday use, and there are no gear derailleur issues to worry about. Simple and neat.',
      verified: false,
      isApproved: true
    },
    {
      productId: product3.id,
      userId: customerUser.id,
      rating: 5,
      title: 'Ranchi college commuter choice!',
      body: 'Best cycle for students. It looks very cool, is lightweight, and very quick. Highly recommended!',
      verified: true,
      isApproved: true
    },
    // Product 4
    {
      productId: product4.id,
      userId: customerUser.id,
      rating: 5,
      title: 'Saves so much space!',
      body: 'I love these adjustable dumbbells. The dial works very smoothly and they take up no space. Sturdy and well-padded so they don\'t rattle. Worth every rupee.',
      verified: true,
      isApproved: true
    },
    {
      productId: product4.id,
      guestName: 'Vikram Singh',
      rating: 4,
      title: 'Premium home gym gear',
      body: 'Very good dumbbells. Adjusting the dial is simple. The tray is sturdy. Only wish they went up to 30kg, but 24kg is good enough for most exercises.',
      verified: false,
      isApproved: true
    },
    // Product 5
    {
      productId: product5.id,
      userId: customerUser.id,
      rating: 5,
      title: 'Excellent smash power',
      body: 'This head-heavy badminton racket is excellent for smashes. High modulus graphite feels very stable. Very responsive net play too.',
      verified: true,
      isApproved: true
    },
    {
      productId: product5.id,
      guestName: 'Sneha Roy',
      rating: 5,
      title: 'Extremely lightweight!',
      body: 'Feels incredibly light at 82g. My wrist speed has improved. Good tension support.',
      verified: false,
      isApproved: true
    }
  ]

  for (const review of reviewsData) {
    await prisma.review.create({ data: review })
  }
  console.log('Created Reviews')

  console.log('Database Seeding Complete! Enjoy VEGA Sports!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
