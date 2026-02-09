export default function Loading() {
  return (
    <div className="page">
      <div className="containerWide">
        {/* Header skeleton */}
        <div className="pageHeader" style={{ marginBottom: '32px' }}>
          <div>
            <div className="skeleton" style={{ width: '120px', height: '32px', borderRadius: '6px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '340px', maxWidth: '100%', height: '18px', borderRadius: '4px' }} />
          </div>
          <div className="skeleton" style={{ width: '130px', height: '44px', borderRadius: '22px' }} />
        </div>

        {/* Sticky search bar skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '24px', flexShrink: 0 }} />
          <div className="skeleton" style={{ flex: 1, height: '48px', borderRadius: '24px' }} />
        </div>

        {/* Grid skeleton - 3 columns desktop, 2 tablet, 1 mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '12px' }} />
          ))}
        </div>

        {/* Info card skeleton */}
        <div className="skeleton" style={{ height: '140px', borderRadius: '12px' }} />
      </div>
    </div>
  );
}
