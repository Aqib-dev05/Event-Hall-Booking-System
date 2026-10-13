const bcrypt = require('bcryptjs')
const env = require('../config/env')
const prisma = require('../config/db')

// Usage:  npm run seed
// WARNING: wipes users, venues, bookings and reviews, then inserts the demo data below.

const VENUES = [
  {
    name: 'Pearl Continental Banquet Hall',
    description: 'The most prestigious event venue in Lahore. Pearl Continental Banquet Hall offers world-class facilities for weddings, corporate events, and grand celebrations. With exquisite décor, state-of-the-art AV equipment, and a dedicated event management team, every event here becomes a memorable experience.',
    location: '99 Egerton Road, Lahore Cantonment',
    city: 'Lahore',
    capacity: 500,
    pricePerHour: 25000,
    category: 'wedding',
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
      'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80',
    ],
    amenities: ['WiFi', 'Parking', 'Catering', 'Sound System', 'AC', 'Projector', 'Stage', 'Lighting', 'Generator', 'Decoration'],
    rating: 4.8,
    totalReviews: 124,
  },
  {
    name: 'Karachi Expo Centre Hall A',
    description: 'Karachi Expo Centre is the premier convention and exhibition facility in Pakistan. Hall A is ideal for large corporate conferences, trade exhibitions, product launches, and concerts. With over 5,000 sq meters of space, it can accommodate the grandest of events.',
    location: 'University Road, Block 9, Clifton',
    city: 'Karachi',
    capacity: 1200,
    pricePerHour: 45000,
    category: 'corporate',
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80',
    ],
    amenities: ['WiFi', 'Parking', 'Sound System', 'AC', 'Projector', 'Stage', 'Lighting', 'Generator'],
    rating: 4.6,
    totalReviews: 87,
  },
  {
    name: 'Islamabad Serena Grand Ballroom',
    description: 'Nestled in the heart of Islamabad, the Serena Grand Ballroom is the perfect venue for luxury weddings, diplomatic receptions, and high-profile corporate dinners. The ballroom features hand-crafted chandeliers, marble flooring, and a capacity for intimate gatherings of up to 300 guests.',
    location: 'Khayaban-e-Suhrawardy, F-7/2',
    city: 'Islamabad',
    capacity: 300,
    pricePerHour: 20000,
    category: 'wedding',
    images: [
      'https://images.unsplash.com/photo-1526887520775-4b14b8aed897?w=800&q=80',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    ],
    amenities: ['WiFi', 'Parking', 'Catering', 'Sound System', 'AC', 'Decoration'],
    rating: 4.9,
    totalReviews: 56,
  },
  {
    name: 'Lahore Fort View Party Hall',
    description: 'A unique party and birthday venue located near the historic Lahore Fort. The hall offers a magical backdrop for celebrations with its rooftop terrace overlooking Badshahi Mosque. Perfect for birthday parties, mehndi nights, and small weddings.',
    location: 'Fort Road, Walled City, Near Hazuri Bagh',
    city: 'Lahore',
    capacity: 150,
    pricePerHour: 8000,
    category: 'party',
    images: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
      'https://images.unsplash.com/photo-1496843916299-590492c751f4?w=800&q=80',
    ],
    amenities: ['Parking', 'Catering', 'Sound System', 'AC', 'Lighting', 'Decoration'],
    rating: 4.3,
    totalReviews: 42,
  },
  {
    name: 'Rawalpindi Stadium Indoor Hall',
    description: 'Rawalpindi Indoor Stadium Hall is ideal for large-scale concerts, cultural events, and sports gatherings. The venue features high-quality acoustic systems, retractable seating, and easy access from major motorways. Perfect for concerts and big corporate events.',
    location: 'Stadium Road, Rawalpindi Cantonment',
    city: 'Rawalpindi',
    capacity: 800,
    pricePerHour: 30000,
    category: 'concert',
    images: [
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
      'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80',
    ],
    amenities: ['Parking', 'Sound System', 'Stage', 'Lighting', 'Generator', 'AC'],
    rating: 4.5,
    totalReviews: 33,
  },
]

async function seed() {
  if (env.isProd && !process.argv.includes('--force')) {
    console.error('Refusing to wipe a production database. Re-run with --force if you really mean it.')
    process.exit(1)
  }

  console.log('🌱 Connecting to PostgreSQL...')
  await prisma.$connect()
  console.log('✅ Connected!')

  // Children first because of foreign keys
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.venue.deleteMany(),
    prisma.user.deleteMany(),
  ])
  console.log('🗑️  Cleared existing users, venues, bookings & reviews')

  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@eventhall.com',
      password: await bcrypt.hash('admin123', 12),
      phone: '+92-300-1234567',
      role: 'admin',
      emailVerified: true,
    },
  })
  console.log('👤 Admin created: admin@eventhall.com / admin123')

  await prisma.user.create({
    data: {
      name: 'Ahmed Khan',
      email: 'customer@test.com',
      password: await bcrypt.hash('test123', 12),
      phone: '+92-321-9876543',
      role: 'customer',
      emailVerified: true,
    },
  })
  console.log('👤 Customer created: customer@test.com / test123')

  await prisma.venue.createMany({ data: VENUES })
  console.log(`🏛️  Created ${VENUES.length} venues:`)
  VENUES.forEach((v) => console.log(`   - ${v.name} (${v.city})`))

  console.log('\n✅ Seed complete! You can now run: npm run dev')
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
