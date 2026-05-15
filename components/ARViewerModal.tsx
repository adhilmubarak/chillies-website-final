import React from 'react';
import { X, Box, Maximize2, Sparkles, Smartphone } from 'lucide-react';

interface ARViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  modelUrl?: string; // .glb or .usdz file
}

const ARViewerModal: React.FC<ARViewerModalProps> = ({ isOpen, onClose, itemName, modelUrl }) => {
  if (!isOpen) return null;

  // Placeholder high-quality 3D food model for the demo if none provided
  const demoModel = "https://modelviewer.dev/shared-assets/models/Astronaut.glb"; // Using a stable GLB for tech demo
  const actualModel = modelUrl || demoModel;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-2xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl aspect-[4/5] sm:aspect-video bg-stone-900 border border-gold-500/20 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col">
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-white/5 bg-stone-900/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-2xl flex items-center justify-center text-stone-950 shadow-lg shadow-gold-500/20">
              <Box size={20} />
            </div>
            <div>
              <h3 className="text-white font-serif text-lg">{itemName}</h3>
              <p className="text-gold-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1">
                <Sparkles size={10} /> AI Powered AR Preview
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-stone-800 text-stone-400 hover:text-white transition-colors flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* 3D Viewer Area */}
        <div className="flex-grow relative bg-[radial-gradient(circle_at_center,_#292524_0%,_#0c0c0c_100%)]">
            {React.createElement('model-viewer' as any, {
                src: actualModel,
                alt: `A 3D model of ${itemName}`,
                ar: true,
                'ar-modes': "webxr scene-viewer quick-look",
                'camera-controls': true,
                'shadow-intensity': "2",
                exposure: "1",
                'environment-image': "neutral",
                'auto-rotate': true,
                className: "w-full h-full",
                style: { width: '100%', height: '100%' }
            }, (
                <div slot="ar-button" className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gold-500 text-stone-950 px-8 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
                    <Smartphone size={16} /> View in Your Room
                </div>
            ))}

            {/* Hint Overlay */}
            <div className="absolute top-8 right-8 pointer-events-none text-right">
                <div className="text-white/20 flex flex-col items-end gap-1">
                    <Maximize2 size={32} strokeWidth={1} />
                    <span className="text-[8px] uppercase tracking-widest font-black">Pinch to Zoom</span>
                </div>
            </div>
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-stone-900/80 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-[10px] text-stone-500 font-medium max-w-xs text-center sm:text-left">
                See exactly how your dish looks before it arrives. Our AI-generated 3D models provide an accurate representation of portions and presentation.
            </div>
            <div className="flex gap-2">
                <div className="px-4 py-2 bg-stone-800 rounded-xl text-stone-400 text-[10px] font-bold uppercase tracking-widest border border-white/5">
                    1:1 Scale
                </div>
                <div className="px-4 py-2 bg-stone-800 rounded-xl text-stone-400 text-[10px] font-bold uppercase tracking-widest border border-white/5">
                    HD Textures
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ARViewerModal;
