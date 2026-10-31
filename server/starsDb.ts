import fs from 'fs';
import path from 'path';

export interface StarTransaction {
  id: string;
  userEmail: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  reason: string;
  toolId?: 'image' | 'video' | 'chat' | 'photo-editor' | 'tools' | 'bonus' | 'admin' | 'topup' | 'editor' | 'fusion';
  timestamp: string;
}

export interface ToolPricing {
  image_standard: number;
  image_8k: number;
  video_standard: number;
  video_4k: number;
  photo_inpaint: number;
  photo_upscale: number;
  chat_message: number;
  audio_voice: number;
  music_gen: number;
  image: number;
  video: number;
  chat: number;
  photoEditor: number;
  tools: number;
  // Extended Photo & Video Editor Tools
  photo_crop_resize: number;
  photo_filter_adjust: number;
  photo_remove_bg: number;
  photo_replace_bg: number;
  photo_object_remove: number;
  photo_retouch: number;
  photo_upscale_4k: number;
  photo_text_sticker: number;
  video_trim_cut: number;
  video_speed_transition: number;
  video_captions_subtitles: number;
  video_audio_voiceover: number;
  video_image_to_video: number;
  video_export_hd: number;
  video_export_4k: number;
  // AI Fusion Studio Suite
  fusion_standard: number;
  fusion_deep: number;
}

export interface UserStarRecord {
  email: string;
  name: string;
  stars: number; // Balance in ₹ (e.g. ₹385 starter credits)
  starterCreditsClaimed: boolean;
  starterCreditsClaimedAt?: string;
  totalEarned: number;
  totalSpent: number;
  isAdmin?: boolean;
  subscription?: {
    planId: string;
    planName: string;
    expiresAt: string;
    active: boolean;
    purchasedAt: string;
    amountPaid: number;
    orderId: string;
  };
  orders?: Array<{
    orderId: string;
    planId: string;
    amount: number;
    creditsAdded: number;
    paymentMethod: string;
    timestamp: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface StarsDatabase {
  users: Record<string, UserStarRecord>;
  pricing: ToolPricing;
  transactions: StarTransaction[];
}

const DEFAULT_PRICING: ToolPricing = {
  image_standard: 10,
  image_8k: 15,
  video_standard: 25,
  video_4k: 40,
  photo_inpaint: 8,
  photo_upscale: 12,
  chat_message: 2,
  audio_voice: 5,
  music_gen: 15,
  image: 15,
  video: 40,
  chat: 2,
  photoEditor: 10,
  tools: 10,
  photo_crop_resize: 0,
  photo_filter_adjust: 2,
  photo_remove_bg: 10,
  photo_replace_bg: 15,
  photo_object_remove: 12,
  photo_retouch: 8,
  photo_upscale_4k: 15,
  photo_text_sticker: 2,
  video_trim_cut: 5,
  video_speed_transition: 8,
  video_captions_subtitles: 10,
  video_audio_voiceover: 12,
  video_image_to_video: 25,
  video_export_hd: 5,
  video_export_4k: 15,
  fusion_standard: 12,
  fusion_deep: 20
};

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'stars_db.json');

// In-memory cache synced with disk
let dbCache: StarsDatabase | null = null;

function ensureDbDirectory() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to ensure data directory:', err);
  }
}

