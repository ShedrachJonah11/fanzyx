export type Category =
  | "Music"
  | "Fitness"
  | "Gaming"
  | "Lifestyle"
  | "Beauty"
  | "Fashion"
  | "Comedy"
  | "Education"
  | "Art"
  | "Other";

export const categories: Category[] = [
  "Music",
  "Fitness",
  "Gaming",
  "Lifestyle",
  "Beauty",
  "Fashion",
  "Comedy",
  "Education",
  "Art",
  "Other",
];

export type Creator = {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatarGradient: string;
  coverGradient: string;
  image?: string;
  verified: boolean;
  subscribers: number;
  monthlyPrice: number;
  category: Category;
  featured?: boolean;
  socials?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
};

export const platformAuthor: Creator = {
  id: "fanzyx",
  name: "FanzyX",
  username: "fanzyx",
  bio: "Featured creators, exclusive drops, and community highlights.",
  avatarGradient: "linear-gradient(135deg, #6929FC 0%, #FD23A7 100%)",
  coverGradient: "linear-gradient(135deg, #4340FA 0%, #FD23A7 100%)",
  image: "/fanzyx-brand-assets/icon/fanzyx-icon-512.png",
  verified: true,
  subscribers: 0,
  monthlyPrice: 0,
  category: "Other",
};

const g = (a: string, b: string, c?: string) =>
  c
    ? `linear-gradient(135deg, ${a} 0%, ${b} 50%, ${c} 100%)`
    : `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;

// Deterministic lady portrait from pravatar.cc — same URL scales to any size.
const pravatar = (id: number) => `https://i.pravatar.cc/600?img=${id}`;

export const creators: Creator[] = [
  {
    id: "1",
    name: "Alex Okafor",
    username: "alex",
    bio: "Music producer & lifestyle. New drops every week.",
    avatarGradient: g("#A855F7", "#EC4899"),
    coverGradient: g("#4C1D95", "#831843", "#0F172A"),
    image: pravatar(1),
    verified: true,
    subscribers: 12840,
    monthlyPrice: 5000,
    category: "Music",
    featured: true,
    socials: { instagram: "@alexokafor", twitter: "@alexok" },
  },
  {
    id: "2",
    name: "Zara Bello",
    username: "zarabello",
    bio: "Fitness coach helping you build habits that last.",
    avatarGradient: g("#EC4899", "#F97316"),
    coverGradient: g("#831843", "#7C2D12"),
    image: pravatar(5),
    verified: true,
    subscribers: 9421,
    monthlyPrice: 3500,
    category: "Fitness",
    featured: true,
    socials: { instagram: "@zarabello.fit" },
  },
  {
    id: "3",
    name: "Tunde Ade",
    username: "tundeplays",
    bio: "Competitive FPS. Nightly streams, coaching sessions & VODs.",
    avatarGradient: g("#22D3EE", "#8B5CF6"),
    coverGradient: g("#0E7490", "#4C1D95"),
    image: pravatar(9),
    verified: false,
    subscribers: 5320,
    monthlyPrice: 4000,
    category: "Gaming",
  },
  {
    id: "4",
    name: "Ijeoma Nwosu",
    username: "ijeoma",
    bio: "Skincare, glow rituals & product breakdowns.",
    avatarGradient: g("#F472B6", "#A855F7"),
    coverGradient: g("#9D174D", "#4C1D95"),
    image: pravatar(16),
    verified: true,
    subscribers: 18205,
    monthlyPrice: 6000,
    category: "Beauty",
    featured: true,
  },
  {
    id: "5",
    name: "Kene Obi",
    username: "keneobi",
    bio: "Streetwear stylist. Weekly fits, drops & reviews.",
    avatarGradient: g("#8B5CF6", "#22D3EE"),
    coverGradient: g("#312E81", "#0E7490"),
    image: pravatar(19),
    verified: false,
    subscribers: 4210,
    monthlyPrice: 3000,
    category: "Fashion",
  },
  {
    id: "6",
    name: "Femi Laughs",
    username: "femilaughs",
    bio: "Comedy sketches, live shows and behind-the-scenes.",
    avatarGradient: g("#F59E0B", "#EF4444"),
    coverGradient: g("#78350F", "#7F1D1D"),
    image: pravatar(20),
    verified: true,
    subscribers: 22140,
    monthlyPrice: 4500,
    category: "Comedy",
    featured: true,
  },
  {
    id: "7",
    name: "Prof. Ada",
    username: "profada",
    bio: "Product design courses, weekly critiques & office hours.",
    avatarGradient: g("#22C55E", "#0EA5E9"),
    coverGradient: g("#064E3B", "#0C4A6E"),
    image: pravatar(24),
    verified: true,
    subscribers: 7120,
    monthlyPrice: 5500,
    category: "Education",
  },
  {
    id: "8",
    name: "Nkem Art",
    username: "nkemart",
    bio: "Digital painter. Timelapses, brush packs, tutorials.",
    avatarGradient: g("#A855F7", "#22D3EE"),
    coverGradient: g("#4C1D95", "#0E7490"),
    image: pravatar(25),
    verified: false,
    subscribers: 3980,
    monthlyPrice: 3500,
    category: "Art",
  },
  {
    id: "9",
    name: "Chi Vlogs",
    username: "chivlogs",
    bio: "Everyday life in Lagos. New vlog every Sunday.",
    avatarGradient: g("#EC4899", "#8B5CF6"),
    coverGradient: g("#9D174D", "#4C1D95"),
    image: pravatar(26),
    verified: false,
    subscribers: 6512,
    monthlyPrice: 3000,
    category: "Lifestyle",
  },
  {
    id: "10",
    name: "Bola Beats",
    username: "bolabeats",
    bio: "Afrobeats production. Loops, samples & song breakdowns.",
    avatarGradient: g("#F97316", "#EC4899"),
    coverGradient: g("#7C2D12", "#831843"),
    image: pravatar(32),
    verified: true,
    subscribers: 14200,
    monthlyPrice: 5000,
    category: "Music",
  },
  {
    id: "11",
    name: "Dami Fit",
    username: "damifit",
    bio: "Home workouts, mobility, and gentle nutrition guides.",
    avatarGradient: g("#22C55E", "#A855F7"),
    coverGradient: g("#064E3B", "#4C1D95"),
    image: pravatar(44),
    verified: false,
    subscribers: 2810,
    monthlyPrice: 2500,
    category: "Fitness",
  },
  {
    id: "12",
    name: "Sade Style",
    username: "sadestyle",
    bio: "Modest fashion, thrift finds & lookbook edits.",
    avatarGradient: g("#8B5CF6", "#EC4899"),
    coverGradient: g("#312E81", "#831843"),
    image: pravatar(47),
    verified: true,
    subscribers: 9840,
    monthlyPrice: 4000,
    category: "Fashion",
    featured: true,
  },
];

