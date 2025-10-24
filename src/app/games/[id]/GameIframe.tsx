'use client'

interface GameIframeProps {
  gameUrl: string;
  title: string;
}

export default function GameIframe({ gameUrl, title }: GameIframeProps) {
  if (!gameUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-blue-900/30">
        <p className="text-blue-300 text-center px-4">
          游戏链接不可用<br />
          <span className="text-sm opacity-70">请检查游戏URL是否正确</span>
        </p>
      </div>
    )
  }

  return (
    <iframe 
      src={gameUrl} 
      title={title}
      className="absolute inset-0 w-full h-full"
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    ></iframe>
  )
}