function loadDatabase(): StarsDatabase {
  if (dbCache) return dbCache;

  ensureDbDirectory();

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
      if (dbCache && dbCache.users && dbCache.pricing) {
        return dbCache;
      }
    } catch (err) {
      console.warn('Failed to parse stars_db.json, reinitializing default store:', err);
    }
  }

  // Initial seed with 400 ⭐ Stars per new user
  const initialTime = new Date().toISOString();
  const defaultDb: StarsDatabase = {
    users: {
      'gautammaheshwari225@gmail.com': {
        email: 'gautammaheshwari225@gmail.com',
        name: 'Alex Vance',
        stars: 400,
        totalEarned: 400,
        totalSpent: 0,
        isAdmin: true,
        starterCreditsClaimed: true,
        createdAt: initialTime,
        updatedAt: initialTime
      },
      'demo@ogoo.ai': {
        email: 'demo@ogoo.ai',
        name: 'Demo Pioneer',
        stars: 400,
        totalEarned: 400,
        totalSpent: 0,
        isAdmin: true,
        starterCreditsClaimed: true,
        createdAt: initialTime,
        updatedAt: initialTime
      }
    },
    pricing: { ...DEFAULT_PRICING },
    transactions: [
      {
        id: 'tx-seed-1',
        userEmail: 'gautammaheshwari225@gmail.com',
        type: 'credit',
        amount: 400,
        balanceAfter: 400,
        reason: 'OGOO New Pioneer Welcome Grant',
        toolId: 'bonus',
        timestamp: initialTime
      },
      {
        id: 'tx-seed-2',
        userEmail: 'demo@ogoo.ai',
        type: 'credit',
        amount: 400,
        balanceAfter: 400,
        reason: 'OGOO New Pioneer Welcome Grant',
        toolId: 'bonus',
        timestamp: initialTime
      }
    ]
  };

  dbCache = defaultDb;
  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(db: StarsDatabase) {
  try {
    ensureDbDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    dbCache = db;
  } catch (err) {
    console.error('Failed to save stars_db.json:', err);
  }
}

// 1. Get user record (auto-creates new user with ₹385 Starter Credits only once)
export function getOrCreateUserStars(email: string, name?: string): UserStarRecord {
  const db = loadDatabase();
  const normalizedEmail = (email || 'guest@ogoo.ai').toLowerCase().trim();

  if (db.users[normalizedEmail]) {
    const existing = db.users[normalizedEmail];
    // Ensure flag is set on legacy/existing records
    if (existing.starterCreditsClaimed === undefined) {
      existing.starterCreditsClaimed = true;
      existing.starterCreditsClaimedAt = existing.createdAt;
      saveDatabase(db);
    }
    return existing;
  }

  // New user automatically receives ₹385 worth of starter credits ONLY ONCE!
  const now = new Date().toISOString();
  const newUser: UserStarRecord = {
    email: normalizedEmail,
    name: name || normalizedEmail.split('@')[0] || 'OGOO Pioneer',
    stars: 385, // ₹385 worth of starter credits
    starterCreditsClaimed: true,
    starterCreditsClaimedAt: now,
    totalEarned: 385,
    totalSpent: 0,
    isAdmin: normalizedEmail.includes('admin') || normalizedEmail === 'gautammaheshwari225@gmail.com' || normalizedEmail === 'demo@ogoo.ai',
    orders: [],
    createdAt: now,
    updatedAt: now
  };

  db.users[normalizedEmail] = newUser;

  // Add welcome transaction
  db.transactions.unshift({
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    userEmail: normalizedEmail,
    type: 'credit',
    amount: 385,
    balanceAfter: 385,
    reason: 'OGOO Starter Grant (₹385 Starter Credits - One-time Pioneer Grant)',
    toolId: 'bonus',
    timestamp: now
  });

  saveDatabase(db);
  return newUser;
}

// Check if user has active VIP Unlimited Pass
export function isUserVipActive(user: UserStarRecord): boolean {
  if (!user.subscription || !user.subscription.active) return false;
  if (!user.subscription.expiresAt) return false;
  return new Date(user.subscription.expiresAt).getTime() > Date.now();
}

