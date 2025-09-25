import React, { useState, useEffect } from 'react';
import TutorialMenu from './TutorialMenu';
import TutorialViewer from './TutorialViewer';
import { getTutorialById, getAllTutorials, setCurrencySymbol } from '../../data/tutorials/tutorialData';
import { useSafeCurrency } from '../../hooks/useSafeCurrency';

const Tutorial = () => {
  const { currencySymbol } = useSafeCurrency();
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [showMenu, setShowMenu] = useState(true);
  
  // Set currency symbol for tutorial data
  useEffect(() => {
    setCurrencySymbol(currencySymbol);
  }, [currencySymbol]);

  const handleSelectTutorial = (tutorial) => {
    setSelectedTutorial(tutorial);
    setShowMenu(false);
  };

  const handleBackToMenu = () => {
    setSelectedTutorial(null);
    setShowMenu(true);
  };

  const handleNextTutorial = () => {
    if (selectedTutorial) {
      const allTutorials = getAllTutorials();
      const currentIndex = allTutorials.findIndex(t => t.id === selectedTutorial.id);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < allTutorials.length) {
        const nextTutorial = allTutorials[nextIndex];
        setSelectedTutorial(nextTutorial);
      } else {
        // Jika sudah tutorial terakhir, kembali ke menu
        handleBackToMenu();
      }
    }
  };

  if (showMenu) {
    return <TutorialMenu onSelectTutorial={handleSelectTutorial} />;
  }

  if (selectedTutorial) {
    return (
      <TutorialViewer 
        tutorial={selectedTutorial}
        onBack={handleBackToMenu}
        onNextTutorial={handleNextTutorial}
      />
    );
  }

  return null;
};

export default Tutorial;
