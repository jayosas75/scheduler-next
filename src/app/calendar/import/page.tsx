'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/import', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ success: true, message: data.message });
                setFile(null);
            } else {
                setResult({ success: false, message: data.message || 'Import failed' });
            }
        } catch (error) {
            setResult({ success: false, message: 'An error occurred during import' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6">
            <div className="w-full max-w-2xl bg-black/60 border-2 border-cyan-500/40 rounded-2xl p-8 glow scanlines">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/20 border border-cyan-500/40 rounded-full mb-4">
                        <Upload className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-black text-cyan-400 mb-2 tracking-widest uppercase">
                        ⊕ Import Calendar
                    </h1>
                    <p className="text-cyan-100/70 text-sm">
                        Upload an <code className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-400">.ics</code> file from Google Calendar, Apple Calendar, or any other calendar app
                    </p>
                </div>

                <div className="space-y-6">
                    {/* File Input */}
                    <div className="border-2 border-dashed border-cyan-500/30 rounded-xl p-8 text-center hover:border-cyan-400/50 transition-colors bg-black/40">
                        <input
                            type="file"
                            accept=".ics"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center"
                        >
                            {file ? (
                                <>
                                    <CheckCircle className="w-12 h-12 text-cyan-400 mb-3" />
                                    <p className="text-lg font-bold text-cyan-100">{file.name}</p>
                                    <p className="text-sm text-cyan-400/60 mt-1">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 text-cyan-400/60 mb-3" />
                                    <p className="text-lg font-bold text-cyan-100">
                                        Click to select a file
                                    </p>
                                    <p className="text-sm text-cyan-400/60 mt-1">
                                        or drag and drop your .ics file here
                                    </p>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full bg-cyan-500 text-black py-3 px-6 rounded-lg font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-400 transition-all uppercase tracking-widest"
                    >
                        {uploading ? '⊙ Importing...' : '⊕ Import Calendar'}
                    </button>

                    {/* Result Message */}
                    {result && (
                        <div
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 ${result.success
                                    ? 'bg-cyan-500/10 border-cyan-500/40'
                                    : 'bg-red-500/10 border-red-500/40'
                                }`}
                        >
                            {result.success ? (
                                <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                                <p
                                    className={`font-bold ${result.success ? 'text-cyan-400' : 'text-red-400'
                                        }`}
                                >
                                    {result.success ? '✓ Success!' : '✗ Error'}
                                </p>
                                <p
                                    className={`text-sm ${result.success ? 'text-cyan-100' : 'text-red-300'
                                        }`}
                                >
                                    {result.message}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 mt-6">
                        <h3 className="font-bold text-cyan-400 mb-2 text-sm uppercase tracking-wider">How to export your calendar:</h3>
                        <ul className="text-xs text-cyan-100/70 space-y-1 list-disc list-inside">
                            <li><strong className="text-cyan-400">Google Calendar:</strong> Settings → Import & Export → Export</li>
                            <li><strong className="text-cyan-400">Apple Calendar:</strong> File → Export → Export...</li>
                            <li><strong className="text-cyan-400">Outlook:</strong> File → Save Calendar → iCalendar Format</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
