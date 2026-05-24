"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, ZoomIn } from "lucide-react";
import getCroppedImg from "@/utils/cropImage";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
}

export default function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteCallback = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    
    setIsProcessing(true);
    try {
      // Calls your utility function from src/utils/cropImage.ts
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage); // Returns the cropped File/Blob back to settings page
      }
    } catch (e) {
      console.error("Failed to crop image:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: "rgba(16,15,22,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              height: "500px",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                Crop Image
              </h3>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Interactive Cropper Area */}
            <div className="relative flex-1 bg-black/50">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropCompleteCallback}
                onZoomChange={setZoom}
                cropShape={aspectRatio === 1 ? "round" : "rect"}
                showGrid={false}
              />
            </div>

            {/* Controls */}
            <div className="p-5 space-y-5 border-t border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <ZoomIn size={16} className="text-gray-400 shrink-0" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#6C63FF]"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} disabled={isProcessing} className="flex-1 px-4 py-2.5 rounded-2xl text-sm font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirm} disabled={isProcessing} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white transition-colors shadow-lg disabled:opacity-50" style={{ background: "#6C63FF" }}>
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {isProcessing ? "Processing..." : "Apply Crop"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
