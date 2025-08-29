import React, { useState } from 'react';
import TutorialMenu from './TutorialMenu';
import TutorialViewer from './TutorialViewer';
import { getTutorialById, getAllTutorials } from '../../data/tutorials/tutorialData';

const Tutorial = () => {
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [showMenu, setShowMenu] = useState(true);

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
