export function InfoSection() {
  const steps = [
    'Select the amount of AIUS you want to lock.',
    'Select the duration, the minimum lock time is one week, and the maximum lock time is two years.',
    'Confirm the lock duration.',
    'Details about your lock will be available inside the dashboard.',
  ]

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-text to-blue-500 text-sm font-bold text-white">
                {index + 1}
              </div>
              <p className="pt-1 text-sm text-gray-700">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Process Overview */}
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <div>
          <p className="mb-4 font-semibold text-black-text">veAIUS Process Overview:</p>
          <div className="space-y-2 text-sm text-gray-700">
            <p>Lock AIUS: Receive veAIUS NFTs, earning rewards.</p>
            <p>Vote: veAIUS holders vote weekly for AI models.</p>
            <p>Emission Distribution: Managed by voter gauges based on veAIUS governance power.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
