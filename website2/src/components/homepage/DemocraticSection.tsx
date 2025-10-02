import Image from 'next/image'

const cards = [
  {
    id: '1',
    icon: '/privacy.png',
    title: 'Decentralized AI Miners',
    content:
      'Miners are rewarded for Proof of Useful Work. Contestation ensures miner honesty, tasks are confirmed on a decentralized network and are available within seconds.',
    background: 'bg-gradient-to-br from-blue-50 to-purple-50',
  },
  {
    id: '2',
    icon: '/code.png',
    title: 'Direct Integration',
    content:
      "Generations done via Arbius's mining network directly outputs requests to downstream applications such as webapps, marketplaces, AI agents, chat-bots or used for gaming.",
    background: 'bg-gradient-to-br from-purple-50 to-pink-50',
  },
  {
    id: '3',
    icon: '/ai.png',
    title: 'DeFi AI',
    content:
      "Model creators are able to set a base fee for invocations, allowing them to monetize their creations. A portion of the revenue is also distributed to Arbius DAO's treasury and to those who hold veAIUS.",
    background: 'bg-gradient-to-br from-pink-50 to-blue-50',
  },
]

export function DemocraticSection() {
  return (
    <div className="bg-gradient-to-r from-blue-50/20 via-purple-50/20 to-pink-50/20 py-24">
      <div className="mx-auto w-[90%] max-w-[2000px] lg:w-[80%]">
        <h2 className="mb-6 text-[45px] text-black-text lg:text-[50px] 2xl:text-[70px]">
          We dream of open and accessible AI
        </h2>

        <p className="w-full text-para text-subtext-three lg:w-[70%]">
          Arbius is controlled by its users, not monopolized by large
          corporations and governments. The design of Arbius makes it
          difficult or impossible to censor usage, allowing for anyone
          in the world to interact with AI models permissionlessly.
        </p>
        <br />
        <p className="w-full text-para text-subtext-three lg:w-[70%]">
          AI model owners can now utilize a distributed network of
          miners and attribute request origins, ensuring high uptime and
          integrity. By decentralizing the hosting process, Arbius
          offers a robust foundation for building reliable and
          transparent AI-driven applications on top of a censorship
          resistant network.
        </p>

        <div className="mt-24 hidden items-center justify-between lg:flex">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`h-[400px] w-[30%] transform rounded-3xl bg-cover bg-no-repeat p-6 transition-all duration-500 hover:-translate-y-1 xl:h-[320px] ${card.background}`}
            >
              <div className="mb-10">
                <Image src={card.icon} alt={card.title} width={20} height={20} />
              </div>
              <h3 className="relative z-10 text-[25px] font-bold text-card-heading">
                {card.title}
              </h3>
              <p className="relative z-10 mt-6 text-[16px] text-card-heading">
                {card.content}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile View - Simple Stack */}
        <div className="mt-12 flex flex-col gap-6 lg:hidden">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`rounded-3xl bg-cover bg-no-repeat p-6 ${card.background}`}
            >
              <div className="mb-6">
                <Image src={card.icon} alt={card.title} width={20} height={20} />
              </div>
              <h3 className="text-[25px] font-bold text-card-heading">
                {card.title}
              </h3>
              <p className="mt-4 text-[16px] text-card-heading">
                {card.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
