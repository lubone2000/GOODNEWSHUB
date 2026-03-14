// Sunny Signals - App Version 1.0.1
import * as React from 'react';
import { useState, useEffect, ErrorInfo, ReactNode, Component } from 'react';
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  LayoutDashboard, 
  FileText, 
  Image as ImageIcon, 
  Download,
  RefreshCw,
  Plus,
  ChevronRight,
  ShieldCheck,
  Globe,
  Tag,
  Bookmark,
  Trash2,
  Zap,
  LogIn,
  LogOut,
  User as UserIcon,
  Video,
  Play,
  Clapperboard,
  Loader2,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService, klingService } from './services/geminiService';
import { Story, Source, Claim, ContentPackage } from './types';
import { auth, db, storage } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  getDocs,
  getDoc,
  writeBatch,
  increment
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';



interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends (Component as any) {
  public state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] p-8">
          <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-xl max-w-md w-full text-center space-y-6">
            <AlertCircle size={48} className="text-red-500 mx-auto" />
            <h2 className="text-2xl font-serif italic">Something went wrong</h2>
            <p className="text-sm text-[#141414]/60">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#141414] text-white rounded-full text-xs font-bold uppercase tracking-widest"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const CATEGORY_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  'Health Wins': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Climate Progress': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Wildlife Recovery': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'Science Breakthroughs': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Tech Helping People': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Local Community Wins': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Education Improvements': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Accessibility Progress': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Evergreen Facts': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'Historical Wins': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Default': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'saved' | 'detail' | 'studio' | 'visual' | 'export'>('feed');
  const [searchQuery, setSearchQuery] = useState('Sustainability and Innovation');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<(string | null)[]>([null, null, null]);
  const [activeVisualPrompt, setActiveVisualPrompt] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('Viral/Catchy');
  const [steeringInstruction, setSteeringInstruction] = useState<string>('');
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [showWebhookSettings, setShowWebhookSettings] = useState(false);
  const [estimatedSpend, setEstimatedSpend] = useState<number>(0);
  const [aiStatus, setAiStatus] = useState<'connected' | 'processing' | 'error'>('connected');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reelPlan, setReelPlan] = useState<any>(null);
  const [reelImages, setReelImages] = useState<(string | null)[]>([null, null, null, null]);
  const [reelVideos, setReelVideos] = useState<(string | null)[]>([null, null, null, null]);
  const [carouselImages, setCarouselImages] = useState<(string | null)[]>([null, null, null]);
  const [carouselLoadingStates, setCarouselLoadingStates] = useState<boolean[]>([false, false, false]);
  const [isGeneratingReel, setIsGeneratingReel] = useState(false);
  const [videoLoadingStates, setVideoLoadingStates] = useState<boolean[]>([false, false, false, false]);
  const [imageLoadingStates, setImageLoadingStates] = useState<boolean[]>([false, false, false, false]);
  const [customReelIdea, setCustomReelIdea] = useState<string>('');

  // Load/Save Spend from Firestore
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setEstimatedSpend(doc.data().estimated_spend || 0);
      } else {
        // Initialize user doc if it doesn't exist
        setDoc(userRef, { 
          email: user.email, 
          displayName: user.displayName, 
          estimated_spend: 0,
          created_at: serverTimestamp() 
        }, { merge: true });
      }
    });
    return () => unsubscribe();
  }, [user]);

  const trackUsage = async (cost: number) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        estimated_spend: increment(cost)
      });
    } catch (error) {
      console.error("Failed to track usage", error);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user) {
      setStories([]);
      setWebhooks([]);
      return;
    }

    // Stories Listener
    const storiesQuery = query(
      collection(db, 'stories'),
      where('uid', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    const unsubscribeStories = onSnapshot(storiesQuery, (snapshot) => {
      const storyData = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id } as unknown as Story));
      setStories(storyData);
    }, (error) => {
      console.error("Firestore Stories Error:", error);
    });

    // Webhooks Listener
    const webhooksQuery = query(
      collection(db, 'webhooks'),
      where('uid', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    const unsubscribeWebhooks = onSnapshot(webhooksQuery, (snapshot) => {
      const webhookData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setWebhooks(webhookData);
    }, (error) => {
      console.error("Firestore Webhooks Error:", error);
    });

    return () => {
      unsubscribeStories();
      unsubscribeWebhooks();
    };
  }, [user]);

  const filteredStories = stories.filter(s => {
    const categoryMatch = !selectedCategory || s.category === selectedCategory;
    const regionMatch = !selectedRegion || (s.region && s.region.toLowerCase().includes(selectedRegion.toLowerCase()));
    return categoryMatch && regionMatch;
  });

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Try popup first
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed", error);
      
      if (error.code === 'auth/network-request-failed') {
        const retry = confirm("Login failed due to a network error. This is often caused by ad-blockers or tracking protection. Would you like to try the 'Redirect' method instead?");
        if (retry) {
          try {
            const provider = new GoogleAuthProvider();
            await signInWithRedirect(auth, provider);
          } catch (redirectError: any) {
            alert(`Redirect login failed: ${redirectError.message}`);
          }
        }
      } else if (error.code === 'auth/popup-blocked') {
        alert("The login popup was blocked by your browser. Please allow popups or try again.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert(`This domain (${window.location.hostname}) is not authorized in Firebase. Please add it to 'Authorized Domains' in the Firebase Console.`);
      } else {
        alert(`Login error: ${error.message}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSelectedStoryId(null);
      setSelectedStory(null);
      setActiveTab('feed');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newWebhookName || !newWebhookUrl) return;
    try {
      await addDoc(collection(db, 'webhooks'), {
        name: newWebhookName,
        url: newWebhookUrl,
        uid: user.uid,
        active: true,
        created_at: serverTimestamp()
      });
      setNewWebhookName('');
      setNewWebhookUrl('');
    } catch (error) {
      console.error("Failed to add webhook", error);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'webhooks', id));
    } catch (error) {
      console.error("Failed to delete webhook", error);
    }
  };

  const handlePushToWebhook = async (webhook: any) => {
    if (!selectedStory || !webhook) return;
    setLoading(true);
    try {
      const payload = {
        event: "story_published",
        story: {
          id: selectedStory.id,
          title: selectedStory.title,
          summary: selectedStory.summary,
          category: selectedStory.category,
          region: selectedStory.region
        },
        content: selectedStory.packages?.map((p: any) => ({
          platform: p.platform,
          headline: p.headline,
          copy: p.copy,
          visual_prompt: p.visual_prompt,
          image_url: p.image_url
        }))
      };

      const res = await fetch('/api/webhooks/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhook.url, payload })
      });
      const data = await res.json();
      if (data.success) {
        alert("Webhook fired successfully!");
        handlePublish();
      } else {
        alert("Webhook failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to push to webhook", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async (queryOverride?: any) => {
    if (!user) return;
    setLoading(true);
    setAiStatus('processing');
    const currentQuery = typeof queryOverride === 'string' ? queryOverride : searchQuery;
    const fullQuery = selectedRegion ? `${currentQuery} in ${selectedRegion}` : currentQuery;
    try {
      const existingTitles = stories.map(s => s.title);
      const newStories = await geminiService.discoverNews(fullQuery, existingTitles);
      
      if (newStories && newStories.length > 0) {
        await trackUsage(0.001); // Estimated cost for discovery
        const batch = writeBatch(db);
        
        for (const story of newStories) {
          const storyRef = doc(collection(db, 'stories'));
          batch.set(storyRef, {
            ...story,
            uid: user.uid,
            status: 'pending',
            verified_score: 0,
            is_saved: false,
            created_at: serverTimestamp()
          });

          // Add sources as subcollection
          if (story.sources) {
            for (const source of story.sources) {
              const sourceRef = doc(collection(storyRef, 'sources'));
              batch.set(sourceRef, { ...source, created_at: serverTimestamp() });
            }
          }
        }
        await batch.commit();
      } else {
        alert(`No new stories found for "${fullQuery}". Try a more specific topic or one of the Content Pillars!`);
      }
      setAiStatus('connected');
    } catch (error) {
      console.error("Discovery failed", error);
      setAiStatus('error');
      alert("Something went wrong during discovery.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (docId: string, isSaved: boolean) => {
    try {
      await updateDoc(doc(db, 'stories', docId), { is_saved: !isSaved });
    } catch (error) {
      console.error("Failed to save story", error);
      alert("Failed to save story. Please check your connection.");
    }
  };

  const handleDeleteStory = async (docId: string) => {
    if (!confirm("Are you sure you want to remove this story from your feed?")) return;
    try {
      await deleteDoc(doc(db, 'stories', docId));
      if (selectedStoryId === docId) {
        setSelectedStoryId(null);
        setSelectedStory(null);
        setActiveTab('feed');
      }
    } catch (error) {
      console.error("Failed to delete story", error);
      alert("Failed to delete story.");
    }
  };

  const handleSelectStory = async (id: string, shouldSwitchTab: boolean = true) => {
    setSelectedStoryId(id);
    setLoading(true);
    try {
      // Find the story in the local list first for quick access to docId
      const localStory = stories.find(s => s.docId === id || s.id === id);
      const docId = localStory?.docId || id;
      
      const storyRef = doc(db, 'stories', docId);
      
      // Fetch the main story document directly to ensure we have the latest status/scores
      const storySnap = await getDoc(storyRef);
      if (!storySnap.exists()) {
        console.error("Story document not found");
        return;
      }
      
      const storyData = { ...storySnap.data(), docId: storySnap.id };
      
      // Fetch subcollections
      const sourcesSnap = await getDocs(collection(storyRef, 'sources'));
      const claimsSnap = await getDocs(collection(storyRef, 'claims'));
      const packagesSnap = await getDocs(collection(storyRef, 'packages'));

      const fullStory = {
        ...storyData,
        sources: sourcesSnap.docs.map(d => d.data()),
        claims: claimsSnap.docs.map(d => d.data()),
        packages: packagesSnap.docs.map(d => ({ ...d.data(), docId: d.id }))
      };

      setSelectedStory(fullStory);
      if (shouldSwitchTab) {
        setActiveTab('detail');
      }
    } catch (error) {
      console.error("Error selecting story:", error);
      alert("Failed to load story details. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedStory || !user) return;
    
    if (!selectedStory.docId) {
      console.error("Cannot verify story: missing docId", selectedStory);
      alert("This story record is incomplete and cannot be verified. Please try discovering it again.");
      return;
    }

    setLoading(true);
    setAiStatus('processing');
    try {
      console.log("Starting verification for story:", selectedStory.docId);
      const sources = selectedStory.sources || [];
      const verification = await geminiService.verifyStory(selectedStory, sources);
      
      if (!verification) {
        console.error("Verification agent returned null for story:", selectedStory.docId);
        alert("The AI agent was unable to verify this story. This can happen if sources are unreachable or the topic is too obscure. Please try again or check the sources.");
        setLoading(false);
        setAiStatus('connected');
        return;
      }

      await trackUsage(0.005); // Estimated cost for deep verification
      
      const storyRef = doc(db, 'stories', selectedStory.docId);
      const batch = writeBatch(db);
      
      batch.update(storyRef, {
        verified_score: verification.score,
        editorial_scores: verification.editorial_scores,
        proof_assets: verification.proof_assets,
        status: 'verified'
      });

      // Clear old claims and add new ones
      const oldClaims = await getDocs(collection(storyRef, 'claims'));
      oldClaims.forEach(d => batch.delete(d.ref));

      for (const claim of verification.claims) {
        const claimRef = doc(collection(storyRef, 'claims'));
        batch.set(claimRef, {
          claim_text: claim.text,
          evidence_status: claim.status,
          created_at: serverTimestamp()
        });
      }

      await batch.commit();
      await handleSelectStory(selectedStory.docId, false);
      setAiStatus('connected');
    } catch (error) {
      console.error("Verification failed", error);
      setAiStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async (platform: 'tiktok' | 'instagram') => {
    if (!selectedStory || !user) return;
    setIsGenerating(true);
    setAiStatus('processing');
    try {
      console.log(`Requesting ${platform} content generation for story ID: ${selectedStory.docId}...`);
      if (!selectedStory.docId) {
        console.error("No docId found on selectedStory", selectedStory);
        alert("Error: Story ID is missing. Please try re-selecting the story from the feed.");
        setLoading(false);
        return;
      }

      const options = await geminiService.generateContent(
        selectedStory, 
        selectedStory.claims || [], 
        platform, 
        selectedStyle, 
        steeringInstruction,
        customReelIdea
      );
      
      console.log(`AI Response options:`, options);
      
      if (options) {
        console.log(`Received content options. Saving to Firestore...`);
        const storyRef = doc(db, 'stories', selectedStory.docId);
        const batch = writeBatch(db);

        const packagesToSave = Array.isArray(options) ? options : [options];

        for (const pkg of packagesToSave) {
          const pkgRef = doc(collection(storyRef, 'packages'));
          
          // Ensure prompt_variations are handled if present
          const carousel = pkg.carousel ? {
            ...pkg.carousel,
            slides: pkg.carousel.slides.map((s: any) => ({
              ...s,
              prompt_variations: s.prompt_variations || []
            }))
          } : null;

          const reel = pkg.reel ? {
            ...pkg.reel,
            shots: pkg.reel.shots.map((s: any) => ({
              ...s,
              prompt_variations: s.prompt_variations || []
            }))
          } : null;

          batch.set(pkgRef, {
            platform,
            format: pkg.format || 'unknown',
            hook: pkg.hook || '',
            script: pkg.script || '',
            visual_description: pkg.visual_description || '',
            carousel,
            reel,
            created_at: serverTimestamp()
          });
        }
        await batch.commit();
        console.log("Batch commit successful.");
        
        // Optimistically update local state to provide immediate feedback
        const newPackages = packagesToSave.map(pkg => ({
          ...pkg,
          platform,
          docId: `temp-${Date.now()}-${Math.random()}`,
          created_at: new Date()
        }));

        setSelectedStory((prev: any) => {
          if (!prev) return prev;
          const updatedPackages = [...(prev.packages || []), ...newPackages];
          console.log("Updating local state with new packages:", updatedPackages.length);
          return {
            ...prev,
            packages: updatedPackages
          };
        });

        // Re-fetch from server after a short delay to ensure consistency
        setTimeout(() => {
          console.log("Performing background re-sync...");
          handleSelectStory(selectedStory.docId, false);
        }, 3000);
      } else {
        console.warn("No options returned from geminiService.generateContent");
        alert("The AI was unable to generate content for this story. This can happen if the story content is too short or restricted. Please try again or adjust your steering instructions.");
      }
      setAiStatus('connected');
    } catch (error) {
      console.error("Content generation failed with error:", error);
      setAiStatus('error');
      alert(`Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdatePrompt = async (packageDocId: string, type: 'carousel' | 'reel', index: number, newPrompt: string) => {
    if (!selectedStory || !user) return;
    try {
      const pkgRef = doc(db, 'stories', selectedStory.docId, 'packages', packageDocId);
      const pkg = selectedStory.packages.find((p: any) => p.docId === packageDocId);
      if (!pkg) return;

      const updatedPkg = { ...pkg };
      if (type === 'carousel' && updatedPkg.carousel) {
        updatedPkg.carousel.slides[index].visual_prompt = newPrompt;
      } else if (type === 'reel' && updatedPkg.reel) {
        updatedPkg.reel.shots[index].image_prompt = newPrompt;
      }

      await updateDoc(pkgRef, {
        carousel: updatedPkg.carousel || null,
        reel: updatedPkg.reel || null
      });

      handleSelectStory(selectedStory.docId, false);
    } catch (error) {
      console.error("Failed to update prompt", error);
    }
  };

  const handleGeneratePromptVariations = async (packageDocId: string, type: 'carousel' | 'reel', index: number, basePrompt: string) => {
    if (!selectedStory || !user) return;
    setAiStatus('processing');
    try {
      const variations = await geminiService.generatePromptVariations(basePrompt);
      if (variations && variations.length > 0) {
        const pkgRef = doc(db, 'stories', selectedStory.docId, 'packages', packageDocId);
        const pkg = selectedStory.packages.find((p: any) => p.docId === packageDocId);
        if (!pkg) return;

        const updatedPkg = { ...pkg };
        if (type === 'carousel' && updatedPkg.carousel) {
          updatedPkg.carousel.slides[index].prompt_variations = variations;
        } else if (type === 'reel' && updatedPkg.reel) {
          updatedPkg.reel.shots[index].prompt_variations = variations;
        }

        await updateDoc(pkgRef, {
          carousel: updatedPkg.carousel || null,
          reel: updatedPkg.reel || null
        });

        handleSelectStory(selectedStory.docId, false);
      }
      setAiStatus('connected');
    } catch (error) {
      console.error("Failed to generate variations", error);
      setAiStatus('error');
    }
  };

  const handlePublish = async () => {
    if (!selectedStory) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'stories', selectedStory.docId), { status: 'published' });
      setSelectedStory({ ...selectedStory, status: 'published' });
    } catch (error) {
      console.error("Failed to publish story", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearPackages = async (platform: string) => {
    if (!selectedStory) return;
    setLoading(true);
    try {
      const storyRef = doc(db, 'stories', selectedStory.docId);
      const packagesSnap = await getDocs(query(collection(storyRef, 'packages'), where('platform', '==', platform)));
      const batch = writeBatch(db);
      packagesSnap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      handleSelectStory(selectedStory.docId, false);
    } catch (error) {
      console.error("Failed to clear packages", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    if (!user) return;
    setLoading(true);
    setAiStatus('processing');
    setGeneratedImages([null, null, null]);
    try {
      // Add a timeout for the whole batch
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Batch generation timed out")), 70000)
      );
      
      const generationPromise = (async () => {
        const promises = [0, 1, 2].map(i => geminiService.generateImage(prompt, i));
        return await Promise.all(promises);
      })();

      const results = await Promise.race([generationPromise, timeoutPromise]) as (string | null)[];
      
      await trackUsage(0.03); // Estimated cost for 3 image generations (0.01 each)
      setGeneratedImages(results);
      setAiStatus('connected');
    } catch (error) {
      console.error("Image generation failed", error);
      setAiStatus('error');
      alert("Image generation timed out or failed. Please try a simpler prompt.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReelPlan = async () => {
    if (!selectedStory && !customReelIdea) return;
    setIsGeneratingReel(true);
    try {
      const plan = await geminiService.generateReelPlan(customReelIdea || selectedStory);
      setReelPlan(plan);
      setReelImages([null, null, null, null]);
      setReelVideos([null, null, null, null]);
    } catch (error) {
      console.error("Failed to generate reel plan", error);
    } finally {
      setIsGeneratingReel(false);
    }
  };

  const handleGenerateCarouselImage = async (idx: number, prompt: string) => {
    if (!user) return;
    setCarouselLoadingStates(prev => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
    try {
      const imageUrl = await geminiService.generateImage(prompt, idx);
      setCarouselImages(prev => {
        const next = [...prev];
        next[idx] = imageUrl;
        return next;
      });
    } catch (error) {
      console.error("Failed to generate carousel image", error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setCarouselLoadingStates(prev => {
        const next = [...prev];
        next[idx] = false;
        return next;
      });
    }
  };

  const handleGenerateReelImage = async (shotIndex: number) => {
    if (!reelPlan) return;
    const newImageLoadingStates = [...imageLoadingStates];
    newImageLoadingStates[shotIndex] = true;
    setImageLoadingStates(newImageLoadingStates);
    
    try {
      const prompt = reelPlan.shots[shotIndex].image_prompt;
      const img = await geminiService.generateImage(prompt, shotIndex);
      const newReelImages = [...reelImages];
      newReelImages[shotIndex] = img;
      setReelImages(newReelImages);
    } catch (error) {
      console.error("Failed to generate reel image", error);
    } finally {
      setImageLoadingStates(prev => {
        const next = [...prev];
        next[shotIndex] = false;
        return next;
      });
    }
  };

  const handleGenerateReelVideo = async (shotIndex: number) => {
    if (!reelPlan) return;
    const newVideoLoadingStates = [...videoLoadingStates];
    newVideoLoadingStates[shotIndex] = true;
    setVideoLoadingStates(newVideoLoadingStates);

    try {
      const prompt = reelPlan.shots[shotIndex].image_prompt;
      const imageBase64 = reelImages[shotIndex];
      // Use klingService for video generation
      const videoUrl = await klingService.generateVideo(prompt, imageBase64 || undefined);
      const newReelVideos = [...reelVideos];
      newReelVideos[shotIndex] = videoUrl;
      setReelVideos(newReelVideos);
    } catch (error) {
      console.error("Failed to generate reel video", error);
    } finally {
      setVideoLoadingStates(prev => {
        const next = [...prev];
        next[shotIndex] = false;
        return next;
      });
    }
  };

  const handleSaveImageToPackage = async (imageUrl: string, packageDocId: string) => {
    if (!selectedStory || !user) return;
    setLoading(true);
    try {
      // Create a timeout for the upload process
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Upload timed out")), 30000)
      );

      const uploadPromise = (async () => {
        // Upload to Firebase Storage
        const storageRef = ref(storage, `visuals/${user.uid}/${selectedStory.docId}/${packageDocId}.png`);
        await uploadString(storageRef, imageUrl, 'data_url');
        return await getDownloadURL(storageRef);
      })();

      const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]) as string;

      // Update package in Firestore
      await updateDoc(doc(db, 'stories', selectedStory.docId, 'packages', packageDocId), {
        image_url: downloadUrl
      });

      alert("Image saved to content package!");
      handleSelectStory(selectedStory.docId, false);
    } catch (error) {
      console.error("Failed to save image", error);
      alert("Failed to save image. The file might be too large or the connection timed out.");
    } finally {
      setLoading(false);
    }
  };

  const PromptEditor = ({ 
    packageDocId, 
    type, 
    index, 
    currentPrompt, 
    variations = [] 
  }: { 
    packageDocId: string, 
    type: 'carousel' | 'reel', 
    index: number, 
    currentPrompt: string, 
    variations?: string[] 
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState(currentPrompt);
    const [showVariations, setShowVariations] = useState(false);

    return (
      <div className="space-y-3 pt-4 border-t border-[#141414]/5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Visual Prompt</p>
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:underline"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            <button 
              onClick={() => handleGeneratePromptVariations(packageDocId, type, index, currentPrompt)}
              className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:underline"
            >
              Get Variations
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea 
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="w-full p-3 bg-white rounded-xl border border-[#141414]/10 text-[10px] outline-none focus:border-[#141414]/40 min-h-[80px]"
            />
            <button 
              onClick={() => {
                handleUpdatePrompt(packageDocId, type, index, editedPrompt);
                setIsEditing(false);
              }}
              className="w-full py-2 bg-[#141414] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
            >
              Save Prompt
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-[#141414]/60 italic line-clamp-3">{currentPrompt}</p>
        )}

        {variations.length > 0 && (
          <div className="space-y-2">
            <button 
              onClick={() => setShowVariations(!showVariations)}
              className="flex items-center text-[8px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100"
            >
              <RefreshCw size={8} className={`mr-1 ${showVariations ? 'rotate-180' : ''} transition-transform`} />
              {showVariations ? 'Hide Variations' : `Show ${variations.length} Variations`}
            </button>
            
            {showVariations && (
              <div className="space-y-2 pl-2 border-l-2 border-[#141414]/5">
                {variations.map((v, i) => (
                  <button 
                    key={i}
                    onClick={() => handleUpdatePrompt(packageDocId, type, index, v)}
                    className="block w-full text-left p-2 bg-white rounded-lg border border-[#141414]/5 text-[8px] italic text-[#141414]/60 hover:border-indigo-500 transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <RefreshCw className="animate-spin text-[#141414]" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] p-8">
        <div className="bg-white p-12 rounded-[3rem] border border-[#141414]/5 shadow-2xl max-w-lg w-full text-center space-y-8">
          <div className="w-20 h-20 bg-[#141414] rounded-3xl flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-xl">
            GS
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-serif italic">Good News Studio</h1>
            <p className="text-[#141414]/60">Your AI-powered newsroom for positive impact.</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all flex items-center justify-center space-x-3"
          >
            <LogIn size={18} />
            <span>Sign in with Google</span>
          </button>
          <p className="text-[10px] uppercase tracking-widest opacity-30 font-bold">Secure Cloud Persistence Enabled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-white border-r border-[#141414]/10 flex flex-col items-center py-8 space-y-8 z-50">
        <div className="w-12 h-12 bg-[#141414] rounded-xl flex items-center justify-center text-white font-bold text-xl">
          GS
        </div>
        <div className="flex flex-col space-y-6">
          <NavIcon icon={<LayoutDashboard size={24} />} active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} label="Feed" />
          <NavIcon icon={<Bookmark size={24} />} active={activeTab === 'saved'} onClick={() => setActiveTab('saved')} label="Saved" />
          <NavIcon icon={<FileText size={24} />} active={activeTab === 'detail'} onClick={() => setActiveTab('detail')} disabled={!selectedStoryId} label="Detail" />
          <NavIcon icon={<Plus size={24} />} active={activeTab === 'studio'} onClick={() => setActiveTab('studio')} disabled={!selectedStoryId} label="Studio" />
          <NavIcon icon={<ImageIcon size={24} />} active={activeTab === 'visual'} onClick={() => setActiveTab('visual')} disabled={!selectedStoryId} label="Visual" />
          <NavIcon icon={<Download size={24} />} active={activeTab === 'export'} onClick={() => setActiveTab('export')} disabled={!selectedStoryId} label="Export" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 min-h-screen">
        <header className="h-20 border-b border-[#141414]/10 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
          <h1 className="text-xl font-medium italic serif">
            {activeTab === 'feed' && "Today's Good News Feed"}
            {activeTab === 'saved' && "Saved Stories"}
            {activeTab === 'detail' && "Evidence Hub"}
            {activeTab === 'studio' && "Content Studio"}
            {activeTab === 'visual' && "Visual Studio"}
            {activeTab === 'export' && "Export Center"}
          </h1>
          <div className="flex items-center space-x-6">
            <div className="hidden sm:block">
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-20 bg-[#141414]/5 px-2 py-1 rounded">v0.0.4-PROD</span>
            </div>
            {/* AI Status & Spend */}
            <div className="hidden md:flex items-center space-x-4 px-4 py-2 bg-[#141414]/5 rounded-full border border-[#141414]/5">
              <div className="flex items-center space-x-2 border-r border-[#141414]/10 pr-4">
                <div className={`w-2 h-2 rounded-full ${
                  aiStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                  aiStatus === 'processing' ? 'bg-amber-500 animate-pulse' : 
                  'bg-rose-500'
                }`} />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  AI {aiStatus === 'connected' ? 'Online' : aiStatus === 'processing' ? 'Thinking' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Est. Spend:</span>
                <span className="text-[10px] font-mono font-bold text-emerald-600">€{estimatedSpend.toFixed(3)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 px-4 py-2 bg-[#F5F5F0] rounded-full border border-[#141414]/5">
              <div className="w-6 h-6 bg-[#141414] rounded-full flex items-center justify-center text-white text-[10px]">
                {user.displayName?.[0] || 'U'}
              </div>
              <span className="text-xs font-medium">{user.displayName}</span>
              <button 
                onClick={handleLogout}
                className="p-1 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
            {activeTab === 'feed' && (
              <div className="flex items-center space-x-2">
                <select 
                  value={selectedRegion || ''} 
                  onChange={(e) => setSelectedRegion(e.target.value || null)}
                  className="bg-[#F5F5F0] border border-[#141414]/5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-[#141414]/20"
                >
                  <option value="">All Regions</option>
                  <option value="Global">Global</option>
                  <option value="Africa">Africa</option>
                  <option value="Asia">Asia</option>
                  <option value="Europe">Europe</option>
                  <option value="North America">North America</option>
                  <option value="South America">South America</option>
                  <option value="Oceania">Oceania</option>
                </select>
                <div className="flex items-center bg-[#F5F5F0] rounded-full px-4 py-2 border border-[#141414]/5 relative group">
                  <Search size={18} className="text-[#141414]/40 mr-2" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics..."
                    className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 pr-8"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-24 p-1 hover:text-red-500 transition-colors"
                      title="Clear search"
                    >
                      <Plus size={14} className="rotate-45" />
                    </button>
                  )}
                  <button 
                    id="discover-btn"
                    onClick={handleDiscover}
                    disabled={loading}
                    className="ml-4 text-xs font-bold uppercase tracking-wider hover:opacity-70 disabled:opacity-30 whitespace-nowrap"
                  >
                    {loading ? 'Searching...' : 'Discover'}
                  </button>
                </div>
              </div>
            )}
            <div className="text-xs font-mono opacity-50">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'feed' && (
            <>
              <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/30 self-center mr-2">Content Pillars:</span>
                {['Health Wins', 'Climate Progress', 'Wildlife Recovery', 'Science Breakthroughs', 'Tech Helping People', 'Local Community Wins', 'Education Improvements', 'Accessibility Progress', 'Evergreen Facts', 'Historical Wins'].map(q => (
                  <button
                    key={q}
                    onClick={() => { 
                      setSearchQuery(q);
                      handleDiscover(q);
                    }}
                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#141414]/5 text-[#141414]/60 hover:bg-[#141414] hover:text-white transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${!selectedCategory ? 'bg-[#141414] text-white border-[#141414]' : 'bg-white text-[#141414]/40 border-[#141414]/10 hover:border-[#141414]/40'}`}
              >
                All Topics
              </button>
              {Object.keys(CATEGORY_COLORS).filter(c => c !== 'Default').map(category => (
                <button 
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${selectedCategory === category ? 'bg-[#141414] text-white border-[#141414]' : 'bg-white text-[#141414]/40 border-[#141414]/10 hover:border-[#141414]/40'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'feed' && (
              <motion.div 
                key="feed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredStories.map((story: Story) => (
                  <StoryCard 
                    key={story.docId || story.id} 
                    story={story} 
                    onClick={() => { handleSelectStory(story.docId || story.id); }}
                    onSave={(e: any) => { e.stopPropagation(); handleSave(story.docId || story.id, !!story.is_saved); }}
                    onDelete={(e: any) => { e.stopPropagation(); handleDeleteStory(story.docId || story.id); }}
                    active={selectedStoryId === (story.docId || story.id)}
                  />
                ))}
                {filteredStories.length === 0 && !loading && (
                  <div className="col-span-full py-32 text-center space-y-6">
                    <div className="w-16 h-16 bg-[#141414]/5 rounded-full flex items-center justify-center mx-auto">
                      <Search size={32} className="opacity-20" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-serif italic opacity-60">Your newsroom is currently empty.</p>
                      <p className="text-sm opacity-40 max-w-xs mx-auto leading-relaxed">
                        Click the <span className="font-bold">Discover</span> button in the header to find today's most inspiring stories.
                      </p>
                    </div>
                    <button 
                      onClick={handleDiscover}
                      className="px-8 py-3 bg-[#141414] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all"
                    >
                      Start Discovery
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'saved' && (
              <motion.div 
                key="saved"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {stories.filter(s => s.is_saved).map((story: Story) => (
                  <StoryCard 
                    key={story.docId || story.id} 
                    story={story} 
                    onClick={() => { handleSelectStory(story.docId || story.id); }}
                    onSave={(e: any) => { e.stopPropagation(); handleSave(story.docId || story.id, !!story.is_saved); }}
                    onDelete={(e: any) => { e.stopPropagation(); handleDeleteStory(story.docId || story.id); }}
                    active={selectedStoryId === (story.docId || story.id)}
                  />
                ))}
                {stories.filter(s => s.is_saved).length === 0 && (
                  <div className="col-span-full py-32 text-center space-y-6">
                    <div className="w-16 h-16 bg-[#141414]/5 rounded-full flex items-center justify-center mx-auto">
                      <Bookmark size={32} className="opacity-20" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-serif italic opacity-60">Your library is empty.</p>
                      <p className="text-sm opacity-40 max-w-xs mx-auto leading-relaxed">
                        Save stories from the feed to build your content pipeline.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'detail' && selectedStory && (
              <motion.div 
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-3xl p-8 border border-[#141414]/5 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 bg-[#141414] text-white text-[10px] uppercase font-bold rounded tracking-widest">
                          {selectedStory.category}
                        </span>
                        {selectedStory.status === 'verified' && (
                          <span className="px-2 py-1 bg-emerald-500 text-white text-[10px] uppercase font-bold rounded tracking-widest flex items-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                            <ShieldCheck size={12} className="mr-1" /> Verified Story
                          </span>
                        )}
                        <span className="text-xs opacity-50 flex items-center">
                          <Globe size={12} className="mr-1" /> {selectedStory.region}
                        </span>
                      </div>
                      <h2 className="text-3xl font-medium mb-4">{selectedStory.title}</h2>
                      <p className="text-[#141414]/70 leading-relaxed max-w-3xl">{selectedStory.summary}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-mono font-light mb-1">{selectedStory.verified_score}</div>
                      <div className="text-[10px] uppercase font-bold tracking-widest opacity-40">Verified Score</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button 
                      onClick={handleVerify}
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-3 bg-[#141414] text-white rounded-full hover:bg-opacity-90 transition-all disabled:opacity-50"
                    >
                      <ShieldCheck size={20} />
                      <span>{loading ? 'Verifying...' : 'Run Verification Agent'}</span>
                    </button>
                    <button 
                      onClick={() => handleSave(selectedStory.docId, !!selectedStory.is_saved)}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-full border transition-all ${selectedStory.is_saved ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-[#141414] text-[#141414] hover:bg-[#F5F5F0]'}`}
                    >
                      <Bookmark size={20} className={selectedStory.is_saved ? 'fill-current' : ''} />
                      <span>{selectedStory.is_saved ? 'Saved to Library' : 'Save to Library'}</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (!selectedStory.is_saved) {
                          handleSave(selectedStory.docId, false);
                        }
                        setActiveTab('studio');
                      }}
                      className="flex items-center space-x-2 px-6 py-3 bg-white border border-[#141414] text-[#141414] rounded-full hover:bg-[#F5F5F0] transition-all"
                    >
                      <Plus size={20} />
                      <span>Add to Studio</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Trend & Engagement Layer */}
                    {selectedStory.trend_signal && (
                      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-indigo-600">
                            <Zap size={18} className="fill-current" />
                            <h3 className="text-sm font-bold uppercase tracking-widest">Trend Signal</h3>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Engagement</span>
                              <span className="text-xs font-mono font-bold text-indigo-600">{selectedStory.engagement_score || 0}/10</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Visual</span>
                              <span className="text-xs font-mono font-bold text-rose-600">{selectedStory.visual_score || 0}/10</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm font-serif italic text-indigo-900 leading-relaxed border-l-2 border-indigo-200 pl-4">
                          "{selectedStory.trend_signal}"
                        </p>
                      </div>
                    )}

                    <div className="space-y-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Verified Claims</h3>
                      <div className="space-y-4">
                        {selectedStory.claims?.map((claim: any, i: number) => (
                          <div key={i} className="bg-white p-4 rounded-2xl border border-[#141414]/5 flex items-start space-x-4">
                            <div className={`mt-1 ${claim.evidence_status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {claim.evidence_status === 'verified' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            </div>
                            <p className="text-sm leading-relaxed">{claim.claim_text}</p>
                          </div>
                        ))}
                        {(!selectedStory.claims || selectedStory.claims.length === 0) && (
                          <p className="italic opacity-40 text-sm">No claims extracted yet. Run verification.</p>
                        )}
                      </div>
                    </div>

                    {selectedStory.status !== 'verified' && (
                      <div className="bg-[#F5F5F0] p-8 rounded-3xl border border-dashed border-[#141414]/10 text-center space-y-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                          <ShieldCheck size={24} className="opacity-20" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold uppercase tracking-widest opacity-40">Verification Required</p>
                          <p className="text-xs opacity-40 max-w-xs mx-auto">Run the Verification Agent to generate the Confidence Meter, Source Badges, and Claim Cards.</p>
                        </div>
                      </div>
                    )}

                    {selectedStory.status === 'verified' && selectedStory.proof_assets && (
                      <div className="space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">On-Screen Proof Layer</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#141414] text-white p-6 rounded-3xl space-y-4">
                            <div className="flex items-center space-x-2 text-emerald-400">
                              <ShieldCheck size={16} />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Confidence Meter</span>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-400 transition-all duration-1000" 
                                style={{ width: `${selectedStory.verified_score}%` }}
                              />
                            </div>
                            <p className="text-xs opacity-60 leading-relaxed italic">
                              {selectedStory.proof_assets.verification_summary}
                            </p>
                          </div>

                          <div className="bg-white p-6 rounded-3xl border border-[#141414]/5 space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Source Badges</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedStory.proof_assets.source_badges?.map((badge: string, i: number) => (
                                <span key={i} className="px-3 py-1 bg-[#F5F5F0] rounded-full text-[10px] font-bold uppercase tracking-widest text-[#141414]/60">
                                  {badge}
                                </span>
                              ))}
                              {(!selectedStory.proof_assets.source_badges || selectedStory.proof_assets.source_badges.length === 0) && (
                                <span className="text-[10px] opacity-40 italic">No badges identified</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedStory.proof_assets.claim_cards?.map((card: string, i: number) => (
                            <div key={i} className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-center space-y-2">
                              <p className="text-sm font-serif italic text-emerald-900">"{card}"</p>
                              <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-600/50">Verified Claim Card</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    {selectedStory.status !== 'verified' && (
                      <div className="bg-white p-6 rounded-3xl border border-[#141414]/5 space-y-4 opacity-50">
                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Editorial Potential</h3>
                        <p className="text-[10px] italic">Scores will be generated after verification.</p>
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-1 w-full bg-[#F5F5F0] rounded-full" />
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedStory.status === 'verified' && selectedStory.editorial_scores && (
                      <div className="bg-white p-6 rounded-3xl border border-[#141414]/5 space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Editorial Potential</h3>
                        <div className="space-y-4">
                          {[
                            { label: 'Novelty', value: selectedStory.editorial_scores.novelty },
                            { label: 'Emotional Lift', value: selectedStory.editorial_scores.emotional_lift },
                            { label: 'Shareability', value: selectedStory.editorial_scores.shareability },
                            { label: 'Visual Potential', value: selectedStory.editorial_scores.visual_potential },
                            { label: 'Audience Fit', value: selectedStory.editorial_scores.audience_fit },
                            { label: 'Shelf Life', value: selectedStory.editorial_scores.shelf_life },
                            { label: 'Explainer Needed', value: selectedStory.editorial_scores.explainer_needed },
                          ].map((score, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="opacity-40">{score.label}</span>
                                <span>{score.value || 0}/10</span>
                              </div>
                              <div className="h-1 w-full bg-[#F5F5F0] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-1000 ${(score.value || 0) > 7 ? 'bg-emerald-400' : (score.value || 0) > 4 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                  style={{ width: `${(score.value || 0) * 10}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Evidence Sources</h3>
                      <div className="space-y-4">
                        {selectedStory.sources?.map((source: any, i: number) => (
                          <a 
                            key={i} 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block bg-white p-4 rounded-2xl border border-[#141414]/5 hover:border-[#141414]/20 transition-all group"
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-medium group-hover:underline">{source.title}</h4>
                              <ExternalLink size={14} className="opacity-30" />
                            </div>
                            <p className="text-xs opacity-40 mt-1 truncate">{source.url}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'studio' && selectedStory && (
              <motion.div 
                key="studio"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-8"
              >
                <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm space-y-8">
                  <div className="pb-6 border-b border-[#141414]/5">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-0.5 rounded bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest">
                        {selectedStory.category}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Content Studio</span>
                    </div>
                    <h2 className="text-2xl font-medium leading-tight">{selectedStory.title}</h2>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">1. Select Tone & Style</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Viral/Catchy', 'Emotional', 'Excited', 'Storyteller', 'Professional'].map(style => (
                        <button
                          key={style}
                          onClick={() => setSelectedStyle(style)}
                          className={`px-6 py-2 rounded-full border transition-all text-sm font-medium ${selectedStyle === style ? 'bg-[#141414] text-white border-[#141414]' : 'bg-white text-[#141414]/40 border-[#141414]/10 hover:border-[#141414]/40'}`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">2. Steering Instructions (Optional)</h3>
                    <div className="relative">
                      <input 
                        type="text"
                        value={steeringInstruction}
                        onChange={(e) => setSteeringInstruction(e.target.value)}
                        placeholder="e.g. 'Make it shorter', 'Focus more on the animal rescue'..."
                        className="w-full p-4 bg-[#F5F5F0] rounded-2xl border border-[#141414]/10 text-sm outline-none focus:border-[#141414]/40 transition-all"
                      />
                      {steeringInstruction && (
                        <button 
                          onClick={() => setSteeringInstruction('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">3. Creative Override (Optional)</h3>
                    <div className="relative">
                      <input 
                        type="text"
                        value={customReelIdea}
                        onChange={(e) => setCustomReelIdea(e.target.value)}
                        placeholder="e.g. 'Imagine this story happening in a cyberpunk city'..."
                        className="w-full p-4 bg-[#F5F5F0] rounded-2xl border border-[#141414]/10 text-sm outline-none focus:border-[#141414]/40 transition-all"
                      />
                      {customReelIdea && (
                        <button 
                          onClick={() => setCustomReelIdea('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">4. Select Platform</h3>
                      <button 
                        onClick={() => handleSelectStory(selectedStory.docId, false)}
                        className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 flex items-center"
                      >
                        <RefreshCw size={10} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh Studio
                      </button>
                    </div>
                    <div className="flex space-x-4">
                      {['Instagram', 'TikTok'].map(platform => (
                        <div key={platform} className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleGenerateContent(platform.toLowerCase() as any)}
                            disabled={loading || isGenerating}
                            className="px-6 py-3 rounded-full border border-[#141414]/10 bg-[#141414] text-white hover:opacity-90 transition-all text-sm font-bold uppercase tracking-widest disabled:opacity-50"
                          >
                            Generate {platform} Pack
                          </button>
                          {selectedStory.packages?.some((p: any) => p.platform === platform.toLowerCase()) && (
                            <button 
                              onClick={() => handleClearPackages(platform.toLowerCase())}
                              className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 flex items-center justify-center"
                            >
                              <RefreshCw size={10} className="mr-1" /> Redo {platform}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-12">
                  {isGenerating && (
                    <div className="col-span-full py-20 text-center space-y-4">
                      <RefreshCw size={32} className="mx-auto animate-spin text-[#141414]/20" />
                      <p className="text-sm italic opacity-40">AI is crafting your {selectedStory.title} social pack...</p>
                    </div>
                  )}
                  {!isGenerating && selectedStory.packages?.map((pkg: any, i: number) => (
                    <div key={i} className="bg-white rounded-3xl p-8 border border-[#141414]/5 shadow-sm space-y-8">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <span className="px-3 py-1 bg-[#141414] text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                              {pkg.platform}
                            </span>
                            <span className="px-3 py-1 bg-[#F5F5F0] rounded-full text-[10px] font-bold uppercase tracking-widest text-[#141414]/60">
                              {pkg.format.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                let text = '';
                                if (pkg.format === 'instagram_pack') {
                                  text += `CAROUSEL:\n`;
                                  pkg.carousel?.slides.forEach((s: any) => text += `Slide ${s.slide_number}: ${s.text}\n`);
                                  text += `\nREEL:\nNarrative: ${pkg.reel?.story_text}\n`;
                                  pkg.reel?.shots.forEach((s: any) => text += `Shot ${s.shot_number}: ${s.script}\n`);
                                } else {
                                  text = `Hook: ${pkg.hook}\n\nScript: ${pkg.script}`;
                                }
                                navigator.clipboard.writeText(text);
                                alert('Content copied to clipboard!');
                              }}
                              className="p-2 text-[#141414]/40 hover:text-[#141414] hover:bg-[#F5F5F0] rounded-lg transition-all"
                              title="Copy All"
                            >
                              <FileText size={18} />
                            </button>
                          </div>
                        </div>

                        {pkg.format === 'instagram_pack' ? (
                          <div className="space-y-12">
                            {/* Carousel Section */}
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-serif italic">Image Carousel (3 Slides)</h3>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Educational Series</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {pkg.carousel?.slides.map((slide: any, idx: number) => (
                                  <div key={idx} className="p-6 bg-[#F5F5F0] rounded-2xl border border-[#141414]/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Slide {slide.slide_number}</span>
                                    </div>
                                    <p className="text-sm font-serif italic leading-relaxed text-[#141414]/80">
                                      {slide.text}
                                    </p>
                                    <PromptEditor 
                                      packageDocId={pkg.docId}
                                      type="carousel"
                                      index={idx}
                                      currentPrompt={slide.visual_prompt}
                                      variations={slide.prompt_variations}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Reel Section */}
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-serif italic">20s Cinematic Reel (4 Shots)</h3>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Dramatic Narrative</span>
                              </div>
                              <div className="p-6 bg-[#141414] text-white rounded-2xl space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Full Narrative</h4>
                                <p className="text-sm font-serif italic opacity-90">{pkg.reel?.story_text}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {pkg.reel?.shots.map((shot: any, idx: number) => (
                                  <div key={idx} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Shot {shot.shot_number} (5s)</span>
                                    </div>
                                    <div className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#141414]/5 space-y-3">
                                      <p className="text-[10px] font-bold leading-tight text-[#141414]/80">{shot.script}</p>
                                      <PromptEditor 
                                        packageDocId={pkg.docId}
                                        type="reel"
                                        index={idx}
                                        currentPrompt={shot.image_prompt}
                                        variations={shot.prompt_variations}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="pt-6 border-t border-[#141414]/5 flex justify-center">
                              <button 
                                onClick={() => {
                                  setReelPlan(pkg.reel);
                                  setActiveTab('visual');
                                }}
                                className="px-12 py-4 bg-[#141414] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all flex items-center"
                              >
                                <Zap size={16} className="mr-2" />
                                Produce Reel in Visual Studio
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Hook</h4>
                              <p className="text-sm font-serif italic text-emerald-900 leading-relaxed">"{pkg.hook}"</p>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Narration Script</h4>
                              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#141414]/80 font-serif italic bg-[#F5F5F0] p-6 rounded-2xl border border-[#141414]/5">
                                {pkg.script}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Visual Direction</h4>
                              <p className="text-xs text-[#141414]/60 italic">
                                {pkg.visual_description}
                              </p>
                            </div>

                            <div className="pt-6 border-t border-[#141414]/5">
                              <button 
                                onClick={() => {
                                  setActiveVisualPrompt(pkg.visual_description);
                                  setActiveTab('visual');
                                }}
                                className="px-6 py-3 bg-[#141414] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center w-fit"
                              >
                                <ImageIcon size={14} className="mr-2" /> Generate Visual Identity
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!selectedStory.packages || selectedStory.packages.length === 0) && (
                    <div className="col-span-full py-20 text-center opacity-40 italic">
                      No content packages generated yet.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'visual' && selectedStory && (
              <motion.div 
                key="visual"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-12"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-serif italic">Visual Identity Studio</h2>
                  <p className="text-[#141414]/60 max-w-xl mx-auto">
                    Generate symbolic, realistic visuals that ground your story in emotion using Gemini Flash.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Active Visual Prompt</h3>
                      <div className="flex space-x-2">
                        <select 
                          onChange={(e) => setActiveVisualPrompt(e.target.value)}
                          className="text-[10px] font-bold uppercase tracking-widest bg-[#F5F5F0] border border-[#141414]/5 rounded-lg px-2 py-1 outline-none"
                        >
                          <option value="">Select from Story</option>
                          {selectedStory.packages?.map((pkg: any) => (
                            <optgroup key={pkg.docId} label={`${pkg.platform} ${pkg.format}`}>
                              {pkg.carousel?.slides.map((s: any) => (
                                <option key={`c-${s.slide_number}`} value={s.visual_prompt}>Carousel Slide {s.slide_number}</option>
                              ))}
                              {pkg.reel?.shots.map((s: any) => (
                                <option key={`r-${s.shot_number}`} value={s.image_prompt}>Reel Shot {s.shot_number}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="p-4 bg-[#F5F5F0] rounded-2xl border border-[#141414]/5">
                      <p className="text-sm italic text-[#141414]/70 leading-relaxed">
                        {activeVisualPrompt || (selectedStory.packages?.[0]?.visual_prompt) || "No prompt selected. Generate content in Studio first."}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleGenerateImage(activeVisualPrompt || selectedStory.packages?.[0]?.visual_prompt)}
                      disabled={loading || (!activeVisualPrompt && !selectedStory.packages?.[0])}
                      className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Generating 3 Options...' : 'Generate 3 Story Visuals (9:16)'}
                    </button>
                    
                    <div className="pt-6 border-t border-[#141414]/5 space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Visual Guidelines</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-[10px] opacity-60">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span>9:16 Vertical Story Format</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] opacity-60">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span>Including People/Animals where appropriate</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] opacity-60">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span>Symbolic & Realistic Atmosphere</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm space-y-6 overflow-hidden">
                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Visual Concepts (9:16)</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {generatedImages.map((img, idx) => (
                        <div key={idx} className="space-y-4">
                          <div className="aspect-[9/16] bg-[#F5F5F0] rounded-2xl overflow-hidden flex items-center justify-center border border-[#141414]/5 relative group">
                            {img ? (
                              <>
                                <img 
                                  src={img} 
                                  alt={`Option ${idx + 1}`} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                {/* Headline Overlay Preview */}
                                {selectedStory.packages?.[selectedStory.packages.length - 1]?.headline && (
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                                    <p className="text-[10px] font-black text-yellow-400 leading-tight uppercase tracking-tighter text-center line-clamp-3 drop-shadow-lg">
                                      {selectedStory.packages?.[selectedStory.packages.length - 1]?.headline}
                                    </p>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-4">
                                  <button 
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = img;
                                      link.download = `visual-${selectedStory.id}-opt${idx+1}.png`;
                                      link.click();
                                    }}
                                    className="p-3 bg-white rounded-full text-[#141414] hover:scale-110 transition-transform flex items-center space-x-2"
                                  >
                                    <Download size={16} />
                                    <span className="text-[10px] font-bold uppercase">Download</span>
                                  </button>
                                  
                                  {selectedStory.packages?.length > 0 && (
                                    <div className="flex flex-col space-y-1 w-full px-4">
                                      <p className="text-[8px] text-white font-bold uppercase tracking-widest text-center mb-1">Save to Package:</p>
                                      <div className="flex flex-wrap justify-center gap-1">
                                        {Array.from(new Set((selectedStory.packages || []).map((p: any) => p.platform))).map((platform: any) => {
                                          const pkg = selectedStory.packages?.find((p: any) => p.platform === platform);
                                          if (!pkg) return null;
                                          return (
                                            <button
                                              key={platform}
                                              onClick={() => handleSaveImageToPackage(img, pkg.docId)}
                                              className="px-2 py-1 bg-indigo-600 text-white rounded text-[8px] font-bold uppercase hover:bg-indigo-700"
                                            >
                                              {platform}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="text-center space-y-2 opacity-20">
                                <ImageIcon size={24} className="mx-auto" />
                                <p className="text-[8px] font-bold uppercase tracking-widest">Option {idx + 1}</p>
                              </div>
                            )}
                          </div>
                          {img && (
                            <button 
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = img;
                                link.download = `visual-${selectedStory.id}-opt${idx+1}.png`;
                                link.click();
                              }}
                              className="w-full py-2 border border-[#141414]/10 rounded-xl text-[8px] font-bold uppercase tracking-widest hover:bg-[#F5F5F0]"
                            >
                              Download
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Carousel Production Studio */}
                {selectedStory.packages?.find((p: any) => p.format === 'instagram_pack') && (
                  <div className="bg-white p-12 rounded-[3rem] border border-[#141414]/5 shadow-sm space-y-12">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Layers size={20} />
                        </div>
                        <h3 className="text-2xl font-serif italic">Carousel Production Studio</h3>
                      </div>
                      <p className="text-sm text-[#141414]/60">Generate high-quality visuals for your 3-slide Instagram carousel.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {selectedStory.packages?.find((p: any) => p.format === 'instagram_pack')?.carousel?.slides.map((slide: any, idx: number) => (
                        <div key={idx} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Slide {slide.slide_number}</span>
                          </div>
                          
                          <div className="aspect-square bg-[#F5F5F0] rounded-3xl overflow-hidden border border-[#141414]/5 relative group">
                            {carouselImages[idx] ? (
                              <img 
                                src={carouselImages[idx]!} 
                                alt={`Slide ${idx + 1}`} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
                                  {carouselLoadingStates[idx] ? <Loader2 size={24} className="animate-spin opacity-20" /> : <ImageIcon size={24} className="opacity-20" />}
                                </div>
                                <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Waiting for visual</p>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-3 p-4">
                              <button 
                                onClick={() => handleGenerateCarouselImage(idx, slide.visual_prompt)}
                                disabled={carouselLoadingStates[idx]}
                                className="w-full py-3 bg-white text-[#141414] rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center hover:scale-105 transition-transform"
                              >
                                {carouselLoadingStates[idx] ? <Loader2 size={14} className="animate-spin mr-2" /> : <ImageIcon size={14} className="mr-2" />}
                                {carouselImages[idx] ? 'Regenerate' : 'Gen Image'}
                              </button>
                              {carouselImages[idx] && (
                                <button 
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = carouselImages[idx]!;
                                    link.download = `carousel-slide-${idx+1}.png`;
                                    link.click();
                                  }}
                                  className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center hover:scale-105 transition-transform"
                                >
                                  <Download size={14} className="mr-2" />
                                  Download
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-bold leading-tight text-[#141414]/80 line-clamp-2">
                              {slide.text}
                            </p>
                            <p className="text-[8px] text-[#141414]/40 italic line-clamp-2">
                              {slide.visual_prompt}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reel Production Studio */}
                <div className="bg-white p-12 rounded-[3rem] border border-[#141414]/5 shadow-sm space-y-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Clapperboard size={20} />
                        </div>
                        <h3 className="text-2xl font-serif italic">Reel Production Studio</h3>
                      </div>
                      <p className="text-sm text-[#141414]/60">Break down your story into a 20-second cinematic reel (4 shots x 5s). Powered by Cinematic Video Engine.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <input 
                        type="text"
                        placeholder="Optional: Custom Idea Override"
                        value={customReelIdea}
                        onChange={(e) => setCustomReelIdea(e.target.value)}
                        className="px-4 py-3 bg-[#F5F5F0] rounded-xl border border-[#141414]/10 text-[10px] outline-none focus:border-[#141414]/40 transition-all w-full md:w-64"
                      />
                      <button 
                        onClick={handleGenerateReelPlan}
                        disabled={isGeneratingReel || (!selectedStory && !customReelIdea)}
                        className="px-8 py-4 bg-[#141414] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-50 whitespace-nowrap"
                      >
                        {isGeneratingReel ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Planning Reel...
                          </>
                        ) : (
                          <>
                            <Zap size={16} className="mr-2" />
                            Generate Reel Plan
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {reelPlan && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      <div className="p-8 bg-[#F5F5F0] rounded-[2rem] border border-[#141414]/5">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4">Reel Narrative</h4>
                        <p className="text-xl font-serif italic leading-relaxed text-[#141414]/80">
                          {reelPlan.story_text}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {reelPlan.shots.map((shot: any, idx: number) => (
                          <div key={idx} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Shot {shot.shot_number} (5s)</span>
                            </div>
                            
                            <div className="aspect-[9/16] bg-[#F5F5F0] rounded-3xl overflow-hidden border border-[#141414]/5 relative group">
                              {reelVideos[idx] ? (
                                <video 
                                  src={reelVideos[idx]!} 
                                  className="w-full h-full object-cover"
                                  controls
                                  autoPlay
                                  loop
                                  muted
                                />
                              ) : reelImages[idx] ? (
                                <img 
                                  src={reelImages[idx]!} 
                                  alt={`Shot ${idx + 1}`} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                                  <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
                                    {imageLoadingStates[idx] ? <Loader2 size={24} className="animate-spin opacity-20" /> : <ImageIcon size={24} className="opacity-20" />}
                                  </div>
                                  <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Waiting for visual</p>
                                </div>
                              )}

                              {/* Action Overlays */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-3 p-4">
                                {!reelImages[idx] && (
                                  <button 
                                    onClick={() => handleGenerateReelImage(idx)}
                                    disabled={imageLoadingStates[idx]}
                                    className="w-full py-3 bg-white text-[#141414] rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center hover:scale-105 transition-transform"
                                  >
                                    {imageLoadingStates[idx] ? <Loader2 size={14} className="animate-spin mr-2" /> : <ImageIcon size={14} className="mr-2" />}
                                    Gen Image
                                  </button>
                                )}
                                {reelImages[idx] && !reelVideos[idx] && (
                                  <button 
                                    onClick={() => handleGenerateReelVideo(idx)}
                                    disabled={videoLoadingStates[idx]}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center hover:scale-105 transition-transform"
                                  >
                                    {videoLoadingStates[idx] ? <Loader2 size={14} className="animate-spin mr-2" /> : <Video size={14} className="mr-2" />}
                                    Gen Video
                                  </button>
                                )}
                                {reelVideos[idx] && (
                                  <button 
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = reelVideos[idx]!;
                                      link.download = `reel-shot-${idx+1}.mp4`;
                                      link.click();
                                    }}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center hover:scale-105 transition-transform"
                                  >
                                    <Download size={14} className="mr-2" />
                                    Download MP4
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-[10px] font-bold leading-tight text-[#141414]/80">
                                {shot.script}
                              </p>
                              <p className="text-[8px] text-[#141414]/40 italic line-clamp-2">
                                {shot.image_prompt}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="bg-[#141414] text-white p-12 rounded-[3rem] text-center space-y-6">
                  <ShieldCheck size={48} className="mx-auto opacity-20" />
                  <h3 className="text-2xl font-serif italic">Authenticity First</h3>
                  <p className="text-white/60 text-sm max-w-md mx-auto">
                    These visuals are symbolic representations generated by Gemini 2.5 Flash to help you tell the story without compromising the privacy of the people involved.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'export' && selectedStory && (
              <motion.div 
                key="export"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] border border-[#141414]/5 shadow-xl text-center space-y-8"
              >
                <div className="w-20 h-20 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto">
                  <Download size={32} className="text-[#141414]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif italic">Finalize & Export</h2>
                  <p className="text-[#141414]/60">Prepare your content package for direct publishing or automation.</p>
                </div>

                <div className="space-y-4 pt-8">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Integrations</h4>
                    <button 
                      onClick={() => setShowWebhookSettings(!showWebhookSettings)}
                      className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:underline"
                    >
                      {showWebhookSettings ? 'Close Settings' : 'Webhook Settings'}
                    </button>
                  </div>

                  {showWebhookSettings && (
                    <div className="p-6 bg-[#F5F5F0] rounded-2xl space-y-4 mb-4">
                      <form onSubmit={handleAddWebhook} className="space-y-2">
                        <input 
                          type="text" 
                          placeholder="Webhook Name (e.g. Zapier)" 
                          value={newWebhookName}
                          onChange={(e) => setNewWebhookName(e.target.value)}
                          className="w-full px-4 py-2 bg-white rounded-xl text-xs border border-[#141414]/5"
                        />
                        <input 
                          type="url" 
                          placeholder="Webhook URL" 
                          value={newWebhookUrl}
                          onChange={(e) => setNewWebhookUrl(e.target.value)}
                          className="w-full px-4 py-2 bg-white rounded-xl text-xs border border-[#141414]/5"
                        />
                        <button type="submit" className="w-full py-2 bg-[#141414] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">
                          Add Webhook
                        </button>
                      </form>
                      <div className="space-y-2">
                        {webhooks.map(hook => (
                          <div key={hook.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#141414]/5">
                            <div className="text-[10px] font-bold">{hook.name}</div>
                            <button onClick={() => handleDeleteWebhook(hook.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {webhooks.map(hook => (
                    <button 
                      key={hook.id}
                      onClick={() => handlePushToWebhook(hook)}
                      disabled={loading || selectedStory.status === 'published'}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2"
                    >
                      <Zap size={16} className={loading ? 'animate-spin' : ''} />
                      <span>Push to {hook.name}</span>
                    </button>
                  ))}
                  
                  {webhooks.length === 0 && (
                    <div className="text-center p-8 border border-dashed border-[#141414]/10 rounded-2xl">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Webhooks Connected</p>
                      <p className="text-[8px] opacity-40 mt-1">Use Zapier or Make.com to automate your socials.</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-[#141414]/5 space-y-4">
                    <button className="w-full py-4 border border-[#141414]/10 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#F5F5F0] transition-all">
                      Download Full Asset Bundle (JSON + Text)
                    </button>
                    <a 
                      href="/api/export-project" 
                      download 
                      className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all flex items-center justify-center"
                    >
                      <Download size={16} className="mr-2" />
                      Download Full Project ZIP (GitHub Alternative)
                    </a>
                    <button 
                      onClick={handlePublish}
                      disabled={selectedStory.status === 'published'}
                      className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${selectedStory.status === 'published' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'border border-[#141414]/10 hover:bg-[#F5F5F0]'}`}
                    >
                      {selectedStory.status === 'published' ? 'Already Published' : 'Mark as Published'}
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-[#141414]/5">
                  <div className="flex items-center justify-center space-x-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <ShieldCheck size={12} />
                    <span>Evidence-Pack Included</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="animate-spin text-[#141414]" size={32} />
            <div className="flex flex-col items-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest">Processing...</span>
              <p className="text-[8px] opacity-40 uppercase tracking-widest">This may take up to 30 seconds</p>
            </div>
            <button 
              onClick={() => {
                setLoading(false);
                setAiStatus('connected');
              }}
              className="px-4 py-2 bg-[#141414] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-80 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavIcon({ icon, active, onClick, disabled, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, disabled?: boolean, label: string }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`relative group p-3 rounded-xl transition-all ${active ? 'bg-[#141414] text-white' : 'text-[#141414]/40 hover:text-[#141414] hover:bg-[#F5F5F0]'} ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}
    >
      {icon}
      <span className="absolute left-full ml-4 px-2 py-1 bg-[#141414] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        {label}
      </span>
    </button>
  );
}

function StoryCard({ story, onClick, onSave, onDelete, active }: any) {
  const color = CATEGORY_COLORS[story.category] || CATEGORY_COLORS['Default'];
  
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`bg-white p-6 rounded-3xl border transition-all cursor-pointer group relative ${active ? 'border-[#141414] shadow-lg' : 'border-[#141414]/5 shadow-sm hover:border-[#141414]/20'}`}
    >
      <div className="absolute top-6 right-6 flex items-center space-x-2 z-10">
        <button 
          onClick={onDelete}
          className="p-2 rounded-full bg-transparent text-[#141414]/20 hover:text-red-500 hover:bg-red-50 transition-all"
          title="Delete Story"
        >
          <Trash2 size={16} />
        </button>
        <button 
          onClick={onSave}
          className={`p-2 rounded-full transition-all ${story.is_saved ? 'bg-amber-50 text-amber-600' : 'bg-transparent text-[#141414]/20 hover:text-[#141414] hover:bg-[#F5F5F0]'}`}
          title={story.is_saved ? "Unsave Story" : "Save Story"}
        >
          <Bookmark size={16} className={story.is_saved ? 'fill-current' : ''} />
        </button>
      </div>

      <div className="flex justify-between items-start mb-4 pr-8">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border w-fit ${color.bg} ${color.text} ${color.border}`}>
              {story.category}
            </span>
            {story.status === 'verified' && (
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest flex items-center shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                <ShieldCheck size={10} className="mr-1" /> Verified
              </span>
            )}
          </div>
          {story.trend_signal && (
            <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-600 flex items-center">
              <Zap size={8} className="mr-1 fill-current" /> {story.trend_signal}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs font-mono">{story.verified_score || 0}</span>
          <ShieldCheck size={14} className={(story.verified_score || 0) > 70 ? 'text-emerald-500' : 'text-amber-500'} />
        </div>
      </div>
      <div className="flex items-center space-x-2 mb-2">
        <h3 className="text-lg font-medium leading-tight group-hover:underline">{story.title}</h3>
        {story.status === 'published' && (
          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[8px] font-bold uppercase tracking-widest">
            Published
          </span>
        )}
      </div>
      <p className="text-xs text-[#141414]/60 line-clamp-3 mb-4 leading-relaxed">{story.summary}</p>
      
      {(story.engagement_score || story.visual_score) && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Engagement: {story.engagement_score}/10</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Visual: {story.visual_score}/10</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-[#141414]/5">
        <div className="flex items-center text-[10px] font-bold uppercase tracking-widest opacity-40">
          <Globe size={12} className="mr-1" /> {story.region}
        </div>
        <div className="text-[10px] font-mono opacity-40">
          {story.source_count || 0} SOURCES
        </div>
      </div>
    </motion.div>
  );
}
