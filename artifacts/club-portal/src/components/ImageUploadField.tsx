import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { requestUploadUrl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadFieldProps {
  label?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export function ImageUploadField({ label, value, onChange, className = "" }: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      // 1. Request presigned URL
      const { uploadURL, objectPath } = await requestUploadUrl({
        name: file.name,
        size: file.size,
        contentType: file.type,
      });

      // 2. PUT file directly to GCS
      const res = await fetch(uploadURL, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image to storage");
      }

      // 3. Save the served URL
      const finalUrl = `/api/storage${objectPath}`;
      onChange(finalUrl);
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
      
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative group rounded-md overflow-hidden border border-border h-24 w-24 bg-muted">
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => onChange(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center rounded-md border border-dashed border-border h-24 w-full bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Click to upload</span>
              </>
            )}
          </div>
        )}
        
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
    </div>
  );
}