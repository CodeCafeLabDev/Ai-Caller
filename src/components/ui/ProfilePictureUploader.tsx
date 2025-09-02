// NOTE: You must install react-easy-crop: npm install react-easy-crop
import React, { useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { api, API_BASE_URL } from "@/lib/apiConfig";

interface ProfilePictureUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onDelete: () => void;
  onUpload?: (file: File) => Promise<void>;
}

export default function ProfilePictureUploader({ value, onChange, onDelete, onUpload }: ProfilePictureUploaderProps) {
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        console.log('Image loaded, showing cropper');
        setImageSrc(reader.result);
        setShowCrop(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    if (!croppedBlob) return;
    const file = new File([croppedBlob], "profile.jpg", { type: "image/jpeg" });
    if (onUpload) {
      console.log('Calling custom onUpload handler with file:', file);
      // The onUpload handler should return the new URL (or call onChange itself)
      const result = await onUpload(file);
      // If the handler returns a URL, call onChange
      if (typeof result === 'string') {
        onChange(result);
      }
    } else {
      const formData = new FormData();
      formData.append("profile_picture", file);
      
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/admin_users/me/avatar_url`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        
        const data = await res.json();
        if (data.success) {
          onChange(data.avatar_url);
        } else {
          console.error('Failed to upload profile picture:', data.message);
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
      }
    }
    setShowCrop(false);
  };

  // Before rendering the cropper modal
  console.log('showCrop:', showCrop, 'imageSrc:', imageSrc);
  return (
    <div className="flex flex-col items-center">
      <img
        src={
          value
            ? value.startsWith('http')
              ? value
              : `${API_BASE_URL}${value}`
            : "/default-avatar.png"
        }
        alt="Profile"
        className="w-20 h-20 rounded-full object-cover mb-2"
      />
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button type="button" onClick={() => inputRef.current?.click()} className="text-xs underline">Change Picture</button>
      {value && <button type="button" onClick={onDelete} className="text-xs text-red-500 underline">Delete Picture</button>}
      {showCrop && imageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded">
            <div className="relative w-64 h-64">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleCropSave} className="bg-black text-white px-4 py-1 rounded">Save</button>
              <button type="button" onClick={() => setShowCrop(false)} className="bg-gray-200 px-4 py-1 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility to crop image to blob
async function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob | null> {
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || null);
    }, "image/jpeg");
  });
} 