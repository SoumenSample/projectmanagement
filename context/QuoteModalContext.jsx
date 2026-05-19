"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

const QuoteModalContext = createContext();

export function QuoteModalProvider({ children }) {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [stepFormData, setStepFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: [],
    requirement: "",
    budget: "",
  });
  const [stepError, setStepError] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  const resetQuoteForm = useCallback(() => {
    setCurrentStepIndex(0);
    setIsComplete(false);
    setStepError("");
    setIsSubmittingLead(false);
    setStepFormData({
      name: "",
      email: "",
      phone: "",
      service: [],
      requirement: "",
      budget: "",
    });
  }, []);

  const openQuoteModal = useCallback(() => {
    resetQuoteForm();
    setIsQuoteModalOpen(true);
  }, [resetQuoteForm]);

  const closeQuoteModal = useCallback(() => {
    setIsQuoteModalOpen(false);
    resetQuoteForm();
  }, [resetQuoteForm]);

  const value = {
    isQuoteModalOpen,
    setIsQuoteModalOpen,
    currentStepIndex,
    setCurrentStepIndex,
    isComplete,
    setIsComplete,
    stepFormData,
    setStepFormData,
    stepError,
    setStepError,
    isSubmittingLead,
    setIsSubmittingLead,
    resetQuoteForm,
    openQuoteModal,
    closeQuoteModal,
  };

  return (
    <QuoteModalContext.Provider value={value}>
      {children}
    </QuoteModalContext.Provider>
  );
}

export function useQuoteModal() {
  const context = useContext(QuoteModalContext);
  if (!context) {
    throw new Error("useQuoteModal must be used within QuoteModalProvider");
  }
  return context;
}