export function getCreator(username: string): Creator | undefined {
  if (username === platformAuthor.username) return platformAuthor;
  return creators.find((c) => c.username === username);
}

export type Post = {
  id: string;
  creatorUsername: string;
  timestamp: string;
  caption: string;
  mediaGradient: string;
  mediaKind: "image" | "video" | "audio";
  locked: boolean;
  ppvPrice?: number;
  likes: number;
  comments: number;
  views: number;
  earnings: number;
  status: "published" | "draft" | "scheduled";
  scheduledFor?: string;
};

const daysAgo = (d: number) =>
  new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

export const posts: Post[] = [
  {
    id: "p_fanzyx_1",
    creatorUsername: "fanzyx",
    timestamp: daysAgo(0.02),
    caption:
      "WE ARE LIVE AND LOADED. FanzyX is now open — a place to back the creators you love. Explore, subscribe, and be part of the community.",
    mediaGradient: g("#4C1D95", "#EC4899"),
    mediaKind: "video",
    locked: false,
    likes: 2140,
    comments: 186,
    views: 24800,
    earnings: 0,
    status: "published",
  },
  {
    id: "p_zara_1",
    creatorUsername: "zarabello",
    timestamp: daysAgo(0.35),
    caption:
      "Full-body reset in 25 minutes — no equipment. Subscriber-only walkthrough with cues and modifications.",
    mediaGradient: g("#831843", "#7C2D12"),
    mediaKind: "video",
    locked: true,
    likes: 842,
    comments: 92,
    views: 6120,
    earnings: 42000,
    status: "published",
  },
  {
    id: "p_ijeoma_1",
    creatorUsername: "ijeoma",
    timestamp: daysAgo(0.9),
    caption:
      "Testing the new SPF drops nobody's talking about. Full review inside — free for everyone this week ✨",
    mediaGradient: g("#9D174D", "#4C1D95"),
    mediaKind: "image",
    locked: false,
    likes: 1520,
    comments: 148,
    views: 12200,
    earnings: 0,
    status: "published",
  },
  {
    id: "p_bola_1",
    creatorUsername: "bolabeats",
    timestamp: daysAgo(1.4),
    caption:
      "New Afrobeats sample pack — 40 loops, drums, and one-shots. Subscriber-only until Friday.",
    mediaGradient: g("#7C2D12", "#831843"),
    mediaKind: "audio",
    locked: true,
    likes: 611,
    comments: 58,
    views: 4210,
    earnings: 18500,
    status: "published",
  },
  {
    id: "p_femi_1",
    creatorUsername: "femilaughs",
    timestamp: daysAgo(2),
    caption:
      "New skit dropping tonight. If you know, you know. 😂 Behind-the-scenes below.",
    mediaGradient: g("#78350F", "#7F1D1D"),
    mediaKind: "video",
    locked: false,
    likes: 3210,
    comments: 412,
    views: 28100,
    earnings: 0,
    status: "published",
  },
  {
    id: "p_tunde_1",
    creatorUsername: "tundeplays",
    timestamp: daysAgo(2.4),
    caption:
      "Ranked climb tonight — subscriber lobby, coaching between rounds. VOD posted after.",
    mediaGradient: g("#0E7490", "#4C1D95"),
    mediaKind: "video",
    locked: true,
    ppvPrice: 3500,
    likes: 512,
    comments: 74,
    views: 3410,
    earnings: 24500,
    status: "published",
  },
  {
    id: "p_fanzyx_2",
    creatorUsername: "fanzyx",
    timestamp: daysAgo(3),
    caption:
      "New this week: creator referrals. Invite a friend, earn ₦2,500 when they subscribe. Head to your dashboard to grab your link.",
    mediaGradient: g("#4C1D95", "#831843"),
    mediaKind: "image",
    locked: false,
    likes: 1820,
    comments: 210,
    views: 19400,
    earnings: 0,
    status: "published",
  },
  {
    id: "p_kene_1",
    creatorUsername: "keneobi",
    timestamp: daysAgo(4),
    caption:
      "This week's fits — three drops under ₦20k and one splurge worth every naira.",
    mediaGradient: g("#312E81", "#0E7490"),
    mediaKind: "image",
    locked: false,
    likes: 902,
    comments: 66,
    views: 7420,
    earnings: 0,
    status: "published",
  },
  {
    id: "p_zara_2",
    creatorUsername: "zarabello",
    timestamp: daysAgo(5.5),
    caption:
      "Meal prep for the week — high protein, low effort. Grocery list free for everyone.",
    mediaGradient: g("#831843", "#7C2D12"),
    mediaKind: "image",
    locked: false,
    likes: 640,
    comments: 45,
    views: 5100,
    earnings: 0,
    status: "published",
  },
  {
    id: "p_alex_1",
    creatorUsername: "alex",
    timestamp: daysAgo(6.5),
    caption:
      "New single drops Friday. 30-sec teaser inside for subscribers only.",
    mediaGradient: g("#4C1D95", "#EC4899"),
    mediaKind: "video",
    locked: true,
    likes: 512,
    comments: 34,
    views: 9200,
    earnings: 42000,
    status: "published",
  },
  {
    id: "p_alex_scheduled",
    creatorUsername: "alex",
    timestamp: daysAgo(-2),
    caption: "Q&A with fans — pre-recorded, going out Wednesday.",
    mediaGradient: g("#4C1D95", "#831843"),
    mediaKind: "video",
    locked: true,
    likes: 0,
    comments: 0,
    views: 0,
    earnings: 0,
    status: "scheduled",
    scheduledFor: daysAgo(-2),
  },
  {
    id: "p_alex_draft",
    creatorUsername: "alex",
    timestamp: daysAgo(0.5),
    caption: "Draft: album cover concepts — need to pick before Friday",
    mediaGradient: g("#0F172A", "#4C1D95"),
    mediaKind: "image",
    locked: false,
    likes: 0,
    comments: 0,
    views: 0,
    earnings: 0,
    status: "draft",
  },
];

