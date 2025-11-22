import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, Sparkles, ChevronLeft, Wand2, Grid, Aperture } from 'lucide-react';
import { analyzeSelfie } from './services/geminiService';
import { AnalysisResult, AppView, PoseSuggestion, TrendingPose } from './types';
import { PoseOverlay } from './components/PoseOverlay';
import { AnalysisView } from './components/AnalysisView';
import { TrendingView } from './components/TrendingView';

const videoConstraints = {
  width: 720,
  height: 1280,
  facingMode: "user"
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<'generic' | 'hand-face' | 'side-profile' | null>(null);
  
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Capture Selfie
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
      handleAnalyze(imageSrc);
    }
  }, [webcamRef]);

  // Handle File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        handleAnalyze(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Core Analysis Logic
  const handleAnalyze = async (imgSrc: string) => {
    setView(AppView.ANALYSIS); // Show loading state in analysis view or specific loading view
    setIsAnalyzing(true);
    
    // Reset overlay when analyzing new image
    setActiveOverlay(null);

    const result = await analyzeSelfie(imgSrc);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  // Start Camera Mode for specific pose
  const startGuidedMode = (pose?: PoseSuggestion | TrendingPose) => {
    setImage(null);
    setView(AppView.CAMERA);
    // Heuristic to choose overlay based on text content
    if (pose) {
        if (pose.title.toLowerCase().includes('hand')) setActiveOverlay('hand-face');
        else if (pose.title.toLowerCase().includes('profile') || pose.title.toLowerCase().includes('side')) setActiveOverlay('side-profile');
        else setActiveOverlay('generic');
    } else {
        setActiveOverlay(null);
    }
  };

  // Render Logic
  const renderContent = () => {
    if (view === AppView.CAMERA) {
      return (
        <div className="relative h-screen w-full bg-black flex flex-col">
          {/* Top Bar */}
          <div className="absolute top-0 w-full z-30 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
             <button onClick={() => setView(AppView.HOME)} className="text-white p-2 rounded-full bg-black/30 backdrop-blur-md">
                <ChevronLeft />
             </button>
             <div className="flex gap-2">
                <button 
                    onClick={() => setActiveOverlay(activeOverlay ? null : 'generic')}
                    className={`p-2 rounded-full backdrop-blur-md ${activeOverlay ? 'bg-pink-500 text-white' : 'bg-black/30 text-white'}`}
                >
                    <Grid size={20}/>
                </button>
             </div>
          </div>

          {/* Camera Feed */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
             <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="absolute inset-0 w-full h-full object-cover"
                mirrored={true}
              />
             <PoseOverlay active={!!activeOverlay} type={activeOverlay || 'generic'} />
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 w-full p-8 pb-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-around items-center z-30">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20"
            >
              <Upload size={24} />
            </button>
            <input 
               type="file" 
               ref={fileInputRef} 
               hidden 
               accept="image/*" 
               onChange={handleFileUpload} 
            />

            <button 
              onClick={capture}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm hover:scale-105 transition-transform active:scale-95"
            >
              <div className="w-16 h-16 bg-white rounded-full" />
            </button>

            <button 
              onClick={() => setView(AppView.ANALYSIS)}
              disabled={!analysisResult} // Only allow if we have history, or change logic
              className={`p-3 rounded-full bg-white/10 backdrop-blur-md text-white ${!analysisResult ? 'opacity-0' : ''}`}
            >
              <Sparkles size={24} />
            </button>
          </div>
        </div>
      );
    }

    if (view === AppView.ANALYSIS) {
      if (isAnalyzing) {
        return (
          <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-8">
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-2xl font-bold mb-2">Analyzing Face Shape...</h2>
            <p className="text-slate-400 text-center">Mapping landmarks and checking lighting conditions.</p>
          </div>
        );
      }

      if (analysisResult) {
        return (
          <>
             <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md p-4 border-b border-slate-800 flex items-center">
                <button onClick={() => setView(AppView.HOME)} className="text-slate-300 p-2 mr-2">
                    <ChevronLeft />
                </button>
                <h1 className="text-lg font-bold text-white">My Results</h1>
             </div>
             <AnalysisView 
                data={analysisResult} 
                onTryPose={startGuidedMode} 
                onRetake={() => setView(AppView.CAMERA)} 
             />
          </>
        );
      }
    }

    if (view === AppView.TRENDING) {
      return (
        <>
            <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md p-4 border-b border-slate-800 flex items-center">
                <button onClick={() => setView(AppView.HOME)} className="text-slate-300 p-2 mr-2">
                    <ChevronLeft />
                </button>
                <h1 className="text-lg font-bold text-white">Trending Poses</h1>
             </div>
            <TrendingView onSelectPose={startGuidedMode} />
        </>
      );
    }

    // Home / Landing View
    return (
      <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden relative">
        
        {/* Hero Background Effect */}
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-gradient-to-b from-violet-900/40 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-pink-500 to-violet-600 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
             <Aperture size={48} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            PoseGenie
          </h1>
          <p className="text-lg text-slate-400 mb-12 max-w-xs">
            AI-powered face shape detection and personalized pose suggestions.
          </p>

          <button 
            onClick={() => setView(AppView.CAMERA)}
            className="w-full max-w-xs bg-white text-slate-900 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-100 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mb-4"
          >
            <Camera className="text-pink-600" />
            Take Selfie Analysis
          </button>

          <button 
             onClick={() => setView(AppView.TRENDING)}
             className="w-full max-w-xs bg-slate-800/50 border border-slate-700 text-white py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-3 backdrop-blur-sm"
          >
            <Wand2 className="text-purple-400" />
            Explore Trends
          </button>
        </div>

        <div className="p-6 text-center text-slate-600 text-xs">
           Powered by Google Gemini 2.5 Flash
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-900 shadow-2xl overflow-hidden">
       {renderContent()}
    </div>
  );
};

export default App;