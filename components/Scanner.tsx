import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // ID del elemento HTML donde se renderizará el video
    const elementId = "reader";
    let isMounted = true;
    
    const startScanner = async () => {
        try {
            // Instanciamos el lector directo (sin UI prefabricada)
            const html5QrCode = new Html5Qrcode(elementId);
            if (isMounted) {
                scannerRef.current = html5QrCode;
            }

            const successCallback = (decodedText: string) => {
                // Éxito al leer - Detenemos inmediatamente para evitar lecturas múltiples
                html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                    onScanSuccess(decodedText);
                }).catch(err => {
                    console.error("Error al detener el escáner", err);
                    onScanSuccess(decodedText); 
                });
            };

            const qrConfig = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                disableFlip: false
            };

            try {
                // Intento 1: Cámara trasera ("environment")
                await html5QrCode.start(
                    { facingMode: "environment" }, 
                    qrConfig,
                    successCallback,
                    () => {} // Ignoramos errores de escaneo de marco
                );
            } catch (err) {
                console.warn("Intento de cámara trasera falló, probando cámara genérica/frontal:", err);
                try {
                    // Intento 2: Cámara frontal o genérica ("user")
                    await html5QrCode.start(
                        { facingMode: "user" }, 
                        qrConfig,
                        successCallback,
                        () => {}
                    );
                } catch (userCamErr) {
                    // Intento 3: Sin faceMode constraint
                    await html5QrCode.start(
                        {}, 
                        qrConfig,
                        successCallback,
                        () => {}
                    );
                }
            }
        } catch (err: any) {
            console.error("Error al iniciar escáner en todos los modos:", err);
            if (isMounted) {
                setError(err?.message || "No se pudo acceder a la cámara.");
            }
        }
    };

    // Pequeño delay para asegurar que el div "reader" exista en el DOM
    const timer = setTimeout(() => {
        startScanner();
    }, 100);

    return () => {
        isMounted = false;
        clearTimeout(timer);
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop()
                .then(() => scannerRef.current?.clear())
                .catch(console.error);
        }
    };
  }, [onScanSuccess]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
        onScanSuccess(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 relative flex flex-col items-center">
        
        {/* Botón Cerrar */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-colors"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="relative w-full aspect-square bg-slate-950">
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-slate-950">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 border border-amber-500/20">
                        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <p className="font-bold text-slate-100 text-lg">Cámara no disponible</p>
                    <p className="text-xs text-gray-400 mt-1.5 mb-6 max-w-xs leading-relaxed">
                        No se detectó cámara trasera u omitió permisos de hardware. <br/>
                        <b>Podés continuar ingresando el ID de la herramienta a continuación:</b>
                    </p>
                    
                    <form onSubmit={handleManualSubmit} className="flex gap-2 w-full max-w-sm px-4">
                        <input 
                            type="text" 
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="Ej: T1001 o Pala" 
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm transition-all"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10"
                        >
                            Ingresar
                        </button>
                    </form>
                    
                    <p className="text-[10px] text-gray-600 mt-6 max-w-[280px] break-words">
                        Detalle técnico: {error}
                    </p>
                </div>
            ) : (
                <>
                     {/* Contenedor del video */}
                     <div id="reader" className="w-full h-full"></div>
                     
                     {/* Overlay Guía Visual */}
                     <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                        <div className="w-64 h-64 border-2 border-violet-500/50 rounded-3xl relative">
                            {/* Esquinas Resaltadas */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-violet-500 rounded-tl-xl shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-violet-500 rounded-tr-xl shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-violet-500 rounded-bl-xl shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-violet-500 rounded-br-xl shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                            
                            {/* Linea de escaneo animada */}
                            <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-violet-400/80 shadow-[0_0_15px_rgba(167,139,250,0.8)] animate-pulse"></div>
                        </div>
                     </div>
                </>
            )}
        </div>
        
        {!error && (
            <div className="p-6 text-center z-10 w-full px-8 border-t border-slate-900 bg-slate-950">
                <p className="text-white font-bold text-base">Escaneando código QR</p>
                <p className="text-gray-400 text-xs mt-0.5 mb-4">Apunte la cámara al código de la herramienta</p>
                
                {/* Separador */}
                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase tracking-wider font-semibold">O INGRESO MANUAL</span>
                    <div className="flex-grow border-t border-slate-800"></div>
                </div>

                {/* Ingreso manual siempre disponible */}
                <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2 w-full">
                    <input 
                        type="text" 
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="ID de herramienta (ej: T1001)..." 
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm transition-colors"
                    />
                    <button 
                        type="submit"
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-600/10"
                    >
                        Confirmar
                    </button>
                </form>
            </div>
        )}

      </div>
    </div>
  );
};

export default Scanner;