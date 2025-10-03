'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, ClockIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import ArbiusLogo from '@/app/assets/images/arbius_logo_team_page.svg'

interface RoadmapItem {
  text: string
  status: 'completed' | 'in-progress' | 'pending'
}

interface RoadmapData {
  empathy: RoadmapItem[]
  compute: RoadmapItem[]
  economy: RoadmapItem[]
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
}

export default function RoadmapPageClient() {
  const [roadmapData] = useState<RoadmapData>(data)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getStatusStyles = (
    status: 'completed' | 'in-progress' | 'pending',
    pillarColor: 'compute' | 'empathy' | 'economy'
  ) => {
    const colors = {
      empathy: { border: '#10b981', bg: '16, 185, 129', text: '#059669' },
      compute: { border: '#3b82f6', bg: '59, 130, 246', text: '#2563eb' },
      economy: { border: '#8b5cf6', bg: '139, 92, 246', text: '#7c3aed' }
    }

    const color = colors[pillarColor]

    if (status === 'completed') {
      return {
        border: `2px solid ${color.border}`,
        background: `rgba(${color.bg}, 0.05)`,
        position: 'relative' as const
      }
    } else if (status === 'in-progress') {
      return {
        border: `2px solid ${color.border}`,
        background: `rgba(${color.bg}, 0.08)`,
        boxShadow: `0 0 0 1px rgba(${color.bg}, 0.1)`,
        position: 'relative' as const
      }
    }
    return {
      border: `2px solid #e5e7eb`,
      background: `#fafafa`,
      position: 'relative' as const
    }
  }

  const StatusBadge = ({ status }: { status: 'completed' | 'in-progress' | 'pending' }) => {
    const icons = {
      completed: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
      'in-progress': <ArrowPathIcon className="w-5 h-5 text-blue-500 status-icon" />,
      pending: <ClockIcon className="w-5 h-5 text-gray-400" />
    }

    const backgrounds = {
      completed: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
      'in-progress': 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
      pending: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)'
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '-12px',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: backgrounds[status],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: status === 'in-progress'
            ? '0 4px 12px rgba(59, 130, 246, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '3px solid white',
          zIndex: 3,
          transition: 'all 0.3s ease'
        }}>
        {icons[status]}
      </div>
    )
  }

  const allItems = Object.values(roadmapData).flat()
  const totalItems = allItems.length
  const completedItems = allItems.filter((item: RoadmapItem) => item.status === 'completed').length
  const inProgressItems = allItems.filter((item: RoadmapItem) => item.status === 'in-progress').length
  const progressPercentage = ((completedItems + (inProgressItems * 0.5)) / totalItems) * 100

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)',
      color: '#111827',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      paddingTop: '120px',
      paddingBottom: '80px',
      paddingLeft: '20px',
      paddingRight: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 20s ease-in-out infinite',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 25s ease-in-out infinite reverse',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '50%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 30s ease-in-out infinite',
        zIndex: 0
      }}></div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.5); }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .roadmap-item {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: visible;
        }

        .roadmap-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transition: left 0.5s ease;
        }

        .roadmap-item:hover::before {
          left: 100%;
        }

        .roadmap-item:hover {
          transform: translateX(8px) scale(1.02);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
        }

        .pillar-header {
          transition: all 0.4s ease;
          position: relative;
        }

        .pillar-header:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15) !important;
        }

        .vision-card {
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .vision-card::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 70%
          );
          transform: rotate(45deg);
          animation: shimmer 3s infinite;
        }

        .vision-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15) !important;
        }

        .fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .progress-bar-fill {
          animation: progressFill 2s ease-out forwards;
        }

        @keyframes progressFill {
          from { width: 0; }
        }

      `}</style>

      <div style={{ maxWidth: '1300px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }} className={mounted ? 'fade-in' : ''}>
          <div style={{
            marginBottom: '40px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Image
              src={ArbiusLogo}
              alt="Arbius Logo"
              style={{ width: '80px', height: 'auto' }}
            />
          </div>

          <h1 style={{
            fontSize: '56px',
            fontWeight: '900',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #1e293b 0%, #3b82f6 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
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
            padding: '18px 56px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            borderRadius: '16px',
            fontSize: '14px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontWeight: '700',
            color: '#475569',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '16px',
              padding: '2px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #10b981)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              opacity: 0.6
            }}></div>
            ARBIUS ROADMAP / PILLARS
          </div>
        </div>

        {/* Three Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
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

            <div className="pillar-header" style={{
              padding: '28px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '3px solid #10b981',
              borderRadius: '20px',
              textAlign: 'center',
              marginBottom: '30px',
              position: 'relative',
              zIndex: 2,
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)',
              cursor: 'pointer'
            }}>
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                animation: 'pulse-glow 2s infinite'
              }}></div>
              <h3 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '10px', color: '#059669', fontWeight: '700' }}>EMPATHY:</h3>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#064e3b' }}>AMICA</p>
            </div>

            {roadmapData.empathy.map((item: RoadmapItem, i: number) => (
              <div key={i} className="roadmap-item" style={{
                ...getStatusStyles(item.status, 'empathy'),
                padding: '20px 16px 16px 28px',
                marginBottom: '20px',
                marginLeft: '16px',
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

            <div className="pillar-header" style={{
              padding: '28px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '3px solid #3b82f6',
              borderRadius: '20px',
              textAlign: 'center',
              marginBottom: '30px',
              position: 'relative',
              zIndex: 2,
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.15)',
              cursor: 'pointer'
            }}>
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                animation: 'pulse-glow 2s infinite'
              }}></div>
              <h3 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '10px', color: '#2563eb', fontWeight: '700' }}>COMPUTE:</h3>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#1e3a8a' }}>ARBIUS PROTOCOL</p>
            </div>

            {roadmapData.compute.map((item: RoadmapItem, i: number) => (
              <div key={i} className="roadmap-item" style={{
                ...getStatusStyles(item.status, 'compute'),
                padding: '20px 16px 16px 28px',
                marginBottom: '20px',
                marginLeft: '16px',
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

            <div className="pillar-header" style={{
              padding: '28px',
              background: 'linear-gradient(135deg, #f3f4ff 0%, #e9d5ff 100%)',
              border: '3px solid #8b5cf6',
              borderRadius: '20px',
              textAlign: 'center',
              marginBottom: '30px',
              position: 'relative',
              zIndex: 2,
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.15)',
              cursor: 'pointer'
            }}>
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                animation: 'pulse-glow 2s infinite'
              }}></div>
              <h3 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '10px', color: '#7c3aed', fontWeight: '700' }}>ECONOMY:</h3>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#4c1d95' }}>EFFECTIVE ACCELERATION</p>
            </div>

            {roadmapData.economy.map((item: RoadmapItem, i: number) => (
              <div key={i} className="roadmap-item" style={{
                ...getStatusStyles(item.status, 'economy'),
                padding: '20px 16px 16px 28px',
                marginBottom: '20px',
                marginLeft: '16px',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
          <div className="vision-card" style={{
            padding: '36px',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)',
            border: '3px solid #10b981',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
              position: 'relative',
              zIndex: 1
            }}>
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <h4 style={{ color: '#059669', fontSize: '16px', marginBottom: '14px', letterSpacing: '1.5px', fontWeight: '700', position: 'relative', zIndex: 1 }}>
              AI WITH EMPATHY
            </h4>
            <p style={{ fontSize: '14px', color: '#064e3b', lineHeight: '1.7', fontWeight: '500', position: 'relative', zIndex: 1 }}>
              INTERFACE WITH AI THAT IS INDISTINGUISHABLE FROM HUMAN INTERACTION.
            </p>
          </div>

          <div className="vision-card" style={{
            padding: '36px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%)',
            border: '3px solid #3b82f6',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.12)',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)',
              position: 'relative',
              zIndex: 1
            }}>
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <h4 style={{ color: '#2563eb', fontSize: '16px', marginBottom: '14px', letterSpacing: '1.5px', fontWeight: '700', position: 'relative', zIndex: 1 }}>
              DECENTRALIZED AI
            </h4>
            <p style={{ fontSize: '14px', color: '#1e3a8a', lineHeight: '1.7', fontWeight: '500', position: 'relative', zIndex: 1 }}>
              PROTOCOL CAN SUPPORT WORLD-WIDE LEVELS OF COMPUTE.
            </p>
          </div>

          <div className="vision-card" style={{
            padding: '36px',
            background: 'linear-gradient(135deg, #f3f4ff 0%, #e9d5ff 50%, #f3f4ff 100%)',
            border: '3px solid #8b5cf6',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.12)',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)',
              position: 'relative',
              zIndex: 1
            }}>
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <h4 style={{ color: '#7c3aed', fontSize: '16px', marginBottom: '14px', letterSpacing: '1.5px', fontWeight: '700', position: 'relative', zIndex: 1 }}>
              AI CAPITALISM
            </h4>
            <p style={{ fontSize: '14px', color: '#4c1d95', lineHeight: '1.7', fontWeight: '500', position: 'relative', zIndex: 1 }}>
              SCALE TO SUPPORT 10 JOBS PER HUMAN/AGENT PER DAY.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '24px',
          padding: '32px',
          border: '2px solid #e2e8f0',
          marginTop: '80px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            fontSize: '14px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span style={{
              color: '#1e293b',
              fontWeight: '700',
              fontSize: '16px',
              letterSpacing: '1px'
            }}>OVERALL PROGRESS</span>
            <span style={{
              color: '#475569',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '13px'
            }}>
              {completedItems} completed • {inProgressItems} in progress • {totalItems - completedItems - inProgressItems} pending
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '18px',
            background: '#e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'shimmer 2s infinite'
              }}></div>
            </div>
          </div>
          <div style={{
            marginTop: '12px',
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: '700',
            color: '#3b82f6'
          }}>
            {Math.round(progressPercentage)}%
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
  )
}
