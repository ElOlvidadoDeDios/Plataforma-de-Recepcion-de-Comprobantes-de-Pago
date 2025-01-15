import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface EmailContextType {
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

interface EmailProviderProps {
  children: ReactNode;
}

export const EmailProvider: React.FC<EmailProviderProps> = ({ children }) => {
  const [email, setEmail] = useState<string>('');

  return (
    <EmailContext.Provider value={{ email, setEmail }}>
      {children}
    </EmailContext.Provider>
  );
};

export const useEmail = (): EmailContextType => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
};
