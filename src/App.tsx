import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Camera, Sparkles, RefreshCw, Download, Image as ImageIcon, CheckCircle2 } from "lucide-react";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cartoonImage, setCartoonImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setCartoonImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const cartoonify = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Extract base64 content
      const base64Data = originalImage.split(",")[1];
      const mimeType = originalImage.split(";")[0].split(":")[1];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: "Convert this person's face into a high-quality 3D stylized cartoon character, similar to Pixar or Disney style. Maintain the person's key facial features, hairstyle, and expression. The result should be vibrant, clean, and professional animation quality.",
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setCartoonImage(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("Could not generate cartoon image. Please try again with a clearer face photo.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during the transformation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!cartoonImage) return;
    const link = document.createElement("a");
    link.href = cartoonImage;
    link.download = "my-toon-face.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1917] font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">ToonFace</h1>
          </div>
          <button
            onClick={() => {
              setOriginalImage(null);
              setCartoonImage(null);
              setError(null);
            }}
            className="text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black mb-4 tracking-tight"
          >
            Turn Your <span className="text-orange-500">Selfie</span> Into <br />A <span className="italic font-serif text-teal-600 underline underline-offset-8 decoration-teal-200">Cartoon Character</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-stone-500 text-lg max-w-xl mx-auto"
          >
            Upload a portrait and let Gemini AI create a stylized 3D character version of you in seconds.
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!originalImage ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-stone-300 rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all duration-300 bg-white shadow-xl shadow-stone-200/50"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Upload className="w-10 h-10 text-stone-400 group-hover:text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-stone-800">Choose a photo or drop it here</p>
                  <p className="text-stone-400 mt-1 uppercase tracking-widest text-xs font-bold">PNG, JPG or WEBP (Max 5MB)</p>
                </div>
                
                {/* Visual accents */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center shadow-lg -rotate-12 group-hover:rotate-0 transition-transform">
                  <Camera className="text-white w-6 h-6" />
                </div>
              </div>
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 rounded-2xl bg-white border border-stone-100 shadow-sm">
                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">1</div>
                  <h3 className="font-bold text-sm">Upload Photo</h3>
                  <p className="text-stone-400 text-xs mt-1">Clear portrait works best</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-stone-100 shadow-sm">
                  <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">2</div>
                  <h3 className="font-bold text-sm">Convert to Toon</h3>
                  <p className="text-stone-400 text-xs mt-1">AI stylizes your features</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-stone-100 shadow-sm">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">3</div>
                  <h3 className="font-bold text-sm">Download & Share</h3>
                  <p className="text-stone-400 text-xs mt-1">Get your digital avatar</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Preview Cards */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-black uppercase tracking-widest text-stone-400">Original Photo</span>
                    <button 
                      onClick={() => setOriginalImage(null)}
                      className="text-stone-400 hover:text-stone-900 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                  <div className="aspect-square bg-stone-200 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Ready to transform
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-black uppercase tracking-widest text-stone-400">Toon Creation</span>
                    {cartoonImage && (
                      <span className="text-teal-600 text-xs font-black flex items-center gap-1 uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </div>
                  <div className="aspect-square bg-stone-100 rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-stone-200 relative flex items-center justify-center">
                    {cartoonImage ? (
                      <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={cartoonImage}
                        alt="Cartoonified"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-8">
                        {isProcessing ? (
                          <div className="space-y-4">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"
                            />
                            <p className="text-stone-500 font-medium animate-pulse">Our AI is sketching your toon...</p>
                          </div>
                        ) : (
                          <div className="space-y-4 text-stone-400">
                            <Sparkles className="w-12 h-12 mx-auto opacity-20" />
                            <p>Hit the button to start the magic</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col items-center gap-6 py-6 border-t border-stone-200">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 w-full max-w-md text-center shadow-lg shadow-red-200/20"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex flex-wrap justify-center gap-4">
                  {!cartoonImage ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={cartoonify}
                      disabled={isProcessing}
                      className="h-16 px-10 bg-[#1c1917] hover:bg-stone-800 text-white rounded-full font-black text-lg shadow-xl shadow-stone-400/30 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {isProcessing ? "Processing..." : "Generate Cartoon Face"}
                      <Sparkles className={`w-6 h-6 text-orange-400 ${isProcessing ? "animate-spin" : "group-hover:scale-125 transition-transform"}`} />
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setCartoonImage(null);
                          cartoonify();
                        }}
                        disabled={isProcessing}
                        className="h-14 px-8 bg-white border-2 border-stone-200 hover:border-orange-500 text-stone-800 rounded-full font-bold shadow-lg transition-all flex items-center gap-2 group"
                      >
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        Try Again
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={downloadImage}
                        className="h-14 px-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-black text-lg shadow-xl shadow-orange-500/30 flex items-center gap-2 transition-colors"
                      >
                        <Download className="w-6 h-6" />
                        Download Toon
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-stone-200 bg-stone-50">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold tracking-tight">ToonFace AI</span>
          </div>
          <p className="text-stone-400 text-xs font-medium">Powered by Gemini AI 2.5 Flash Image Model</p>
          <div className="flex gap-4 text-stone-400 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-stone-900">Privacy</a>
            <a href="#" className="hover:text-stone-900">Terms</a>
            <a href="#" className="hover:text-stone-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
