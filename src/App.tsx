import React, { useState, useEffect, useRef } from 'react';
import {
  NavTab,
  ChatMessage,
  GeneratedImage,
  GeneratedVideo,
  FusedImage,
  HistoryItem,
  AppSettings,
  UserProfile
} from './types';
import {
  defaultSettings,
  defaultProfile,
  initialChatMessages,
  sampleImages,
  sampleVideos,
  sampleHistory
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { ImageGenView } from './components/ImageGenView';
import { FusionStudioView } from './components/FusionStudioView';
import { VideoGenView } from './components/VideoGenView';
import { PhotoEditorView } from './components/PhotoEditorView';
import { ToolsSuiteView } from './components/ToolsSuiteView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { AuthView } from './components/AuthView';
import { StarsView } from './components/StarsView';
import { MyApiView } from './components/MyApiView';
import { OwnerSecretView } from './components/OwnerSecretView';
import { SplashIntro3D } from './components/SplashIntro3D';
import { MobileQuickActionMenu } from './components/MobileQuickActionMenu';
import { AudioPermissionModal } from './components/AudioPermissionModal';
import { MessageSquare, Sparkles, Wand2, Boxes, Layers } from 'lucide-react';
import { OgooStarIcon } from './components/OgooStarCurrency';
import {
  getFirestoreUser,
  saveFirestoreUser,
  logOutFirebaseUser,
  onAuthUserChanged,
  forceSyncOfflineWithFirestore,
  ForceSyncResult
} from './lib/firebase';

export default function App() {
  // Flow Step: 'splash_3d' | 'auth' | 'app'
  const [appFlow, setAppFlow] = useState<'splash_3d' | 'auth' | 'app'>('splash_3d');

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('og_ai_user') || localStorage.getItem('ogoo_current_user');
      return !!saved;
    } catch {
      return false;
    }
  });

  // Current logged in user email
  const [userEmail, setUserEmail] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('og_ai_user') || localStorage.getItem('ogoo_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.email || '';
      }
    } catch {}
    return '';
  });

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('ogoo_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'dark';
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<NavTab>('chat');

  // Mobile bottom nav haptic tactile feedback state
  const [hapticTappedTab, setHapticTappedTab] = useState<NavTab | null>(null);

  // Mobile bottom nav long-press quick-action shortcuts state
  const [quickActionTab, setQuickActionTab] = useState<NavTab | null>(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [holdingNavTab, setHoldingNavTab] = useState<NavTab | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressFiredRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleMobileNavClick = (tab: NavTab) => {
    // 1. Android physical vibration haptics (if supported by hardware)
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(12); // Crisp 12ms haptic tap for Android
      } catch {}
    }

    // 2. Visual spring bounce and scale pulse
    setHapticTappedTab(tab);
    setTimeout(() => {
      setHapticTappedTab(null);
    }, 250);

    setActiveTab(tab);
  };

  const handleNavPressStart = (tab: NavTab, e: React.TouchEvent | React.MouseEvent) => {
    isLongPressFiredRef.current = false;
    setHoldingNavTab(tab);

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    touchStartPosRef.current = { x: clientX, y: clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      isLongPressFiredRef.current = true;
      setHoldingNavTab(null);

      // Trigger distinct Android vibration pattern for long-press trigger
      if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate([25, 40, 25]);
        } catch {}
      }

      setQuickActionTab(tab);
      setIsQuickActionOpen(true);
    }, 420); // 420ms long-press threshold
  };

  const handleNavPressEnd = (tab: NavTab, shouldActivateClick = true) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setHoldingNavTab(null);

    // If long press did not fire and normal tap completed, execute normal navigation
    if (!isLongPressFiredRef.current && shouldActivateClick) {
      handleMobileNavClick(tab);
    }
    isLongPressFiredRef.current = false;
  };

  const handleNavPressMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const diffY = Math.abs(touch.clientY - touchStartPosRef.current.y);

    // If finger moves > 8px, user is scrolling: cancel long press
    if (diffX > 8 || diffY > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setHoldingNavTab(null);
    }
  };

  // Sidebar Layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Model & Audio
  const [selectedModel, setSelectedModel] = useState<string>('OG AI Quantum 4.5 Omni');
  const [audioSpeechEnabled, setAudioSpeechEnabled] = useState(false);

  // Core Data Stores with localStorage and Firestore persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('ogoo_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultSettings;
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('ogoo_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultProfile;
  });

  // Helper to ensure all chat messages have unique keys and IDs
  const deduplicateMessages = (msgs: ChatMessage[]): ChatMessage[] => {
    if (!Array.isArray(msgs)) return [];
    const seenIds = new Set<string>();
    const clean: ChatMessage[] = [];
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      if (!m) continue;
      let id = m.id;
      if (!id || seenIds.has(id)) {
        id = `ai-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 8)}`;
      }
      seenIds.add(id);
      clean.push({ ...m, id });
    }
    return clean;
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ogoo_messages');
      if (saved) return deduplicateMessages(JSON.parse(saved));
    } catch {}
    return deduplicateMessages(initialChatMessages);
  });

  const [isChatLoading, setIsChatLoading] = useState(false);

  // Videos Gallery state: persist in localStorage
  const [videos, setVideos] = useState<GeneratedVideo[]>(() => {
    try {
      const saved = localStorage.getItem('ogoo_videos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'vid-cyber-demo',
        prompt: 'Hyper-realistic cybernetic falcon soaring over a neon Tokyo skyline at dusk, cinematic 4K camera tracking, volumetric sunset reflections',
        motion: 'Dynamic 7',
        cameraMovement: 'Orbital Pan 360°',
        duration: '6s',
        videoUrl: '/videos/test_cinematic.mp4',
        posterUrl: '/ogoo-icon-512.png',
        timestamp: 'Featured Cinema',
        style: 'Cinematic Cyber'
      }
    ];
  });

  // Images Gallery state: persist in localStorage
  const [images, setImages] = useState<GeneratedImage[]>(() => {
    try {
      const saved = localStorage.getItem('ogoo_images');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ogoo_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return sampleHistory;
  });

  // Inter-tool handoff (e.g. Image Studio -> Photo Lab)
  const [photoLabActiveImage, setPhotoLabActiveImage] = useState<string | null>(null);
  const [fusionActiveImage, setFusionActiveImage] = useState<string | null>(null);

  // Maintain active Firebase Authentication session across reloads & Android launches
  useEffect(() => {
    const unsubscribe = onAuthUserChanged((firebaseUser) => {
      if (firebaseUser?.email) {
        setUserEmail(firebaseUser.email);
        setIsAuthenticated(true);
        if (firebaseUser.displayName) {
          setProfile((prev) => ({
            ...prev,
            name: firebaseUser.displayName || prev.name,
            email: firebaseUser.email || prev.email
          }));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Theme to HTML Root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('ogoo_theme', theme);
    } catch {}
  }, [theme]);

  // Load persistent user data from Firestore on sign-in or reload
  useEffect(() => {
    if (!userEmail) return;
    getFirestoreUser(userEmail)
      .then((doc) => {
        if (doc) {
          if (typeof doc.stars === 'number') {
            setProfile((prev) => ({
              ...prev,
              name: doc.name || prev.name,
              email: doc.email || prev.email || userEmail,
              stars: doc.stars,
              credits: doc.credits || doc.stars
            }));
          }
          // Keep image and video libraries clean as requested
          setImages([]);
          if (Array.isArray(doc.history) && doc.history.length > 0) {
            setHistory(doc.history);
          }
          if (Array.isArray(doc.messages) && doc.messages.length > 0) {
            setMessages(deduplicateMessages(doc.messages));
          }
        }
      })
      .catch((err) => console.warn('Firestore user fetch failed:', err));
  }, [userEmail]);

  // Persist State Changes locally & to Firestore
  useEffect(() => {
    try {
      localStorage.setItem('ogoo_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('ogoo_profile', JSON.stringify(profile));
    } catch {}
    if (userEmail && settings.cloudSyncEnabled !== false) {
      saveFirestoreUser(userEmail, {
        name: profile.name,
        email: profile.email,
        stars: profile.stars,
        credits: profile.credits
      }).catch(() => {});
    }
  }, [profile, userEmail, settings.cloudSyncEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('ogoo_messages', JSON.stringify(messages));
    } catch {}
    if (userEmail && messages.length > 0 && settings.cloudSyncEnabled !== false) {
      saveFirestoreUser(userEmail, { messages }).catch(() => {});
    }
  }, [messages, userEmail, settings.cloudSyncEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('ogoo_images', JSON.stringify(images));
    } catch {}
    if (userEmail && images.length > 0 && settings.cloudSyncEnabled !== false) {
      saveFirestoreUser(userEmail, { images }).catch(() => {});
    }
  }, [images, userEmail, settings.cloudSyncEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('ogoo_videos', JSON.stringify(videos));
    } catch {}
    if (userEmail && videos.length > 0 && settings.cloudSyncEnabled !== false) {
      saveFirestoreUser(userEmail, { videos }).catch(() => {});
    }
  }, [videos, userEmail, settings.cloudSyncEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('ogoo_history', JSON.stringify(history));
    } catch {}
    if (userEmail && history.length > 0 && settings.cloudSyncEnabled !== false) {
      saveFirestoreUser(userEmail, { history }).catch(() => {});
    }
  }, [history, userEmail, settings.cloudSyncEnabled]);

  // Synchronize ⭐ Stars balance securely from database
  useEffect(() => {
    if (!profile?.email) return;
    fetch(`/api/stars/balance?email=${encodeURIComponent(profile.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && typeof data.stars === 'number') {
          setProfile((prev) => ({
            ...prev,
            stars: data.stars
          }));
        }
      })
      .catch((err) => console.warn('Could not sync stars balance:', err));
  }, [profile?.email]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addHistoryItem = (item: HistoryItem) => {
    setHistory((prev) => [item, ...prev]);
  };

  // Chat message sending with intelligent multimodal reasoning response
  const handleSendMessage = async (text: string, attachments?: any[]) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
      attachments: attachments && attachments.length > 0 ? attachments : undefined
    };

    setMessages((prev) => [...prev, userMsg]);

    // Deduct credits
    setProfile((prev) => ({
      ...prev,
      credits: Math.max(0, prev.credits - 2),
      creationsCount: prev.creationsCount + 1
    }));

    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          model: selectedModel,
          userEmail: profile.email,
          attachments: attachments?.map((att) => ({
            name: att.name,
            type: att.type,
            data: att.data
          }))
        })
      });

      let aiResponseText = '';
      let usedModel = 'n8n AI Agent';

      if (response.ok) {
        const data = await response.json();
        if (data.reply && typeof data.reply === 'string') {
          aiResponseText = data.reply;
          if (data.modelUsed) usedModel = data.modelUsed;
        } else {
          aiResponseText = 'Invalid response format received from AI Agent.';
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        aiResponseText = errData.error || `Error (${response.status}): Failed to connect to AI Agent.`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: 'Just now',
        modelUsed: usedModel,
        tokenCount: Math.floor(Math.random() * 80) + 90
      };

      setMessages((prev) => deduplicateMessages([...prev, aiMsg]));

      // Add to universal history
      addHistoryItem({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'chat',
        title: text.slice(0, 42) + (text.length > 42 ? '...' : ''),
        summary: aiResponseText.slice(0, 110),
        timestamp: 'Just now',
        data: { model: usedModel }
      });
    } catch (err: any) {
      console.warn("Chat request error:", err);
      const networkErrorMessage = `Network Error: ${err.message || 'Unable to communicate with chat server.'}`;
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: 'ai',
        text: networkErrorMessage,
        timestamp: 'Just now',
        modelUsed: 'n8n Webhook Guard',
        tokenCount: 20
      };
      setMessages((prev) => deduplicateMessages([...prev, aiMsg]));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem('ogoo_messages');
    } catch {}
  };

  // Image Generation Handler
  const handleGenerateImage = (newImage: GeneratedImage) => {
    setImages((prev) => [newImage, ...prev]);
    setProfile((prev) => ({
      ...prev,
      credits: Math.max(0, prev.credits - 10),
      creationsCount: prev.creationsCount + 1
    }));
    addHistoryItem({
      id: `hist-${Date.now()}`,
      type: 'image',
      title: newImage.prompt.slice(0, 36) + '...',
      summary: `Synthesized with ${newImage.model} at ${newImage.resolution}`,
      timestamp: 'Just now',
      data: { imageUrl: newImage.url, prompt: newImage.prompt }
    });
  };

  // Direct handoff from Image Studio -> Photo Lab Editor
  const handleSendToPhotoEditor = (imageUrl: string) => {
    setPhotoLabActiveImage(imageUrl);
    setActiveTab('photo-editor');
  };

  // Direct handoff to AI Fusion Studio
  const handleSendToFusionStudio = (imageUrl: string) => {
    setFusionActiveImage(imageUrl);
    setActiveTab('fusion');
  };

  const handleSaveFusedImage = (newFused: FusedImage) => {
    addHistoryItem({
      id: `hist-fusion-${Date.now()}`,
      type: 'image',
      title: `AI Fusion: ${newFused.fusionMode}`,
      summary: newFused.prompt.slice(0, 40) + '...',
      timestamp: 'Just now',
      data: { imageUrl: newFused.fusedUrl, prompt: newFused.prompt }
    });
  };

  // Video Generation Handler
  const handleGenerateVideo = (newVideo: GeneratedVideo) => {
    setVideos((prev) => {
      const updated = [newVideo, ...prev];
      try {
        localStorage.setItem('ogoo_videos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setProfile((prev) => ({
      ...prev,
      credits: Math.max(0, prev.credits - 25),
      creationsCount: prev.creationsCount + 1
    }));
    addHistoryItem({
      id: `hist-${Date.now()}`,
      type: 'video',
      title: newVideo.prompt.slice(0, 36) + '...',
      summary: `Generated motion video (${newVideo.duration})`,
      timestamp: 'Just now',
      data: { videoUrl: newVideo.videoUrl, prompt: newVideo.prompt }
    });
  };

  // Image Deletion Handlers
  const handleDeleteImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      try {
        localStorage.setItem('ogoo_images', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearAllImages = () => {
    setImages([]);
    try {
      localStorage.removeItem('ogoo_images');
    } catch {}
  };

  // Video Deletion Handlers
  const handleDeleteVideo = (id: string) => {
    setVideos((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      try {
        localStorage.setItem('ogoo_videos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearAllVideos = () => {
    setVideos([]);
    try {
      localStorage.removeItem('ogoo_videos');
    } catch {}
  };

  // Settings update
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  // Manual Force Synchronization with Firestore Backend for Cross-Device Parity
  const handleManualSync = async (): Promise<ForceSyncResult> => {
    const targetEmail = userEmail || profile.email || 'gautammaheshwari225@gmail.com';
    const result = await forceSyncOfflineWithFirestore(targetEmail, {
      profile,
      settings,
      history,
      messages,
      images,
      videos
    });

    if (result.success && result.mergedData) {
      setProfile(result.mergedData.profile);
      setSettings(result.mergedData.settings);
      setHistory(result.mergedData.history);
      setMessages(deduplicateMessages(result.mergedData.messages));
      setImages(result.mergedData.images || []);
      setVideos(result.mergedData.videos || []);
    }
    return result;
  };

  const handleTopUpCredits = () => {
    setProfile((prev) => ({
      ...prev,
      credits: prev.credits + 2500
    }));
    alert('Compute credits successfully topped up (+2,500 QC)!');
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('ogoo_history');
    } catch {}
  };

  // User Authentication Handlers
  const handleAuthSuccess = (userData: { name: string; email: string; stars?: number }) => {
    setIsAuthenticated(true);
    setUserEmail(userData.email);
    setProfile((prev) => {
      const updated = {
        ...prev,
        name: userData.name || prev.name,
        email: userData.email,
        stars: userData.stars !== undefined ? userData.stars : prev.stars,
        credits: userData.stars !== undefined ? userData.stars : prev.credits,
        handle: `@${(userData.name || userData.email.split('@')[0] || 'og').toLowerCase().replace(/\s+/g, '_')}`
      };
      try {
        localStorage.setItem('ogoo_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setAppFlow('app');
  };

  const handleLogout = async () => {
    await logOutFirebaseUser();
    try {
      localStorage.removeItem('og_ai_user');
      localStorage.removeItem('og_ai_phone_user');
      localStorage.removeItem('ogoo_current_user');
      localStorage.removeItem('emailForSignIn');
    } catch {}
    setIsAuthenticated(false);
    setUserEmail('');
    setAppFlow('auth');
  };

  // =========================================================================
  // APP LIFECYCLE FLOW:
  // 1. App Launch → 1-minute OG AI 3D animation (SplashIntro3D)
  // 2. Automatically open Login / Sign Up page (AuthView) with Email Link
  // 3. Firebase Email verification → Main Homepage
  // =========================================================================

  if (appFlow === 'splash_3d') {
    return (
      <SplashIntro3D
        onComplete={() => {
          if (isAuthenticated) {
            setAppFlow('app');
          } else {
            setAppFlow('auth');
          }
        }}
      />
    );
  }

  if (appFlow === 'auth' || !isAuthenticated) {
    return (
      <AuthView
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors duration-200 ${
        theme === 'dark'
          ? 'bg-[#07090e] text-slate-100'
          : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        profile={profile}
        onLogout={handleLogout}
        theme={theme}
      />

      {/* Main Viewport */}
      <div className="flex flex-col grow min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          selectedModel={selectedModel}
          onSelectModel={(model) => setSelectedModel(model)}
          audioSpeechEnabled={audioSpeechEnabled}
          onToggleAudioSpeech={() => setAudioSpeechEnabled(!audioSpeechEnabled)}
          onSelectTab={setActiveTab}
          onLogout={handleLogout}
          stars={profile.stars}
          onOpenStars={() => setActiveTab('stars')}
          userEmail={userEmail || profile.email}
          onQuickPrompt={(prompt) => {
            setActiveTab('chat');
            handleSendMessage(prompt);
          }}
        />

        {/* View Content Area */}
        <main className="grow overflow-x-hidden">
          {activeTab === 'chat' && (
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              selectedModel={selectedModel}
              settings={settings}
              theme={theme}
              onAddHistoryItem={addHistoryItem}
              onSelectTab={setActiveTab}
              isLoading={isChatLoading}
            />
          )}

          {activeTab === 'image' && (
            <ImageGenView
              images={images}
              onGenerateImage={handleGenerateImage}
              onSendToPhotoEditor={handleSendToPhotoEditor}
              onSendToFusionStudio={handleSendToFusionStudio}
              onDeleteImage={handleDeleteImage}
              onClearAllImages={handleClearAllImages}
              theme={theme}
              settings={settings}
              userEmail={profile.email}
              onOpenStars={() => setActiveTab('stars')}
              onStarsDeducted={(newBal) => {
                setProfile((prev) => ({ ...prev, stars: newBal }));
              }}
            />
          )}

          {activeTab === 'fusion' && (
            <FusionStudioView
              initialImage={fusionActiveImage}
              onSaveFusedImage={handleSaveFusedImage}
              onSendToPhotoEditor={handleSendToPhotoEditor}
              onSendToVideoStudio={(imgUrl) => {
                setPhotoLabActiveImage(imgUrl);
                setActiveTab('video');
              }}
              theme={theme}
              profile={profile}
              onUpdateStars={(newStars) => {
                setProfile((prev) => ({ ...prev, stars: newStars, credits: newStars }));
              }}
              onOpenCredits={() => setActiveTab('stars')}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'video' && (
            <VideoGenView
              videos={videos}
              onGenerateVideo={handleGenerateVideo}
              onDeleteVideo={handleDeleteVideo}
              onClearAllVideos={handleClearAllVideos}
              theme={theme}
              settings={settings}
              userEmail={profile.email}
              onOpenStars={() => setActiveTab('stars')}
              onStarsDeducted={(newBal) => {
                setProfile((prev) => ({ ...prev, stars: newBal }));
              }}
            />
          )}

          {activeTab === 'photo-editor' && (
            <PhotoEditorView
              initialImage={photoLabActiveImage}
              onSaveToGallery={(url) => {
                addHistoryItem({
                  id: `hist-photo-${Date.now()}`,
                  type: 'image',
                  title: 'OG AI Photo/Video Studio Edit',
                  summary: 'High-definition neural master creation',
                  timestamp: 'Just now',
                  data: { imageUrl: url }
                });
              }}
              theme={theme}
              profile={profile}
              onUpdateStars={(newStars) => {
                setProfile((prev) => ({ ...prev, stars: newStars, credits: newStars }));
              }}
              onOpenCredits={() => setActiveTab('stars')}
              onSelectTab={setActiveTab}
              onSendToFusionStudio={handleSendToFusionStudio}
            />
          )}

          {activeTab === 'tools' && (
            <ToolsSuiteView
              theme={theme}
              onAddHistoryItem={addHistoryItem}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'stars' && (
            <StarsView
              profile={profile}
              onUpdateStars={(newStars: number) => {
                setProfile((prev) => ({
                  ...prev,
                  stars: newStars,
                  credits: newStars
                }));
              }}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'my-api' && (
            <MyApiView
              theme={theme}
              profile={profile}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'owner-secret' && (
            <OwnerSecretView
              theme={theme}
              profile={profile}
              userEmail={userEmail || profile.email}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              history={history}
              onClearHistory={handleClearHistory}
              onNavigate={setActiveTab}
              theme={theme}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleSaveSettings}
              theme={theme}
              onToggleTheme={toggleTheme}
              userEmail={userEmail || profile.email}
              profile={profile}
              history={history}
              messages={messages}
              images={images}
              videos={videos}
              onManualSync={handleManualSync}
              onApplySyncedData={(data) => {
                if (data.profile) setProfile(data.profile);
                if (data.settings) setSettings(data.settings);
                if (data.history) setHistory(data.history);
                if (data.messages) setMessages(deduplicateMessages(data.messages));
                if (data.images) setImages(data.images);
                if (data.videos) setVideos(data.videos);
              }}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              profile={profile}
              onTopUpCredits={handleTopUpCredits}
              onLogout={handleLogout}
              onOpenStars={() => setActiveTab('stars')}
              theme={theme}
            />
          )}
        </main>

        {/* Mobile Android Bottom Navigation Bar with Tactile Haptic-Like Scale, Touch Feedback & Long-Press Shortcuts */}
        <nav
          id="mobile-bottom-nav"
          className="md:hidden sticky bottom-0 z-40 bg-[#0a0e19]/95 backdrop-blur-xl border-t border-white/10 px-1.5 py-1 flex items-center justify-around shadow-2xl safe-area-pb tap-haptic-responsive"
        >
          {/* 1. Chat */}
          <button
            type="button"
            onTouchStart={(e) => handleNavPressStart('chat', e)}
            onTouchEnd={() => handleNavPressEnd('chat', true)}
            onTouchMove={handleNavPressMove}
            onMouseDown={(e) => handleNavPressStart('chat', e)}
            onMouseUp={() => handleNavPressEnd('chat', true)}
            onMouseLeave={() => handleNavPressEnd('chat', false)}
            aria-label="Chat (Tap to open, hold for shortcuts)"
            className={`tap-haptic-responsive relative flex flex-col items-center justify-center min-w-[50px] min-h-[50px] py-1 px-2 rounded-xl transition-all duration-150 ease-out cursor-pointer active:scale-85 active:translate-y-0.5 active:bg-white/10 active:brightness-125 ${
              holdingNavTab === 'chat' ? 'animate-hold-charge bg-cyan-500/20' : ''
            } ${
              activeTab === 'chat'
                ? `text-cyan-400 font-bold bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.25)] ${
                    hapticTappedTab === 'chat' ? 'animate-haptic-pop' : 'scale-105'
                  }`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'chat' ? 'scale-110 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]' : ''}`} />
              {activeTab === 'chat' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-mono tracking-tight mt-0.5">Chat</span>
            {activeTab === 'chat' && (
              <span className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]" />
            )}
          </button>

          {/* 2. Studio */}
          <button
            type="button"
            onTouchStart={(e) => handleNavPressStart('image', e)}
            onTouchEnd={() => handleNavPressEnd('image', true)}
            onTouchMove={handleNavPressMove}
            onMouseDown={(e) => handleNavPressStart('image', e)}
            onMouseUp={() => handleNavPressEnd('image', true)}
            onMouseLeave={() => handleNavPressEnd('image', false)}
            aria-label="Studio (Tap to open, hold for shortcuts)"
            className={`tap-haptic-responsive relative flex flex-col items-center justify-center min-w-[50px] min-h-[50px] py-1 px-2 rounded-xl transition-all duration-150 ease-out cursor-pointer active:scale-85 active:translate-y-0.5 active:bg-white/10 active:brightness-125 ${
              holdingNavTab === 'image' ? 'animate-hold-charge bg-purple-500/20' : ''
            } ${
              activeTab === 'image' || activeTab === 'video'
                ? `text-purple-400 font-bold bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.25)] ${
                    hapticTappedTab === 'image' ? 'animate-haptic-pop' : 'scale-105'
                  }`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Sparkles className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'image' || activeTab === 'video' ? 'scale-110 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]' : ''}`} />
              {(activeTab === 'image' || activeTab === 'video') && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc] animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-mono tracking-tight mt-0.5">Studio</span>
            {(activeTab === 'image' || activeTab === 'video') && (
              <span className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-purple-400 shadow-[0_0_4px_#c084fc]" />
            )}
          </button>

          {/* 3. Fusion */}
          <button
            type="button"
            onTouchStart={(e) => handleNavPressStart('fusion', e)}
            onTouchEnd={() => handleNavPressEnd('fusion', true)}
            onTouchMove={handleNavPressMove}
            onMouseDown={(e) => handleNavPressStart('fusion', e)}
            onMouseUp={() => handleNavPressEnd('fusion', true)}
            onMouseLeave={() => handleNavPressEnd('fusion', false)}
            aria-label="Fusion (Tap to open, hold for shortcuts)"
            className={`tap-haptic-responsive relative flex flex-col items-center justify-center min-w-[50px] min-h-[50px] py-1 px-2 rounded-xl transition-all duration-150 ease-out cursor-pointer active:scale-85 active:translate-y-0.5 active:bg-white/10 active:brightness-125 ${
              holdingNavTab === 'fusion' ? 'animate-hold-charge bg-fuchsia-500/20' : ''
            } ${
              activeTab === 'fusion'
                ? `text-fuchsia-400 font-bold bg-fuchsia-500/10 shadow-[0_0_12px_rgba(217,70,239,0.25)] ${
                    hapticTappedTab === 'fusion' ? 'animate-haptic-pop' : 'scale-105'
                  }`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Layers className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'fusion' ? 'scale-110 drop-shadow-[0_0_6px_rgba(217,70,239,0.6)]' : ''}`} />
              {activeTab === 'fusion' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_6px_#e879f9] animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-mono tracking-tight mt-0.5">Fusion</span>
            {activeTab === 'fusion' && (
              <span className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-fuchsia-400 shadow-[0_0_4px_#e879f9]" />
            )}
          </button>

          {/* 4. Editor */}
          <button
            type="button"
            onTouchStart={(e) => handleNavPressStart('photo-editor', e)}
            onTouchEnd={() => handleNavPressEnd('photo-editor', true)}
            onTouchMove={handleNavPressMove}
            onMouseDown={(e) => handleNavPressStart('photo-editor', e)}
            onMouseUp={() => handleNavPressEnd('photo-editor', true)}
            onMouseLeave={() => handleNavPressEnd('photo-editor', false)}
            aria-label="Editor (Tap to open, hold for shortcuts)"
            className={`tap-haptic-responsive relative flex flex-col items-center justify-center min-w-[50px] min-h-[50px] py-1 px-2 rounded-xl transition-all duration-150 ease-out cursor-pointer active:scale-85 active:translate-y-0.5 active:bg-white/10 active:brightness-125 ${
              holdingNavTab === 'photo-editor' ? 'animate-hold-charge bg-cyan-500/20' : ''
            } ${
              activeTab === 'photo-editor'
                ? `text-cyan-300 font-bold bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.25)] ${
                    hapticTappedTab === 'photo-editor' ? 'animate-haptic-pop' : 'scale-105'
                  }`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <div className={`p-0.5 rounded-lg transition-colors ${activeTab === 'photo-editor' ? 'bg-cyan-500/20 border border-cyan-400/50' : ''}`}>
                <Wand2 className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${activeTab === 'photo-editor' ? 'scale-110 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]' : ''}`} />
              </div>
              {activeTab === 'photo-editor' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#67e8f9] animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-mono tracking-tight mt-0.5">Editor</span>
            {activeTab === 'photo-editor' && (
              <span className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_4px_#67e8f9]" />
            )}
          </button>

          {/* 5. Stars / Balance */}
          <button
            type="button"
            onTouchStart={(e) => handleNavPressStart('stars', e)}
            onTouchEnd={() => handleNavPressEnd('stars', true)}
            onTouchMove={handleNavPressMove}
            onMouseDown={(e) => handleNavPressStart('stars', e)}
            onMouseUp={() => handleNavPressEnd('stars', true)}
            onMouseLeave={() => handleNavPressEnd('stars', false)}
            aria-label="Credits (Tap to open, hold for shortcuts)"
            className={`tap-haptic-responsive relative flex flex-col items-center justify-center min-w-[50px] min-h-[50px] py-1 px-2 rounded-xl transition-all duration-150 ease-out cursor-pointer active:scale-85 active:translate-y-0.5 active:bg-white/10 active:brightness-125 ${
              holdingNavTab === 'stars' ? 'animate-hold-charge bg-amber-500/20' : ''
            } ${
              activeTab === 'stars'
                ? `text-amber-400 font-bold bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.25)] ${
                    hapticTappedTab === 'stars' ? 'animate-haptic-pop' : 'scale-105'
                  }`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <OgooStarIcon size={18} glow={activeTab === 'stars'} className={`transition-transform duration-200 ${activeTab === 'stars' ? 'scale-115' : ''}`} />
              {activeTab === 'stars' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-300 tracking-tight mt-0.5">₹{profile.stars}</span>
            {activeTab === 'stars' && (
              <span className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-amber-400 shadow-[0_0_4px_#fbbf24]" />
            )}
          </button>

          {/* 6. Tools */}
          <button
            type="button"
            onTouchStart={(e) => handleNavPressStart('tools', e)}
            onTouchEnd={() => handleNavPressEnd('tools', true)}
            onTouchMove={handleNavPressMove}
            onMouseDown={(e) => handleNavPressStart('tools', e)}
            onMouseUp={() => handleNavPressEnd('tools', true)}
            onMouseLeave={() => handleNavPressEnd('tools', false)}
            aria-label="Tools (Tap to open, hold for shortcuts)"
            className={`tap-haptic-responsive relative flex flex-col items-center justify-center min-w-[50px] min-h-[50px] py-1 px-2 rounded-xl transition-all duration-150 ease-out cursor-pointer active:scale-85 active:translate-y-0.5 active:bg-white/10 active:brightness-125 ${
              holdingNavTab === 'tools' ? 'animate-hold-charge bg-emerald-500/20' : ''
            } ${
              activeTab === 'tools'
                ? `text-emerald-400 font-bold bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.25)] ${
                    hapticTappedTab === 'tools' ? 'animate-haptic-pop' : 'scale-105'
                  }`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Boxes className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'tools' ? 'scale-110 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]' : ''}`} />
              {activeTab === 'tools' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-mono tracking-tight mt-0.5">Tools</span>
            {activeTab === 'tools' && (
              <span className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            )}
          </button>
        </nav>

        {/* Mobile Quick Action Long-Press Shortcuts Menu */}
        <MobileQuickActionMenu
          tab={quickActionTab}
          isOpen={isQuickActionOpen}
          onClose={() => setIsQuickActionOpen(false)}
          onSelectTab={setActiveTab}
          profile={profile}
          onQuickPrompt={(prompt) => {
            setActiveTab('chat');
            handleSendMessage(prompt);
          }}
          onToggleAudioSpeech={() => setAudioSpeechEnabled(!audioSpeechEnabled)}
          audioSpeechEnabled={audioSpeechEnabled}
          onClearChat={handleClearChat}
          onTopUpCredits={handleTopUpCredits}
        />
        {/* One-time Permission Popup for Sound & Music */}
        <AudioPermissionModal
          onChoice={(allowed) => {
            setAudioSpeechEnabled(allowed);
          }}
        />
      </div>
    </div>
  );
}
