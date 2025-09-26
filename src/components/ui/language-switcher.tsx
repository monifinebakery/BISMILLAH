import { Languages, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const languages = [
  {
    code: 'id',
    name: 'Bahasa Indonesia',
    flag: '🇮🇩',
    shortName: 'ID'
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    shortName: 'EN'
  }
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 h-8 px-2 hover:bg-accent/50 transition-colors"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Globe className="h-4 w-4" />
          </motion.div>
          <span className="text-xs font-medium">
            {currentLanguage.shortName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <AnimatePresence>
          {languages.map((language, index) => (
            <motion.div
              key={language.code}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <DropdownMenuItem
                onClick={() => changeLanguage(language.code)}
                className={`flex items-center gap-3 cursor-pointer transition-colors ${
                  currentLanguage.code === language.code 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent/50'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{language.name}</span>
                  <span className="text-xs text-muted-foreground">{language.shortName}</span>
                </div>
                {currentLanguage.code === language.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 bg-primary rounded-full"
                  />
                )}
              </DropdownMenuItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function MobileLanguageSwitcher() {
  const { i18n } = useTranslation()
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const toggleLanguage = () => {
    const newLang = currentLanguage.code === 'id' ? 'en' : 'id'
    i18n.changeLanguage(newLang)
  }

  return (
    <Button 
      onClick={toggleLanguage}
      variant="ghost" 
      size="sm" 
      className="gap-2 h-9 px-3 hover:bg-accent/50 transition-colors"
    >
      <motion.div
        key={currentLanguage.code}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2"
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span className="text-xs font-medium">{currentLanguage.shortName}</span>
      </motion.div>
    </Button>
  )
}