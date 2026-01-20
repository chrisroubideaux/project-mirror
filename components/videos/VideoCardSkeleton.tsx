// components/videos/VideoCardSkeleton.tsx
// components/videos/VideoCardSkeleton.tsx
export default function VideoCardSkeleton() {
  return (
    <div
      style={{
        width: 300,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Thumbnail skeleton */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          background:
            'linear-gradient(90deg, #222 25%, #333 37%, #222 63%)',
          backgroundSize: '400% 100%',
          animation: 'skeleton 1.4s ease infinite',
          borderRadius: 14,
        }}
      />

      {/* Text skeleton */}
      <div style={{ paddingTop: 10 }}>
        <div
          style={{
            height: 14,
            width: '90%',
            background: '#222',
            borderRadius: 4,
            marginBottom: 6,
          }}
        />
        <div
          style={{
            height: 12,
            width: '60%',
            background: '#222',
            borderRadius: 4,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes skeleton {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
      `}</style>
    </div>
  );
}