// Claim starter credits endpoint handler (Strictly one-time only!)
export function claimStarterCredits(email: string, name?: string): {
  success: boolean;
  alreadyClaimed: boolean;
  balance: number;
  message: string;
} {
  const db = loadDatabase();
  const normalizedEmail = (email || 'guest@ogoo.ai').toLowerCase().trim();
  const user = db.users[normalizedEmail];

  if (user) {
    if (user.starterCreditsClaimed) {
      return {
        success: false,
        alreadyClaimed: true,
        balance: user.stars,
        message: 'Starter credits of ₹385 have already been claimed once for this account. No duplicate grants allowed.'
      };
    }
    // Grant once if somehow flag was false
    user.stars += 385;
    user.starterCreditsClaimed = true;
    user.starterCreditsClaimedAt = new Date().toISOString();
    user.totalEarned += 385;
    user.updatedAt = new Date().toISOString();

    db.transactions.unshift({
      id: `tx-claim-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userEmail: normalizedEmail,
      type: 'credit',
      amount: 385,
      balanceAfter: user.stars,
      reason: 'OGOO Starter Grant (₹385 Starter Credits Claimed)',
      toolId: 'bonus',
      timestamp: new Date().toISOString()
    });

    saveDatabase(db);
    return {
      success: true,
      alreadyClaimed: false,
      balance: user.stars,
      message: '₹385 starter credits activated successfully!'
    };
  }

  // Create brand new user
  const newUser = getOrCreateUserStars(normalizedEmail, name);
  return {
    success: true,
    alreadyClaimed: false,
    balance: newUser.stars,
    message: 'Welcome! ₹385 starter credits granted for your new account.'
  };
}

// 2. Check balance before generation
export function checkBalance(
  email: string,
  toolId: keyof ToolPricing
): {
  hasEnough: boolean;
  currentBalance: number;
  cost: number;
  message?: string;
  isVip?: boolean;
} {
  const user = getOrCreateUserStars(email);
  const db = loadDatabase();
  const cost = db.pricing[toolId] ?? 10;

  // VIP subscribers have unlimited free usage!
  if (isUserVipActive(user)) {
    return {
      hasEnough: true,
      currentBalance: user.stars,
      cost: 0,
      isVip: true,
      message: 'VIP Unlimited Pass active (0 credits required)'
    };
  }

  if (user.stars >= cost) {
    return {
      hasEnough: true,
      currentBalance: user.stars,
      cost
    };
  }

  return {
    hasEnough: false,
    currentBalance: user.stars,
    cost,
    message: `Not enough credits (₹${cost} required, current balance: ₹${user.stars}). Please top up credits.`
  };
}

// 3. Deduct Stars only after successful generation
export function deductStars(
  email: string,
  toolId: keyof ToolPricing,
  customReason?: string
): {
  success: boolean;
  newBalance: number;
  deducted: number;
  transaction?: StarTransaction;
  error?: string;
  isVip?: boolean;
} {
  const db = loadDatabase();
  const normalizedEmail = (email || '').toLowerCase().trim();
  const user = db.users[normalizedEmail] || getOrCreateUserStars(email);
  const cost = db.pricing[toolId] ?? 10;

  // VIP subscribers bypass deduction!
  if (isUserVipActive(user)) {
    return {
      success: true,
      newBalance: user.stars,
      deducted: 0,
      isVip: true
    };
  }

  if (user.stars < cost) {
    return {
      success: false,
      newBalance: user.stars,
      deducted: 0,
      error: `Not enough credits (₹${cost} required, balance: ₹${user.stars}).`
    };
  }

  user.stars -= cost;
  user.totalSpent += cost;
  user.updatedAt = new Date().toISOString();

  const toolLabels: Record<string, string> = {
    image_standard: 'AI Image Standard Generation',
    image_8k: 'AI Image 8K Photorealistic Master',
    video_standard: 'AI Video HD Neural Motion',
    video_4k: 'AI Video 4K Cinematic Generation',
    photo_inpaint: 'AI Neural Photo Inpainting',
    photo_upscale: 'AI Neural Photo Upscaling',
    chat_message: 'Quantum Neural Chat Synthesis',
    audio_voice: 'Neural AI Voice Cloning & Synthesis',
    music_gen: 'AI Music & Audio Composition',
    image: 'AI Image Studio Generation',
    video: 'AI Video Cinematic Generation',
    chat: 'Quantum Neural Chat Synthesis',
    photoEditor: 'Neural Photo Lab Enhancement',
    tools: 'OGOO Specialized AI Tool Suite',
    photo_crop_resize: 'Photo Crop & Transform',
    photo_filter_adjust: 'Photo Filter & Color Adjustment',
    photo_remove_bg: 'AI Background Removal',
    photo_replace_bg: 'AI Background Replacement',
    photo_object_remove: 'AI Object Removal (Magic Eraser)',
    photo_retouch: 'AI Face & Skin Retouching',
    photo_upscale_4k: 'AI 4K Super-Resolution Upscale',
    photo_text_sticker: 'Text & Sticker Overlays',
    video_trim_cut: 'Video Trimming & Cutting',
    video_speed_transition: 'Video Speed & Transitions',
    video_captions_subtitles: 'AI Auto-Captions Subtitles',
    video_audio_voiceover: 'AI Voice-Over & Audio Mix',
    video_image_to_video: 'Image-to-Video AI Generation',
    video_export_hd: 'HD Video Export',
    video_export_4k: '4K Ultra HD Video Export'
  };

  const reason = customReason || toolLabels[toolId] || `AI Generation (${toolId})`;

  const tx: StarTransaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    userEmail: normalizedEmail,
    type: 'debit',
    amount: -cost,
    balanceAfter: user.stars,
    reason,
    toolId: (toolId.startsWith('photo_') || toolId.startsWith('video_')) ? 'editor' : (toolId as any),
    timestamp: new Date().toISOString()
  };

  db.transactions.unshift(tx);
  saveDatabase(db);

  return {
    success: true,
    newBalance: user.stars,
    deducted: cost,
    transaction: tx
  };
}

// Arbitrary credit deduction for custom tool operations (e.g. Photo & Video editor operations)
export function deductCustomCredits(
  email: string,
  amount: number,
  reason: string,
  toolId: string = 'editor'
): {
  success: boolean;
  newBalance: number;
  deducted: number;
  transaction?: StarTransaction;
  error?: string;
} {
  const db = loadDatabase();
  const normalizedEmail = (email || '').toLowerCase().trim();
  const user = db.users[normalizedEmail] || getOrCreateUserStars(email);
  const cost = Math.max(0, Math.floor(Number(amount)));

  if (isUserVipActive(user)) {
    return {
      success: true,
      newBalance: user.stars,
      deducted: 0
    };
  }

  if (cost > 0 && user.stars < cost) {
    return {
      success: false,
      newBalance: user.stars,
      deducted: 0,
      error: `Insufficient credits. Required: ₹${cost}, available: ₹${user.stars}.`
    };
  }

  if (cost > 0) {
    user.stars -= cost;
    user.totalSpent += cost;
    user.updatedAt = new Date().toISOString();
  }

  const tx: StarTransaction = {
    id: `tx-edit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    userEmail: normalizedEmail,
    type: 'debit',
    amount: -cost,
    balanceAfter: user.stars,
    reason,
    toolId: 'editor',
    timestamp: new Date().toISOString()
  };

  if (cost > 0) {
    db.transactions.unshift(tx);
    saveDatabase(db);
  }

  return {
    success: true,
    newBalance: user.stars,
    deducted: cost,
    transaction: tx
  };
}

// Purchase and activate credit top-up packages
export function purchaseCreditsPlan(
  email: string,
  planId: string,
  paymentMethod: string = 'UPI',
  paymentReference?: string
): {
  success: boolean;
  newBalance: number;
  planName: string;
  orderId: string;
  vipExpiresAt?: string;
  transaction?: StarTransaction;
  error?: string;
} {
  const db = loadDatabase();
  const normalizedEmail = (email || '').toLowerCase().trim();
  const user = db.users[normalizedEmail] || getOrCreateUserStars(email);
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  let creditsAdded = 0;
  let planName = 'Credits Top-Up';
  let amountPaid = 0;

  if (planId === 'plan_100') {
    amountPaid = 100;
    creditsAdded = 700; // 700 Stars / Credits (Value boost)
    planName = '₹100 Starter Boost (700 Credits)';
  } else if (planId === 'plan_1000') {
    amountPaid = 1000;
    creditsAdded = 1500; // 1,500 Stars / Credits
    planName = '₹1,000 Creator Pro (1,500 Credits)';
  } else if (planId === 'plan_10000_vip') {
    amountPaid = 10000;
    creditsAdded = 10000; // Bonus bank
    planName = '₹10,000 VIP Ultimate Pass (42 Days Unlimited AI Access)';

    // 1 Month + 12 Days FREE = 42 Days validity!
    const expiry = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString();
    user.subscription = {
      planId: 'vip_42_days',
      planName: 'VIP Ultimate Pass',
      expiresAt: expiry,
      active: true,
      purchasedAt: new Date().toISOString(),
      amountPaid: 10000,
      orderId
    };
  } else {
    // Custom amount fallback
    amountPaid = 100;
    creditsAdded = 700;
    planName = 'Credits Package';
  }

  user.stars += creditsAdded;
  user.totalEarned += creditsAdded;
  user.updatedAt = new Date().toISOString();

  if (!user.orders) user.orders = [];
  user.orders.unshift({
    orderId,
    planId,
    amount: amountPaid,
    creditsAdded,
    paymentMethod,
    timestamp: new Date().toISOString(),
    status: 'completed'
  });

  const tx: StarTransaction = {
    id: `tx-ord-${orderId}`,
    userEmail: normalizedEmail,
    type: 'credit',
    amount: creditsAdded,
    balanceAfter: user.stars,
    reason: `Purchased ${planName} via ${paymentMethod}`,
    toolId: 'topup',
    timestamp: new Date().toISOString()
  };

  db.transactions.unshift(tx);
  saveDatabase(db);

  return {
    success: true,
    newBalance: user.stars,
    planName,
    orderId,
    vipExpiresAt: user.subscription?.expiresAt,
    transaction: tx
  };
}

// 4. Admin update user balance
export function adminSetUserBalance(
  targetEmail: string,
  newBalance: number,
  reason: string = 'Admin credit adjustment'
): {
  success: boolean;
  user: UserStarRecord;
  transaction: StarTransaction;
} {
  const db = loadDatabase();
  const normalizedEmail = (targetEmail || '').toLowerCase().trim();
  const user = db.users[normalizedEmail] || getOrCreateUserStars(targetEmail);
  const oldBalance = user.stars;
  const targetStars = Math.max(0, Math.floor(Number(newBalance)));
  const diff = targetStars - oldBalance;

  user.stars = targetStars;
  if (diff > 0) {
    user.totalEarned += diff;
  }
  user.updatedAt = new Date().toISOString();

  const tx: StarTransaction = {
    id: `tx-adm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    userEmail: normalizedEmail,
    type: diff >= 0 ? 'credit' : 'debit',
    amount: diff,
    balanceAfter: user.stars,
    reason: `Admin Adjustment: ${reason}`,
    toolId: 'admin',
    timestamp: new Date().toISOString()
  };

  db.transactions.unshift(tx);
  saveDatabase(db);

  return {
    success: true,
    user,
    transaction: tx
  };
}

// 5. Admin update tool pricing
export function adminUpdateToolPricing(newPricing: Partial<ToolPricing>): ToolPricing {
  const db = loadDatabase();
  db.pricing = {
    ...db.pricing,
    ...newPricing
  };
  saveDatabase(db);
  return db.pricing;
}

// 6. User Top-Up package purchase
export function topUpStars(
  email: string,
  amount: number,
  packageName: string
): {
  success: boolean;
  newBalance: number;
  transaction: StarTransaction;
} {
  const db = loadDatabase();
  const normalizedEmail = (email || '').toLowerCase().trim();
  const user = db.users[normalizedEmail] || getOrCreateUserStars(email);
  const topUpAmount = Math.max(1, Math.floor(Number(amount)));

  user.stars += topUpAmount;
  user.totalEarned += topUpAmount;
  user.updatedAt = new Date().toISOString();

  const tx: StarTransaction = {
    id: `tx-top-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    userEmail: normalizedEmail,
    type: 'credit',
    amount: topUpAmount,
    balanceAfter: user.stars,
    reason: `Purchased ${packageName} (+${topUpAmount} ⭐ Stars)`,
    toolId: 'topup',
    timestamp: new Date().toISOString()
  };

  db.transactions.unshift(tx);
  saveDatabase(db);

  return {
    success: true,
    newBalance: user.stars,
    transaction: tx
  };
}

// 7. Get transactions for a user
export function getUserTransactions(email: string): StarTransaction[] {
  const db = loadDatabase();
  const normalizedEmail = (email || '').toLowerCase().trim();
  return db.transactions.filter((tx) => tx.userEmail.toLowerCase() === normalizedEmail);
}

// 8. Get current pricing
export function getCurrentPricing(): ToolPricing {
  const db = loadDatabase();
  return db.pricing;
}

// 9. Get all users (for admin panel)
export function getAllUsersList(): UserStarRecord[] {
  const db = loadDatabase();
  return Object.values(db.users);
}
