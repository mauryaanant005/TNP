import React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadCardProps {
  title: string;
  description: string;
  onFileChange: (file: File | null) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  formType: string;
}

export function FileUploadCard({
  title,
  description,
  onFileChange,
  onSubmit,
  formType,
}: FileUploadCardProps) {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      <div className="relative h-full bg-gradient-to-b from-blue-900 to-blue-800 text-white p-8 rounded-xl shadow-2xl flex flex-col">
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
          {title}
        </h3>
        <p className="text-blue-200 mb-6 text-sm">{description}</p>

        <form onSubmit={onSubmit} className="space-y-6 flex-1 flex flex-col">
          <input type="hidden" value={formType} name="formType" />

          <div className="flex-1 flex flex-col justify-center">
            <label
              htmlFor={`file-${formType}`}
              className="relative group cursor-pointer w-full aspect-video flex flex-col items-center justify-center border-2 border-dashed border-blue-400 rounded-lg hover:border-orange-400 transition-colors"
            >
              <input
                id={`file-${formType}`}
                type="file"
                className="hidden"
                required
                onChange={(e) =>
                  onFileChange(e.target.files ? e.target.files[0] : null)
                }
                accept=".csv,.xlsx,.xls"
              />
              <Upload className="w-12 h-12 text-blue-400 group-hover:text-orange-400 transition-colors mb-4" />
              <span className="text-sm text-blue-300 group-hover:text-orange-300 transition-colors">
                Drag & drop your file here or click to browse
              </span>
              <span className="text-xs text-blue-400 mt-2">
                Supported formats: CSV, Excel
              </span>
            </label>
          </div>

          <button
            type="submit"
            className={cn(
              "w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-400",
              "rounded-lg font-medium text-white shadow-lg",
              "transform transition-all duration-200",
              "hover:from-orange-400 hover:to-orange-300 hover:shadow-orange-500/25",
              "active:scale-95"
            )}
          >
            Upload File
          </button>
        </form>
      </div>
    </div>
  );
}