export function getPostsFor(username: string) {
  return posts
    .filter((p) => p.creatorUsername === username)
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

export type Subscriber = {
  id: string;
  name: string;
  username: string;
  avatarGradient: string;
  plan: string;
  planPrice: number;
  joined: string;
  renewalDate: string;
  status: "active" | "cancelled" | "past_due";
  totalSpent: number;
};

export const subscribers: Subscriber[] = [
  {
    id: "s1",
    name: "Amaka O.",
    username: "amaka",
    avatarGradient: g("#A855F7", "#EC4899"),
    plan: "Monthly",
    planPrice: 5000,
    joined: daysAgo(120),
    renewalDate: daysAgo(-10),
    status: "active",
    totalSpent: 20000,
  },
  {
    id: "s2",
    name: "Chidi E.",
    username: "chidi",
    avatarGradient: g("#22D3EE", "#8B5CF6"),
    plan: "Monthly",
    planPrice: 5000,
    joined: daysAgo(45),
    renewalDate: daysAgo(-15),
    status: "active",
    totalSpent: 10000,
  },
  {
    id: "s3",
    name: "Ify N.",
    username: "ify",
    avatarGradient: g("#F472B6", "#A855F7"),
    plan: "Monthly",
    planPrice: 5000,
    joined: daysAgo(200),
    renewalDate: daysAgo(-2),
    status: "active",
    totalSpent: 35000,
  },
  {
    id: "s4",
    name: "Kunle B.",
    username: "kunle",
    avatarGradient: g("#0EA5E9", "#22C55E"),
    plan: "Monthly",
    planPrice: 5000,
    joined: daysAgo(310),
    renewalDate: daysAgo(-25),
    status: "past_due",
    totalSpent: 45000,
  },
  {
    id: "s5",
    name: "Ngozi T.",
    username: "ngozi",
    avatarGradient: g("#EC4899", "#F97316"),
    plan: "Monthly",
    planPrice: 5000,
    joined: daysAgo(18),
    renewalDate: daysAgo(-12),
    status: "active",
    totalSpent: 5000,
  },
  {
    id: "s6",
    name: "Deji A.",
    username: "deji",
    avatarGradient: g("#8B5CF6", "#22D3EE"),
    plan: "Monthly",
    planPrice: 5000,
    joined: daysAgo(90),
    renewalDate: daysAgo(-8),
    status: "cancelled",
    totalSpent: 15000,
  },
  {
    id: "s7",
    name: "Bimpe S.",
    username: "bimpe",
    avatarGradient: g("#F59E0B", "#EF4444"),
    plan: "Monthly",
    planPrice: 5000,
    joined: daysAgo(60),
    renewalDate: daysAgo(-20),
    status: "active",
    totalSpent: 10000,
  },
  {
    id: "s8",
    name: "Uche V.",
    username: "uche",
    avatarGradient: g("#22C55E", "#0EA5E9"),
    plan: "Monthly",
    planPrice: 5000,
    joined: daysAgo(5),
    renewalDate: daysAgo(-25),
    status: "active",
    totalSpent: 5000,
  },
];

export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: "subscription" | "tip" | "ppv" | "fee" | "withdrawal";
  amount: number;
  status: "completed" | "pending";
};

