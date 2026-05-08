export default function AILoader() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Spinning circle from 21st.dev/beratberkayg/ai-loader */}
      <div
        className="animate-loader-circle rounded-full shrink-0"
        style={{ width: 28, height: 28 }}
      />
      {/* Bouncing A I letters */}
      <div className="flex items-center gap-1">
        {['A', 'I'].map((letter, i) => (
          <span
            key={letter}
            className="animate-loader-letter text-sm font-semibold text-blue-500 select-none"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            {letter}
          </span>
        ))}
        <span className="ml-1 text-sm text-gray-400">réfléchit…</span>
      </div>
    </div>
  )
}
