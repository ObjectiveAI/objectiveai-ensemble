export default function Loading() {
  return (
    <div className="page">
      <div className="container">
        {/* Back link skeleton */}
        <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '4px', marginBottom: '24px' }} />

        {/* Header skeleton */}
        <div style={{ marginBottom: '32px' }}>
          <div className="skeleton" style={{ width: '90px', height: '22px', borderRadius: '12px', marginBottom: '10px' }} />
          <div className="skeleton" style={{ width: '320px', maxWidth: '100%', height: '28px', borderRadius: '6px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '4px' }} />
        </div>

        {/* Model configuration card skeleton */}
        <div style={{ marginBottom: '24px' }}>
          <div className="skeleton" style={{ width: '180px', height: '20px', borderRadius: '4px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />
        </div>

        {/* Provider preferences card skeleton */}
        <div>
          <div className="skeleton" style={{ width: '160px', height: '20px', borderRadius: '4px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
        </div>
      </div>
    </div>
  );
}