export const transactions: Transaction[] = [
  {
    id: "t1",
    date: daysAgo(0.02),
    description: "Subscription — Amaka O.",
    type: "subscription",
    amount: 5000,
    status: "completed",
  },
  {
    id: "t2",
    date: daysAgo(0.5),
    description: "Tip — Chidi E.",
    type: "tip",
    amount: 10000,
    status: "completed",
  },
  {
    id: "t3",
    date: daysAgo(1),
    description: "PPV unlock — Studio breakdown",
    type: "ppv",
    amount: 3500,
    status: "completed",
  },
  {
    id: "t4",
    date: daysAgo(1),
    description: "Platform fee",
    type: "fee",
    amount: -750,
    status: "completed",
  },
  {
    id: "t5",
    date: daysAgo(2),
    description: "Subscription — Ify N.",
    type: "subscription",
    amount: 5000,
    status: "completed",
  },
  {
    id: "t6",
    date: daysAgo(3),
    description: "PPV unlock — Sample pack",
    type: "ppv",
    amount: 3500,
    status: "completed",
  },
  {
    id: "t7",
    date: daysAgo(4),
    description: "Tip — Bimpe S.",
    type: "tip",
    amount: 5000,
    status: "completed",
  },
  {
    id: "t8",
    date: daysAgo(6),
    description: "Withdrawal to bank",
    type: "withdrawal",
    amount: -150000,
    status: "completed",
  },
  {
    id: "t9",
    date: daysAgo(7),
    description: "Subscription — Ngozi T.",
    type: "subscription",
    amount: 5000,
    status: "completed",
  },
  {
    id: "t10",
    date: daysAgo(9),
    description: "Subscription — Uche V.",
    type: "subscription",
    amount: 5000,
    status: "pending",
  },
];

