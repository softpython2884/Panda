
"use client"; // Assurez-vous que c'est un composant client

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Vérifiez si window est défini (pour éviter les erreurs SSR)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    
    const listener = () => setMatches(mediaQueryList.matches);

    // Définir l'état initial
    listener();
    
    // Écouter les changements
    // Ancienne méthode addListener (pour la compatibilité) et nouvelle addEventListener
    try {
        mediaQueryList.addEventListener('change', listener);
    } catch (e) { // Safari < 14
        mediaQueryList.addListener(listener);
    }


    return () => {
      try {
        mediaQueryList.removeEventListener('change', listener);
      } catch (e) { // Safari < 14
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}
