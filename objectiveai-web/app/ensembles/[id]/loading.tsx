export default function Loading() {
  return (
    <div className="page">
      <div className="container">
        {/* Back link skeleton */}
        <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '4px', marginBottom: '24px' }} />

        {/* Header skeleton */}
        <div style={{ marginBottom: '32px' }}>
          <div className="skeleton" style={{ width: '70px', height: '22px', borderRadius: '12px', marginBottom: '10px' }} />
          <div className="skeleton" style={{ width: '320px', maxWidth: '100%', height: '28px', borderRadius: '6px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '4px' }} />
        </div>

        {/* Usage stats grid skeleton */}
        <div style={{ marginBottom: '32px' }}>
          <div className="skeleton" style={{ width: '140px', height: '20px', borderRadius: '4px', marginBottom: '16px' }} />
          <div className="gridTwo" style={{ gap: '16px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
            ))}
          </div>
        </div>

        {/* LLM list skeleton */}
        <div>
          <div className="skeleton" style={{ width: '120px', height: '20px', borderRadius: '4px', marginBottom: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '12px' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
