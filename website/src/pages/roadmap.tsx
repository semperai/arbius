import React, { useState } from 'react';
import { CheckCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import RootLayout from '@/app/layout';
import ArbiusLogo from '@/app/assets/images/arbius_logo_team_page.svg';

interface RoadmapItem {
  text: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface RoadmapData {
  empathy: RoadmapItem[];
  compute: RoadmapItem[];
  economy: RoadmapItem[];
}

const data: RoadmapData = {
  empathy: [
    { text: "CHARACTERS WITH FINE-TUNED PERSONALITY", status: 'completed' },
    { text: "FULL SENSORY COMPREHENSION", status: 'completed' },
    { text: "BUILD CRYPTOCURRENCY WALLET INTO AMICA", status: 'in-progress' },
    { text: "AUTONOMOUS INTERACTION WITH INTERFACES", status: 'pending' },
    { text: "LONG/SHORT TERM MEMORY SYSTEM", status: 'in-progress' },
    { text: "PHYSICAL AMICA DEVICE", status: 'in-progress' }
  ],
  compute: [
    { text: "LAUNCH DAO", status: 'completed' },
    { text: "SUPPORT ADDITIONAL MODEL TYPES (VIDEO, LLM, AUDIO)", status: 'completed' },
    { text: "SCALE TO 100 SOLUTIONS PER SECOND", status: 'in-progress' },
    { text: "IMPLEMENT COMPOSABLE MODEL PIPELINES", status: 'pending' },
    { text: "ARBIUS MODELS USED TO GENERATE SYNTHETIC DATASETS", status: 'pending' },
    { text: "AGENTS AS SELF EXECUTING SMART CONTRACTS", status: 'pending' }
  ],
  economy: [
    { text: "LAUNCH MARKETPLACE WITH AUTONOMOUS AGENT WORKERS", status: 'completed' },
    { text: "DECENTRALIZED ESCROW & REPUTATION SYSTEM", status: 'completed' },
    { text: "SUPPORT ANY DIGITAL CURRENCY", status: 'pending' },
    { text: "HIRE AGENTS ON A TIME BASIS", status: 'pending' },
    { text: "INVEST DIRECTLY IN AGENTS AND RECEIVE DIVIDENDS", status: 'in-progress' },
    { text: "ENCRYPTED TEXT AND VIDEO CHAT WITH AGENTS", status: 'in-progress' }
  ]
};

export default function Roadmap() {
  const [roadmapData, setRoadmapData] = useState<RoadmapData>(data);

  const getStatusStyles = (
    status: 'completed' | 'in-progress' | 'pending',
    pillarColor: 'compute' | 'empathy' | 'economy'
  ) => {
    const colors = {
      empathy: { border: '#10b981', bg: '16, 185, 129', text: '#059669' },
      compute: { border: '#3b82f6', bg: '59, 130, 246', text: '#2563eb' },
      economy: { border: '#8b5cf6', bg: '139, 92, 246', text: '#7c3aed' }
    };

    const color = colors[pillarColor];

    if (status === 'completed') {
      return {
        border: `2px solid ${color.border}`,
        background: `rgba(${color.bg}, 0.05)`,
        position: 'relative' as const
      };
    } else if (status === 'in-progress') {
      return {
        border: `2px solid ${color.border}`,
        background: `rgba(${color.bg}, 0.08)`,
        boxShadow: `0 0 0 1px rgba(${color.bg}, 0.1)`,
        position: 'relative' as const
      };
    }
    return {
      border: `2px solid #e5e7eb`,
      background: `#fafafa`,
      position: 'relative' as const
    };
  };

  const StatusBadge = ({ status }: { status: 'completed' | 'in-progress' | 'pending' }) => {
    const icons = {
      completed: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
      'in-progress': <ArrowPathIcon className="w-5 h-5 text-blue-500" />,
      pending: <ClockIcon className="w-5 h-5 text-gray-400" />
    };

    return (
      <div style={{
        position: 'absolute',
        top: '-10px',
        left: '-10px',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '2px solid #f3f4f6',
        zIndex: 3
      }}>
        {icons[status]}
      </div>
    );
  };

  const allItems = Object.values(roadmapData).flat();
  const totalItems = allItems.length;
  const completedItems = allItems.filter((item: RoadmapItem) => item.status === 'completed').length;
  const inProgressItems = allItems.filter((item: RoadmapItem) => item.status === 'in-progress').length;
  const progressPercentage = ((completedItems + (inProgressItems * 0.5)) / totalItems) * 100;

  return (
    <RootLayout>
      <div style={{
        minHeight: '100vh',
        background: 'white',
        color: '#111827',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        paddingTop: '120px',
        paddingBottom: '80px',
        paddingLeft: '20px',
        paddingRight: '20px'
      }}>
        <style>{`
          .roadmap-item {
            transition: all 0.3s ease;
          }
          .roadmap-item:hover {
            transform: translateX(5px);
          }
        `}</style>
  
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              marginBottom: '40px',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)'
            }}>
              <Image
                src={ArbiusLogo}
                alt="Arbius Logo"
                style={{ width: '80px', height: 'auto' }}
              />
            </div>
  
            <h1 style={{
              fontSize: '48px',
              fontWeight: '800',
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Roadmap
            </h1>
  
            <p style={{
              fontSize: '18px',
              color: '#475569',
              maxWidth: '900px',
              margin: '0 auto 24px',
              lineHeight: '1.7',
              fontWeight: '500'
            }}>
              Arbius envisions a future where artificial intelligence transcends current limitations, by embracing decentralization, empathy, and economic innovation.
            </p>
  
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              maxWidth: '900px',
              margin: '0 auto 20px',
              lineHeight: '1.7'
            }}>
              This foundation ensures that AI capabilities are not just advanced but also universally accessible, breaking down barriers to entry and fostering innovation on a global scale.
            </p>
  
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              maxWidth: '900px',
              margin: '0 auto 20px',
              lineHeight: '1.7'
            }}>
              Our roadmap outlines our vision where Decentralized AI democratizes global computational power, AI with Empathy blurs the line between human and machine interaction, and AI Capitalism redefines economic productivity, in a world where AIs and humans work and co-exist together.
            </p>
  
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              maxWidth: '900px',
              margin: '0 auto',
              lineHeight: '1.7'
            }}>
              Our goal is to ensure AI can be free, in the sense of liberty, and to build tools and protocols to ensure open access to both humans and AI equally. Everything we build is for AI to use.
            </p>
          </div>
  
          {/* Main Title Box */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              display: 'inline-block',
              padding: '16px 48px',
              background: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontWeight: '600',
              color: '#475569'
            }}>
              ARBIUS ROADMAP / PILLARS
            </div>
          </div>
  
          {/* Three Pillars Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '40px',
            marginBottom: '80px'
          }}>
            {/* EMPATHY Pillar */}
            <div style={{ position: 'relative' }}>
              {/* Vertical connecting line */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '60px',
                bottom: '20px',
                width: '2px',
                background: 'linear-gradient(180deg, #10b981 0%, transparent 100%)',
                transform: 'translateX(-50%)',
                opacity: 0.2,
                zIndex: 0
              }}></div>
  
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '2px solid #10b981',
                borderRadius: '16px',
                textAlign: 'center',
                marginBottom: '30px',
                position: 'relative',
                zIndex: 2,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
              }}>
                <h3 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '8px', color: '#059669', fontWeight: '700' }}>EMPATHY:</h3>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#064e3b' }}>AMICA</p>
              </div>
  
              {roadmapData.empathy.map((item: RoadmapItem, i: number) => (
                <div key={i} className="roadmap-item" style={{
                  ...getStatusStyles(item.status, 'empathy'),
                  padding: '16px 16px 16px 24px',
                  marginBottom: '16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  letterSpacing: '0.3px',
                  textAlign: 'left',
                  color: item.status === 'pending' ? '#6b7280' : '#059669',
                  fontWeight: '500',
                  zIndex: 2,
                  backgroundColor: 'white',
                }}>
                  <StatusBadge status={item.status} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
  
            {/* COMPUTE Pillar */}
            <div style={{ position: 'relative' }}>
              {/* Vertical connecting line */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '60px',
                bottom: '20px',
                width: '2px',
                background: 'linear-gradient(180deg, #3b82f6 0%, transparent 100%)',
                transform: 'translateX(-50%)',
                opacity: 0.2,
                zIndex: 0
              }}></div>
  
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '2px solid #3b82f6',
                borderRadius: '16px',
                textAlign: 'center',
                marginBottom: '30px',
                position: 'relative',
                zIndex: 2,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
              }}>
                <h3 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '8px', color: '#2563eb', fontWeight: '700' }}>COMPUTE:</h3>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a' }}>ARBIUS PROTOCOL</p>
              </div>
  
              {roadmapData.compute.map((item: RoadmapItem, i: number) => (
                <div key={i} className="roadmap-item" style={{
                  ...getStatusStyles(item.status, 'compute'),
                  padding: '16px 16px 16px 24px',
                  marginBottom: '16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  letterSpacing: '0.3px',
                  textAlign: 'left',
                  color: item.status === 'pending' ? '#6b7280' : '#2563eb',
                  fontWeight: '500',
                  zIndex: 2,
                  backgroundColor: 'white',
                }}>
                  <StatusBadge status={item.status} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
  
            {/* ECONOMY Pillar */}
            <div style={{ position: 'relative' }}>
              {/* Vertical connecting line */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '60px',
                bottom: '20px',
                width: '2px',
                background: 'linear-gradient(180deg, #8b5cf6 0%, transparent 100%)',
                transform: 'translateX(-50%)',
                opacity: 0.2,
                zIndex: 0
              }}></div>
  
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #f3f4ff 0%, #e9d5ff 100%)',
                border: '2px solid #8b5cf6',
                borderRadius: '16px',
                textAlign: 'center',
                marginBottom: '30px',
                position: 'relative',
                zIndex: 2,
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.08)'
              }}>
                <h3 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '8px', color: '#7c3aed', fontWeight: '700' }}>ECONOMY:</h3>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#4c1d95' }}>EFFECTIVE ACCELERATION</p>
              </div>
  
              {roadmapData.economy.map((item: RoadmapItem, i: number) => (
                <div key={i} className="roadmap-item" style={{
                  ...getStatusStyles(item.status, 'economy'),
                  padding: '16px 16px 16px 24px',
                  marginBottom: '16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  letterSpacing: '0.3px',
                  textAlign: 'left',
                  color: item.status === 'pending' ? '#6b7280' : '#7c3aed',
                  fontWeight: '500',
                  zIndex: 2,
                  backgroundColor: 'white',
                }}>
                  <StatusBadge status={item.status} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
  
          {/* Vision Statements */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '30px',
            marginTop: '80px'
          }}>
            <div style={{
              padding: '30px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)',
              border: '2px solid #10b981',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
            }}>
              <h4 style={{ color: '#059669', fontSize: '15px', marginBottom: '12px', letterSpacing: '1px', fontWeight: '700' }}>
                AI WITH EMPATHY
              </h4>
              <p style={{ fontSize: '13px', color: '#064e3b', lineHeight: '1.6' }}>
                INTERFACE WITH AI THAT IS INDISTINGUISHABLE FROM HUMAN INTERACTION.
              </p>
            </div>
  
            <div style={{
              padding: '30px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%)',
              border: '2px solid #3b82f6',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
            }}>
              <h4 style={{ color: '#2563eb', fontSize: '15px', marginBottom: '12px', letterSpacing: '1px', fontWeight: '700' }}>
                DECENTRALIZED AI
              </h4>
              <p style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.6' }}>
                PROTOCOL CAN SUPPORT WORLD-WIDE LEVELS OF COMPUTE.
              </p>
            </div>
  
            <div style={{
              padding: '30px',
              background: 'linear-gradient(135deg, #f3f4ff 0%, #e9d5ff 50%, #f3f4ff 100%)',
              border: '2px solid #8b5cf6',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.08)'
            }}>
              <h4 style={{ color: '#7c3aed', fontSize: '15px', marginBottom: '12px', letterSpacing: '1px', fontWeight: '700' }}>
                AI CAPITALISM
              </h4>
              <p style={{ fontSize: '13px', color: '#4c1d95', lineHeight: '1.6' }}>
                SCALE TO SUPPORT 10 JOBS PER HUMAN/AGENT PER DAY.
              </p>
            </div>
          </div>
  
          {/* Progress Bar */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '20px',
            padding: '24px',
            border: '2px solid #e2e8f0',
            marginTop: '80px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
              fontSize: '14px'
            }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>OVERALL PROGRESS</span>
              <span style={{ color: '#475569', fontWeight: '500' }}>
                {completedItems} completed • {inProgressItems} in progress • {totalItems - completedItems - inProgressItems} pending
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '14px',
              background: '#e2e8f0',
              borderRadius: '7px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6)',
                transition: 'width 0.5s ease',
                borderRadius: '7px'
              }}></div>
            </div>
          </div>
  
          {/* Legend */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            marginTop: '24px',
            padding: '24px',
            background: '#fafafa',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                border: '2px solid #f3f4f6'
              }}>
                <ClockIcon className="w-4 h-4 text-gray-400" />
              </div>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Pending</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                border: '2px solid #f3f4f6'
              }}>
                <ArrowPathIcon className="w-4 h-4 text-blue-500" />
              </div>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>In Progress</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                border: '2px solid #f3f4f6'
              }}>
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
              </div>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Completed</span>
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