export type ActivityItem = {
  id: string;
  kind: "subscribe" | "tip" | "comment" | "renewal";
  actor: string;
  actorGradient: string;
  detail: string;
  time: string;
};

export const activity: ActivityItem[] = [
  {
    id: "a1",
    kind: "subscribe",
    actor: "Ngozi T.",
    actorGradient: g("#EC4899", "#F97316"),
    detail: "subscribed to your channel",
    time: daysAgo(0.05),
  },
  {
    id: "a2",
    kind: "tip",
    actor: "Chidi E.",
    actorGradient: g("#22D3EE", "#8B5CF6"),
    detail: "tipped ₦10,000 on your new post",
    time: daysAgo(0.2),
  },
  {
    id: "a3",
    kind: "comment",
    actor: "Amaka O.",
    actorGradient: g("#A855F7", "#EC4899"),
    detail: "commented: 'This mix is fire 🔥'",
    time: daysAgo(0.5),
  },
  {
    id: "a4",
    kind: "renewal",
    actor: "Ify N.",
    actorGradient: g("#F472B6", "#A855F7"),
    detail: "renewed their monthly subscription",
    time: daysAgo(1),
  },
  {
    id: "a5",
    kind: "subscribe",
    actor: "Bimpe S.",
    actorGradient: g("#F59E0B", "#EF4444"),
    detail: "subscribed to your channel",
    time: daysAgo(1.4),
  },
];

export type Conversation = {
  id: string;
  name: string;
  username: string;
  avatarGradient: string;
  image?: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  pinned?: boolean;
  verified?: boolean;
  typing?: boolean;
};

export const conversations: Conversation[] = [
  {
    id: "c1",
    name: "Amaka O.",
    username: "amaka",
    avatarGradient: g("#6929FC", "#FD23A7"),
    image: "https://i.pravatar.cc/200?img=1",
    lastMessage: "Loved the new drop! When's the album out?",
    time: daysAgo(0.02),
    unread: 2,
    online: true,
    pinned: true,
    verified: true,
    typing: true,
  },
  {
    id: "c2",
    name: "Chidi E.",
    username: "chidi",
    avatarGradient: g("#22D3EE", "#6929FC"),
    image: "https://i.pravatar.cc/200?img=5",
    lastMessage: "Just tipped for the sample pack 🎹",
    time: daysAgo(0.2),
    unread: 0,
    online: true,
    pinned: true,
  },
  {
    id: "c3",
    name: "Ify N.",
    username: "ify",
    avatarGradient: g("#F472B6", "#6929FC"),
    image: "https://i.pravatar.cc/200?img=16",
    lastMessage: "You: Can you go live this weekend?",
    time: daysAgo(0.8),
    unread: 0,
    online: false,
    verified: true,
  },
  {
    id: "c4",
    name: "Kunle B.",
    username: "kunle",
    avatarGradient: g("#0EA5E9", "#22C55E"),
    image: "https://i.pravatar.cc/200?img=9",
    lastMessage: "Where can I find your old mixes?",
    time: daysAgo(2),
    unread: 0,
    online: false,
  },
  {
    id: "c5",
    name: "Ngozi T.",
    username: "ngozi",
    avatarGradient: g("#FD23A7", "#F97316"),
    image: "https://i.pravatar.cc/200?img=20",
    lastMessage: "Just subscribed! What should I check first?",
    time: daysAgo(3),
    unread: 1,
    online: false,
    verified: true,
  },
  {
    id: "c6",
    name: "Deji A.",
    username: "deji",
    avatarGradient: g("#6929FC", "#22D3EE"),
    image: "https://i.pravatar.cc/200?img=25",
    lastMessage: "🎵 Voice message · 0:24",
    time: daysAgo(5),
    unread: 0,
    online: false,
  },
  {
    id: "c7",
    name: "Bimpe S.",
    username: "bimpe",
    avatarGradient: g("#F59E0B", "#EF4444"),
    image: "https://i.pravatar.cc/200?img=26",
    lastMessage: "📷 Photo",
    time: daysAgo(9),
    unread: 0,
    online: false,
  },
];

