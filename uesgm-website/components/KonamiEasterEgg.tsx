'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KONAMI_CODE = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'KeyB',
    'KeyA',
];

export function KonamiEasterEgg() {
    const [keys, setKeys] = useState<string[]>([]);
    const [activated, setActivated] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setKeys((prevKeys) => {
                const newKeys = [...prevKeys, e.code].slice(-10);

                if (JSON.stringify(newKeys) === JSON.stringify(KONAMI_CODE)) {
                    setActivated(true);
                    setTimeout(() => setActivated(false), 10000);
                    return [];
                }

                return newKeys;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <AnimatePresence>
            {activated && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ y: 50 }}
                        animate={{ y: 0 }}
                        className="text-center space-y-6 p-8 max-w-2xl"
                    >
                        {/* Animation du drapeau gabonais */}
                        <motion.div
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1,
                            }}
                            className="w-32 h-32 mx-auto mb-8 rounded-full overflow-hidden border-4 border-white shadow-2xl"
                        >
                            <div className="w-full h-1/3 bg-green-600"></div>
                            <div className="w-full h-1/3 bg-yellow-400"></div>
                            <div className="w-full h-1/3 bg-blue-600"></div>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-4xl font-montserrat font-bold text-gold"
                        >
                            🎉 Vous avez trouvé l'Easter Egg ! 🎉
                        </motion.h2>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="space-y-4 text-white"
                        >
                            <p className="text-xl font-lato">
                                Félicitations ! Vous êtes un vrai explorateur digital.
                            </p>

                            <div className="border-t border-b border-gold/30 py-6 my-6">
                                <p className="text-lg text-gold/80 italic">
                                    "L'union fait la force, la digitalisation fait l'avenir"
                                </p>
                                <p className="text-sm text-gray-400 mt-2">- UESGM 2026</p>
                            </div>

                            <div className="bg-primary/20 rounded-lg p-6 backdrop-blur border border-primary/30">
                                <p className="text-sm font-mono text-gold">
                                    🏆 SIGNATURE DES DÉVELOPPEURS 🏆
                                </p>
                                <p className="text-xs text-gray-300 mt-4">
                                    Site développé avec ❤️ pour l'UESGM
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Stack : Next.js 14 • TypeScript • Tailwind CSS • Prisma
                                </p>
                                <p className="text-xs text-gray-400">
                                    Janvier 2026 • Version 1.0
                                </p>
                                <p className="text-xs text-gold/60 mt-4 font-mono">
                  /* Easter Egg activated via Konami Code */
                                    <br />
                  /* ↑ ↑ ↓ ↓ ← → ← → B A */
                                    <br />
                  /* Created with passion for the Gabonese student community */
                                </p>
                            </div>

                            <motion.p
                                animate={{
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                }}
                                className="text-sm text-gray-400"
                            >
                                Ce message disparaîtra dans quelques secondes...
                            </motion.p>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
