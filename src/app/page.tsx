'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  BarChart3, 
  Users, 
  Mail, 
  Calendar, 
  DollarSign, 
  Zap, 
  Shield, 
  Globe, 
  Smartphone, 
  Star,
  CheckCircle,
  Phone,
  MessageCircle,
  LogIn,
  Sparkles,
  TrendingUp,
  Target,
  Brain,
  Rocket,
  Award
} from 'lucide-react';

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Lead Generation",
      description: "Automatically identify and qualify high-value prospects using advanced AI algorithms and market intelligence.",
      benefits: ["Smart lead scoring", "Automated prospecting", "Real-time market insights"]
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Intelligent Email Campaigns",
      description: "Create personalized email sequences that adapt based on recipient behavior and engagement patterns.",
      benefits: ["Dynamic personalization", "A/B testing", "Behavioral triggers"]
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Advanced Analytics Dashboard",
      description: "Get comprehensive insights into your business performance with real-time analytics and predictive forecasting.",
      benefits: ["Real-time metrics", "Predictive analytics", "Custom reporting"]
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "CRM Integration",
      description: "Seamlessly manage your entire customer lifecycle from lead to conversion with our integrated CRM system.",
      benefits: ["Contact management", "Pipeline tracking", "Deal automation"]
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Proposal Builder",
      description: "Generate professional proposals and quotations in minutes with AI-assisted content and smart templates.",
      benefits: ["Template library", "AI content generation", "Digital signatures"]
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Social Media Management",
      description: "Plan, schedule, and analyze your social media presence across multiple platforms with AI-driven insights.",
      benefits: ["Multi-platform posting", "Content suggestions", "Engagement analytics"]
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechCorp Solutions",
      content: "AI Business Developer transformed our lead generation process. We've seen a 300% increase in qualified leads within just 3 months.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Sales Manager",
      company: "Growth Dynamics",
      content: "The AI-powered email campaigns have revolutionized our outreach. Our response rates improved by 250% and conversion rates doubled.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Business Owner",
      company: "Digital Innovations",
      content: "The analytics dashboard gives us insights we never had before. We can now make data-driven decisions that actually move the needle.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$99",
      period: "per month",
      description: "Perfect for small businesses getting started",
      features: [
        "Up to 1,000 contacts",
        "5 email campaigns/month",
        "Basic analytics",
        "Email support",
        "CRM integration"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$299",
      period: "per month",
      description: "Ideal for growing businesses",
      features: [
        "Up to 10,000 contacts",
        "Unlimited campaigns",
        "Advanced analytics",
        "Priority support",
        "All integrations",
        "AI proposal builder",
        "Social media management"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large organizations with specific needs",
      features: [
        "Unlimited contacts",
        "Custom integrations",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom reporting",
        "White-label options",
        "API access"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-emerald-50/50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Largify Solutions
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Features
              </a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Testimonials
              </a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Pricing
              </a>
              <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Contact
              </a>
              <Link href="/login">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              <Award className="w-4 h-4 mr-1" />
              #1 AI Business Development Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Transform Your Business with
              <span className="block bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                AI-Powered Growth
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Leverage cutting-edge artificial intelligence to automate lead generation, optimize sales processes, 
              and accelerate your business growth. Join thousands of companies already scaling with AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#contact">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-8 py-3">
                  <LogIn className="w-5 h-5 mr-2" />
                  Access Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">300%</div>
              <div className="text-gray-600 dark:text-gray-300">Lead Increase</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">$50M+</div>
              <div className="text-gray-600 dark:text-gray-300">Revenue Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-300">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Modern Businesses
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our AI-powered platform provides everything you need to streamline your business development 
              and accelerate growth.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-all duration-300 ${
                    activeFeature === index 
                      ? 'border-emerald-500 shadow-lg bg-emerald-50/50 dark:bg-emerald-900/20' 
                      : 'hover:border-emerald-300 hover:shadow-md'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        activeFeature === index 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}>
                        {feature.icon}
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base mb-3">
                      {feature.description}
                    </CardDescription>
                    {activeFeature === index && (
                      <div className="space-y-2">
                        {feature.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="lg:pl-8">
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-8 text-white">
                <div className="mb-6">
                  {features[activeFeature].icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{features[activeFeature].title}</h3>
                <p className="text-emerald-100 mb-6">{features[activeFeature].description}</p>
                <div className="space-y-3">
                  {features[activeFeature].benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-200" />
                      <span className="text-emerald-100">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white/50 dark:bg-gray-800/50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what our customers are saying about their success with AI Business Developer
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white dark:bg-gray-900 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="border-t pt-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                    <div className="text-sm text-emerald-600 dark:text-emerald-400">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Growth Plan
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Flexible pricing options designed to scale with your business
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${
                plan.popular 
                  ? 'border-emerald-500 shadow-xl scale-105 bg-white dark:bg-gray-900' 
                  : 'bg-white dark:bg-gray-900'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-emerald-600">{plan.price}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">/{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="#contact">
                    <Button className={`w-full ${
                      plan.popular 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white'
                    }`}>
                      {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-r from-emerald-600 to-green-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Get in touch with our sales team to learn how AI Business Developer can accelerate your growth
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Call Us</h3>
              <p className="text-emerald-100">+1 (555) 123-4567</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email Us</h3>
              <p className="text-emerald-100">sales@largifysolutions.com</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Chat</h3>
              <p className="text-emerald-100">Available 24/7</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-3">
              Schedule Demo
              <Calendar className="w-5 h-5 ml-2" />
            </Button>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3">
                <LogIn className="w-5 h-5 mr-2" />
                Access Platform
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Largify Solutions</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering businesses with AI-driven growth solutions.
              </p>
              <div className="flex space-x-4">
                <Shield className="w-5 h-5 text-emerald-400" />
                <Globe className="w-5 h-5 text-emerald-400" />
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a></li>
                <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Dashboard</Link></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog</a></li>
                <li><a href="#contact" className="hover:text-emerald-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Largify Solutions. All rights reserved. Powered by AI innovation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
