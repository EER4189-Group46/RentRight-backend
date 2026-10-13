import { getPool } from './db.js';
import { passwordUtil } from '../utils/password.util.js';

export async function seedDatabaseIfEmpty() {
  const pool = getPool();

  // Check if categories table has rows
  const [catRows] = await pool.execute('SELECT COUNT(*) AS count FROM categories');
  const catCount = catRows[0].count;

  // Check if items table has rows
  const [itemRows] = await pool.execute('SELECT COUNT(*) AS count FROM items');
  const itemCount = itemRows[0].count;

  if (catCount > 0 && itemCount > 0) {
    return; // Already seeded
  }

  console.log('[Seed] Seeding initial categories and dummy rental items...');

  // 1. Seed Categories if empty
  if (catCount === 0) {
    const categories = [
      {
        name: 'Power Tools & Construction',
        slug: 'tools-construction',
        icon: 'Wrench',
        description: 'Heavy duty drills, concrete mixers, generators, high-pressure washers, and saws.',
      },
      {
        name: 'Photography & Video',
        slug: 'cameras-photography',
        icon: 'Camera',
        description: 'Mirrorless cameras, prime & zoom lenses, gimbals, drones, and studio lighting.',
      },
      {
        name: 'Camping & Outdoor',
        slug: 'camping-outdoor',
        icon: 'Tent',
        description: 'Weatherproof tents, backpacks, sleeping bags, camp stoves, and trekking poles.',
      },
      {
        name: 'Audio & Event Equipment',
        slug: 'audio-events',
        icon: 'Speaker',
        description: 'PA systems, party speakers, projectors, microphones, DJ equipment, and smoke machines.',
      },
      {
        name: 'Vehicles & Transport',
        slug: 'vehicles-transport',
        icon: 'Truck',
        description: 'Touring motorcycles, mountain bikes, rooftop carriers, and transport trailers.',
      },
      {
        name: 'Party & Celebrations',
        slug: 'party-celebrations',
        icon: 'Sparkles',
        description: 'Popcorn machines, chocolate fountains, decorative backdrops, and catering gear.',
      },
    ];

    for (const cat of categories) {
      await pool.execute(
        `INSERT IGNORE INTO categories (name, slug, icon, description)
         VALUES (?, ?, ?, ?)`,
        [cat.name, cat.slug, cat.icon, cat.description]
      );
    }
    console.log(`[Seed] Seeded ${categories.length} categories.`);
  }

  // 2. Ensure Provider Users exist
  const hashedPassword = await passwordUtil.hash('password123');

  const providers = [
    {
      name: 'Colombo Heavy Rentals',
      email: 'provider_colombo@rentright.lk',
      phone: '077 112 2334',
      role: 'provider',
      provider_type: 'business',
      business_name: 'Colombo Tool & Equipment Rentals Pvt Ltd',
    },
    {
      name: 'Lanka Adventure Gear',
      email: 'gear_lanka@rentright.lk',
      phone: '071 556 6778',
      role: 'provider',
      provider_type: 'business',
      business_name: 'Lanka Campers & Trekkers',
    },
    {
      name: 'Apex Cine & Sound',
      email: 'apex_cine@rentright.lk',
      phone: '076 889 9001',
      role: 'provider',
      provider_type: 'business',
      business_name: 'Apex Audiovisual & Media Hub',
    },
    {
      name: 'Kasun Perera',
      email: 'kasun_rentals@rentright.lk',
      phone: '077 998 8776',
      role: 'provider',
      provider_type: 'individual',
      business_name: null,
    },
  ];

  for (const prov of providers) {
    await pool.execute(
      `INSERT IGNORE INTO users (name, email, password_hash, phone, role, provider_type, business_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        prov.name,
        prov.email,
        hashedPassword,
        prov.phone,
        prov.role,
        prov.provider_type,
        prov.business_name,
      ]
    );
  }

  // Map category and user IDs
  const [allCats] = await pool.execute('SELECT id, slug FROM categories');
  const catMap = {};
  allCats.forEach((c) => {
    catMap[c.slug] = c.id;
  });

  const [allUsers] = await pool.execute('SELECT id, email FROM users');
  const userMap = {};
  allUsers.forEach((u) => {
    userMap[u.email] = u.id;
  });

  const colomboProvId = userMap['provider_colombo@rentright.lk'];
  const lankaProvId = userMap['gear_lanka@rentright.lk'];
  const apexProvId = userMap['apex_cine@rentright.lk'];
  const kasunProvId = userMap['kasun_rentals@rentright.lk'];

  // 3. Seed Items
  const dummyItems = [
    {
      provider_id: colomboProvId,
      category_id: catMap['tools-construction'],
      name: 'Bosch Professional Rotary Hammer Drill 800W',
      description: 'Heavy duty concrete and masonry rotary hammer drill with SDS-plus chuck. Includes set of 5 drill bits, carrying case, and depth gauge. Ideal for DIY renovations and construction.',
      price_per_day: 1800.00,
      price_per_hour: 350.00,
      deposit_amount: 5000.00,
      location: 'Colombo 03',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: colomboProvId,
      category_id: catMap['tools-construction'],
      name: 'Honda 3kVA Silent Inverter Generator EU30is',
      description: 'Ultra-quiet 3000 Watt portable inverter petrol generator. Clean pure sine wave output safe for sensitive electronics, laptops, sound equipment, or emergency home backup.',
      price_per_day: 4800.00,
      price_per_hour: 800.00,
      deposit_amount: 15000.00,
      location: 'Colombo 05',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: colomboProvId,
      category_id: catMap['tools-construction'],
      name: 'Kärcher High Pressure Washer K5 Compact (145 Bar)',
      description: 'Powerful 145 bar water pressure cleaner with 8m high-pressure hose and dirt blaster lance. Perfect for patio washing, vehicle detailing, roof cleaning, and walls.',
      price_per_day: 2200.00,
      price_per_hour: 400.00,
      deposit_amount: 6000.00,
      location: 'Negombo',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: colomboProvId,
      category_id: catMap['tools-construction'],
      name: 'Stihl Heavy Duty Petrol Chainsaw 18" Bar',
      description: 'Commercial 50cc petrol powered chainsaw with anti-vibration technology and quick chain tensioning. Ideal for garden maintenance, tree trimming, and firewood preparation.',
      price_per_day: 3200.00,
      price_per_hour: 600.00,
      deposit_amount: 8000.00,
      location: 'Kandy',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1579294800821-694d95e86143?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: apexProvId,
      category_id: catMap['cameras-photography'],
      name: 'Sony Alpha A7 IV Full-Frame Mirrorless Camera Kit',
      description: '33MP full-frame hybrid mirrorless camera with 4K 60p 10-bit recording. Kit comes with Sony FE 24-70mm f/2.8 GM lens, 2x 128GB high-speed SD cards, 3 batteries, and dual charger.',
      price_per_day: 8500.00,
      price_per_hour: 1500.00,
      deposit_amount: 25000.00,
      location: 'Colombo 07',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: apexProvId,
      category_id: catMap['cameras-photography'],
      name: 'Canon EOS R5 8K Mirrorless Camera + 50mm f/1.2L',
      description: 'Flagship 45MP full-frame camera with revolutionary 8K RAW video, in-body image stabilization (IBIS), and Dual Pixel CMOS AF II. Outstanding for high-end wedding and commercial shoots.',
      price_per_day: 12500.00,
      price_per_hour: 2200.00,
      deposit_amount: 35000.00,
      location: 'Nugegoda, Colombo',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: apexProvId,
      category_id: catMap['cameras-photography'],
      name: 'DJI RS 3 Pro 3-Axis Camera Gimbal Stabilizer',
      description: 'Automated axis locks, extended carbon fiber axis arms, and 4.5kg payload capacity. Includes briefcase handle, focus motor, and phone holder for cinematic stabilization.',
      price_per_day: 3500.00,
      price_per_hour: 600.00,
      deposit_amount: 10000.00,
      location: 'Colombo 03',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: apexProvId,
      category_id: catMap['cameras-photography'],
      name: 'Godox SL-150W II Studio Video Light Kit (Pair + Softboxes)',
      description: 'Continuous daylight LED light pair (5600K) with 8 built-in FX effects, Bowens mounts, 90cm parabolic softboxes, honeycombs, and heavy-duty light stands.',
      price_per_day: 4200.00,
      price_per_hour: 750.00,
      deposit_amount: 10000.00,
      location: 'Dehiwala',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: lankaProvId,
      category_id: catMap['camping-outdoor'],
      name: 'Coleman 4-Person Weatherproof Camping Tent',
      description: 'WeatherTec system with patented welded floors and inverted seams to keep rain out. Easy 10-minute setup, storage pockets, and electrical access port.',
      price_per_day: 1500.00,
      price_per_hour: null,
      deposit_amount: 4000.00,
      location: 'Kandy',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: lankaProvId,
      category_id: catMap['camping-outdoor'],
      name: 'Portable Camping Gas Stove & Cookware Mess Kit',
      description: 'Compact 2-burner butane camping stove with windshield and non-stick pot/pan cooking kit for up to 4 campers. Lightweight and windproof.',
      price_per_day: 950.00,
      price_per_hour: null,
      deposit_amount: 2500.00,
      location: 'Ella',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: lankaProvId,
      category_id: catMap['camping-outdoor'],
      name: 'Osprey 65L Hiking & Trekking Backpack + Rain Cover',
      description: 'Ergonomic internal frame trekking rucksack with anti-gravity suspension system, adjustable harness, and integrated waterproof rain cover. Great for knuckles & Adam\'s Peak climbs.',
      price_per_day: 1200.00,
      price_per_hour: null,
      deposit_amount: 3500.00,
      location: 'Nuwara Eliya',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: apexProvId,
      category_id: catMap['audio-events'],
      name: 'JBL PartyBox 310 Portable Bluetooth Speaker + 2 Wireless Mics',
      description: '240 Watts of powerful JBL Pro Sound with dynamic light show synched to the beat. 18-hour battery life, splashproof IPX4, and telescopic handle with wheels.',
      price_per_day: 4800.00,
      price_per_hour: 800.00,
      deposit_amount: 15000.00,
      location: 'Galle',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: apexProvId,
      category_id: catMap['audio-events'],
      name: '4K Ultra HD Portable Home & Event Projector (3500 Lumens) + 100" Screen',
      description: 'Bright 3500 ANSI lumen smart projector with HDMI, Bluetooth, screen mirroring, and portable folding 100-inch projection screen with tripod stand.',
      price_per_day: 5200.00,
      price_per_hour: 900.00,
      deposit_amount: 12000.00,
      location: 'Colombo 04',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: apexProvId,
      category_id: catMap['audio-events'],
      name: 'Yamaha StagePas 600BT Portable PA Sound System',
      description: '680W portable PA system featuring 10-channel powered mixer, two 10" passive speakers, Bluetooth audio streaming, SPX digital reverbs, and feedback suppressor.',
      price_per_day: 7800.00,
      price_per_hour: 1400.00,
      deposit_amount: 20000.00,
      location: 'Colombo 05',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1520523839898-507125cd53c1?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: kasunProvId,
      category_id: catMap['vehicles-transport'],
      name: 'Royal Enfield Hunter 350 Touring Motorcycle',
      description: '350cc modern-classic roadster equipped with crash guards, saddle stays, and phone charger. Clean condition, fully insured for self-riding rentals along southern coast.',
      price_per_day: 4200.00,
      price_per_hour: 750.00,
      deposit_amount: 15000.00,
      location: 'Galle Fort',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: lankaProvId,
      category_id: catMap['vehicles-transport'],
      name: 'Trek Marlin 7 All-Terrain Mountain Bike (Large)',
      description: 'Lightweight Alpha Silver aluminum frame, RockShox suspension fork with lockout, Shimano Deore 1x10 drivetrain, and hydraulic disc brakes. Includes helmet and lock.',
      price_per_day: 1800.00,
      price_per_hour: 350.00,
      deposit_amount: 5000.00,
      location: 'Kandy',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: colomboProvId,
      category_id: catMap['party-celebrations'],
      name: 'Commercial Popcorn Maker Machine with Cart',
      description: 'Antique style 8oz kettle commercial movie theater popcorn maker machine with warming deck, tempered glass doors, and retro wheels. A massive hit for birthdays and celebrations.',
      price_per_day: 3500.00,
      price_per_hour: null,
      deposit_amount: 8000.00,
      location: 'Maharagama, Colombo',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      provider_id: colomboProvId,
      category_id: catMap['party-celebrations'],
      name: '4-Tier Luxury Heated Chocolate Fountain (Stainless Steel)',
      description: 'Heavy duty 4-tier commercial chocolate fondue fountain. Melts and cascades up to 2.5kg of chocolate smoothly. Great for weddings, engagements, and corporate events.',
      price_per_day: 3800.00,
      price_per_hour: null,
      deposit_amount: 8000.00,
      location: 'Colombo 04',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
      ],
    },
  ];

  for (const it of dummyItems) {
    await pool.execute(
      `INSERT INTO items (provider_id, category_id, name, description, price_per_day, price_per_hour, deposit_amount, location, status, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        it.provider_id,
        it.category_id,
        it.name,
        it.description,
        it.price_per_day,
        it.price_per_hour,
        it.deposit_amount,
        it.location,
        it.status,
        JSON.stringify(it.images),
      ]
    );
  }

  console.log(`[Seed] Seeded ${dummyItems.length} dummy rental items with full filterable data.`);
}