export type Message = {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
};

export const messagesFor: Record<string, Message[]> = {
  c1: [
    { id: "m1", fromMe: false, text: "Hey! Been on repeat with the last track 🎶", time: daysAgo(0.35) },
    { id: "m2", fromMe: false, text: "That mix from the studio session was 🔥🔥🔥", time: daysAgo(0.34) },
    { id: "m3", fromMe: true, text: "🙏 means a lot. Album is in mixing right now.", time: daysAgo(0.24), status: "read" },
    { id: "m4", fromMe: true, text: "Should be out in about 3 weeks. Sending you an early listen when it's ready.", time: daysAgo(0.24), status: "read" },
    { id: "m5", fromMe: false, text: "STOP IT 😭 I need that in my life", time: daysAgo(0.1) },
    { id: "m6", fromMe: false, text: "Loved the new drop! When's the album out?", time: daysAgo(0.02) },
  ],
  c2: [
    { id: "m1", fromMe: false, text: "Sample pack is insane", time: daysAgo(0.3) },
    { id: "m2", fromMe: false, text: "Just tipped for the sample pack 🎹", time: daysAgo(0.2) },
    { id: "m3", fromMe: true, text: "Appreciate you Chidi 🔥", time: daysAgo(0.18), status: "read" },
    { id: "m4", fromMe: true, text: "Which loops are you feeling most?", time: daysAgo(0.17), status: "read" },
  ],
  c3: [
    { id: "m1", fromMe: false, text: "Been thinking of catching your next live", time: daysAgo(1) },
    { id: "m2", fromMe: true, text: "Can you go live this weekend?", time: daysAgo(0.8), status: "delivered" },
  ],
  c5: [
    { id: "m1", fromMe: false, text: "Hey! Just subscribed 🎉", time: daysAgo(3.1) },
    { id: "m2", fromMe: false, text: "Just subscribed! What should I check first?", time: daysAgo(3) },
  ],
};

// Analytics — monthly earnings series
export const earningsSeries: { label: string; value: number }[] = [
  { label: "Feb", value: 128000 },
  { label: "Mar", value: 152000 },
  { label: "Apr", value: 189000 },
  { label: "May", value: 210000 },
  { label: "Jun", value: 245000 },
  { label: "Jul", value: 288000 },
  { label: "Aug", value: 312000 },
  { label: "Sep", value: 356000 },
  { label: "Oct", value: 380000 },
  { label: "Nov", value: 402000 },
  { label: "Dec", value: 428500 },
];

export const subscriberSeries: { label: string; value: number }[] = [
  { label: "Feb", value: 320 },
  { label: "Mar", value: 410 },
  { label: "Apr", value: 512 },
  { label: "May", value: 640 },
  { label: "Jun", value: 780 },
  { label: "Jul", value: 890 },
  { label: "Aug", value: 990 },
  { label: "Sep", value: 1080 },
  { label: "Oct", value: 1160 },
  { label: "Nov", value: 1220 },
  { label: "Dec", value: 1284 },
];

export const currentCreator = creators[0]; // Alex — used for demo dashboard

export const featuredCreators = [
  {
    name: "Barbiehillz",
    username: "@barbiehillz",
    image: "https://i.pravatar.cc/600?img=48",
    avatar: "https://i.pravatar.cc/200?img=48",
    likes: "2.11k",
    followers: "12.4k",
    videos: "42",
    photos: "128",
    verified: true,
  },
  {
    name: "Likekenny_xx",
    username: "@Likennyx",
    image: "https://i.pravatar.cc/600?img=49",
    avatar: "https://i.pravatar.cc/200?img=49",
    likes: "661",
    followers: "1.82k",
    videos: "18",
    photos: "64",
    verified: true,
  },
  {
    name: "Crazysocket",
    username: "@Crazysocket",
    image: "https://i.pravatar.cc/600?img=45",
    avatar: "https://i.pravatar.cc/200?img=45",
    likes: "2.34k",
    followers: "11.4k",
    videos: "37",
    photos: "112",
    verified: true,
  },
];
