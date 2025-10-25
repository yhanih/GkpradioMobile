import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function addSampleData() {
  console.log('📝 Adding sample data to existing tables...\n');

  // Add sample sponsors (if table exists)
  try {
    const { data: existingSponsors } = await supabase.from('sponsors').select('id').limit(1);
    
    if (!existingSponsors || existingSponsors.length === 0) {
      console.log('Adding sample sponsors...');
      const { error } = await supabase.from('sponsors').insert([
        {
          name: 'Blessed Bakery',
          description: 'Faith-based bakery supporting our ministry with fresh bread daily',
          tier: 'gold',
          isactive: true,
          websiteurl: 'https://example.com/blessed-bakery'
        },
        {
          name: 'Kingdom Books',
          description: 'Christian bookstore and resources for spiritual growth',
          tier: 'silver',
          isactive: true,
          websiteurl: 'https://example.com/kingdom-books'
        },
        {
          name: 'Faith Finance',
          description: 'Biblical financial planning and stewardship services',
          tier: 'bronze',
          isactive: true,
          websiteurl: 'https://example.com/faith-finance'
        }
      ]);
      
      if (error) {
        console.error('  ❌ Error adding sponsors:', error.message);
      } else {
        console.log('  ✅ Sample sponsors added');
      }
    } else {
      console.log('  ℹ️  Sponsors already exist, skipping');
    }
  } catch (error) {
    console.log('  ⚠️  Sponsors table not ready:', error.message);
  }

  // Add sample episodes (if table exists)
  try {
    const { data: existingEpisodes } = await supabase.from('episodes').select('id').limit(1);
    
    if (!existingEpisodes || existingEpisodes.length === 0) {
      console.log('Adding sample episodes...');
      const { error } = await supabase.from('episodes').insert([
        {
          title: 'Walking in Faith - Morning Devotion',
          description: 'Start your day with powerful scripture and prayer. Today we explore Hebrews 11 and what it means to walk by faith.',
          audiourl: 'https://example.com/audio/episode1.mp3',
          duration: 1800,
          category: 'Teaching',
          tags: ['faith', 'devotion', 'prayer'],
          ispublished: true,
          playcount: 150
        },
        {
          title: 'Financial Wisdom from Proverbs',
          description: 'Learn biblical principles for managing money and building wealth according to God\'s word.',
          audiourl: 'https://example.com/audio/episode2.mp3',
          duration: 2400,
          category: 'Finance',
          tags: ['finance', 'wisdom', 'proverbs'],
          ispublished: true,
          playcount: 89
        },
        {
          title: 'Worship Hour - Live Recording',
          description: 'Join us for an hour of powerful worship music recorded live from our Sunday service.',
          audiourl: 'https://example.com/audio/episode3.mp3',
          duration: 3600,
          category: 'Worship',
          tags: ['worship', 'music', 'live'],
          ispublished: true,
          playcount: 245
        },
        {
          title: 'Prayer Warriors Unite',
          description: 'A special prayer session focusing on healing, restoration, and breakthrough in your life.',
          audiourl: 'https://example.com/audio/episode4.mp3',
          duration: 2100,
          category: 'Prayer',
          tags: ['prayer', 'healing', 'breakthrough'],
          ispublished: true,
          playcount: 178
        },
        {
          title: 'Family Values in Modern Times',
          description: 'Discussing how to maintain strong Christian family values in today\'s challenging world.',
          audiourl: 'https://example.com/audio/episode5.mp3',
          duration: 2700,
          category: 'Family',
          tags: ['family', 'values', 'parenting'],
          ispublished: true,
          playcount: 122
        },
        {
          title: 'Testimonies of Grace',
          description: 'Hear powerful testimonies from our community members about God\'s grace in their lives.',
          audiourl: 'https://example.com/audio/episode6.mp3',
          duration: 1950,
          category: 'Testimony',
          tags: ['testimony', 'grace', 'miracles'],
          ispublished: true,
          playcount: 203
        }
      ]);
      
      if (error) {
        console.error('  ❌ Error adding episodes:', error.message);
      } else {
        console.log('  ✅ Sample episodes added');
      }
    } else {
      console.log('  ℹ️  Episodes already exist, skipping');
    }
  } catch (error) {
    console.log('  ⚠️  Episodes table not ready:', error.message);
  }

  // Add sample videos (if table exists)
  try {
    const { data: existingVideos } = await supabase.from('videos').select('id').limit(1);
    
    if (!existingVideos || existingVideos.length === 0) {
      console.log('Adding sample videos...');
      const { error } = await supabase.from('videos').insert([
        {
          title: 'Sunday Service - Full Recording',
          description: 'Watch the complete Sunday service including worship, sermon, and altar call.',
          videourl: 'https://example.com/videos/sunday-service.mp4',
          thumbnailurl: 'https://example.com/thumbnails/sunday.jpg',
          duration: 5400,
          category: 'Service',
          tags: ['sunday', 'worship', 'sermon'],
          ispublished: true,
          viewcount: 532
        },
        {
          title: 'Youth Conference Highlights',
          description: 'Best moments from our annual youth conference with powerful messages and worship.',
          videourl: 'https://example.com/videos/youth-conference.mp4',
          thumbnailurl: 'https://example.com/thumbnails/youth.jpg',
          duration: 1800,
          category: 'Youth',
          tags: ['youth', 'conference', 'highlights'],
          ispublished: true,
          viewcount: 287
        },
        {
          title: 'Bible Study: Book of Romans',
          description: 'Deep dive into the book of Romans - Chapter 8, Life in the Spirit.',
          videourl: 'https://example.com/videos/bible-study-romans.mp4',
          thumbnailurl: 'https://example.com/thumbnails/bible-study.jpg',
          duration: 3600,
          category: 'Bible Study',
          tags: ['bible', 'romans', 'study'],
          ispublished: true,
          viewcount: 198
        }
      ]);
      
      if (error) {
        console.error('  ❌ Error adding videos:', error.message);
      } else {
        console.log('  ✅ Sample videos added');
      }
    } else {
      console.log('  ℹ️  Videos already exist, skipping');
    }
  } catch (error) {
    console.log('  ⚠️  Videos table not ready:', error.message);
  }

  console.log('\n✅ Sample data script complete!');
  console.log('\nYour application should now show:');
  console.log('  - 3 sponsors in the carousel');
  console.log('  - 6 podcast episodes');
  console.log('  - 3 videos');
}

// Run the script
addSampleData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });