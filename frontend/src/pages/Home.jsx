import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Button, Card } from '../components/UI';
import { Database, Shield, Zap, Globe, ShoppingBag, Package, ArrowRight } from 'lucide-react';

const Home = () => {
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Decentralized<br />
            <span className="text-primary-600">Synthetic Data Market</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Buy and sell AI-generated datasets with built-in quality verification,
            escrow protection, and IPFS-backed transparency.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            {isConnected ? (
              <>
                <Link to="/buyer">
                  <Button size="lg">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Buyer Dashboard
                  </Button>
                </Link>
                <Link to="/seller">
                  <Button variant="secondary" size="lg">
                    <Package className="h-5 w-5 mr-2" />
                    Seller Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <Button size="lg">
                Connect Wallet to Get Started
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Database className="h-8 w-8" />}
            title="Create Request"
            description="Buyers specify their data needs, budget, and accepted formats"
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="AI Generation"
            description="Sellers use AI models to generate datasets matching requirements"
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="Quality Verification"
            description="Automated QA verification with reports stored on IPFS"
          />
          <FeatureCard
            icon={<Globe className="h-8 w-8" />}
            title="Secure Payment"
            description="Smart contract escrow ensures fair transactions"
          />
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Synthetic Data Market?
              </h2>
              <ul className="space-y-4">
                <BenefitItem text="Decentralized marketplace with no intermediaries" />
                <BenefitItem text="Automated quality verification with IPFS transparency" />
                <BenefitItem text="Smart contract escrow protection for both parties" />
                <BenefitItem text="Lightweight on-chain storage for efficiency" />
                <BenefitItem text="Flexible format support (Audio, CSV, Image, Text, Video)" />
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Datasets Sold" value="1,234" />
              <StatCard label="Active Sellers" value="89" />
              <StatCard label="Total Volume" value="45 ETH" />
              <StatCard label="Avg QA Score" value="92/100" />
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="p-12 text-center bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Connect your wallet and start trading synthetic datasets today
          </p>
          {!isConnected && (
            <Button size="lg">
              Connect Wallet
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <Card className="p-6 text-center hover:shadow-lg transition-shadow">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </Card>
  );
};

const BenefitItem = ({ text }) => {
  return (
    <li className="flex items-start">
      <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-gray-700">{text}</span>
    </li>
  );
};

const StatCard = ({ label, value }) => {
  return (
    <Card className="p-6">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary-600">{value}</p>
    </Card>
  );
};

export default Home;
