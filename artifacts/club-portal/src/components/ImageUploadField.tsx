import { useState, useRef, useCallback } from "react";
import { requestUploadUrl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, ImageIcon, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type ImageUploadVariant = "square" | "banner" | "standard";

interface ImageUploadFieldProps {
  label?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  variant?: ImageUploadVariant;
  maxSizeMB?: number;
}

const MAX_DEFAULT_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  className = "",
  variant = "standard",
  maxSizeMB = MAX_DEFAULT_MB,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isSquare = variant === "square";
  const isBanner = variant === "banner";

  const containerClass = isSquare
    ? "h-28 w-28"
    : isBanner
      ? "h-44 w-full"
      : "h-52 w-full";

  const previewClass = isSquare
    ? "h-28 w-28 rounded-xl"
    : isBanner
      ? "h-44 w-full rounded-xl"
      : "h-52 w-full rounded-xl";

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPEG, PNG, WEBP, or GIF image.",
          variant: "destructive",
        });
        return;
      }

      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        toast({
          title: "File too large",
          description: `Image must be ${maxSizeMB} MB or less. Selected file is ${formatBytes(file.size)}.`,
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const { uploadURL, objectPath } = await requestUploadUrl({
          name: file.name,
          size: file.size,
          contentType: file.type,
        });

        const xhr = new XMLHttpRequest();
        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
          xhr.open("PUT", uploadURL);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        const finalUrl = `/api/storage${objectPath}`;
        onChange(finalUrl);
        toast({
          title: "Image uploaded",
          description: "Your image has been saved successfully.",
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message ?? "Something went wrong. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [maxSizeMB, onChange, toast],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleClick = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium leading-none text-foreground">
          {label}
        </label>
      )}

      <div className={containerClass}>
        {value ? (
          <div className={`relative group overflow-hidden border border-border bg-muted ${previewClass}`}>
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover"
            />

            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <span className="text-white text-xs font-medium">{uploadProgress}%</span>
                <div className="w-3/4 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {!isUploading && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs shadow-lg"
                  onClick={handleClick}
                  type="button"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Replace
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs shadow-lg"
                  onClick={() => onChange(null)}
                  type="button"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center border-2 border-dashed cursor-pointer transition-all duration-200 select-none ${previewClass} ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-muted/60 bg-muted/30"
            }`}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Uploading… {uploadProgress}%
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-6 text-center pointer-events-none">
                <div className={`rounded-xl flex items-center justify-center transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"} ${isSquare ? "h-10 w-10 bg-muted" : "h-12 w-12 bg-muted"}`}>
                  {isDragging ? (
                    <CheckCircle2 className={isSquare ? "h-5 w-5" : "h-6 w-6"} />
                  ) : (
                    <ImageIcon className={isSquare ? "h-5 w-5" : "h-6 w-6"} />
                  )}
                </div>
                {!isSquare && (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      {isDragging ? "Drop image here" : "Click or drag to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG, WEBP or GIF · Max {maxSizeMB} MB
                    </p>
                  </>
                )}
                {isSquare && (
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Upload
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}
