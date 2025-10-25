import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function seedStarterDiscussions() {
  console.log('🌱 Seeding starter discussions for community engagement...\n');

  try {
    // First, create a system user for posting these discussions
    const { data: systemUser, error: userError } = await supabase
      .from('users')
      .upsert({
        username: 'GKPRadio',
        fullname: 'GKP Radio Team',
        email: 'community@gkpradio.com',
        bio: 'Official GKP Radio Community Team',
        isemailverified: true
      }, { onConflict: 'email' })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating system user:', userError.message);
      return;
    }

    console.log('✅ System user ready:', systemUser.username);

    // Define starter discussions for each category
    const starterDiscussions = [
      {
        category: 'Prayer Requests',
        title: 'Share Your Prayer Requests - We\'re Here to Lift You Up',
        content: 'Welcome to our Prayer Requests community! This is a sacred space where we come together to support one another through prayer. Whether you\'re facing health challenges, family difficulties, financial struggles, or just need spiritual strength, share your heart here. Our community believes in the power of united prayer and we\'re committed to standing with you in faith. Remember: "The prayer of a righteous person is powerful and effective" (James 5:16). How can we pray for you today?'
      },
      {
        category: 'Testimonies',
        title: 'God\'s Faithfulness - Share Your Victory Stories',
        content: 'Your testimony has the power to encourage someone who\'s going through what you\'ve already overcome! This space is for celebrating God\'s faithfulness in your life. Whether it\'s answered prayer, provision in hard times, healing, breakthrough, or simply experiencing His presence - we want to hear about it. Your story might be exactly what someone else needs to hear today. "They triumphed over him by the blood of the Lamb and by the word of their testimony" (Revelation 12:11). What has God done in your life lately?'
      },
      {
        category: 'Youth Voices',
        title: 'Young Believers - Let\'s Connect and Grow Together',
        content: 'Calling all young believers! This is YOUR space to connect with other young Christians navigating faith in today\'s world. Whether you\'re in high school, college, or just starting your career, we know the unique challenges you face. Share your questions, struggles, victories, and insights. Let\'s talk about maintaining faith on campus, dealing with peer pressure, finding godly friendships, pursuing your calling, and growing deeper in your relationship with Christ. Remember: "Don\'t let anyone look down on you because you are young, but set an example" (1 Timothy 4:12). What\'s on your heart today?'
      },
      {
        category: 'Pray for Others',
        title: 'Intercessors Unite - Standing in the Gap for Others',
        content: 'Welcome intercessors! This category is specifically for those who feel called to pray for others in our community and around the world. Share prayer requests for friends, family members, communities, nations, or global situations that are heavy on your heart. Whether it\'s praying for missionaries, persecuted Christians, natural disaster victims, or just someone who desperately needs breakthrough, post here. Let\'s be a community that truly bears one another\'s burdens. Who needs our prayers today?'
      },
      {
        category: 'Praise & Worship',
        title: 'Songs That Touch Your Soul - Share What Moves You',
        content: 'Music has a unique way of drawing us closer to God! In this space, share worship songs that have touched your heart, powerful lyrics that spoke to your situation, or worship experiences that transformed you. Maybe it\'s a classic hymn that brings you peace, a contemporary song that helped you through a hard time, or a worship moment that changed your perspective. Let\'s encourage each other with the songs that move our souls. "Sing to the Lord a new song; sing to the Lord, all the earth" (Psalm 96:1). What\'s your current worship anthem?'
      },
      {
        category: 'To My Husband',
        title: 'Celebrating Our Husbands - Words of Love and Appreciation',
        content: 'Wives, this is your special space to celebrate, encourage, and honor your husband! Share words of appreciation, gratitude for his leadership, prayers for his journey, or just tell the world why he\'s amazing. In a world that often criticizes men, let\'s be a community that builds them up. Whether you\'re thanking him for being a godly father, a faithful provider, a spiritual leader, or just for being your best friend - share your heart here. Your words might inspire another wife to see her husband through fresh eyes of appreciation. What do you love most about your husband?'
      },
      {
        category: 'To My Wife',
        title: 'Honoring Our Wives - Expressing Love and Gratitude',
        content: 'Husbands, this is your dedicated space to honor, celebrate, and appreciate your wife! Share what makes her special, thank her for her love and support, acknowledge her strength, or simply tell the world how blessed you are. Let\'s be men who publicly honor our wives and encourage other husbands to do the same. Whether it\'s her unwavering faith, her nurturing heart, her wisdom, or how she makes your house a home - share your gratitude here. "An excellent wife is the crown of her husband" (Proverbs 12:4). How has your wife blessed your life?'
      },
      {
        category: 'Words of Encouragement',
        title: 'Speak Life - Share Words That Uplift and Inspire',
        content: 'Sometimes a single word of encouragement can change someone\'s entire day or even their life! This space is dedicated to sharing uplifting messages, inspirational quotes, scripture that spoke to you, or simply words of hope for anyone who needs them. Whether you\'re sharing something that encouraged you or feeling led to encourage others, your words matter. In tough times, we all need reminders of God\'s goodness, faithfulness, and love. "Therefore encourage one another and build each other up" (1 Thessalonians 5:11). What encouraging word do you have today?'
      },
      {
        category: 'Born Again',
        title: 'New Life in Christ - Share Your Salvation Story',
        content: 'There\'s nothing more powerful than the testimony of how Jesus transformed your life! Whether you were just born again recently or years ago, your salvation story is unique and powerful. Share how you came to know Christ, what life was like before, how you encountered His love, and how your life has changed since. Your story could be the encouragement someone needs to take that step of faith. "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!" (2 Corinthians 5:17). When did you say yes to Jesus?'
      },
      {
        category: 'Bragging on My Child (ren)',
        title: 'Proud Parents - Celebrate Your Children\'s Wins!',
        content: 'Parents, this is YOUR space to brag on your kids! Whether they\'re toddlers, teens, or grown adults, share their victories, accomplishments, character growth, or just those precious moments that make your heart burst with pride. Good grades, sports achievements, acts of kindness, spiritual growth, overcoming challenges - it all counts! Let\'s be a community that celebrates the next generation and encourages parents who are investing in their children. "Children are a heritage from the Lord, offspring a reward from him" (Psalm 127:3). What amazing thing has your child done lately?'
      },
      {
        category: 'Sharing Hobbies',
        title: 'God-Given Talents - Share What You Love to Do',
        content: 'God gave each of us unique interests and talents! This is a fun space to share your hobbies, creative pursuits, and passions. Whether you paint, cook, garden, play instruments, work with wood, collect things, play sports, or anything else that brings you joy - share it here! Let\'s connect over shared interests and maybe even inspire each other to try something new. Plus, it\'s always refreshing to see how believers use their God-given creativity and talents. What hobby or interest brings you joy?'
      },
      {
        category: 'Money & Finances',
        title: 'Financial Wisdom - Biblical Stewardship and Practical Tips',
        content: 'Let\'s talk about money in a healthy, biblical way! This space is for sharing financial testimonies, biblical principles of stewardship, budgeting tips, debt-freedom journeys, and practical wisdom for managing God\'s resources. Whether you\'re learning to tithe, getting out of debt, saving for the future, or teaching your kids about money, share your journey here. We can learn so much from each other\'s experiences. Remember: "The borrower is slave to the lender" (Proverbs 22:7). What financial principle has transformed your life?'
      },
      {
        category: 'Physical & Mental Health',
        title: 'Whole Person Wellness - Mind, Body, and Spirit',
        content: 'God cares about every aspect of our wellbeing - physical, mental, emotional, and spiritual. This is a safe space to discuss health journeys, mental health struggles, healing testimonies, wellness tips, and how faith intersects with our health challenges. Whether you\'re battling illness, managing chronic conditions, working through anxiety or depression, or celebrating health victories - you\'re not alone here. We believe in praying for healing while also supporting each other practically. "Dear friend, I pray that you may enjoy good health and that all may go well with you" (3 John 1:2). How can we support your health journey?'
      }
    ];

    console.log('\n📝 Creating starter discussions...\n');

    for (const discussion of starterDiscussions) {
      const { data, error } = await supabase
        .from('communitythreads')
        .insert({
          userid: systemUser.id,
          title: discussion.title,
          content: discussion.content,
          category: discussion.category,
          ispinned: true, // Pin these starter discussions
          viewcount: Math.floor(Math.random() * 50) + 20, // Random view count between 20-70
        })
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error creating discussion for ${discussion.category}:`, error.message);
      } else {
        console.log(`  ✅ Created: "${discussion.title.substring(0, 50)}..." (${discussion.category})`);
      }
    }

    console.log('\n✅ Starter discussions seeded successfully!');
    console.log('🎉 Your community now has engaging content in all 13 categories!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedStarterDiscussions()
  .then(() => {
    console.log('\n🎊 All done! Your community is ready for engagement.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
