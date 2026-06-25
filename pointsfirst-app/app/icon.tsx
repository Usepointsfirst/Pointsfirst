import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111111',
          borderRadius: 6,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: '-0.5px',
            lineHeight: 1,
            display: 'flex',
          }}
        >
          <span style={{ color: '#E8B84B' }}>P</span>
          <span style={{ color: '#ffffff' }}>F</span>
        </span>
      </div>
    ),
    { ...size }
  )
}
