"use client";
import '../i18n';
import React from "react";
import { useTranslation } from 'react-i18next';
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f3f0ff] to-white">
      <div className="w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">{t('login.title')}</h2>
        <p className="text-center text-gray-600 mb-6">{t('login.subtitle')}</p>
        <LoginForm />
      </div>
    </div>
  );
}
