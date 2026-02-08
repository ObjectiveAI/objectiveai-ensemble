export default function Loading() {
  return (
    <div className="page">
      <div className="container">
        {/* Breadcrumb skeleton */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ width: '12px', height: '14px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '4px' }} />
        </div>

        {/* Header skeleton */}
        <div style={{ marginBottom: '28px' }}>
          <div className="skeleton" style={{ width: '260px', height: '28px', borderRadius: '6px', marginBottom: '10px' }} />
          <div className="skeleton" style={{ width: '400px', maxWidth: '100%', height: '16px', borderRadius: '4px', marginBottom: '12px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="skeleton" style={{ width: '70px', height: '24px', borderRadius: '12px' }} />
            <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '12px' }} />
          </div>
        </div>

        {/* Two-column layout skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left: Input form placeholder */}
          <div>
            <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '12px' }} />
          </div>
          {/* Right: Results placeholder */}
          <div>
            <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '8px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '22px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
