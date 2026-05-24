"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, Globe, Lock, Loader2, ArrowRight, Sparkles, ShieldAlert, X, Camera, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg: "#03060F",
  surface: "rgba(8,16,40,0.70)",
  surfaceHi: "rgba(10,22,52,0.85)",
  border: "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent: "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  violet: "#7C3AED",
  violetLo: "rgba(124,58,237,0.12)",
  violetMd: "rgba(124,58,237,0.25)",
  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.12)",
  rose: "#FF4D6D",
  roseLo: "rgba(255,77,109,0.12)",
  roseMd: "rgba(255,77,109,0.25)",
  text: "#E2E8F8",
  muted: "#4A5578",
};

/* ─── utils ──────────────────────────────────────────────────────────────── */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  fileName: string = "workspace-avatar.jpg"
): Promise<File | null> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (error) => reject(error));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      resolve(new File([blob], fileName, { type: "image/jpeg" }));
    }, "image/jpeg", 0.95);
  });
}

export default function CreateWorkspacePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setCropImageSrc(URL.createObjectURL(file));
    setCropModalOpen(true);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    
    e.target.value = ""; // Clear input to allow re-selection
  };

  const handleCropSave = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedFile = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      if (croppedFile) {
        setAvatarFile(croppedFile);
        setAvatarPreview(URL.createObjectURL(croppedFile));
      }
      setCropModalOpen(false);
    } catch (err) {
      setError("Failed to crop image.");
    }
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/workspace/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, isPrivate }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      } else {
        const newWorkspaceId = data.workspace?._id || data._id;

        // If an avatar was selected, instantly upload it to the existing API
        if (avatarFile && newWorkspaceId) {
          try {
            const formData = new FormData();
            formData.append("workspaceId", newWorkspaceId);
            formData.append("file", avatarFile); 
            formData.append("avatar", avatarFile); // Fallback depending on your backend param name

            await fetch("/api/workspace/avatar", {
              method: "POST",
              body: formData,
            });
          } catch (err) {
            console.error("Avatar upload failed, continuing to workspace.", err);
          }
        }

        router.push(newWorkspaceId ? `/workspace/${newWorkspaceId}` : "/dashboard");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
      `}</style>

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: T.accentLo, filter: "blur(120px)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: T.violetLo, filter: "blur(120px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      {/* Main Card */}
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[480px] z-10"
      >
        <div className="relative rounded-[2.5rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
          style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(40px)" }}
        >
          {/* Glow blob inside card */}
          <div aria-hidden style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: T.accentLo, filter: "blur(60px)", pointerEvents: "none" }} />

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-xl" style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.violet})` }}>
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2" style={{ fontFamily: "'Sora',sans-serif" }}>
              New Workspace
            </h1>
            <p className="text-sm" style={{ color: T.muted }}>
              Set up a collaborative space for your team
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-6 relative z-10">

            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-4">
              <div
                className="relative w-24 h-24 rounded-[2rem] flex items-center justify-center cursor-pointer overflow-hidden group transition-all duration-300"
                style={{
                  background: avatarPreview ? T.surface : "rgba(255,255,255,0.02)",
                  border: `2px dashed ${avatarPreview ? T.accentMd : T.borderHi}`,
                }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = avatarPreview ? T.accentMd : T.borderHi; e.currentTarget.style.background = avatarPreview ? T.surface : "rgba(255,255,255,0.02)" }}
              >
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="w-6 h-6" style={{ color: T.accent }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.text }}>Logo</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
            </div>

            {/* Workspace Name Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: T.muted }}>
                Workspace name
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: T.muted }} />
                <input
                  type="text"
                  placeholder="e.g., Acme Corp"
                  className="w-full rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none transition-all shadow-inner"
                  style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${T.borderHi}`, color: T.text, fontFamily: "'DM Sans',sans-serif" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentLo}`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.1)"; }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Privacy Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: T.muted }}>
                Privacy setting
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all border outline-none"
                  style={{
                    background: isPrivate ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
                    borderColor: isPrivate ? T.accentMd : T.border,
                    boxShadow: isPrivate ? `0 0 0 2px ${T.accentLo}` : "none",
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: isPrivate ? T.accentLo : "rgba(255,255,255,0.03)", color: isPrivate ? T.accent : T.muted }}>
                    <Lock size={18} />
                  </div>
                  <span className="text-sm font-bold transition-colors" style={{ color: isPrivate ? "#fff" : T.muted }}>Private</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all border outline-none"
                  style={{
                    background: !isPrivate ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
                    borderColor: !isPrivate ? T.violetMd : T.border,
                    boxShadow: !isPrivate ? `0 0 0 2px ${T.violetLo}` : "none",
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: !isPrivate ? T.violetLo : "rgba(255,255,255,0.03)", color: !isPrivate ? T.violet : T.muted }}>
                    <Globe size={18} />
                  </div>
                  <span className="text-sm font-bold transition-colors" style={{ color: !isPrivate ? "#fff" : T.muted }}>Public</span>
                </button>
              </div>

              {/* Warning for public workspaces */}
              <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl transition-all" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                {!isPrivate ? (
                  <>
                    <Globe className="w-4 h-4 shrink-0 mt-0.5" style={{ color: T.violet }} />
                    <p className="text-xs leading-relaxed" style={{ color: T.muted }}>
                      This workspace will be visible on the browse page. Anyone can join the workspace without approval.
                    </p>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: T.accent }} />
                    <p className="text-xs leading-relaxed" style={{ color: T.muted }}>
                      This workspace is completely hidden. Only invited members with the private link can access it.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-50 mt-6 shadow-xl"
              style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, boxShadow: `0 8px 32px ${T.accentLo}`, fontFamily: "'DM Sans',sans-serif" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Workspace
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>

      <AnimatePresence>
        {/* Crop Modal */}
        {cropModalOpen && cropImageSrc && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(14px)" }}
              onClick={() => setCropModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl p-6 sm:p-8"
              style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}`, backdropFilter: "blur(40px)" }}
            >
              <h3 className="text-2xl font-bold text-white mb-6 text-center" style={{ fontFamily: "'Sora',sans-serif" }}>Adjust Logo</h3>
              
              <div className="relative w-full h-72 rounded-3xl overflow-hidden mb-8" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedArea) => setCroppedAreaPixels(croppedArea)}
                />
              </div>
              
              <div className="flex gap-4">
                <button type="button" onClick={() => setCropModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-bold transition-all hover:bg-white/5" style={{ color: T.muted, border: `1px solid ${T.border}` }}>
                  Cancel
                </button>
                <button type="button" onClick={handleCropSave} className="flex-1 py-3.5 rounded-2xl font-bold text-white transition-all shadow-xl active:scale-95" style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, boxShadow: `0 8px 24px ${T.accentLo}` }}>
                  Save & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Error Modal */}
        {error && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(14px)" }}
              onClick={() => setError("")}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
              style={{ background: T.surfaceHi, border: `1px solid ${T.roseMd}`, backdropFilter: "blur(40px)" }}
            >
              <div className="h-1" style={{ background: `linear-gradient(90deg, ${T.rose}, transparent)` }} />
              
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6"
                  style={{ background: T.roseLo, border: `1px solid ${T.roseMd}`, boxShadow: `0 0 0 8px ${T.roseLo}` }}>
                  <ShieldAlert size={28} style={{ color: T.rose }} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Sora',sans-serif" }}>Action Blocked</h3>
                <p className="text-sm leading-7 mb-8" style={{ color: T.muted }}>
                    {error}
                </p>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setError("")}
                  className="w-full py-4 rounded-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#FF4D6D,#F97316)", boxShadow: "0 6px 24px rgba(255,77,109,0.30)", fontFamily: "'DM Sans',sans-serif" }}
                >
                  Understood
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}