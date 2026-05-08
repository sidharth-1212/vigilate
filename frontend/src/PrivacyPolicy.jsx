import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-gray-800/50 border border-gray-700 rounded-2xl p-10 shadow-2xl backdrop-blur-xl">
        
        <div className="flex items-center gap-4 border-b border-gray-700 pb-6 mb-8">
          <Shield className="w-10 h-10 text-blue-500" />
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Privacy Policy for Vigilate</h1>
            <p className="text-sm text-gray-500 mt-1">Effective Date: May 7, 2026</p>
          </div>
        </div>

        <div className="space-y-8 prose prose-invert prose-blue max-w-none">
          
          <section>
            <h2 className="text-xl font-bold text-white border-b border-gray-700/50 pb-2 mb-4">1. Introduction</h2>
            <p>
              Welcome to Vigilate ("we," "our," or "us"). We are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy explains how we collect, use, and protect your information when you visit our website at https://vigilate.vercel.app (the "Service").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-gray-700/50 pb-2 mb-4">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-blue-400">Personal Information:</strong> Name, email address, and other contact details when you provide them to us.</li>
              <li><strong className="text-blue-400">Uploaded Documents:</strong> We process the text of legal documents (e.g., PDFs, DOCX) you upload to provide our analysis. We do not permanently store the original files; we only store the generated summary and risk score in your private audit history.</li>
              <li><strong className="text-blue-400">Device Information:</strong> IP address, browser type, operating system, and other technical information required for server security.</li>
              <li><strong className="text-blue-400">Cookies and Tracking Data:</strong> Information collected through secure session tokens to keep you logged in.</li>
              <li><strong className="text-blue-400">Payment Information:</strong> Transaction history and subscription status when you make purchases.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-gray-700/50 pb-2 mb-4">3. Third-Party Services</h2>
            <p>We use third-party services that collect, monitor, and analyze data to operate our platform:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-blue-400">Artificial Intelligence APIs:</strong> We utilize third-party AI APIs (SambaNova) to process and analyze the text of uploaded documents. We only transmit the extracted text necessary for analysis, and our AI providers are strictly prohibited from using your documents to train their models.</li>
              <li><strong className="text-blue-400">Transactional Email:</strong> We use secure email providers to send critical account alerts, such as password resets.</li>
              <li><strong className="text-blue-400">Payment Processors:</strong> We use Dodo Payments to handle transactions. Your credit card data is processed securely by them and never touches our servers.</li>
              <li><strong className="text-blue-400">Content Delivery Networks:</strong> We use Vercel's global CDN to ensure the site loads quickly and securely.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-gray-700/50 pb-2 mb-4">4. Your Privacy Rights</h2>
            <p>Depending on your location (including under GDPR in the EU and CCPA in California), you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access the personal information we hold about you.</li>
              <li>Request the deletion of your account and all associated audit histories.</li>
              <li>Opt-out of any data processing.</li>
            </ul>
            <p className="mt-4"><strong>We do not sell personal information of our users.</strong></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-gray-700/50 pb-2 mb-4">5. Contact Us</h2>
            <p>If you wish to exercise your data rights or have questions about this policy, contact us:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>By email: architechsystems.lk@gmail.com</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}