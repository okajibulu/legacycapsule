'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ScanResult {
  success: boolean;
  message: string;
  guest_name?: string;
  category?: string;
  souvenir_tier?: string;
  direction?: 'IN' | 'OUT';
}

export default function UsherScanner() {
  // Session Configuration Setup
  const [isConfigured, setIsConfigured] = useState(false);
  const [usherOpCode, setUsherOpCode] = useState('USH-01');
  const [usherName, setUsherName] = useState('');
  const [gateLabel, setGateLabel] = useState('Gate 1 Main');
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');

  // Scanning State
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isConfigured) return;

    // Initialize Camera Scanner Component
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        if (isProcessing) return; // Prevent double trigger
        handleScan(decodedText);
      },
      (errorMessage) => {
        // Optical noise / scanning frame errors — ignore silently
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isConfigured, direction, usherOpCode, usherName, gateLabel]);

  // Execute Stored Procedure on Supabase
  const handleScan = async (codeString: string) => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.rpc('process_gate_scan', {
        p_code_string: codeString.trim(),
        p_direction: direction,
        p_usher_op_code: usherOpCode,
        p_usher_name: usherName,
        p_gate_label: gateLabel,
      });

      if (error) {
        setLastResult({
          success: false,
          message: `SERVER ERROR: ${error.message}`,
        });
      } else {
        setLastResult(data as ScanResult);
        
        // Trigger Haptic Feedback on Mobile
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          if (data.success) {
            navigator.vibrate([100, 50, 100]); // Short double vibration
          } else {
            navigator.vibrate([400]); // Long error vibration
          }
        }
      }
    } catch (err: any) {
      setLastResult({
        success: false,
        message: 'NETWORK ERROR: Scan failed to reach server.',
      });
    } finally {
      // Cooldown buffer before allowing next camera read
      setTimeout(() => {
        setIsProcessing(false);
      }, 1500);
    }
  };

  // Setup Form Viewport
  if (!isConfigured) {
    return (
      <div className="max-w-md mx-auto p-6 bg-slate-900 text-white rounded-xl shadow-md mt-10">
        <h2 className="text-xl font-bold mb-4 text-center border-b border-slate-700 pb-2">
          Usher Gate Setup
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Usher OpCode</label>
            <input
              type="text"
              value={usherOpCode}
              onChange={(e) => setUsherOpCode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
              placeholder="e.g. USH-01"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Usher Name</label>
            <input
              type="text"
              value={usherName}
              onChange={(e) => setUsherName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
              placeholder="e.g. Blessing Okon"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Gate / Service Point</label>
            <input
              type="text"
              value={gateLabel}
              onChange={(e) => setGateLabel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
              placeholder="e.g. Gate 1 North / Souvenir Canopy"
            />
          </div>
          <button
            onClick={() => setIsConfigured(true)}
            disabled={!usherName || !usherOpCode}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-lg mt-4 transition"
          >
            Start Scanning Session
          </button>
        </div>
      </div>
    );
  }

  // Active Scanner Viewport
  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4">
      {/* Top Session Context Header */}
      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
        <div>
          <span className="text-emerald-400 font-mono font-bold">{usherOpCode}</span> • {usherName}
          <div className="text-slate-400">{gateLabel}</div>
        </div>
        <button
          onClick={() => setIsConfigured(false)}
          className="text-slate-400 hover:text-white underline text-2xl px-2"
        >
          ⚙️
        </button>
      </div>

      {/* Mode Toggle Bar: IN vs OUT */}
      <div className="my-4 grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
        <button
          onClick={() => setDirection('IN')}
          className={`py-3 rounded-md font-bold text-sm transition ${
            direction === 'IN'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ⬇️ ENTRY (IN)
        </button>
        <button
          onClick={() => setDirection('OUT')}
          className={`py-3 rounded-md font-bold text-sm transition ${
            direction === 'OUT'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ⬆️ EXIT (OUT)
        </button>
      </div>

      {/* Camera Stream Container */}
      <div className="relative rounded-xl overflow-hidden border-2 border-slate-800 bg-black">
        <div id="reader" className="w-full"></div>
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-sm font-semibold text-emerald-400 backdrop-blur-xs">
            Verifying Code...
          </div>
        )}
      </div>

      {/* Dynamic Scan Result Cards */}
      {lastResult && (
        <div
          className={`mt-4 p-4 rounded-xl border-2 transition-all ${
            lastResult.success
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
              : 'bg-rose-950/80 border-rose-500 text-rose-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-black tracking-wide">
              {lastResult.success ? '✓ SUCCESS' : '✕ DENIED'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono uppercase bg-black/40">
              {lastResult.direction || direction}
            </span>
          </div>

          <p className="text-sm font-medium mt-1">{lastResult.message}</p>

          {lastResult.success && lastResult.guest_name && (
            <div className="mt-3 pt-2 border-t border-white/10 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Guest:</span>{' '}
                <strong className="text-white text-sm">{lastResult.guest_name}</strong>
              </div>
              {lastResult.category && (
                <div>
                  <span className="text-slate-400">Category:</span>{' '}
                  <span className="text-amber-300 font-semibold">{lastResult.category}</span>
                </div>
              )}
              {lastResult.souvenir_tier && (
                <div>
                  <span className="text-slate-400">Souvenir:</span>{' '}
                  <span className="text-emerald-300">{lastResult.souvenir_tier}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}